"use client";

import React, { useEffect, useState } from "react";
import { Check, Scissors, X } from "lucide-react";
import { saveLocalCustomSticker } from "@/lib/db/assets-repo";
import { exportDieCutSticker } from "@/lib/drawing/diecut";
import type { LocalCustomStickerRecord } from "@/types/models";

interface SaveStickerModalProps {
  open: boolean;
  sourceCanvas: HTMLCanvasElement | null;
  onClose: () => void;
  onSaved: (record: LocalCustomStickerRecord) => void;
}

export function SaveStickerModal({
  open,
  sourceCanvas,
  onClose,
  onSaved,
}: SaveStickerModalProps) {
  const [name, setName] = useState("Sticker xinh");
  const [borderEnabled, setBorderEnabled] = useState(true);
  const [shadowEnabled, setShadowEnabled] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMeta, setPreviewMeta] = useState<{
    width: number;
    height: number;
    sizeBytes: number;
    mime: "image/webp" | "image/png";
    blob: Blob;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !sourceCanvas) {
      return;
    }

    let cancelled = false;
    let generatedUrl: string | null = null;

    async function buildPreview() {
      if (!sourceCanvas) return;
      setError(null);
      try {
        const result = await exportDieCutSticker(sourceCanvas, {
          borderEnabled,
          shadowEnabled,
        });
        if (cancelled) return;
        generatedUrl = URL.createObjectURL(result.blob);
        setPreviewUrl(generatedUrl);
        setPreviewMeta(result);
      } catch (err) {
        if (cancelled) return;
        setPreviewMeta(null);
        setPreviewUrl(null);
        setError(
          err instanceof Error
            ? err.message
            : "Không thể cắt sticker từ khung vẽ hiện tại.",
        );
      }
    }

    void buildPreview();

    return () => {
      cancelled = true;
      if (generatedUrl) {
        URL.revokeObjectURL(generatedUrl);
      }
    };
  }, [open, sourceCanvas, borderEnabled, shadowEnabled]);

  if (!open) return null;

  async function handleSaveSticker() {
    if (!previewMeta) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await saveLocalCustomSticker({
        name: name.trim() || "Sticker xinh",
        width: previewMeta.width,
        height: previewMeta.height,
        mime: previewMeta.mime,
        blob: previewMeta.blob,
      });
      setSaving(false);
      onSaved(saved);
    } catch (err) {
      setSaving(false);
      setError(
        err instanceof Error
          ? err.message
          : "Không lưu được sticker vào kho.",
      );
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-sticker-title"
      className="fixed inset-0 z-50 bg-[#4A2C3A]/45 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-[360px] rounded-[28px] bg-white border-2 border-[#FFD1E1] p-5 k-shadow space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2
            id="save-sticker-title"
            className="text-[16px] font-extrabold text-[#4A2C3A] flex items-center gap-2"
          >
            <Scissors className="w-4 h-4 text-[#D63D76]" aria-hidden="true" />
            <span>Cắt làm Sticker</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại cắt sticker"
            className="btn-press cursor-pointer min-w-[44px] min-h-[44px] rounded-2xl bg-[#FFF0F5] flex items-center justify-center text-[#8C5A6E]"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Die-cut transparent checkered preview */}
        <div className="rounded-2xl border-2 border-dashed border-[#FFD1E1] bg-[radial-gradient(#FFE8F1_1px,transparent_1px)] [background-size:12px_12px] bg-[#FFFDFE] min-h-[168px] flex flex-col items-center justify-center p-3 gap-2">
          {previewUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Xem trước sticker viền trắng"
                className="max-h-[128px] max-w-full object-contain"
              />
              {previewMeta ? (
                <span className="text-[11px] font-bold text-[#8C5A6E]">
                  {previewMeta.width}×{previewMeta.height} px ·{" "}
                  {(previewMeta.sizeBytes / 1024).toFixed(1)} KB
                </span>
              ) : null}
            </>
          ) : error ? (
            <p className="text-xs font-bold text-[#B52A5E] text-center">{error}</p>
          ) : (
            <p className="text-xs font-bold text-[#8C5A6E]">
              Đang cắt viền trắng cho nét vẽ...
            </p>
          )}
        </div>

        <div className="space-y-2.5">
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[#4A2C3A]">Tên sticker</span>
            <input
              type="text"
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Bé thỏ ôm tim"
              aria-label="Tên sticker tự vẽ"
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#FFF7FA] border border-[#FFD1E1] text-xs font-semibold text-[#4A2C3A] focus:outline-none focus:border-[#D63D76]"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="min-h-[44px] px-3 rounded-xl bg-[#FFF7FA] border border-[#FFE0EC] flex items-center gap-2 text-xs font-bold text-[#4A2C3A] cursor-pointer">
              <input
                type="checkbox"
                checked={borderEnabled}
                onChange={(e) => setBorderEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#D63D76]"
              />
              <span>Viền trắng</span>
            </label>
            <label className="min-h-[44px] px-3 rounded-xl bg-[#FFF7FA] border border-[#FFE0EC] flex items-center gap-2 text-xs font-bold text-[#4A2C3A] cursor-pointer">
              <input
                type="checkbox"
                checked={shadowEnabled}
                onChange={(e) => setShadowEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#D63D76]"
              />
              <span>Đổ bóng nhẹ</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="btn-press cursor-pointer flex-1 min-h-[44px] rounded-full bg-[#FFF0F5] text-[#8C5A6E] text-xs font-extrabold"
          >
            Hủy
          </button>
          <button
            type="button"
            data-save-sticker-confirm="true"
            disabled={!previewMeta || saving}
            onClick={() => void handleSaveSticker()}
            className="btn-press cursor-pointer flex-[1.5] min-h-[44px] rounded-full bg-[#D63D76] text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 disabled:opacity-45"
          >
            <Check className="w-4 h-4" aria-hidden="true" />
            <span>{saving ? "Đang lưu..." : "Lưu vào Kho Sticker"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
