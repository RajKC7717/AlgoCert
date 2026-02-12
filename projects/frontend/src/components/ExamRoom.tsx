import React, { useState, useEffect } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { useSnackbar } from 'notistack';
import Editor from '@monaco-editor/react';
import { useKeystrokeMonitor } from '../hooks/useKeystrokeMonitor';

// UTILITIES
import { gradeExam } from '../utils/gradeExam';
import { generateCertificate } from '../utils/generateCertificate';

const EXAM_QUESTION = `Given an array of integers 'nums' and an integer 'target', return indices of the two numbers such that they add up to target.
You may assume that each input would have exactly one solution.`;

const EXAM_DURATION_SEC = 3600;

const ExamRoom = () => {
  const { activeAddress } = useWallet();
  const { enqueueSnackbar } = useSnackbar();
  
  const { trustScore, processKeystroke } = useKeystrokeMonitor();

  // STATE
  const [status, setStatus] = useState<'LOCKED' | 'ENROLLING' | 'ACTIVE' | 'PAUSED' | 'TERMINATED' | 'SUBMITTING' | 'GRADED'>('LOCKED');
  const [warnings, setWarnings] = useState(0);
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION_SEC);
  const [code, setCode] = useState("# Write your solution here...\ndef solve_challenge():\n    pass");
  const [gradingResult, setGradingResult] = useState<any>(null);

  // --- 1. ENTER SECURE MODE ---
  const enterSecureMode = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      setStatus('ENROLLING');
    } catch (err) { alert("Full Screen Required"); }
  };

  // --- 2. PLEDGE (Strict) ---
  const handlePledge = async () => {
    if (!activeAddress) {
        enqueueSnackbar("❌ Wallet Disconnected. Please Login.", { variant: 'error' });
        return;
    }
    setStatus('ACTIVE');
    enqueueSnackbar("✅ Pledge Recorded! Good Luck.", { variant: 'success' });
  };

  // --- 3. SUBMISSION HANDLER (Strict) ---
  const handleSubmit = async () => {
    // 🛡️ SECURITY CHECK: Is user still connected?
    if (!activeAddress) {
        setStatus('TERMINATED');
        enqueueSnackbar("❌ FATAL: Wallet Disconnected during exam.", { variant: 'error' });
        return;
    }

    if (trustScore < 70) {
        setStatus('TERMINATED');
        enqueueSnackbar("❌ REJECTED: Trust Score too low.", { variant: 'error' });
        return;
    }

    setStatus('SUBMITTING');

    try {
        enqueueSnackbar("💸 Verifying Identity & Payment...", { variant: 'info' });
        
        // Simulate Payment Delay (2s)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        enqueueSnackbar("✅ Identity Verified! Grading...", { variant: 'success' });

        // AI Grading
        const result = await gradeExam(EXAM_QUESTION, code);
        setGradingResult(result);
        setStatus('GRADED');

    } catch (error: any) {
        console.error(error);
        enqueueSnackbar("❌ Error: " + error.message, { variant: 'error' });
        setStatus('ACTIVE');
    }
  };

  // --- 4. WATCHDOGS ---
  useEffect(() => {
    const handleVisibility = () => { if (document.hidden && status === 'ACTIVE') handleViolation("Tab Switching"); };
    const handleFullScreen = () => { if (!document.fullscreenElement && status === 'ACTIVE') { setStatus('PAUSED'); handleViolation("Exited Full Screen"); } };
    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullScreen);
    return () => { document.removeEventListener("visibilitychange", handleVisibility); document.removeEventListener("fullscreenchange", handleFullScreen); };
  }, [status]);

  const handleViolation = (reason: string) => {
    setWarnings(prev => prev + 1);
    enqueueSnackbar(`⚠️ WARNING: ${reason}`, { variant: 'warning' });
  };

  // --- UI RENDERER ---
  return (
    <div className={`min-h-screen ${status === 'ACTIVE' ? 'bg-[#1e1e1e]' : 'bg-black'} text-white font-sans overflow-hidden`}>
      
      {/* LOCKED / ENROLLING / PAUSED States */}
      {status === 'LOCKED' && (
         <div className="h-screen flex flex-col items-center justify-center">
             <button onClick={enterSecureMode} className="px-8 py-4 bg-blue-600 font-bold rounded">ENTER SECURE MODE</button>
         </div>
      )}
      {status === 'ENROLLING' && (
         <div className="h-screen flex flex-col items-center justify-center">
             <button onClick={handlePledge} className="px-8 py-4 bg-green-600 font-bold rounded">I AGREE & START</button>
         </div>
      )}
      {status === 'PAUSED' && (
         <div className="fixed inset-0 bg-red-900/90 flex flex-col items-center justify-center z-50">
             <h1 className="text-4xl font-bold">PAUSED</h1>
             <button onClick={() => {document.documentElement.requestFullscreen(); setStatus('ACTIVE')}} className="mt-4 px-6 py-2 bg-white text-red-900 font-bold rounded">RESUME</button>
         </div>
      )}
      {status === 'TERMINATED' && (
         <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
             <h1 className="text-6xl text-red-600 font-black">DISQUALIFIED</h1>
             <p className="text-gray-400 mt-4">Integrity Violation or Disconnection.</p>
         </div>
      )}

      {/* ACTIVE EXAM INTERFACE */}
      {(status === 'ACTIVE' || status === 'SUBMITTING') && (
        <div className="h-screen flex flex-col">
           {/* HEADER */}
           <div className="h-14 bg-[#252526] flex items-center justify-between px-6 border-b border-gray-700">
              <span className="font-bold">Python 101</span>
              <div className="flex gap-6 items-center">
                 <div className={`font-mono ${trustScore < 70 ? 'text-red-500' : 'text-green-400'}`}>Trust: {trustScore}%</div>
                 <div className="font-mono text-gray-400">{Math.floor(timeLeft/60)}m Left</div>
                 <button 
                    onClick={handleSubmit}
                    disabled={status === 'SUBMITTING'}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 font-bold rounded shadow-lg"
                 >
                    {status === 'SUBMITTING' ? "GRADING..." : "SUBMIT EXAM"}
                 </button>
              </div>
           </div>

           {/* SPLIT SCREEN */}
           <div className="flex-1 flex">
              <div className="w-1/3 p-6 border-r border-gray-700 overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4">Problem 1: Two Sum</h2>
                  <p className="text-gray-400 whitespace-pre-wrap">{EXAM_QUESTION}</p>
              </div>
              <div className="flex-1 relative">
                  <Editor 
                    height="100%" 
                    defaultLanguage="python" 
                    defaultValue={code} 
                    theme="vs-dark"
                    onMount={(editor) => editor.onDidChangeModelContent(processKeystroke)}
                    onChange={(val) => setCode(val || "")}
                  />
                  {status === 'SUBMITTING' && (
                      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10">
                          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                          <p className="text-blue-400 font-mono">Verifying & Grading...</p>
                      </div>
                  )}
              </div>
           </div>
        </div>
      )}

      {/* RESULTS MODAL (GRADED) */}
      {status === 'GRADED' && gradingResult && activeAddress && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center">
              <div className="bg-[#1e1e1e] p-10 rounded-2xl border border-gray-700 max-w-2xl w-full text-center shadow-2xl">
                  {gradingResult.passed ? (
                      <>
                        <div className="text-6xl mb-4">🏆</div>
                        <h1 className="text-4xl font-bold text-green-400 mb-2">YOU PASSED!</h1>
                        <p className="text-gray-400 mb-6">{gradingResult.feedback}</p>
                        
                        {/* CERTIFICATE PREVIEW (Safe Render) */}
                        <div className="bg-black/50 p-4 rounded-xl border border-gray-800 mb-8 inline-block">
                             <img 
                                src={generateCertificate(activeAddress, gradingResult.score, warnings).imageBase64} 
                                alt="Cert" 
                                className="h-48 rounded shadow-lg"
                             />
                        </div>
                        
                        <div className="flex gap-4 justify-center">
                            <button onClick={() => window.location.reload()} className="px-6 py-3 bg-gray-700 rounded font-bold">Close</button>
                        </div>
                      </>
                  ) : (
                      <>
                        <div className="text-6xl mb-4">❌</div>
                        <h1 className="text-4xl font-bold text-red-500 mb-2">EXAM FAILED</h1>
                        <p className="text-gray-300 mb-8">{gradingResult.feedback}</p>
                        <button onClick={() => setStatus('ACTIVE')} className="px-8 py-3 bg-white text-black font-bold rounded">Try Again</button>
                      </>
                  )}
              </div>
          </div>
      )}

    </div>
  );
};

export default ExamRoom;