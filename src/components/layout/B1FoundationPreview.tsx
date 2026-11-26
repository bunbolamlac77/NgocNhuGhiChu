"use client";

import React, { useState } from "react";
import { AppShell } from "./AppShell";
import { BottomNav, type AppTabId } from "./BottomNav";
import { BunnyLockCover } from "@/components/mascots/BunnyLockCover";
import { PaperCanvas } from "@/components/papers/PaperCanvas";
import { PAPER_TEMPLATES } from "@/components/papers/paper-templates";
import {
  BUILTIN_STICKERS,
  STICKER_CATEGORIES,
  type BuiltinStickerCategory,
} from "@/components/stickers/builtin-stickers";

type FilterCat = "all" | BuiltinStickerCategory;

export function B1FoundationPreview() {
  const [activeTab, setActiveTab] = useState<AppTabId>("home");
  const [stickerCat, setStickerCat] = useState<FilterCat>("all");

  const visibleStickers =
    stickerCat === "all"
      ? BUILTIN_STICKERS
      : BUILTIN_STICKERS.filter((s) => s.cat === stickerCat);

  const header = (
    <div className="px-4 pt-3 pb-3 bg-gradient-to-b from-[#FFE0EC] to-[#FFF5F8]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-11 h-11 rounded-full bg-white border-2 border-[#FFB7CE] flex items-center justify-center k-shadow-sm shrink-0">
            {BUILTIN_STICKERS[0]?.renderSvg("w-8 h-8")}
          </div>
          <div className="min-w-0">
            <h1 className="text-[17px] font-extrabold text-[#4A2C3A] leading-tight truncate">
              Ghi Chú Của Ngọc Như
            </h1>
            <p className="text-xs font-semibold text-[#8C5A6E] mt-0.5 truncate">
              Khung nền tảng B1 · Kawaii V3
            </p>
          </div>
        </div>
        <span className="shrink-0 px-3 py-1.5 rounded-full bg-white border border-[#FFB7CE] text-xs font-extrabold text-[#B52A5E]">
          S01
        </span>
      </div>
    </div>
  );

  return (
    <AppShell
      header={header}
      bottomNav={<BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />}
    >
      <div className="flex-1 px-3.5 pb-6 pt-2 space-y-5">
        {activeTab === "home" ? (
          <>
            <section
              aria-label="Linh vật bìa sổ"
              className="rounded-[24px] bg-white border-2 border-[#FFD1E1] p-4 k-shadow flex flex-col items-center text-center"
            >
              <BunnyLockCover className="w-40 h-36" />
              <h2 className="text-[16px] font-extrabold text-[#4A2C3A] mt-1">
                Sổ Nhỏ Ngọc Như
              </h2>
              <p className="text-xs text-[#8C5A6E] mt-1">
                6 mẫu giấy văn phòng phẩm và 28 sticker vector SVG nét #4A2C3A
              </p>
            </section>

            <section aria-label="6 mẫu giấy ghi chú" className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-extrabold text-[#4A2C3A]">
                  6 Mẫu Giấy Kawaii
                </h2>
                <span className="text-xs font-bold text-[#B52A5E]">
                  {PAPER_TEMPLATES.length} mẫu
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {PAPER_TEMPLATES.map((tpl, index) => (
                  <PaperCanvas
                    key={tpl.id}
                    templateId={tpl.id}
                    innerClassName="min-h-[126px] flex flex-col justify-between"
                  >
                    <div className="pr-5">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-white/90 text-[11px] font-bold text-[#B52A5E]">
                        #{index + 1}
                      </span>
                      <div className="text-[13px] font-extrabold text-[#4A2C3A] mt-1.5 leading-snug">
                        {tpl.shortName}
                      </div>
                    </div>
                    <p className="text-[11px] text-[#6B4657] leading-snug mt-2">
                      {tpl.description}
                    </p>
                  </PaperCanvas>
                ))}
              </div>
            </section>

            <section aria-label="28 sticker SVG dựng sẵn" className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-extrabold text-[#4A2C3A]">
                  28 Sticker SVG
                </h2>
                <span className="text-xs font-bold text-[#B52A5E]">
                  {visibleStickers.length} hiển thị
                </span>
              </div>

              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Nhóm sticker">
                <button
                  type="button"
                  role="tab"
                  aria-selected={stickerCat === "all"}
                  onClick={() => setStickerCat("all")}
                  className={`btn-press cursor-pointer min-h-[44px] min-w-[44px] px-3.5 rounded-full text-xs font-extrabold transition ${
                    stickerCat === "all"
                      ? "bg-[#D63D76] text-white"
                      : "bg-white border border-[#FFD1E1] text-[#8C5A6E]"
                  }`}
                >
                  Tất cả ({BUILTIN_STICKERS.length})
                </button>
                {STICKER_CATEGORIES.map((cat) => {
                  const count = BUILTIN_STICKERS.filter(
                    (s) => s.cat === cat.id,
                  ).length;
                  const active = stickerCat === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setStickerCat(cat.id)}
                      className={`btn-press cursor-pointer min-h-[44px] min-w-[44px] px-3.5 rounded-full text-xs font-extrabold transition ${
                        active
                          ? "bg-[#D63D76] text-white"
                          : "bg-white border border-[#FFD1E1] text-[#8C5A6E]"
                      }`}
                    >
                      {cat.label} ({count})
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-4 gap-2">
                {visibleStickers.map((stk) => (
                  <div
                    key={stk.id}
                    data-sticker-id={stk.id}
                    className="rounded-2xl bg-white border border-[#FFD1E1] p-2 flex flex-col items-center justify-start text-center gap-1 k-shadow-sm"
                  >
                    <div className="diecut-shadow">{stk.renderSvg("w-10 h-10")}</div>
                    <span className="text-[11px] font-bold text-[#4A2C3A] leading-tight">
                      {stk.name}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="rounded-[24px] bg-white border-2 border-[#FFD1E1] p-5 k-shadow text-center space-y-3 mt-4">
            <div className="flex justify-center">
              {BUILTIN_STICKERS[0]?.renderSvg("w-14 h-14")}
            </div>
            <h2 className="text-[16px] font-extrabold text-[#4A2C3A]">
              {activeTab === "editor" && "Trình soạn thảo ghi chú (B2–B3)"}
              {activeTab === "draw" && "Studio Vẽ Tay & Sticker Die-cut (B4)"}
              {activeTab === "tree" && "Khu Vườn Cây Ước Nguyện (B5)"}
            </h2>
            <p className="text-xs text-[#8C5A6E]">
              Khung điều hướng 4 mục của B1 đã sẵn sàng. Chạm nút dưới để quay
              lại xem 6 mẫu giấy và 28 sticker.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab("home")}
              className="btn-press cursor-pointer min-h-[44px] px-5 rounded-full bg-[#D63D76] text-white text-xs font-extrabold"
            >
              Xem 6 mẫu giấy &amp; 28 sticker
            </button>
          </section>
        )}
      </div>
    </AppShell>
  );
}
