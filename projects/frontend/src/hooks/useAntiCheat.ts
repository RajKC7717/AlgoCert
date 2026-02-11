import { useState, useEffect, useRef } from 'react';
import { useSnackbar } from 'notistack';

export const useAntiCheat = (MAX_WARNINGS: number = 3) => {
  const { enqueueSnackbar } = useSnackbar();
  
  // State
  const [warnings, setWarnings] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [pasteCount, setPasteCount] = useState(0);
  
  // Refs
  const internalClipboard = useRef(""); 
  const lastFrameTime = useRef(Date.now());
  const frameId = useRef<number>(0);
  const lastStrikeTime = useRef(0); // <--- NEW: To prevent double counting

  // --- HELPER: Trigger a Strike (Debounced) ---
  const triggerWarning = (reason: string) => {
    if (isLocked) return;

    // Prevent double strikes (e.g. Blur + Hidden firing same time)
    const now = Date.now();
    if (now - lastStrikeTime.current < 1000) return; 
    lastStrikeTime.current = now;
    
    setWarnings(prev => {
        const newCount = prev + 1;
        if (newCount >= MAX_WARNINGS) setIsLocked(true);
        return newCount;
    });
    
    enqueueSnackbar(`⚠️ STRIKE ${warnings + 1}/${MAX_WARNINGS}: ${reason}`, { variant: 'error' });
  };

  // --- LAYER 1: THE HEARTBEAT & FOCUS CHECK ---
  useEffect(() => {
    const checkSecurity = () => {
      const now = Date.now();
      const timeDiff = now - lastFrameTime.current;

      // 1. Frame Rate Check (Anti-Extension)
      if (timeDiff > 1200) { // Relaxed slightly to 1.2s to prevent false positives
          triggerWarning("❌ TAB SWITCH DETECTED (System Throttled)");
      }

      // 2. OS Focus Check (Strict)
      if (!document.hasFocus()) {
          // triggerWarning("❌ WINDOW LOST FOCUS"); 
      }

      lastFrameTime.current = now;
      frameId.current = requestAnimationFrame(checkSecurity);
    };

    frameId.current = requestAnimationFrame(checkSecurity);

    // 3. Event Listeners
    const handleVisibility = () => {
        if (document.hidden) triggerWarning("❌ TAB HIDDEN");
    };
    
    const handleBlur = () => {
        // Only trigger blur warning if document is NOT hidden 
        // (If hidden, visibility event handles it)
        if (!document.hidden) triggerWarning("❌ WINDOW UNFOCUSED (Alt-Tab)");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur); 

    return () => {
      cancelAnimationFrame(frameId.current);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
    };
  }, [warnings, isLocked]);

  return {
    warnings,
    isLocked,
    pasteCount,
    setPasteCount,
    triggerWarning,
    internalClipboard
  };
};