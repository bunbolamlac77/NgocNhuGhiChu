"use client";

import React from "react";
import {
  ArrowUpToLine,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  Trash2,
} from "lucide-react";
import type { PlacedSticker } from "@/types/models";

interface StickerControlsBarProps {
  selectedSticker: PlacedSticker | null;
  stickerCount: number;
  maxStickers: number;
  onScaleChange: (delta: number) => void;
  onRotateChange: (delta: number) => void;
  onBringToFront: () => void;
  onDelete: () => void;
}

export function StickerControlsBar({
  selectedSticker,
  stickerCount,
  maxStickers,
  onScaleChange,
  onRotateChange,
  onBringToFront,
  onDelete,
}: StickerControlsBarProps) {
  const disabled = !selectedSticker;

  return (
    <div
      data-sticker-controls="true"
      className={`bg-white rounded-2xl p-2.5 border-2 border-[#FFB7CE] k-shadow-sm space-y-2 transition ${
        disabled ? "opacity-75" : "opacity-100"
      }`}
    >
      <div className="flex items-center justify-between gap-2 text-[11px] font-extrabold">
        <span className="text-[#B52A5E] truncate">
          {selectedSticker
            ? `Đang chọn · Cỡ ${selectedSticker.scale}x · ${selectedSticker.rotation}°`
            : "Chạm sticker trên giấy để kéo & chỉnh"}
        </span>
        <span className="shrink-0 text-[#8C5A6E]">
          {stickerCount}/{maxStickers}
        </span>
      </div>

      <div className="grid grid-cols-6 gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onScaleChange(-0.18)}
          aria-label="Thu nhỏ sticker"
          title="Thu nhỏ"
          className="btn-press cursor-pointer min-w-[44px] min-h-[44px] rounded-xl bg-[#FFF0F5] border border-[#FFD1E1] flex items-center justify-center text-[#4A2C3A] disabled:opacity-45 disabled:cursor-not-allowed"
        >
          <Minus className="w-4 h-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onScaleChange(0.18)}
          aria-label="Phóng to sticker"
          title="Phóng to"
          className="btn-press cursor-pointer min-w-[44px] min-h-[44px] rounded-xl bg-[#FFF0F5] border border-[#FFD1E1] flex items-center justify-center text-[#4A2C3A] disabled:opacity-45 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onRotateChange(-15)}
          aria-label="Xoay trái sticker"
          title="Xoay trái 15 độ"
          className="btn-press cursor-pointer min-w-[44px] min-h-[44px] rounded-xl bg-[#FFF0F5] border border-[#FFD1E1] flex items-center justify-center text-[#4A2C3A] disabled:opacity-45 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onRotateChange(15)}
          aria-label="Xoay phải sticker"
          title="Xoay phải 15 độ"
          className="btn-press cursor-pointer min-w-[44px] min-h-[44px] rounded-xl bg-[#FFF0F5] border border-[#FFD1E1] flex items-center justify-center text-[#4A2C3A] disabled:opacity-45 disabled:cursor-not-allowed"
        >
          <RotateCw className="w-4 h-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={onBringToFront}
          aria-label="Đưa sticker lên trên"
          title="Đưa lên trên"
          className="btn-press cursor-pointer min-w-[44px] min-h-[44px] rounded-xl bg-[#FFF0F5] border border-[#FFD1E1] flex items-center justify-center text-[#4A2C3A] disabled:opacity-45 disabled:cursor-not-allowed"
        >
          <ArrowUpToLine className="w-4 h-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={onDelete}
          aria-label="Xóa sticker"
          title="Xóa sticker"
          className="btn-press cursor-pointer min-w-[44px] min-h-[44px] rounded-xl bg-[#FFE0EC] border border-[#FFB7CE] flex items-center justify-center text-[#D63D76] disabled:opacity-45 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
