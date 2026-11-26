"use client";

import React from "react";
import { Check, Sparkles, Trash2, X } from "lucide-react";
import type { LocalWishRecord } from "@/types/models";

interface WishBoxDrawerProps {
  open: boolean;
  wishes: readonly LocalWishRecord[];
  onClose: () => void;
  onToggleDone: (id: string) => Promise<void>;
  onDeleteWish: (id: string) => Promise<void>;
}

const STYLE_LABELS: Record<LocalWishRecord["style"], string> = {
  ema: "Thẻ gỗ Ema",
  heart: "Trái tim",
  star: "Ngôi sao",
  lantern: "Đèn lồng",
};

export function WishBoxDrawer({
  open,
  wishes,
  onClose,
  onToggleDone,
  onDeleteWish,
}: WishBoxDrawerProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wish-box-title"
      className="fixed inset-0 z-50 bg-[#4A2C3A]/45 flex items-end justify-center sm:items-center sm:p-4"
    >
      <div className="w-full max-w-[460px] rounded-t-[28px] sm:rounded-[28px] bg-white border-2 border-[#FFD1E1] p-5 k-shadow space-y-3 max-h-[82vh] flex flex-col">
        <div className="flex items-center justify-between gap-2 shrink-0">
          <h2
            id="wish-box-title"
            className="text-[16px] font-extrabold text-[#4A2C3A] flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#D63D76]" aria-hidden="true" />
            <span>Hộp điều ước ({wishes.length})</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp điều ước"
            className="btn-press cursor-pointer min-w-[44px] min-h-[44px] rounded-2xl bg-[#FFF0F5] flex items-center justify-center text-[#8C5A6E]"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto phone-scroll space-y-2 pr-0.5">
          {wishes.length === 0 ? (
            <div className="rounded-2xl bg-[#FFF5F8] border border-dashed border-[#FFB7CE] p-5 text-center text-xs font-semibold text-[#8C5A6E]">
              Chưa có điều ước nào. Hãy bấm &ldquo;Treo ước mới&rdquo; để gắn thẻ
              lên cành cây nhé!
            </div>
          ) : (
            wishes.map((wish) => (
              <div
                key={wish.id}
                data-wish-box-item={wish.id}
                className={`rounded-2xl border p-3 flex items-start justify-between gap-2 ${
                  wish.done
                    ? "bg-[#FFF8DF] border-[#F6C85F]"
                    : "bg-[#FFF9FB] border-[#FFE0EC]"
                }`}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-white border border-[#FFD1E1] text-[10px] font-extrabold text-[#B52A5E]">
                      {STYLE_LABELS[wish.style]}
                    </span>
                    {wish.done ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#FFE48A] text-[10px] font-extrabold text-[#7A5200]">
                        Đã thành hiện thực
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs font-bold text-[#4A2C3A] break-words">
                    {wish.text}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => void onToggleDone(wish.id)}
                    aria-label={
                      wish.done
                        ? `Đánh dấu chưa hoàn thành: ${wish.text}`
                        : `Đánh dấu hoàn thành: ${wish.text}`
                    }
                    className={`btn-press cursor-pointer min-w-[44px] min-h-[44px] rounded-xl border flex items-center justify-center ${
                      wish.done
                        ? "bg-[#F6C85F] text-[#4A2C3A] border-[#D99416]"
                        : "bg-white text-[#3E9B77] border-[#BBE5CF]"
                    }`}
                  >
                    <Check className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDeleteWish(wish.id)}
                    aria-label={`Xóa điều ước: ${wish.text}`}
                    className="btn-press cursor-pointer min-w-[44px] min-h-[44px] rounded-xl bg-white border border-[#FFD1E1] flex items-center justify-center text-[#B52A5E]"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
