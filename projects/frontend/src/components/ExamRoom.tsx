import React, { useState, useRef } from 'react';
import Editor from "@monaco-editor/react";
import { useWallet } from '@txnlab/use-wallet-react';
import { useAntiCheat } from '../hooks/useAntiCheat'; // Import the new hook

const ExamRoom = () => {
  const { activeAddress } = useWallet(); 
  const [code, setCode] = useState("# Task: Return your wallet suffix.\n# Security: ANTI-SPOOFING ACTIVE.");
  
  const editorRef = useRef<any>(null);

  // Use the Hook (All logic is inside here now)
  const { 
    warnings, 
    isLocked, 
    pasteCount, 
    setPasteCount, 
    triggerWarning, 
    internalClipboard 
  } = useAntiCheat(3); // 3 Max Warnings

  // --- EDITOR SETUP ---
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // 1. Capture Internal Copies (Allow whitelisted text)
    // We listen for the editor's specific keybindings or context menu
    // But since we have the native listener in the hook, we just need 
    // to sync the editor selection when a copy happens.
    const updateClipboard = () => {
        const selection = editor.getModel().getValueInRange(editor.getSelection());
        if (selection) {
            internalClipboard.current = selection;
            console.log("✅ Whitelisted:", selection.slice(0, 10) + "...");
        }
    };
    
    // Bind to the Editor's Copy Command
    editor.onKeyDown((e: any) => {
        if ((e.metaKey || e.ctrlKey) && e.code === 'KeyC') updateClipboard();
    });
    // Also bind standard context menu copy if possible, or rely on Native Listener

    // 2. Paste Validation
    editor.onDidPaste((e: any) => {
        const pastedText = e.range ? editor.getModel().getValueInRange(e.range) : "";
        
        // Clean strings to ignore minor formatting differences
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

  const finishExam = () => {
      alert(`Exam Submitted!\nExternal Pastes: ${pasteCount}\nStrikes: ${warnings}`);
  };

  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-red-950 text-white fixed inset-0 z-50">
        <h1 className="text-9xl font-black">LOCKED</h1>
        <p className="text-2xl mt-4">Security Violation: Focus Lost or Malicious Extension.</p>
        <button onClick={() => window.location.reload()} className="mt-8 px-6 py-3 bg-red-600 rounded font-bold hover:bg-red-500">RESET</button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      <div className="h-16 bg-[#252526] flex justify-between items-center px-6 border-b border-black shadow-md">
        <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]"></div>
            <div className="font-bold text-lg tracking-wide">SMART-LAB <span className="text-gray-500 text-sm">| SECURE MODE</span></div>
        </div>
        <div className="flex gap-4 items-center">
            <div className={`px-4 py-1 rounded font-mono border ${warnings > 0 ? 'bg-red-900/40 border-red-500 text-red-200' : 'bg-green-900/20 border-green-700 text-green-400'}`}>
                STRIKES: {warnings}/3
            </div>
            <div className="px-4 py-1 rounded font-mono border bg-blue-900/20 border-blue-700 text-blue-300">
                PASTES: {pasteCount}
            </div>
            <button onClick={finishExam} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded font-bold transition-all shadow-lg hover:shadow-purple-500/50">
                SUBMIT EXAM
            </button>
        </div>
      </div>

      <div className="flex-grow relative">
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
  );
};

export default ExamRoom;