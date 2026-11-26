"use client";

import { useEffect, useRef } from "react";

export const AUTO_LOCK_MS = 15 * 60 * 1000;

export function shouldAutoLock(
  hiddenAt: number | null,
  now: number,
  timeoutMs: number = AUTO_LOCK_MS,
): boolean {
  if (hiddenAt === null) return false;
  return now - hiddenAt >= timeoutMs;
}

export function useAutoLock(enabled: boolean, onLock: () => void): void {
  const hiddenAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      hiddenAtRef.current = null;
      return;
    }

    function checkElapsedAndLock() {
      if (shouldAutoLock(hiddenAtRef.current, Date.now())) {
        hiddenAtRef.current = null;
        onLock();
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        if (hiddenAtRef.current === null) {
          hiddenAtRef.current = Date.now();
        }
      } else {
        checkElapsedAndLock();
        hiddenAtRef.current = null;
      }
    }

    function handlePageHide() {
      if (hiddenAtRef.current === null) {
        hiddenAtRef.current = Date.now();
      }
    }

    function handleFocus() {
      checkElapsedAndLock();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("focus", handleFocus);
    };
  }, [enabled, onLock]);
}
