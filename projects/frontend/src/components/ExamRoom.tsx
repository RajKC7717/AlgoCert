import React, { useState, useEffect, useRef } from 'react';
import Editor from "@monaco-editor/react";
import { useWallet } from '@txnlab/use-wallet-react';
import { useAntiCheat } from '../hooks/useAntiCheat';
import { gradeSubmission } from '../utils/aiGrader'; // <--- Import AI Logic

const ExamRoom = () => {
  const { activeAddress } = useWallet(); 
  
  // --- STATE ---
  const [code, setCode] = useState("# Task: Return your wallet suffix.\n# Security: ANTI-SPOOFING ACTIVE.");
  const [gradingResult, setGradingResult] = useState<any>(null); // For the Popup
  const [isGrading, setIsGrading] = useState(false);

  const editorRef = useRef<any>(null);

  const { 
    warnings, 
    isLocked, 
    pasteCount, 
    setPasteCount, 
    triggerWarning, 
    internalClipboard 
  } = useAntiCheat(3); 

  // --- EDITOR SETUP ---
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Internal Copy Tracker
    editor.onKeyDown((e: any) => {
        if ((e.metaKey || e.ctrlKey) && e.code === 'KeyC') {
            const selection = editor.getModel().getValueInRange(editor.getSelection());
            internalClipboard.current = selection;
            console.log("✅ Internal Copy Recorded");
        }
    });

    // Paste Validator
    editor.onDidPaste((e: any) => {
        const pastedText = e.range ? editor.getModel().getValueInRange(e.range) : "";
        const cleanPaste = pastedText.trim().replace(/\s+/g, '');
        const cleanClip = internalClipboard.current.trim().replace(/\s+/g, '');

        if (cleanPaste === cleanClip && cleanClip.length > 0) {
            console.log("✅ Paste Allowed");
        } else {
            setPasteCount(prev => prev + 1);
            triggerWarning("🚨 EXTERNAL PASTE DETECTED");
        }
    });
  };

  // --- AI GRADING HANDLER ---
  const handleFinishExam = async () => {
      if (isGrading) return;
      setIsGrading(true);

      // 1. Call the AI Grader (mock)
      const result = await gradeSubmission(code, warnings);
      
      // 2. Show Custom Modal (No Alerts!)
      setGradingResult(result);
      setIsGrading(false);
  };

  // --- LOCKED SCREEN ---
  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-red-950 text-white fixed inset-0 z-50">
        <h1 className="text-9xl font-black">LOCKED</h1>
        <p className="text-2xl mt-4">Security Violation Detected.</p>
        <button onClick={() => window.location.reload()} className="mt-8 px-6 py-3 bg-red-600 rounded font-bold hover:bg-red-500">RESET DEMO</button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white relative">
        
      {/* HEADER */}
      <div className="h-16 bg-[#252526] flex justify-between items-center px-6 border-b border-black shadow-md">
        <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_green]"></div>
            <div className="font-bold text-lg tracking-wide">SMART-LAB <span className="text-gray-500 text-sm">| EXAM ACTIVE</span></div>
        </div>
        
        <div className="flex gap-4 items-center">
            <div className={`px-4 py-1 rounded font-mono border ${warnings > 0 ? 'bg-red-900/40 border-red-500 text-red-200' : 'bg-green-900/20 border-green-700 text-green-400'}`}>
                STRIKES: {warnings}/3
            </div>
            <button 
                onClick={handleFinishExam}
                disabled={isGrading}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold transition-all shadow-lg hover:shadow-blue-500/50 disabled:opacity-50"
            >
                {isGrading ? "GRADING..." : "SUBMIT SOLUTION"}
            </button>
        </div>
      </div>

      {/* SPLIT VIEW */}
      <div className="flex-grow flex">
        {/* QUESTION PANEL */}
        <div className="w-1/3 bg-[#1e1e1e] border-r border-gray-800 p-6 overflow-y-auto">
            <h2 className="text-2xl font-bold text-blue-400 mb-4">Task: String Reversal</h2>
            <div className="prose prose-invert">
                <p className="text-gray-300 mb-4">
                    Write a Python function named <code>reverse_string</code> that takes a string input and returns it reversed.
                </p>
                <div className="bg-black/50 p-4 rounded border border-gray-700 font-mono text-sm mb-4">
                    <p className="text-green-400"># Example Input:</p>
                    <p>"Algorand"</p>
                    <p className="text-green-400 mt-2"># Expected Output:</p>
                    <p>"dnaroglA"</p>
                </div>
            </div>
        </div>

        {/* EDITOR PANEL */}
        <div className="w-2/3 relative">
            <Editor
                height="100%"
                defaultLanguage="python"
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val || "")}
                onMount={handleEditorDidMount}
                options={{ fontSize: 16, minimap: { enabled: false }, padding: { top: 20 }, automaticLayout: true, pasteAsQuotedText: false }}
            />
        </div>
      </div>

      {/* --- GRADING MODAL (Prevents 'Blur' Strike) --- */}
      {gradingResult && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
              <div className={`p-8 rounded-2xl border-2 shadow-2xl max-w-md w-full text-center ${gradingResult.passed ? 'bg-gray-900 border-green-500' : 'bg-gray-900 border-red-500'}`}>
                  <div className="text-6xl mb-4">{gradingResult.passed ? "🏆" : "❌"}</div>
                  <h2 className={`text-3xl font-bold mb-2 ${gradingResult.passed ? 'text-green-400' : 'text-red-400'}`}>
                      {gradingResult.passed ? "PASSED!" : "FAILED"}
                  </h2>
                  <p className="text-gray-300 text-lg mb-6">{gradingResult.feedback}</p>
                  
                  <div className="bg-black/40 rounded-lg p-4 mb-6 grid grid-cols-2 gap-4">
                      <div>
                          <div className="text-xs text-gray-500 uppercase">Score</div>
                          <div className="text-2xl font-mono font-bold">{gradingResult.score}/100</div>
                      </div>
                      <div>
                          <div className="text-xs text-gray-500 uppercase">Integrity</div>
                          <div className="text-2xl font-mono font-bold">{warnings === 0 ? "PERFECT" : "FLAGGED"}</div>
                      </div>
                  </div>

                  <button 
                    onClick={() => setGradingResult(null)} // Close modal
                    className="w-full py-3 rounded font-bold bg-gray-700 hover:bg-gray-600 transition-colors"
                  >
                      {gradingResult.passed ? "MINT CERTIFICATE (Coming Soon)" : "TRY AGAIN"}
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default ExamRoom;