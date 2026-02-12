import { useState, useEffect, useRef, useCallback } from 'react';

// --- CONFIGURATION ---
const CONFIG = {
  WPM_REALISTIC_MAX: 180,      // Humans rarely type code faster than this
  PASTE_THRESHOLD: 10,         // Inserting >10 chars at once is considered a paste
  TRUST_PENALTY_TAB: 15,       // -15% for leaving the tab
  TRUST_PENALTY_FOCUS: 10,     // -10% for losing focus (extensions/overlays)
  TRUST_PENALTY_PASTE: 20,     // -20% for pasting code
  TRUST_PENALTY_BOT: 50,       // -50% for impossible typing speeds
};

export const useKeystrokeMonitor = () => {
  // --- STATE ---
  const [trustScore, setTrustScore] = useState(100);
  const [wpm, setWpm] = useState(0);
  const [pasteCount, setPasteCount] = useState(0);
  const [violationLog, setViolationLog] = useState<string[]>([]);
  
  // --- REFS (Mutable tracking without re-renders) ---
  const keyHistory = useRef<{ timestamp: number; charCount: number }[]>([]);
  const lastStrokeTime = useRef<number>(Date.now());
  const isTabActive = useRef(true);

  // --- HELPER: LOG VIOLATION ---
  const logViolation = useCallback((type: string, penalty: number, details: string = "") => {
    const timestamp = new Date().toLocaleTimeString();
    const message = `[${timestamp}] 🚨 VIOLATION: ${type} ${details} (-${penalty}%)`;
    
    console.warn(message);
    
    // Update State
    setViolationLog(prev => [message, ...prev]);
    setTrustScore(prev => Math.max(0, prev - penalty));
  }, []);

  // --- 1. ENVIRONMENT MONITOR (Tab & Window Focus) ---
  useEffect(() => {
    // A. TAB SWITCHING (The "Alt-Tab" Police)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isTabActive.current = false;
        logViolation("TAB_SWITCH", CONFIG.TRUST_PENALTY_TAB, "(User left the exam tab)");
      } else {
        isTabActive.current = true;
        console.log("User returned to exam.");
      }
    };

    // B. FOCUS LOSS (Detects Extensions/Overlays/DevTools)
    // If an extension popup opens (e.g., ChatGPT Sidebar, Grammarly), the window blurs.
    const handleWindowBlur = () => {
      // Only penalize if the tab is still "visible" but lost focus (Overlay/Popup)
      if (document.visibilityState === 'visible') {
        logViolation("WINDOW_FOCUS_LOSS", CONFIG.TRUST_PENALTY_FOCUS, "(Possible Extension/Overlay/DevTools)");
      }
    };

    // C. EXTERNAL CLIPBOARD PASTE LISTENER
    // This catches "Ctrl+V" specifically from the OS level
    const handleExternalPaste = (e: ClipboardEvent) => {
      // We don't prevent it (that breaks UX), but we verify it
      const text = e.clipboardData?.getData('text') || "";
      console.log(`📋 System Paste Event Detected: "${text.substring(0, 20)}..."`);
      // Note: The logic inside 'processKeystroke' will actually apply the penalty based on size
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("paste", handleExternalPaste);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("paste", handleExternalPaste);
    };
  }, [logViolation]);

  // --- 2. KEYSTROKE ANALYZER (Attached to Editor) ---
  const processKeystroke = useCallback((event: any) => {
    const now = Date.now();
    
    // Monaco Editor Change Event Structure
    const changes = event.changes; // Array of changes
    
    changes.forEach((change: any) => {
      const textInserted = change.text;
      const textLength = textInserted.length;

      // A. DETECT PASTE (Large Insertion)
      if (textLength > CONFIG.PASTE_THRESHOLD) {
        setPasteCount(prev => prev + 1);
        logViolation("CODE_PASTE", CONFIG.TRUST_PENALTY_PASTE, `(Inserted ${textLength} chars)`);
        return; 
      }

      // B. CALCULATE WPM (Typing Speed)
      // Only count actual typing (length 1 insertions), ignore deletions
      if (textLength === 1) {
        // Add to history
        keyHistory.current.push({ timestamp: now, charCount: 1 });
        
        // Prune history older than 60 seconds (Rolling Window)
        const sixtySecondsAgo = now - 60000;
        keyHistory.current = keyHistory.current.filter(h => h.timestamp > sixtySecondsAgo);
        
        // Calculate WPM: (Chars in last 60s / 5) = Standard Word Count
        const currentWPM = Math.round(keyHistory.current.length / 5);
        setWpm(currentWPM);

        // C. DETECT BOT SPEEDS
        if (currentWPM > CONFIG.WPM_REALISTIC_MAX) {
           // Only penalize if we haven't penalized recently to avoid draining score instantly
           if (now - lastStrokeTime.current > 1000) { 
             logViolation("BOT_SPEED", CONFIG.TRUST_PENALTY_BOT, `(${currentWPM} WPM)`);
           }
        }
      }
    });

    lastStrokeTime.current = now;
  }, [logViolation]);

  return {
    trustScore,
    wpm,
    pasteCount,
    violationLog,
    processKeystroke
  };
};