"use client";

import React, { useEffect, useState } from "react";
import { RotateCcw, X } from "lucide-react";
import { NoteEditor } from "@/components/editor/NoteEditor";
import { HomeScreen } from "@/components/home/HomeScreen";
import { SettingsDrawer } from "@/components/settings/SettingsDrawer";
import { BuiltinStickerSvg } from "@/components/stickers/builtin-stickers";
import { useNotesStore } from "@/stores/useNotesStore";
import { AppShell } from "./AppShell";
import { BottomNav, type AppTabId } from "./BottomNav";

export function AppWorkspace() {
  const {
    notes,
    hydrated,
    error,
    activeCategory,
    searchQuery,
    editingNoteId,
    undoToast,
    loadNotes,
    setCategory,
    setSearchQuery,
    createNote,
    openNote,
    closeEditor,
    saveNotePatch,
    toggleChecklistItem,
    deleteNoteWithUndo,
    undoLastDelete,
    dismissUndoToast,
    importBackup,
  } = useNotesStore();

  const [activeTab, setActiveTab] = useState<AppTabId>("home");
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const editingNote = editingNoteId
    ? notes.find((n) => n.id === editingNoteId)
    : undefined;

  async function handleSelectTab(tab: AppTabId) {
    setActiveTab(tab);
    if (tab === "home") {
      closeEditor();
      return;
    }
    if (tab === "editor") {
      if (!editingNoteId) {
        await createNote({
          templateId: "sakura-dashed",
          category: "diary",
        });
      }
    }
  }

  async function handleCreateFromHome() {
    setActiveTab("editor");
    await createNote({
      templateId: "sakura-dashed",
      category: "diary",
    });
  }

  function handleOpenNoteFromHome(id: string) {
    openNote(id);
    setActiveTab("editor");
  }

  function handleBackFromEditor() {
    closeEditor();
    setActiveTab("home");
  }

  async function handleDeleteFromEditor(id: string) {
    await deleteNoteWithUndo(id);
    setActiveTab("home");
  }

  return (
    <AppShell
      bottomNav={
        editingNote ? null : (
          <BottomNav
            activeTab={activeTab}
            onSelectTab={(tab) => void handleSelectTab(tab)}
          />
        )
      }
    >
      {error ? (
        <div
          role="alert"
          className="mx-3.5 mt-2 px-3 py-2 rounded-xl bg-[#FFE4EE] border border-[#D63D76] text-xs font-bold text-[#B52A5E]"
        >
          {error}
        </div>
      ) : null}

      {editingNote ? (
        <NoteEditor
          key={editingNote.id}
          note={editingNote}
          onSave={saveNotePatch}
          onDelete={handleDeleteFromEditor}
          onBack={handleBackFromEditor}
        />
      ) : activeTab === "home" || activeTab === "editor" ? (
        <HomeScreen
          notes={notes}
          hydrated={hydrated}
          activeCategory={activeCategory}
          searchQuery={searchQuery}
          onSelectCategory={setCategory}
          onSearchChange={setSearchQuery}
          onOpenNote={handleOpenNoteFromHome}
          onCreateNote={() => void handleCreateFromHome()}
          onToggleChecklist={(noteId, itemId) =>
            void toggleChecklistItem(noteId, itemId)
          }
          onOpenSettings={() => setSettingsOpen(true)}
        />
      ) : (
        <div className="flex-1 px-4 py-6">
          <section className="rounded-[24px] bg-white border-2 border-[#FFD1E1] p-5 k-shadow text-center space-y-3">
            <div className="flex justify-center">
              <BuiltinStickerSvg id="bunny" className="w-16 h-16" />
            </div>
            <h2 className="text-[16px] font-extrabold text-[#4A2C3A]">
              {activeTab === "draw"
                ? "Studio Vẽ Tay & Sticker Die-cut (B4)"
                : "Khu Vườn Cây Ước Nguyện (B5)"}
            </h2>
            <p className="text-xs text-[#8C5A6E]">
              Tính năng này sẽ được mở ở bước tiếp theo. Quay lại Trang Chủ để
              viết và quản lý ghi chú ngay.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab("home")}
              className="btn-press cursor-pointer min-h-[44px] px-5 rounded-full bg-[#D63D76] text-white text-xs font-extrabold"
            >
              Quay về Trang Chủ
            </button>
          </section>
        </div>
      )}

      {undoToast ? (
        <div
          role="status"
          aria-live="polite"
          data-undo-toast="true"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-[440px] rounded-2xl bg-[#4A2C3A] text-white px-3.5 py-2 k-shadow flex items-center justify-between gap-2 anim-pop"
        >
          <span className="text-xs font-bold truncate">
            Đã xóa &ldquo;{undoToast.title}&rdquo;
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => void undoLastDelete()}
              className="btn-press cursor-pointer min-h-[44px] px-3 rounded-xl bg-[#FFE07D] text-[#4A2C3A] text-xs font-extrabold inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Hoàn tác</span>
            </button>
            <button
              type="button"
              onClick={dismissUndoToast}
              aria-label="Đóng thông báo hoàn tác"
              className="cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center text-white/80"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onImportBackup={importBackup}
      />
    </AppShell>
  );
}
