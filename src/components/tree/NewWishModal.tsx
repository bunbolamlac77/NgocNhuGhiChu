"use client";

import React, { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { MAX_WISH_CHARS, validateWishText } from "@/lib/validation";
import type { WishCardStyle } from "@/types/models";

interface NewWishModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (text: string, style: WishCardStyle) => Promise<void>;
}

const STYLE_OPTIONS: readonly { id: WishCardStyle; label: string }[] = [
  { id: "ema", label: "Thẻ gỗ Ema" },
  { id: "heart", label: "Trái tim" },
  { id: "star", label: "Ngôi sao" },
  { id: "lantern", label: "Đèn lồng" },
];

export function NewWishModal({ open, onClose, onCreate }: NewWishModalProps) {
  const [text, setText] = useState("");
  const [style, setStyle] = useState<WishCardStyle>("ema");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const check = validateWishText(text);
    if (!check.valid) {
      setError(check.reason);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onCreate(check.normalized, style);
      setText("");
      setStyle("ema");
      setSubmitting(false);
      onClose();
    } catch (err) {
      setSubmitting(false);
      setError(
        err instanceof Error ? err.message : "Không thể treo điều ước.",
      );
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-wish-title"
      className="fixed inset-0 z-50 bg-[#4A2C3A]/45 flex items-center justify-center p-4"
    >
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="w-full max-w-[360px] rounded-[28px] bg-white border-2 border-[#FFD1E1] p-5 k-shadow space-y-4"
      >
        <div className="flex items-center justify-between gap-2">
          <h2
            id="new-wish-title"
            className="text-[16px] font-extrabold text-[#4A2C3A] flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#D63D76]" aria-hidden="true" />
            <span>Treo điều ước mới</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại điều ước"
            className="btn-press cursor-pointer min-w-[44px] min-h-[44px] rounded-2xl bg-[#FFF0F5] flex items-center justify-center text-[#8C5A6E]"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {error ? (
          <div
            role="alert"
            className="px-3 py-2 rounded-xl bg-[#FFE4EE] border border-[#D63D76] text-xs font-bold text-[#B52A5E]"
          >
            {error}
          </div>
        ) : null}

        <label className="block space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-[#4A2C3A]">
            <span>Điều ước của Ngọc Như</span>
            <span className="text-[#8C5A6E]">
              {text.length}/{MAX_WISH_CHARS}
            </span>
          </div>
          <textarea
            rows={3}
            maxLength={MAX_WISH_CHARS}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ví dụ: Đọc xong 2 cuốn sách hay trong tháng này..."
            aria-label="Nội dung điều ước"
            className="w-full rounded-2xl bg-[#FFF7FA] border border-[#FFD1E1] p-3 text-xs font-semibold text-[#4A2C3A] focus:outline-none focus:border-[#D63D76] resize-none"
          />
        </label>

        <div className="space-y-1.5">
          <div className="text-xs font-bold text-[#4A2C3A]">Chọn kiểu thẻ</div>
          <div className="grid grid-cols-2 gap-1.5">
            {STYLE_OPTIONS.map((opt) => {
              const active = style === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  data-wish-style={opt.id}
                  aria-pressed={active}
                  onClick={() => setStyle(opt.id)}
                  className={`btn-press cursor-pointer min-h-[44px] px-3 rounded-xl text-xs font-extrabold border transition ${
                    active
                      ? "bg-[#D63D76] text-white border-[#B52A5E]"
                      : "bg-[#FFF5F8] text-[#4A2C3A] border-[#FFD1E1]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
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
            type="submit"
            disabled={submitting}
            className="btn-press cursor-pointer flex-[1.5] min-h-[44px] rounded-full bg-[#D63D76] text-white text-xs font-extrabold disabled:opacity-45"
          >
            {submitting ? "Đang treo..." : "Treo lên cây (+5 XP)"}
          </button>
        </div>
      </form>
    </div>
  );
}
