"use client";

import React, { useRef, useState } from "react";
import { Download, Upload, X } from "lucide-react";
import { exportBackupJson, type ImportBackupSummary } from "@/lib/db/backup";
import { getLocalDateString } from "@/lib/ids";

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  onImportBackup: (rawJson: string) => Promise<ImportBackupSummary>;
}

export function SettingsDrawer({
  open,
  onClose,
  onImportBackup,
}: SettingsDrawerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function handleExport() {
    setBusy(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const jsonText = await exportBackupJson();
      const blob = new Blob([jsonText], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `so-ngoc-nhu-backup-${getLocalDateString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMessage("Đã xuất tệp sao lưu .json thành công.");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Không thể xuất tệp sao lưu.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setBusy(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const text = await file.text();
      const summary = await onImportBackup(text);
      setStatusMessage(
        `Đã khôi phục ${summary.notesImported} ghi chú, ${summary.wishesImported} điều ước, ${summary.stickersImported} sticker.`,
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Tệp sao lưu không hợp lệ.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cài đặt sổ"
      className="fixed inset-0 z-50 bg-[#4A2C3A]/45 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-3"
    >
      <div className="bg-white rounded-[26px] border-2 border-[#FFB7CE] p-4 w-full max-w-[440px] k-shadow anim-pop space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-extrabold text-[#4A2C3A]">
            Cài Đặt &amp; Sao Lưu
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cài đặt"
            className="btn-press cursor-pointer min-w-[44px] min-h-[44px] rounded-2xl bg-[#FFF0F5] flex items-center justify-center text-[#8C5A6E]"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="rounded-2xl bg-[#FFF5F8] border border-[#FFD1E1] p-3.5 space-y-2.5">
          <div className="text-xs font-extrabold text-[#4A2C3A]">
            Sao lưu cục bộ (.json)
          </div>
          <p className="text-[11px] text-[#8C5A6E] leading-relaxed">
            Xuất toàn bộ ghi chú, ảnh vẽ, sticker tự vẽ và điều ước để lưu dự
            phòng hoặc khôi phục lại vào máy.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleExport()}
              className="btn-press cursor-pointer min-h-[44px] px-3 rounded-2xl bg-[#D63D76] text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 k-shadow-sm disabled:opacity-60"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>Xuất sao lưu .json</span>
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className="btn-press cursor-pointer min-h-[44px] px-3 rounded-2xl bg-white border-2 border-[#FFB7CE] text-[#B52A5E] text-xs font-extrabold inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <Upload className="w-4 h-4" aria-hidden="true" />
              <span>Nhập sao lưu .json</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={(e) => void handleFileChange(e)}
              aria-label="Chọn tệp sao lưu JSON"
              className="hidden"
            />
          </div>
        </div>

        {statusMessage ? (
          <div
            role="status"
            className="px-3 py-2 rounded-xl bg-[#C6EBD1]/45 border border-[#5AA473] text-xs font-bold text-[#2F6B45]"
          >
            {statusMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div
            role="alert"
            className="px-3 py-2 rounded-xl bg-[#FFE4EE] border border-[#D63D76] text-xs font-bold text-[#B52A5E]"
          >
            {errorMessage}
          </div>
        ) : null}
      </div>
    </div>
  );
}
