import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { useSnackbar } from 'notistack';
import Editor, { OnMount } from '@monaco-editor/react';
import { AlgorandClient } from '@algorandfoundation/algokit-utils';
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs';
import { useKeystrokeMonitor } from '../hooks/useKeystrokeMonitor';
import { gradeExam } from '../utils/gradeExam';
import { generateCertificate, CertificateData } from '../utils/generateCertificate'; // Use the Interface
import { uploadToIPFS, uploadJSONToIPFS } from '../utils/pinata';

interface DevDuelProps {
  openModal: boolean;
  closeModal: () => void;
}

const EXAM_QUESTION = `print number 8`;

const DevDuel: React.FC<DevDuelProps> = ({ openModal, closeModal }) => {
  const { activeAddress, transactionSigner } = useWallet();
  const { enqueueSnackbar } = useSnackbar();
  const { trustScore, processKeystroke } = useKeystrokeMonitor();

    // Student display name: prefer env override, otherwise derive from address
    const ENV_STUDENT_NAME = (import.meta.env.VITE_STUDENT_NAME as string) || '';
    const studentName = ENV_STUDENT_NAME || (activeAddress ? `User-${activeAddress.slice(0,6)}` : 'Student');

  // --- ALGOKIT CLIENT ---
  const algorand = useMemo(() => {
    const algodConfig = getAlgodConfigFromViteEnvironment();
    const client = AlgorandClient.fromConfig({ algodConfig });
    client.setDefaultSigner(transactionSigner);
    return client;
  }, [transactionSigner]);

  // --- STATE ---
  const [status, setStatus] = useState<'LOCKED' | 'ACTIVE' | 'SUBMITTING' | 'GRADED' | 'PAUSED'>('LOCKED');
  const [code, setCode] = useState("# Write your solution here...\ndef solve_challenge():\n    pass");
  const [gradingResult, setGradingResult] = useState<any>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);

  // --- METRICS (Visual Only) ---
  const [pasteCount, setPasteCount] = useState({ internal: 0, external: 0 });
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

    // --- REFS ---
    const isInternalCopy = useRef<boolean>(false);
    const editorRef = useRef<any>(null);
    const pasteHandlerRef = useRef<any>(null);
    const copyHandlerRef = useRef<any>(null);
    const cutHandlerRef = useRef<any>(null);

  // --- RESET & FULLSCREEN WATCHER ---
  useEffect(() => {
    if (!openModal) {
      setStatus('LOCKED');
      setCode("# Reset...");
      setGradingResult(null);
      setCertificate(null);
      setIsMinting(false);
      setPasteCount({ internal: 0, external: 0 });
      setTabSwitchCount(0);
      isInternalCopy.current = false;
      if (document.fullscreenElement) document.exitFullscreen().catch(e => console.log(e));
    }
  }, [openModal]);

  // Watch for Fullscreen Exit
  useEffect(() => {
    const handleFullScreenChange = () => {
        const isFs = !!document.fullscreenElement;
        if (isFs) {
            // Entered fullscreen: resume if previously paused
            if (status === 'PAUSED' || status === 'LOCKED') setStatus('ACTIVE');
        } else {
            // Exited fullscreen: pause if session was active
            if (status === 'ACTIVE') {
                setStatus('PAUSED');
                setTabSwitchCount(prev => prev + 1);
                enqueueSnackbar('⚠️ Exited Fullscreen — session paused', { variant: 'warning' });
            }
        }
    };
    const handleVisibility = () => {
        if (document.hidden && status === 'ACTIVE') {
            setTabSwitchCount(prev => prev + 1);
        }
    };
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
        document.removeEventListener("fullscreenchange", handleFullScreenChange);
        document.removeEventListener("visibilitychange", handleVisibility);
    }
  }, [status]);

  const handleStart = async () => {
     try {
       if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
       setStatus('ACTIVE');
     } catch (err) {
       setStatus('ACTIVE'); // Allow anyway if blocked
     }
  };

  const handleSubmit = async () => {
    setStatus('SUBMITTING');
    try {
        await new Promise(r => setTimeout(r, 1000)); 
        const result = await gradeExam(EXAM_QUESTION, code);
        setGradingResult(result);

        // Generate Certificate if passed
        if (result.passed) {
            const certData = await generateCertificate(studentName, "Python 101", result.score);
            setCertificate(certData);
        }

        setStatus('GRADED');
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    } catch (e) {
        enqueueSnackbar("Error submitting", { variant: 'error' });
        setStatus('ACTIVE');
    }
  };

  // --- MINT NFT LOGIC ---
  // --- MINT NFT LOGIC ---
  const handleMint = async () => {
    // 🛑 Security Check: Ensure wallet is connected & exam is passed
    if (!activeAddress || !gradingResult || !certificate) return;
    
    try {
        setIsMinting(true);
        enqueueSnackbar("📤 Uploading Certificate to IPFS...", { variant: 'info' });

        // 1. Convert the Certificate Preview URL back to a File Object
        const response = await fetch(certificate.previewUrl);
        const blob = await response.blob();
        const imageFile = new File([blob], "certificate.png", { type: "image/png" });

        // 2. Upload Image to Pinata (Get Image CID)
        const imageCid = await uploadToIPFS(imageFile, `Cert-${activeAddress.slice(0,6)}`);
        
        // 3. Prepare Metadata (ARC-3 Standard)
        const metadata = {
            name: "Smart-Lab Certification",
            description: `Certified Python Developer. Score: ${gradingResult.score}/100`,
            image: imageCid, // Points to ipfs://...
            properties: {
                score: gradingResult.score,
                trust_score: trustScore,
                tab_switches: tabSwitchCount,
                exam: "Python 101",
                student: activeAddress,
                date: new Date().toISOString()
            }
        };

        // 4. Upload Metadata to Pinata (Get Metadata CID)
        enqueueSnackbar("💾 Pinning Metadata...", { variant: 'info' });
        const metadataCid = await uploadJSONToIPFS(metadata, `Meta-${activeAddress.slice(0,6)}`);

        // 5. Mint NFT on Algorand
        enqueueSnackbar("✍️ Please Sign Transaction...", { variant: 'warning' });
        
        const result = await algorand.send.assetCreate({
            sender: activeAddress,
            total: 1n,             // NFT = 1 total supply
            decimals: 0,           // Not divisible
            assetName: "SL-CERT",  // Asset Name
            unitName: "PY101",     // Unit Name
            url: `${metadataCid}#arc3`, // ARC-3 Compliant URL
            manager: activeAddress, // Student owns and controls the asset
            reserve: activeAddress,
            freeze: activeAddress,
            clawback: activeAddress,
        });

        // 6. Success
        enqueueSnackbar(`✅ NFT Minted! ID: ${result.confirmation.assetIndex}`, { variant: 'success' });

    } catch (error: any) {
        console.error(error);
        enqueueSnackbar("Minting Failed: " + error.message, { variant: 'error' });
    } finally {
        setIsMinting(false);
    }
  };

  // --- EDITOR SETUP (Anti-Cheat) ---
    const handleEditorDidMount: OnMount = (editor) => {
        editorRef.current = editor;
        const domNode = editor.getDomNode();
        if (!domNode) return;

        // Handlers (store refs so we can remove later)
        copyHandlerRef.current = () => {
            isInternalCopy.current = true;
            // small window where a following paste is considered internal
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
                        setPasteCount(p => ({ ...p, internal: p.internal + 1 }));
                        // allow internal paste to proceed
                    } else {
                        setPasteCount(p => ({ ...p, external: p.external + 1 }));
                        e.preventDefault();
                        e.stopPropagation();
                        enqueueSnackbar("⚠️ External Paste Forbidden!", { variant: 'error' });
                    }
                    // reset flag after paste handling
                    isInternalCopy.current = false;
                }
            } catch (err) {
                console.error('Paste handler error', err);
            }
        };

        // Attach listeners: copy/cut on the editor DOM; paste on window capture to catch keyboard pastes
        domNode.addEventListener('copy', copyHandlerRef.current);
        domNode.addEventListener('cut', cutHandlerRef.current);
        window.addEventListener('paste', pasteHandlerRef.current, true);
    };

    // Cleanup listeners when component unmounts or editor changes
    useEffect(() => {
        return () => {
            const dom = editorRef.current?.getDomNode?.();
            try {
                if (dom) {
                    if (copyHandlerRef.current) dom.removeEventListener('copy', copyHandlerRef.current);
                    if (cutHandlerRef.current) dom.removeEventListener('cut', cutHandlerRef.current);
                }
                if (pasteHandlerRef.current) window.removeEventListener('paste', pasteHandlerRef.current, true);
            } catch (e) {
                // ignore
            }
        };
    }, []);

  if (!openModal) return null;

  // --- COMIC UI ---
  return (
    <div className="fixed inset-0 z-50 bg-black/95 text-white font-mono flex items-center justify-center backdrop-blur-sm">
      
      {/* MODAL CONTAINER */}
      <div className="bg-black border-4 border-white w-full max-w-5xl h-[90vh] flex flex-col shadow-[16px_16px_0px_0px_#fff] relative animate-in zoom-in duration-200">
          
          {/* HEADER BAR */}
          <div className="h-16 border-b-4 border-white flex items-center justify-between px-6 bg-black">
             <div className="flex items-center gap-2">
                 <div className="w-4 h-4 bg-red-500 border border-white"></div>
                 <h2 className="font-black text-2xl tracking-tighter">SMART<span className="text-yellow-400">LAB</span>_EXAM</h2>
             </div>
             <button onClick={closeModal} className="font-bold hover:text-red-500 border-2 border-transparent hover:border-red-500 px-2">
                 [CLOSE X]
             </button>
          </div>

          {/* PAUSED OVERLAY */}
          {status === 'PAUSED' && (
             <div className="absolute inset-0 z-50 bg-red-600 flex flex-col items-center justify-center">
                 <h1 className="text-6xl font-black text-white mb-2">LOCKED</h1>
                 <p className="font-mono text-black bg-white px-2 mb-6">FULLSCREEN REQUIRED</p>
                 <button onClick={() => {document.documentElement.requestFullscreen(); setStatus('ACTIVE')}} className="border-4 border-black bg-yellow-400 text-black font-black px-8 py-4 hover:scale-105">
                    RESUME SESSION
                 </button>
             </div>
          )}

          {/* CONTENT AREA */}
          <div className="flex-1 flex overflow-hidden">
             
             {/* LEFT SIDEBAR (Problem & Stats) */}
             <div className="w-1/3 border-r-4 border-white bg-[#111] p-6 flex flex-col gap-6 overflow-y-auto">
                 {/* Live Stats Box */}
                 <div className="border-2 border-white bg-black p-4 shadow-[4px_4px_0px_0px_#666]">
                    <h3 className="text-yellow-400 font-bold border-b border-gray-700 mb-2 pb-1">LIVE METRICS</h3>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Trust Score:</span>
                        <span className={`${trustScore < 70 ? 'text-red-500' : 'text-green-400'} font-bold`}>{trustScore}%</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Tab Switches:</span>
                        <span className="text-white font-bold">{tabSwitchCount}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Pastes (Ext):</span>
                        <span className="text-red-500 font-bold">{pasteCount.external}</span>
                    </div>
                 </div>

                 {/* Problem Box */}
                 <div>
                    <h3 className="font-black text-xl mb-2 text-white uppercase decoration-4 underline decoration-yellow-400">Mission Objective</h3>
                    <p className="font-mono text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{EXAM_QUESTION}</p>
                 </div>
             </div>

             {/* RIGHT AREA (Editor or Start/End) */}
             <div className="flex-1 relative bg-black">
                {status === 'LOCKED' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <h1 className="text-4xl font-black mb-6">READY?</h1>
                        <button onClick={handleStart} className="px-10 py-4 bg-white text-black font-black text-2xl border-4 border-black shadow-[6px_6px_0px_0px_#yellow-400] hover:translate-y-1 hover:shadow-none transition-all">
                            BEGIN EXAM
                        </button>
                    </div>
                )}

                {(status === 'ACTIVE' || status === 'SUBMITTING') && (
                    <>
                        <Editor 
                            height="100%" 
                            defaultLanguage="python" 
                            defaultValue={code} 
                            theme="vs-dark"
                            onMount={handleEditorDidMount} 
                            onChange={(val) => setCode(val || "")}
                            options={{ fontFamily: 'monospace', fontSize: 14 }}
                        />
                        <button 
                            onClick={handleSubmit} 
                            disabled={status === 'SUBMITTING'}
                            className="absolute bottom-6 right-6 px-6 py-3 bg-blue-600 text-white font-black border-2 border-white shadow-[4px_4px_0px_0px_#fff] hover:translate-y-1 hover:shadow-none"
                        >
                            {status === 'SUBMITTING' ? 'ANALYZING...' : 'SUBMIT CODE'}
                        </button>
                    </>
                )}

                {status === 'GRADED' && gradingResult && (
                    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center p-8">
                        <div className={`text-8xl mb-4 ${gradingResult.passed ? 'text-green-400' : 'text-red-500'}`}>
                            {gradingResult.passed ? 'PASS' : 'FAIL'}
                        </div>
                        <p className="text-white border-y border-white py-2 mb-6 font-mono">{gradingResult.feedback}</p>
                        
                        {gradingResult.passed && (
                            <div className="flex flex-col items-center gap-4">
                                <div className="border-2 border-white p-2 bg-[#111]">
                                    {certificate ? (
                                        <img src={certificate.previewUrl} className="h-40 object-contain" alt="Cert" />
                                    ) : (
                                        <div className="h-40 w-60 flex items-center justify-center text-yellow-500">GENERATING...</div>
                                    )}
                                </div>
                                <button 
                                    onClick={handleMint}
                                    disabled={isMinting || !certificate}
                                    className="px-8 py-3 bg-yellow-400 text-black font-black border-2 border-white shadow-[4px_4px_0px_0px_#fff]"
                                >
                                    {isMinting ? 'MINTING...' : 'MINT NFT'}
                                </button>
                            </div>
                        )}
                        {!gradingResult.passed && (
                            <button onClick={() => setStatus('ACTIVE')} className="px-6 py-2 border-2 border-white text-white hover:bg-white hover:text-black">TRY AGAIN</button>
                        )}
                    </div>
                )}
             </div>
          </div>
      </div>
    </div>
  );
};

export default DevDuel;