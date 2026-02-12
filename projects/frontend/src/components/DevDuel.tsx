import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { useSnackbar } from 'notistack';
import Editor, { OnMount } from '@monaco-editor/react';
import { AlgorandClient } from '@algorandfoundation/algokit-utils';
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs';
import { useKeystrokeMonitor } from '../hooks/useKeystrokeMonitor';
import { gradeExam } from '../utils/gradeExam';
import { generateCertificate } from '../utils/generateCertificate';
import { uploadToIPFS, uploadJSONToIPFS, base64ToBlob } from '../utils/pinata';

interface DevDuelProps {
  openModal: boolean;
  closeModal: () => void;
}

const EXAM_QUESTION = `Given an array of integers 'nums' and an integer 'target', return indices of the two numbers such that they add up to target.`;

const DevDuel: React.FC<DevDuelProps> = ({ openModal, closeModal }) => {
  const { activeAddress, transactionSigner } = useWallet();
  const { enqueueSnackbar } = useSnackbar();
  const { trustScore, processKeystroke } = useKeystrokeMonitor();

  // --- ALGOKIT CLIENT ---
  const algorand = useMemo(() => {
    const algodConfig = getAlgodConfigFromViteEnvironment();
    const client = AlgorandClient.fromConfig({ algodConfig });
    client.setDefaultSigner(transactionSigner);
    return client;
  }, [transactionSigner]);

  // --- STATE ---
  const [status, setStatus] = useState<'LOCKED' | 'ACTIVE' | 'SUBMITTING' | 'GRADED'>('LOCKED');
  const [code, setCode] = useState("# Write your solution here...\ndef solve_challenge():\n    pass");
  const [gradingResult, setGradingResult] = useState<any>(null);
  const [isMinting, setIsMinting] = useState(false);

  // --- REFS ---
  const isInternalCopy = useRef<boolean>(false);
  const editorRef = useRef<any>(null);

  // --- RESET ---
  useEffect(() => {
    if (!openModal) {
      setStatus('LOCKED');
      setCode("# Reset...");
      setGradingResult(null);
      setIsMinting(false);
      isInternalCopy.current = false;
      if (document.fullscreenElement) document.exitFullscreen().catch(e => console.log(e));
    }
  }, [openModal]);

  const handleStart = async () => {
     try {
       if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
       setStatus('ACTIVE');
     } catch (err) {
       setStatus('ACTIVE');
     }
  };

  const handleSubmit = async () => {
    setStatus('SUBMITTING');
    try {
        await new Promise(r => setTimeout(r, 1000)); 
        const result = await gradeExam(EXAM_QUESTION, code);
        setGradingResult(result);
        setStatus('GRADED');
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    } catch (e) {
        enqueueSnackbar("Error submitting", { variant: 'error' });
        setStatus('ACTIVE');
    }
  };

  // --- MINT NFT LOGIC ---
  const handleMint = async () => {
    if (!activeAddress || !gradingResult) return;
    
    try {
        setIsMinting(true);
        enqueueSnackbar("📤 Uploading Certificate to IPFS...", { variant: 'info' });

        // 1. Generate & Upload Image
        const certData = generateCertificate(activeAddress, gradingResult.score, 0);
        const imageBlob = base64ToBlob(certData.imageBase64);
        const imageCid = await uploadToIPFS(imageBlob, `Cert-${activeAddress.slice(0,6)}`);
        
        // 2. Prepare Metadata (ARC-3 Standard)
        const metadata = {
            name: "Smart-Lab Python Certification",
            description: `Certified Python Developer. Score: ${gradingResult.score}/100. Trust Score: ${trustScore}%.`,
            image: imageCid, // Points to IPFS image
            properties: {
                score: gradingResult.score,
                trust_score: trustScore,
                exam: "Python 101",
                student: activeAddress,
                date: new Date().toISOString()
            }
        };

        enqueueSnackbar("💾 Pinning Metadata...", { variant: 'info' });
        const metadataCid = await uploadJSONToIPFS(metadata, `Meta-${activeAddress.slice(0,6)}`);

        // 3. Mint NFT on Algorand
        enqueueSnackbar("✍️ Signing Transaction...", { variant: 'warning' });
        
        const result = await algorand.send.assetCreate({
            sender: activeAddress,
            total: 1n,
            decimals: 0,
            assetName: "SL-CERT",
            unitName: "PY101",
            url: `${metadataCid}#arc3`, // ARC-3 Compliant URL
            manager: activeAddress,
        });

        enqueueSnackbar(`✅ NFT Minted! ID: ${result.confirmation.assetIndex}`, { variant: 'success' });
        setIsMinting(false);

    } catch (error: any) {
        console.error(error);
        enqueueSnackbar("Minting Failed: " + error.message, { variant: 'error' });
        setIsMinting(false);
    }
  };

  // --- EDITOR SETUP (Anti-Cheat) ---
  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
    const domNode = editor.getDomNode();
    if (domNode) {
      domNode.addEventListener('copy', () => { isInternalCopy.current = true; });
      domNode.addEventListener('cut', () => { isInternalCopy.current = true; });
      domNode.addEventListener('paste', (e: any) => {
        if (!isInternalCopy.current) {
          e.preventDefault();
          e.stopPropagation();
          enqueueSnackbar("⚠️ External Paste Forbidden!", { variant: 'error' });
        }
      }, true);
    }
  };

  if (!openModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#1e1e1e] text-white flex flex-col font-sans animate-in fade-in zoom-in duration-300">
      
      {/* HEADER */}
      <div className="h-16 bg-[#252526] border-b border-gray-700 flex items-center justify-between px-6">
         <h2 className="font-bold text-lg">🐍 Smart-Lab: Python Exam</h2>
         <button onClick={closeModal} className="btn btn-sm btn-ghost text-gray-400">Exit</button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 flex overflow-hidden">
         {status === 'LOCKED' && (
            <div className="m-auto text-center">
               <h1 className="text-4xl font-bold mb-4">Python Certification Exam</h1>
               <button onClick={handleStart} className="btn btn-primary btn-lg">Start Exam</button>
            </div>
         )}

         {(status === 'ACTIVE' || status === 'SUBMITTING') && (
            <>
              <div className="w-1/3 p-6 border-r border-gray-700 overflow-y-auto">
                 <h3 className="font-bold mb-2">Problem: Two Sum</h3>
                 <p className="text-gray-300">{EXAM_QUESTION}</p>
              </div>
              <div className="flex-1 relative">
                 <Editor 
                   height="100%" 
                   defaultLanguage="python" 
                   defaultValue={code} 
                   theme="vs-dark"
                   onMount={handleEditorDidMount} 
                   onChange={(val) => setCode(val || "")}
                 />
                 <button 
                    onClick={handleSubmit} 
                    disabled={status === 'SUBMITTING'}
                    className="absolute bottom-4 right-4 btn btn-primary"
                 >
                    {status === 'SUBMITTING' ? 'Grading...' : 'Submit Solution'}
                 </button>
              </div>
            </>
         )}

         {status === 'GRADED' && gradingResult && (
             <div className="m-auto text-center bg-[#252526] p-10 rounded-xl border border-gray-600 max-w-lg w-full">
                 <div className="text-6xl mb-4">{gradingResult.passed ? '🏆' : '❌'}</div>
                 <h2 className="text-3xl font-bold mb-2">{gradingResult.passed ? 'PASSED' : 'FAILED'}</h2>
                 <p className="mb-6 text-gray-400">{gradingResult.feedback}</p>
                 
                 {gradingResult.passed && activeAddress && (
                    <div className="mb-6">
                        <img 
                           src={generateCertificate(activeAddress, gradingResult.score, 0).imageBase64} 
                           className="h-48 mx-auto rounded shadow-lg mb-4 border border-gray-700" 
                           alt="Cert"
                        />
                        <button 
                            onClick={handleMint} 
                            disabled={isMinting}
                            className={`btn btn-wide ${isMinting ? 'btn-disabled' : 'btn-accent'}`}
                        >
                            {isMinting ? <span className="loading loading-spinner"></span> : 'Mint NFT on Algorand'}
                        </button>
                    </div>
                 )}
                 <button onClick={closeModal} className="btn btn-outline btn-sm">Close</button>
             </div>
         )}
      </div>
    </div>
  );
};

export default DevDuel;