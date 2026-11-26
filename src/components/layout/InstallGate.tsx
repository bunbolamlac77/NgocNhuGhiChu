"use client";

import React, { useEffect, useState } from "react";
import { Share, X } from "lucide-react";

interface InstallGateProps {
  onPersistenceChange?: (persisted: boolean) => void;
}

export function InstallGate({ onPersistenceChange }: InstallGateProps) {
  const [showIosBanner, setShowIosBanner] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Keep app usable even if SW registration fails in private mode
      });
    }

    async function checkStoragePersistence() {
      try {
        const storage = navigator.storage;
        if (!storage) return;
        let persisted = false;
        if (typeof storage.persisted === "function") {
          persisted = await storage.persisted();
        }
        if (!persisted && typeof storage.persist === "function") {
          persisted = await storage.persist();
        }
        onPersistenceChange?.(Boolean(persisted));
      } catch {
        onPersistenceChange?.(false);
      }
    }

    void checkStoragePersistence();

    const ua = navigator.userAgent || "";
    const isIos = /iphone|ipad|ipod/i.test(ua);
    const navWithStandalone = navigator as Navigator & { standalone?: boolean };
    const isStandalone =
      Boolean(navWithStandalone.standalone) ||
      window.matchMedia?.("(display-mode: standalone)")?.matches === true;

    if (isIos && !isStandalone) {
      setShowIosBanner(true);
    }
  }, [onPersistenceChange]);

  if (!showIosBanner) return null;

  return (
    <div
      role="region"
      aria-label="Hướng dẫn cài đặt lên Màn hình chính"
      className="mx-3.5 mt-2 rounded-2xl bg-[#FFF4D6] border border-[#F6C85F] px-3 py-2.5 flex items-center justify-between gap-2 text-xs text-[#7A5200]"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Share className="w-4 h-4 shrink-0 text-[#B52A5E]" aria-hidden="true" />
        <p className="font-bold leading-snug">
          Nhấn <strong>Chia sẻ</strong> rồi chọn{" "}
          <strong>Thêm vào Màn hình chính</strong> để dùng mượt và bền hơn trên
          iPhone!
        </p>
      </div>
      <button
        type="button"
        onClick={() => setShowIosBanner(false)}
        aria-label="Ẩn hướng dẫn cài đặt"
        className="btn-press cursor-pointer min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center shrink-0 text-[#7A5200]"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
