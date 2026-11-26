"use client";

import React, { useState } from "react";
import {
  BUILTIN_STICKERS,
  type BuiltinStickerCategory,
} from "@/components/stickers/builtin-stickers";

export interface CustomTraySticker {
  id: string;
  name: string;
  url: string;
}

type TrayTabId = BuiltinStickerCategory | "custom";

interface StickerTrayProps {
  customStickers?: CustomTraySticker[];
  onAddSticker: (source: "builtin" | "custom", assetId: string) => void;
}

const TRAY_TABS: { id: TrayTabId; label: string }[] = [
  { id: "animals", label: "Thú" },
  { id: "nature", label: "Hoa lá" },
  { id: "sweets", label: "Đồ ngọt" },
  { id: "custom", label: "Tự vẽ" },
];

export function StickerTray({
  customStickers = [],
  onAddSticker,
}: StickerTrayProps) {
  const [activeTab, setActiveTab] = useState<TrayTabId>("animals");

  const tabCount = (id: TrayTabId) =>
    id === "custom"
      ? customStickers.length
      : BUILTIN_STICKERS.filter((s) => s.cat === id).length;

  const builtinList =
    activeTab === "custom"
      ? []
      : BUILTIN_STICKERS.filter((s) => s.cat === activeTab);

  return (
    <div
      data-sticker-tray="true"
      className="bg-white rounded-2xl p-2.5 border border-[#FFE0EC] k-shadow-sm space-y-2"
    >
      <div
        role="tablist"
        aria-label="Nhóm sticker dán lên giấy"
        className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar"
      >
        {TRAY_TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              data-sticker-tab={tab.id}
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`btn-press cursor-pointer shrink-0 min-h-[44px] min-w-[44px] px-3 rounded-full text-[11px] font-extrabold transition ${
                active
                  ? "bg-[#D63D76] text-white"
                  : tab.id === "custom"
                    ? "bg-[#FFF4D6] text-[#8C5A6E]"
                    : "bg-[#FFF0F5] text-[#8C5A6E]"
              }`}
            >
              {tab.label} ({tabCount(tab.id)})
            </button>
          );
        })}
      </div>

      {activeTab === "custom" ? (
        customStickers.length === 0 ? (
          <div className="rounded-xl bg-[#FFF5F8] border border-dashed border-[#FFB7CE] p-4 text-center text-xs font-semibold text-[#8C5A6E]">
            Chưa có sticker tự vẽ. Vào tab Vẽ tay để tự tạo sticker viền trắng nhé!
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1.5 max-h-[168px] overflow-y-auto phone-scroll">
            {customStickers.map((stk) => (
              <button
                key={stk.id}
                type="button"
                data-tray-sticker={stk.id}
                aria-label={`Thêm sticker ${stk.name}`}
                onClick={() => onAddSticker("custom", stk.id)}
                className="btn-press cursor-pointer min-h-[60px] p-1.5 rounded-xl bg-[#FFF7FA] border border-[#FFE0EC] hover:border-[#FFB7CE] flex flex-col items-center justify-center gap-1"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={stk.url}
                  alt={stk.name}
                  className="w-9 h-9 object-contain diecut-shadow"
                />
                <span className="text-[10px] font-bold text-[#4A2C3A] leading-tight truncate w-full text-center">
                  {stk.name}
                </span>
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="grid grid-cols-4 gap-1.5 max-h-[168px] overflow-y-auto phone-scroll">
          {builtinList.map((stk) => (
            <button
              key={stk.id}
              type="button"
              data-tray-sticker={stk.id}
              aria-label={`Thêm sticker ${stk.name}`}
              onClick={() => onAddSticker("builtin", stk.id)}
              className="btn-press cursor-pointer min-h-[60px] p-1.5 rounded-xl bg-[#FFF7FA] border border-[#FFE0EC] hover:border-[#FFB7CE] flex flex-col items-center justify-center gap-1"
            >
              <div className="diecut-shadow">{stk.renderSvg("w-9 h-9")}</div>
              <span className="text-[10px] font-bold text-[#4A2C3A] leading-tight truncate w-full text-center">
                {stk.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
