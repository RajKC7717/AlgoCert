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

  // --- HELPER: Trigger a Strike ---
  const triggerWarning = (reason: string) => {
    if (isLocked) return;
    
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

      // 1. Frame Rate Check (Throttling detection)
      if (timeDiff > 900) {
          triggerWarning("❌ TAB SWITCH DETECTED (System Throttled)");
      }

      // 2. OS Focus Check (The "Always Active" Killer)
      if (!document.hasFocus()) {
          // You can uncomment this line for strict OS-level focus checking
          // triggerWarning("❌ WINDOW LOST FOCUS"); 
      }

      lastFrameTime.current = now;
      frameId.current = requestAnimationFrame(checkSecurity);
    };

    // Start Loop
    frameId.current = requestAnimationFrame(checkSecurity);

    // 3. Event Listeners (Redundant Safety)
    const handleVisibility = () => {
        if (document.hidden) triggerWarning("❌ TAB HIDDEN");
    };
    
    const handleBlur = () => {
        triggerWarning("❌ WINDOW UNFOCUSED (Alt-Tab Detected)");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur); 

    return () => {
      cancelAnimationFrame(frameId.current);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
    };
  }, [warnings, isLocked]);

  // --- LAYER 2: CLIPBOARD WHITELISTING ---
  useEffect(() => {
    const handleNativeCopy = () => {
        const selection = window.getSelection()?.toString();
        // Ideally, we rely on the editor to set the clipboard, 
        // but this catches generic page copies.
    };

    document.addEventListener("copy", handleNativeCopy);
    return () => document.removeEventListener("copy", handleNativeCopy);
  }, []);

  return {
    warnings,
    isLocked,
    pasteCount,
    setPasteCount,
    triggerWarning,
    internalClipboard
  };
};