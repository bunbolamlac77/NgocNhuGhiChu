"use client";

import React from "react";
import { Lock, Plus, Search, Settings, X } from "lucide-react";
import { BuiltinStickerSvg } from "@/components/stickers/builtin-stickers";
import { searchAndFilterNotes } from "@/lib/db/notes-repo";
import type { SyncUiState } from "@/stores/useSyncStore";
import type { LocalNoteRecord, NoteCategory } from "@/types/models";
import { NoteCard } from "./NoteCard";

interface HomeScreenProps {
  notes: LocalNoteRecord[];
  hydrated: boolean;
  activeCategory: "all" | NoteCategory;
  searchQuery: string;
  syncStatus?: SyncUiState;
  onSelectCategory: (cat: "all" | NoteCategory) => void;
  onSearchChange: (q: string) => void;
  onOpenNote: (id: string) => void;
  onCreateNote: () => void;
  onToggleChecklist: (noteId: string, itemId: string) => void;
  onOpenSettings: () => void;
  onLockApp?: () => void;
}

const FILTER_PILLS: { id: "all" | NoteCategory; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "diary", label: "Nhật ký" },
  { id: "checklist", label: "Checklist" },
  { id: "draw", label: "Vẽ tay" },
  { id: "private", label: "Riêng tư" },
];

function getSyncStatusVisual(status: SyncUiState): { dot: string; label: string } {
  switch (status) {
    case "syncing":
      return { dot: "bg-[#F6C85F] animate-pulse", label: "Đang đồng bộ..." };
    case "idle":
      return { dot: "bg-[#3BB273]", label: "Đã đồng bộ đám mây" };
    case "offline":
      return { dot: "bg-[#F28B66]", label: "Chờ đồng bộ (ngoại tuyến)" };
    case "needs-auth":
      return { dot: "bg-[#D63D76]", label: "Cần nhập lại Mật khẩu sổ" };
    case "error":
      return { dot: "bg-[#D63D76]", label: "Chờ đồng bộ lại" };
    case "unlinked":
    default:
      return { dot: "bg-[#3BB273]", label: "Lưu cục bộ · Trên máy" };
  }
}

export function HomeScreen({
  notes,
  hydrated,
  activeCategory,
  searchQuery,
  syncStatus = "unlinked",
  onSelectCategory,
  onSearchChange,
  onOpenNote,
  onCreateNote,
  onToggleChecklist,
  onOpenSettings,
  onLockApp,
}: HomeScreenProps) {
  const filteredNotes = searchAndFilterNotes(notes, activeCategory, searchQuery);
  const hasAnyNotes = notes.some((n) => !n.deleted);
  const syncVisual = getSyncStatusVisual(syncStatus);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="px-4 pt-3 pb-3 bg-gradient-to-b from-[#FFE0EC] to-[#FFF5F8] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-11 h-11 rounded-full bg-white border-2 border-[#FFB7CE] flex items-center justify-center k-shadow-sm shrink-0">
              <BuiltinStickerSvg id="bunny" className="w-8 h-8" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[17px] font-extrabold text-[#4A2C3A] leading-tight truncate">
                Sổ Nhỏ Ngọc Như
              </h1>
              <div
                data-sync-badge={syncStatus}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8C5A6E] mt-0.5"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${syncVisual.dot}`} />
                <span className="truncate">{syncVisual.label}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onLockApp ? (
              <button
                type="button"
                data-lock-now="true"
                onClick={onLockApp}
                aria-label="Khóa sổ ngay"
                className="btn-press cursor-pointer min-w-[44px] min-h-[44px] rounded-2xl bg-white border-2 border-[#FFD1E1] flex items-center justify-center text-[#8C5A6E] k-shadow-sm shrink-0"
              >
                <Lock className="w-4 h-4" aria-hidden="true" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Mở cài đặt"
              className="btn-press cursor-pointer min-w-[44px] min-h-[44px] rounded-2xl bg-white border-2 border-[#FFD1E1] flex items-center justify-center text-[#D63D76] k-shadow-sm shrink-0"
            >
              <Settings className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search
            className="w-4 h-4 text-[#8C5A6E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm tiêu đề, nội dung hoặc việc cần làm..."
            aria-label="Tìm kiếm ghi chú"
            className="w-full min-h-[44px] pl-10 pr-10 py-2 rounded-2xl bg-white border-2 border-[#FFD1E1] text-xs font-semibold text-[#4A2C3A] placeholder:text-[#8C5A6E] focus:outline-none focus:border-[#D63D76]"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Xóa từ khóa tìm kiếm"
              className="cursor-pointer min-w-[44px] min-h-[44px] absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#8C5A6E]"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar"
          role="tablist"
          aria-label="Lọc ghi chú theo danh mục"
        >
          {FILTER_PILLS.map((pill) => {
            const active = activeCategory === pill.id;
            const label =
              pill.id === "all"
                ? `${pill.label} (${notes.filter((n) => !n.deleted).length})`
                : pill.label;
            return (
              <button
                key={pill.id}
                type="button"
                role="tab"
                data-filter-cat={pill.id}
                aria-selected={active}
                onClick={() => onSelectCategory(pill.id)}
                className={`btn-press cursor-pointer shrink-0 min-h-[44px] min-w-[44px] px-3.5 rounded-full text-xs font-extrabold transition ${
                  active
                    ? "bg-[#D63D76] text-white k-shadow-sm"
                    : "bg-white border border-[#FFD1E1] text-[#8C5A6E]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 px-3.5 pb-6 pt-1">
        {!hydrated ? (
          <div className="grid grid-cols-2 gap-3" aria-busy="true">
            <div className="h-40 rounded-[22px] bg-[#FFE4EE]/60 animate-pulse" />
            <div className="h-40 rounded-[22px] bg-[#FFE4EE]/60 animate-pulse" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="rounded-[24px] bg-white border-2 border-[#FFD1E1] p-6 k-shadow text-center space-y-3 mt-3">
            <div className="flex justify-center">
              <BuiltinStickerSvg id="bunny" className="w-16 h-16" />
            </div>
            <h2 className="text-[15px] font-extrabold text-[#4A2C3A]">
              {hasAnyNotes
                ? "Không tìm thấy ghi chú phù hợp"
                : "Trang sổ đầu tiên đang chờ Ngọc Như"}
            </h2>
            <p className="text-xs text-[#8C5A6E]">
              {hasAnyNotes
                ? "Thử đổi từ khóa hoặc chọn lại bộ lọc Tất cả nha."
                : "Hãy viết vài dòng nhật ký hoặc checklist trái tim đầu tiên."}
            </p>
            {!hasAnyNotes ? (
              <button
                type="button"
                onClick={onCreateNote}
                className="btn-press cursor-pointer min-h-[44px] px-5 rounded-full bg-[#D63D76] text-white text-xs font-extrabold inline-flex items-center gap-1.5 k-shadow-sm"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Viết ghi chú đầu tiên</span>
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3" data-notes-grid>
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onOpen={onOpenNote}
                onToggleChecklist={onToggleChecklist}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
