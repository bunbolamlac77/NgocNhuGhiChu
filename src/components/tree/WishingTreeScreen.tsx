"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Archive, Check, Droplets, Sparkles, Trash2, X } from "lucide-react";
import { listActiveNotes } from "@/lib/db/notes-repo";
import {
  createLocalWish,
  listActiveWishes,
  listAllWaterings,
  recordWateringForDate,
  softDeleteWish,
  toggleWishDone,
} from "@/lib/db/wishes-repo";
import { pickAnimalQuote, type MvpAnimalId } from "@/lib/tree/animal-quotes";
import { computeTreeProgress, getStageMeta } from "@/lib/tree/progression";
import { useSyncStore } from "@/stores/useSyncStore";
import type { LocalWishRecord, TreeProgress, WishCardStyle } from "@/types/models";
import { NewWishModal } from "./NewWishModal";
import { SanctuarySvg } from "./SanctuarySvg";
import { WishBoxDrawer } from "./WishBoxDrawer";

const INITIAL_PROGRESS: TreeProgress = {
  xp: 0,
  stage: 1,
  streakDays: 0,
  noteDays: 0,
  wateringsCount: 0,
  wishesCount: 0,
  wishesDoneCount: 0,
  wateredToday: false,
};

export function WishingTreeScreen() {
  const [wishes, setWishes] = useState<LocalWishRecord[]>([]);
  const [progress, setProgress] = useState<TreeProgress>(INITIAL_PROGRESS);
  const [selectedWish, setSelectedWish] = useState<LocalWishRecord | null>(null);
  const [newWishOpen, setNewWishOpen] = useState(false);
  const [boxOpen, setBoxOpen] = useState(false);
  const [animalBubble, setAnimalBubble] = useState<string | null>(null);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [dewAnimating, setDewAnimating] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const animalTapCountRef = useRef<Record<MvpAnimalId, number>>({
    bunny: 0,
    kitty: 0,
  });
  const quoteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshTreeData = useCallback(async () => {
    const [notes, activeWishes, waterings] = await Promise.all([
      listActiveNotes(),
      listActiveWishes(),
      listAllWaterings(),
    ]);
    setWishes(activeWishes);
    setProgress(computeTreeProgress({ notes, wishes: activeWishes, waterings }));
  }, []);

  useEffect(() => {
    void refreshTreeData();
    return () => {
      if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current);
      if (fxTimerRef.current) clearTimeout(fxTimerRef.current);
    };
  }, [refreshTreeData]);

  function handleTapAnimal(animalId: MvpAnimalId) {
    const idx = animalTapCountRef.current[animalId];
    animalTapCountRef.current[animalId] = idx + 1;
    setAnimalBubble(pickAnimalQuote(animalId, idx));
    if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current);
    quoteTimerRef.current = setTimeout(() => setAnimalBubble(null), 4000);
  }

  async function handleWaterDew() {
    const res = await recordWateringForDate();
    if (!res.created) {
      setStatusToast("Hôm nay Ngọc Như đã tưới sương cho cây rồi nè!");
      return;
    }
    setDewAnimating(true);
    setStatusToast("Tưới sương mai thành công! +5 XP cho cây");
    if (fxTimerRef.current) clearTimeout(fxTimerRef.current);
    fxTimerRef.current = setTimeout(() => setDewAnimating(false), 1200);
    await refreshTreeData();
    useSyncStore.getState().scheduleDebouncedSync(refreshTreeData);
  }

  async function handleCreateWish(text: string, style: WishCardStyle) {
    await createLocalWish(text, style);
    setStatusToast("Đã treo điều ước mới lên cành cây (+5 XP)!");
    await refreshTreeData();
    useSyncStore.getState().scheduleDebouncedSync(refreshTreeData);
  }

  async function handleToggleWishDone(id: string) {
    const updated = await toggleWishDone(id);
    if (updated.done) {
      setCelebrating(true);
      setStatusToast("Điều ước đã thành hiện thực! +25 XP");
      if (fxTimerRef.current) clearTimeout(fxTimerRef.current);
      fxTimerRef.current = setTimeout(() => setCelebrating(false), 1600);
    } else {
      setStatusToast("Đã chuyển điều ước về trạng thái đang ấp ủ.");
    }
    if (selectedWish?.id === id) {
      setSelectedWish(updated);
    }
    await refreshTreeData();
    useSyncStore.getState().scheduleDebouncedSync(refreshTreeData);
  }

  async function handleDeleteWish(id: string) {
    await softDeleteWish(id);
    if (selectedWish?.id === id) {
      setSelectedWish(null);
    }
    setStatusToast("Đã cất điều ước khỏi cây.");
    await refreshTreeData();
    useSyncStore.getState().scheduleDebouncedSync(refreshTreeData);
  }

  const stageMeta = getStageMeta(progress.stage);
  const goalXp = stageMeta.nextXp ?? 220;
  const pct =
    stageMeta.nextXp === null
      ? 100
      : Math.min(100, Math.round((progress.xp / goalXp) * 100));

  return (
    <div
      data-wishing-tree-screen="true"
      className="flex-1 min-w-0 w-full flex flex-col px-3.5 pt-3 pb-4 gap-3"
    >
      {/* Top Progress HUD */}
      <section className="rounded-[22px] bg-white border-2 border-[#FFD1E1] p-3 k-shadow-sm space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-[16px] font-extrabold text-[#4A2C3A] leading-tight">
              Cây Ước Nguyện
            </h1>
            <div
              data-tree-stage-label="true"
              className="text-[11px] font-extrabold text-[#D63D76]"
            >
              GĐ {progress.stage}/5 · {stageMeta.label}
            </div>
          </div>

          <div className="text-right">
            <div
              data-tree-xp="true"
              className="text-xs font-extrabold text-[#4A2C3A]"
            >
              {progress.xp} XP
            </div>
            <div
              data-tree-streak="true"
              className="text-[11px] font-bold text-[#8C5A6E]"
            >
              Chuỗi {progress.streakDays} ngày
            </div>
          </div>
        </div>

        <div className="w-full h-2.5 rounded-full bg-[#FFE8F1] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FF8FB8] to-[#D63D76] transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </section>

      {statusToast ? (
        <div
          role="status"
          className="px-3 py-2 rounded-xl bg-[#FFF4D6] border border-[#F6C85F] text-xs font-bold text-[#7A5200]"
        >
          {statusToast}
        </div>
      ) : null}

      {animalBubble ? (
        <div
          data-animal-quote="true"
          className="px-3.5 py-2.5 rounded-2xl bg-white border-2 border-[#FFB7CE] text-xs font-bold text-[#4A2C3A] k-shadow-sm anim-pop"
        >
          {animalBubble}
        </div>
      ) : null}

      <SanctuarySvg
        stage={progress.stage}
        wishes={wishes}
        dewAnimating={dewAnimating}
        celebrating={celebrating}
        onSelectWish={setSelectedWish}
        onTapAnimal={handleTapAnimal}
      />

      {/* Action Strip */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          data-water-dew="true"
          disabled={progress.wateredToday}
          onClick={() => void handleWaterDew()}
          className={`btn-press cursor-pointer min-h-[48px] px-2 rounded-2xl border text-[11px] font-extrabold flex flex-col items-center justify-center gap-0.5 ${
            progress.wateredToday
              ? "bg-[#E9F8F0] border-[#BBE5CF] text-[#2E7A5D] opacity-80"
              : "bg-white border-[#9DD8FF] text-[#1E6BA8] k-shadow-sm"
          }`}
        >
          <Droplets className="w-4 h-4" aria-hidden="true" />
          <span>{progress.wateredToday ? "Đã tưới" : "Tưới sương"}</span>
        </button>

        <button
          type="button"
          data-new-wish-btn="true"
          onClick={() => setNewWishOpen(true)}
          className="btn-press cursor-pointer min-h-[48px] px-2 rounded-2xl bg-[#D63D76] text-white text-[11px] font-extrabold flex flex-col items-center justify-center gap-0.5 k-shadow-sm"
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          <span>Treo ước mới</span>
        </button>

        <button
          type="button"
          data-wish-box-btn="true"
          onClick={() => setBoxOpen(true)}
          className="btn-press cursor-pointer min-h-[48px] px-2 rounded-2xl bg-white border-2 border-[#FFD1E1] text-[#4A2C3A] text-[11px] font-extrabold flex flex-col items-center justify-center gap-0.5 k-shadow-sm"
        >
          <Archive className="w-4 h-4 text-[#D63D76]" aria-hidden="true" />
          <span>Hộp ({wishes.length})</span>
        </button>
      </div>

      {/* Inline Selected Wish Detail Modal */}
      {selectedWish ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Chi tiết điều ước"
          className="fixed inset-0 z-50 bg-[#4A2C3A]/45 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-[340px] rounded-[26px] bg-white border-2 border-[#FFD1E1] p-5 k-shadow space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="px-2.5 py-1 rounded-full bg-[#FFF0F5] border border-[#FFD1E1] text-[11px] font-extrabold text-[#B52A5E]">
                {selectedWish.done ? "Đã thành hiện thực" : "Điều ước đang ấp ủ"}
              </span>
              <button
                type="button"
                onClick={() => setSelectedWish(null)}
                aria-label="Đóng chi tiết điều ước"
                className="btn-press cursor-pointer min-w-[44px] min-h-[44px] rounded-2xl bg-[#FFF0F5] flex items-center justify-center text-[#8C5A6E]"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <p className="text-sm font-bold text-[#4A2C3A] break-words">
              {selectedWish.text}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleToggleWishDone(selectedWish.id)}
                className="btn-press cursor-pointer flex-[1.6] min-h-[44px] px-3 rounded-full bg-[#3E9B77] text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>
                  {selectedWish.done ? "Chưa hoàn thành" : "Thành hiện thực (+25 XP)"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteWish(selectedWish.id)}
                aria-label="Xóa điều ước này"
                className="btn-press cursor-pointer min-w-[44px] min-h-[44px] rounded-full bg-[#FFF0F5] border border-[#FFD1E1] flex items-center justify-center text-[#B52A5E]"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <NewWishModal
        open={newWishOpen}
        onClose={() => setNewWishOpen(false)}
        onCreate={handleCreateWish}
      />

      <WishBoxDrawer
        open={boxOpen}
        wishes={wishes}
        onClose={() => setBoxOpen(false)}
        onToggleDone={handleToggleWishDone}
        onDeleteWish={handleDeleteWish}
      />
    </div>
  );
}
