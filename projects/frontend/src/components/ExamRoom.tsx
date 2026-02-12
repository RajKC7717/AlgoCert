import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { useSnackbar } from 'notistack';
import Editor from '@monaco-editor/react';
import { useKeystrokeMonitor } from '../hooks/useKeystrokeMonitor';
import * as algosdk from 'algosdk';
import { AlgorandClient } from '@algorandfoundation/algokit-utils';
import { sha256 } from 'js-sha256';

// --- IMPORTS ---
import { gradeExam } from '../utils/gradeExam';
import { generateCertificate, CertificateData } from '../utils/generateCertificate';
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs';
import { pinFileToIPFS, pinJSONToIPFS, ipfsHttpUrl } from '../utils/pinata';

// --- EXAM CONFIGURATION ---
const EXAM_QUESTION = `Given an array of integers 'nums' and an integer 'target', return indices of the two numbers such that they add up to target.
You may assume that each input would have exactly one solution.`;

const EXAM_DURATION_SEC = 3600;

const ExamRoom = () => {
  // HOOKS
  const { activeAddress, transactionSigner } = useWallet();
  const { enqueueSnackbar } = useSnackbar();
  const { trustScore, processKeystroke } = useKeystrokeMonitor();

    // Resolve student display name: environment override or derived from wallet address
    const ENV_STUDENT_NAME = (import.meta.env.VITE_STUDENT_NAME as string) || '';
    const studentName = ENV_STUDENT_NAME || (activeAddress ? `User-${activeAddress.slice(0,6)}` : 'Student');

  // STATE MANAGEMENT
  const [status, setStatus] = useState<'LOCKED' | 'ENROLLING' | 'ACTIVE' | 'PAUSED' | 'TERMINATED' | 'SUBMITTING' | 'GRADED'>('LOCKED');
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION_SEC);
  const [code, setCode] = useState("# Write your solution here...\ndef solve_challenge():\n    pass");
  
  // TRACKING METRICS (UI ONLY)
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [warnings, setWarnings] = useState(0);

  // GRADING & CERTIFICATE STATE
  const [gradingResult, setGradingResult] = useState<any>(null);
  const [certificate, setCertificate] = useState<CertificateData | null>(null); 
  
  // MINTING STATE
  const [isMinting, setIsMinting] = useState(false);
  const [mintedAssetId, setMintedAssetId] = useState<number | null>(null);

  // ALGORAND CLIENT SETUP
  const algorand = useMemo(() => {
    const algodConfig = getAlgodConfigFromViteEnvironment();
    const client = AlgorandClient.fromConfig({ algodConfig });
    client.setDefaultSigner(transactionSigner);
    return client;
  }, [transactionSigner]);

    // Editor refs for paste/copy detection
    const editorRef = useRef<any>(null);
    const isInternalCopy = useRef<boolean>(false);
    const pasteHandlerRef = useRef<any>(null);
    const copyHandlerRef = useRef<any>(null);
    const cutHandlerRef = useRef<any>(null);

    const handleEditorMount = (editor: any) => {
        editorRef.current = editor;
        // Attach Monaco change handler for keystroke analysis
        editor.onDidChangeModelContent(processKeystroke);

        const domNode = editor.getDomNode();
        if (!domNode) return;

        copyHandlerRef.current = () => {
            isInternalCopy.current = true;
            setTimeout(() => { isInternalCopy.current = false; }, 800);
        };
        cutHandlerRef.current = () => {
            isInternalCopy.current = true;
            setTimeout(() => { isInternalCopy.current = false; }, 800);
        };

        pasteHandlerRef.current = (e: ClipboardEvent) => {
            try {
                const target = e.target as Node | null;
                const insideEditor = target && domNode.contains(target);
                if (insideEditor) {
                    if (isInternalCopy.current) {
                        // internal paste: ignore as violation
                    } else {
                        // external paste detected
                        setWarnings(prev => prev + 1);
                        enqueueSnackbar("⚠️ External Paste Detected!", { variant: 'warning' });
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    isInternalCopy.current = false;
                }
            } catch (err) {
                console.error('paste handler', err);
            }
        };

        domNode.addEventListener('copy', copyHandlerRef.current);
        domNode.addEventListener('cut', cutHandlerRef.current);
        window.addEventListener('paste', pasteHandlerRef.current, true);
    };

    // Cleanup paste/copy listeners on unmount
    useEffect(() => {
        return () => {
            const dom = editorRef.current?.getDomNode?.();
            try {
                if (dom) {
                    if (copyHandlerRef.current) dom.removeEventListener('copy', copyHandlerRef.current);
                    if (cutHandlerRef.current) dom.removeEventListener('cut', cutHandlerRef.current);
                }
                if (pasteHandlerRef.current) window.removeEventListener('paste', pasteHandlerRef.current, true);
            } catch (e) {}
        };
    }, []);

  // --- 1. ENTER SECURE MODE ---
  const enterSecureMode = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      setStatus('ENROLLING');
    } catch (err) { 
        enqueueSnackbar("Full Screen is required to take the exam.", { variant: 'warning' });
    }
  };

  // --- 2. PLEDGE ---
  const handlePledge = async () => {
    if (!activeAddress) {
        enqueueSnackbar("❌ Wallet Disconnected. Please Login.", { variant: 'error' });
        return;
    }
    setStatus('ACTIVE');
    enqueueSnackbar("✅ Pledge Recorded! Good Luck.", { variant: 'success' });
  };

  // --- 3. SUBMISSION HANDLER ---
  const handleSubmit = async () => {
    if (!activeAddress) {
        setStatus('TERMINATED');
        enqueueSnackbar("❌ FATAL: Wallet Disconnected.", { variant: 'error' });
        return;
    }

    setStatus('SUBMITTING');

    try {
        enqueueSnackbar("Verifying & Grading...", { variant: 'info' });

        // Grade Exam
        const result = await gradeExam(EXAM_QUESTION, code);
        setGradingResult(result);

        // GENERATE CERTIFICATE IMMEDIATELY IF PASSED
        if (result.passed) {
            enqueueSnackbar("🏆 Passed! Generating Certificate...", { variant: 'success' });
            const certData = await generateCertificate(studentName, "Python 101", result.score);
            setCertificate(certData);
        } else {
            enqueueSnackbar("❌ Exam Failed.", { variant: 'error' });
        }

        setStatus('GRADED');

    } catch (error: any) {
        console.error(error);
        enqueueSnackbar("Error: " + error.message, { variant: 'error' });
        setStatus('ACTIVE');
    }
  };

  // --- 4. MINT CERTIFICATE HANDLER ---
  const handleClaimCertificate = async () => {
      if (!activeAddress || !gradingResult || !certificate) return;
      
      setIsMinting(true);
      enqueueSnackbar("🎨 Uploading Certificate Asset...", { variant: 'info' });

      try {
          const filePin = await pinFileToIPFS(certificate.file); 
          const imageUrl = ipfsHttpUrl(filePin.IpfsHash);

          const metadata = {
              name: "Python 101 Certificate",
              description: `Issued to ${activeAddress} for passing Python 101 with score ${gradingResult.score}. Trust Score: ${trustScore}%`,
              image: imageUrl,
              properties: {
                  score: gradingResult.score,
                  trust_score: trustScore,
                  warnings: warnings,
                  tab_switches: tabSwitchCount,
                  issuer: "SkillChain Arena",
                  exam_id: "PY-101"
              }
          };

          const jsonPin = await pinJSONToIPFS(metadata);
          const metadataUrl = `${ipfsHttpUrl(jsonPin.IpfsHash)}#arc3`;

          const hashHex = sha256(JSON.stringify(metadata));
          const metadataHash = new Uint8Array(
            hashHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
          );

          enqueueSnackbar("✍️ Please sign the transaction...", { variant: 'warning' });
          
          const result = await algorand.send.assetCreate({
            sender: activeAddress,
            total: 1n,
            decimals: 0,
            assetName: "PY101-CERT",
            unitName: "CERT",
            url: metadataUrl,
            metadataHash,
            manager: activeAddress, 
          });

          setMintedAssetId(Number(result.confirmation.assetIndex));
          enqueueSnackbar(`🎉 Certificate Minted! ID: ${result.confirmation.assetIndex}`, { variant: 'success' });

      } catch (error: any) {
          console.error(error);
          enqueueSnackbar("Minting Failed: " + error.message, { variant: 'error' });
      } finally {
          setIsMinting(false);
      }
  };

  // --- 5. WATCHDOGS ---
  useEffect(() => {
    const handleVisibility = () => { 
        if (document.hidden && status === 'ACTIVE') {
            setTabSwitchCount(prev => prev + 1); // Track switches
            handleViolation("Tab Switching Detected"); 
        }
    };
    
    const handleFullScreen = () => { 
        const isFs = !!document.fullscreenElement;
        if (isFs) {
            // Entering fullscreen: resume if previously paused
            if (status === 'PAUSED') {
                setStatus('ACTIVE');
            }
        } else {
            // Exited fullscreen: pause and record violation if exam was active
            if (status === 'ACTIVE') {
                setStatus('PAUSED');
                handleViolation("Exited Full Screen");
            }
        }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullScreen);
    
    let timer: any;
    if (status === 'ACTIVE' && timeLeft > 0) {
        timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && status === 'ACTIVE') {
        handleSubmit();
    }

    return () => { 
        document.removeEventListener("visibilitychange", handleVisibility); 
        document.removeEventListener("fullscreenchange", handleFullScreen);
        clearInterval(timer);
    };
  }, [status, timeLeft]);

  const handleViolation = (reason: string) => {
    setWarnings(prev => prev + 1);
    enqueueSnackbar(`⚠️ WARNING: ${reason}`, { variant: 'warning' });
  };

  // --- UI RENDERER (PAPER COMIC STYLE) ---
  return (
    <div className={`min-h-screen bg-black text-white font-mono overflow-hidden relative selection:bg-yellow-400 selection:text-black`}>
      
      {/* 1. LOCKED */}
      {status === 'LOCKED' && (
         <div className="h-screen flex flex-col items-center justify-center p-4">
             <div className="border-4 border-white p-10 bg-black shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] max-w-lg w-full text-center">
                <h1 className="text-5xl font-black mb-2 uppercase tracking-tighter">Exam<br/>Locked</h1>
                <div className="h-1 w-full bg-white my-6"></div>
                <p className="text-gray-300 mb-8 font-mono text-sm">SECURE ENVIRONMENT REQUIRED</p>
                <button onClick={enterSecureMode} className="w-full py-4 bg-yellow-400 text-black font-black text-xl border-2 border-white hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all">
                    ENTER SECURE MODE
                </button>
             </div>
         </div>
      )}

      {/* 2. ENROLLING */}
      {status === 'ENROLLING' && (
         <div className="h-screen flex flex-col items-center justify-center p-4">
             <div className="border-4 border-white p-8 bg-black shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] max-w-2xl w-full">
                <h2 className="text-3xl font-bold mb-4 uppercase">Honor Pledge</h2>
                <div className="bg-[#1a1a1a] border-2 border-white p-4 mb-6 font-mono text-sm leading-relaxed text-gray-300">
                    "I agree to complete this exam without external assistance. I understand that my keystrokes, clipboard, and browser focus are being monitored."
                </div>
                <button onClick={handlePledge} className="w-full py-4 bg-green-500 text-black font-black text-xl border-2 border-white hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all">
                    I AGREE & START
                </button>
             </div>
         </div>
      )}

      {/* 3. PAUSED (Overlay) */}
      {status === 'PAUSED' && (
         <div className="fixed inset-0 bg-red-600/90 z-50 flex flex-col items-center justify-center">
             <div className="bg-black border-4 border-white p-10 text-center shadow-[10px_10px_0px_0px_#000]">
                 <h1 className="text-6xl font-black text-white mb-4">PAUSED</h1>
                 <p className="text-xl font-mono mb-8 text-yellow-400">FULLSCREEN EXIT DETECTED</p>
                 <button onClick={() => {document.documentElement.requestFullscreen(); setStatus('ACTIVE')}} className="px-8 py-3 bg-white text-black font-black text-lg border-2 border-black hover:scale-105 transition-transform">
                     RETURN TO EXAM
                 </button>
             </div>
         </div>
      )}

      {/* 4. TERMINATED */}
      {status === 'TERMINATED' && (
         <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
             <h1 className="text-8xl text-red-600 font-black mb-4 tracking-tighter">DISQUALIFIED</h1>
             <p className="text-white font-mono text-xl border-b-2 border-red-600 pb-2">INTEGRITY VIOLATION DETECTED</p>
             <button onClick={() => window.location.reload()} className="mt-10 text-gray-500 underline hover:text-white">RESTART SYSTEM</button>
         </div>
      )}

      {/* 5. ACTIVE EXAM */}
      {(status === 'ACTIVE' || status === 'SUBMITTING') && (
        <div className="h-screen flex flex-col">
           {/* COMIC HEADER */}
           <div className="h-16 bg-black border-b-4 border-white flex items-center justify-between px-6">
              <span className="font-black text-2xl tracking-tighter">DEV<span className="text-yellow-400">DUEL</span>_EXAM</span>
              
              <div className="flex gap-4 items-center font-mono text-sm">
                 {/* STATS BADGES */}
                 <div className="flex items-center gap-2 border-2 border-white px-3 py-1 bg-[#111]">
                    <span className="text-gray-400">TRUST:</span>
                    <span className={`font-bold ${trustScore < 70 ? 'text-red-500' : 'text-green-400'}`}>{trustScore}%</span>
                 </div>

                 <div className="flex items-center gap-2 border-2 border-white px-3 py-1 bg-[#111]">
                    <span className="text-gray-400">TABS:</span>
                    <span className={`font-bold ${tabSwitchCount > 0 ? 'text-red-500' : 'text-white'}`}>{tabSwitchCount}</span>
                 </div>

                 <div className="flex items-center gap-2 border-2 border-white px-3 py-1 bg-[#111]">
                    <span className="text-gray-400">TIME:</span>
                    <span className="text-yellow-400">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                 </div>

                 <button 
                    onClick={handleSubmit}
                    disabled={status === 'SUBMITTING'}
                    className={`ml-4 px-6 py-2 font-black border-2 border-white shadow-[2px_2px_0px_0px_#fff] active:translate-y-1 active:shadow-none transition-all ${status === 'SUBMITTING' ? 'bg-gray-600' : 'bg-blue-600 text-white'}`}
                 >
                    {status === 'SUBMITTING' ? "GRADING..." : "SUBMIT"}
                 </button>
              </div>
           </div>

           {/* SPLIT SCREEN */}
           <div className="flex-1 flex overflow-hidden">
              <div className="w-1/3 p-6 border-r-4 border-white bg-black overflow-y-auto">
                  <div className="border-2 border-white p-4 bg-[#111] mb-4 shadow-[4px_4px_0px_0px_#333]">
                    <h2 className="text-xl font-bold mb-2 text-yellow-400 border-b-2 border-yellow-400 inline-block">MISSION</h2>
                    <p className="mt-4 text-gray-200 whitespace-pre-wrap leading-relaxed">{EXAM_QUESTION}</p>
                  </div>
              </div>

              <div className="flex-1 relative bg-[#0d0d0d]">
                                    <Editor 
                                        height="100%" 
                                        defaultLanguage="python" 
                                        defaultValue={code} 
                                        theme="vs-dark"
                                        options={{ 
                                                minimap: { enabled: false }, 
                                                fontSize: 14, 
                                                fontFamily: 'monospace',
                                                cursorBlinking: 'solid'
                                        }}
                                        onMount={handleEditorMount}
                                        onChange={(val) => setCode(val || "")}
                                    />
                  {status === 'SUBMITTING' && (
                      <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-10">
                          <div className="text-yellow-400 font-black text-2xl animate-pulse">EVALUATING LOGIC...</div>
                      </div>
                  )}
              </div>
           </div>
        </div>
      )}

      {/* 6. RESULTS MODAL */}
      {status === 'GRADED' && gradingResult && activeAddress && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-black border-4 border-white p-8 max-w-3xl w-full text-center shadow-[12px_12px_0px_0px_#fff] relative">
                  
                  {gradingResult.passed ? (
                      <>
                        <h1 className="text-6xl font-black text-green-400 mb-2 italic transform -rotate-2">PASSED</h1>
                        <div className="text-2xl font-mono text-white mb-6 border-y-2 border-gray-700 py-2">Score: {gradingResult.score}/100</div>
                        
                        <div className="border-2 border-white bg-[#111] p-4 mb-8 inline-block">
                             {certificate ? (
                                <img 
                                    src={certificate.previewUrl} 
                                    alt="Certificate Preview" 
                                    className="h-48 md:h-64 object-contain"
                                />
                             ) : (
                                <div className="h-48 w-64 flex items-center justify-center text-yellow-500 font-mono">GENERATING...</div>
                             )}
                        </div>
                        
                        <div className="flex gap-4 justify-center">
                            {mintedAssetId ? (
                                <div className="border-2 border-green-500 bg-green-900/20 p-4 w-full">
                                    <div className="text-green-400 font-bold mb-2">ASSET MINTED: #{mintedAssetId}</div>
                                    <button onClick={() => window.location.reload()} className="px-6 py-2 bg-white text-black font-bold border-2 border-black hover:bg-gray-200">CLOSE</button>
                                </div>
                            ) : (
                                <button 
                                    onClick={handleClaimCertificate} 
                                    disabled={isMinting || !certificate}
                                    className={`px-8 py-4 font-black text-xl border-2 border-white shadow-[4px_4px_0px_0px_#fff] hover:translate-y-1 hover:shadow-none transition-all ${isMinting ? 'bg-gray-600' : 'bg-yellow-400 text-black'}`}
                                >
                                    {isMinting ? 'MINTING...' : 'CLAIM NFT PROOF'}
                                </button>
                            )}
                        </div>
                      </>
                  ) : (
                      <>
                        <h1 className="text-6xl font-black text-red-600 mb-2 uppercase transform rotate-2">FAILED</h1>
                        <p className="text-white font-mono mb-8 border-2 border-red-900 bg-red-900/20 p-4">{gradingResult.feedback}</p>
                        <button onClick={() => setStatus('ACTIVE')} className="px-10 py-3 bg-white text-black font-black border-2 border-white hover:bg-gray-200 shadow-[4px_4px_0px_0px_#fff]">RETRY</button>
                      </>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default ExamRoom;