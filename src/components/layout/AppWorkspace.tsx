"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { RotateCcw, X } from "lucide-react";
import { DeviceLinkScreen } from "@/components/auth/DeviceLinkScreen";
import { FirstTimeSetup } from "@/components/auth/FirstTimeSetup";
import { LockScreen } from "@/components/auth/LockScreen";
import { PrivatePassModal } from "@/components/auth/PrivatePassModal";
import { RecoveryModal } from "@/components/auth/RecoveryModal";
import { NoteEditor } from "@/components/editor/NoteEditor";
import type { CustomTraySticker } from "@/components/editor/StickerTray";
import { HomeScreen } from "@/components/home/HomeScreen";
import { SettingsDrawer } from "@/components/settings/SettingsDrawer";
import { WishingTreeScreen } from "@/components/tree/WishingTreeScreen";
import { useAutoLock } from "@/hooks/useAutoLock";
import {
  decryptNotePayload,
  getSessionDek,
  setSessionDek,
} from "@/lib/crypto/session-keys";
import {
  listActiveCustomStickers,
  softDeleteCustomSticker,
} from "@/lib/db/assets-repo";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNotesStore } from "@/stores/useNotesStore";
import { useSyncStore } from "@/stores/useSyncStore";
import type { NotePayload } from "@/types/models";
import { AppShell } from "./AppShell";
import { BottomNav, type AppTabId } from "./BottomNav";
import { InstallGate } from "./InstallGate";

const LazyDrawingStudio = dynamic(
  () =>
    import("@/components/draw/DrawingStudio").then((m) => m.DrawingStudio),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center p-6 text-xs font-bold text-[#8C5A6E]">
        Đang mở Studio Vẽ Tay...
      </div>
    ),
  },
);

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

  const {
    hydrated: authHydrated,
    hasPin,
    unlocked,
    lockoutUntil,
    hydratePinState,
    completePinSetup,
    unlockWithPin,
    lockApp,
    forceResetPin,
  } = useAuthStore();

  const {
    deviceLinked,
    vaultSnapshot,
    status: syncStatus,
    lastSyncedAt,
    conflictNotice,
    hydrateSyncMeta,
    markLinked,
    updateVaultSnapshot,
    triggerSync,
    scheduleDebouncedSync,
    clearConflictNotice,
  } = useSyncStore();

  const [activeTab, setActiveTab] = useState<AppTabId>("home");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [linkMode, setLinkMode] = useState<"sync-link" | "forgot-pin" | null>(
    null,
  );
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [storagePersisted, setStoragePersisted] = useState<boolean | null>(null);
  const [drawTargetNoteId, setDrawTargetNoteId] = useState<string | null>(null);
  const [customStickers, setCustomStickers] = useState<CustomTraySticker[]>([]);
  const [privatePromptOpen, setPrivatePromptOpen] = useState(false);
  const [decryptedNotesMap, setDecryptedNotesMap] = useState<
    Record<string, NotePayload>
  >({});
  const [privateDecryptError, setPrivateDecryptError] = useState<string | null>(
    null,
  );
  const pendingDekResolveRef = useRef<((dek: CryptoKey | null) => void) | null>(
    null,
  );
  const customStickerUrlsRef = useRef<string[]>([]);

  useAutoLock(authHydrated && hasPin && unlocked, lockApp);

  useEffect(() => {
    if (!unlocked) {
      setDecryptedNotesMap({});
      setPrivatePromptOpen(false);
      if (pendingDekResolveRef.current) {
        pendingDekResolveRef.current(null);
        pendingDekResolveRef.current = null;
      }
    }
  }, [unlocked]);

  function requestSessionDek(): Promise<CryptoKey | null> {
    const existing = getSessionDek();
    if (existing) return Promise.resolve(existing);
    setPrivatePromptOpen(true);
    return new Promise((resolve) => {
      pendingDekResolveRef.current = resolve;
    });
  }

  const refreshCustomStickers = useCallback(async () => {
    const records = await listActiveCustomStickers();
    for (const url of customStickerUrlsRef.current) {
      URL.revokeObjectURL(url);
    }
    const nextUrls: string[] = [];
    const nextList: CustomTraySticker[] = [];
    for (const rec of records) {
      if (rec.blob instanceof Blob) {
        const url = URL.createObjectURL(rec.blob);
        nextUrls.push(url);
        nextList.push({ id: rec.id, name: rec.name, url });
      }
    }
    customStickerUrlsRef.current = nextUrls;
    setCustomStickers(nextList);
  }, []);

  const reloadAfterSync = useCallback(async () => {
    await Promise.all([loadNotes(), refreshCustomStickers()]);
  }, [loadNotes, refreshCustomStickers]);

  useEffect(() => {
    if (!authHydrated) {
      void hydratePinState();
    }
    void hydrateSyncMeta();
  }, [authHydrated, hydratePinState, hydrateSyncMeta]);

  useEffect(() => {
    if (!authHydrated || !unlocked || !deviceLinked) return;
    void triggerSync(reloadAfterSync);

    function handleOnline() {
      void triggerSync(reloadAfterSync);
    }
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [authHydrated, unlocked, deviceLinked, triggerSync, reloadAfterSync]);

  useEffect(() => {
    void loadNotes();
    void refreshCustomStickers();
    return () => {
      for (const url of customStickerUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
      customStickerUrlsRef.current = [];
    };
  }, [loadNotes, refreshCustomStickers]);

  const editingNote = editingNoteId
    ? notes.find((n) => n.id === editingNoteId)
    : undefined;

  async function handleSelectTab(tab: AppTabId) {
    setDrawTargetNoteId(null);
    setActiveTab(tab);
    if (tab === "home" || tab === "draw" || tab === "tree") {
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
    setDrawTargetNoteId(null);
    setActiveTab("editor");
    await createNote({
      templateId: "sakura-dashed",
      category: "diary",
    });
  }

  async function handleOpenNoteFromHome(id: string) {
    setDrawTargetNoteId(null);
    setPrivateDecryptError(null);
    const target = notes.find((n) => n.id === id);
    if (target?.isLocked && target.encryptedPayload) {
      const dek = await requestSessionDek();
      if (!dek) return;
      try {
        const plain = await decryptNotePayload(
          dek,
          target.contentId,
          target.encryptedPayload,
        );
        setDecryptedNotesMap((prev) => ({ ...prev, [target.id]: plain }));
      } catch {
        setPrivateDecryptError(
          "Không giải mã được ghi chú riêng tư (AAD hoặc khóa không khớp).",
        );
        return;
      }
    }
    openNote(id);
    setActiveTab("editor");
  }

  function handleBackFromEditor() {
    if (editingNoteId) {
      setDecryptedNotesMap((prev) => {
        const copy = { ...prev };
        delete copy[editingNoteId];
        return copy;
      });
    }
    setDrawTargetNoteId(null);
    closeEditor();
    setActiveTab("home");
  }

  async function handleDeleteFromEditor(id: string) {
    setDecryptedNotesMap((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setDrawTargetNoteId(null);
    await deleteNoteWithUndo(id);
    setActiveTab("home");
  }

  if (!authHydrated) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#FFF5F8] flex items-center justify-center p-6 text-xs font-extrabold text-[#8C5A6E]">
        Đang mở Sổ Nhỏ Ngọc Như...
      </div>
    );
  }

  if (!hasPin) {
    return (
      <>
        <InstallGate onPersistenceChange={setStoragePersisted} />
        <FirstTimeSetup onComplete={completePinSetup} />
      </>
    );
  }

  if (!unlocked) {
    return (
      <>
        <InstallGate onPersistenceChange={setStoragePersisted} />
        <LockScreen
          initialLockoutUntil={lockoutUntil}
          onUnlock={unlockWithPin}
          onForgotPin={() => setLinkMode("forgot-pin")}
        />
        <DeviceLinkScreen
          open={linkMode === "forgot-pin"}
          mode="forgot-pin"
          localVaultSnapshot={vaultSnapshot}
          onClose={() => setLinkMode(null)}
          onSyncLinked={async (vault, dek) => {
            setSessionDek(dek);
            await markLinked(vault);
          }}
          onResetPinSuccess={async (newPin, dek) => {
            setSessionDek(dek);
            await forceResetPin(newPin);
          }}
          onOpenRecovery={() => {
            setLinkMode(null);
            setRecoveryOpen(true);
          }}
        />
        <RecoveryModal
          open={recoveryOpen}
          onClose={() => setRecoveryOpen(false)}
          onRecovered={async (updatedVault, dek) => {
            setSessionDek(dek);
            await updateVaultSnapshot(updatedVault);
          }}
        />
      </>
    );
  }

  return (
    <AppShell
      bottomNav={
        editingNote && !drawTargetNoteId ? null : (
          <BottomNav
            activeTab={activeTab}
            onSelectTab={(tab) => void handleSelectTab(tab)}
          />
        )
      }
    >
      <InstallGate onPersistenceChange={setStoragePersisted} />
      {error || privateDecryptError ? (
        <div
          role="alert"
          className="mx-3.5 mt-2 px-3 py-2 rounded-xl bg-[#FFE4EE] border border-[#D63D76] text-xs font-bold text-[#B52A5E]"
        >
          {error ?? privateDecryptError}
        </div>
      ) : null}

      {conflictNotice ? (
        <div
          role="status"
          className="mx-3.5 mt-2 px-3 py-2 rounded-xl bg-[#FFF4D6] border border-[#F6C85F] text-xs font-bold text-[#7A5200] flex items-center justify-between gap-2"
        >
          <span>{conflictNotice}</span>
          <button
            type="button"
            onClick={clearConflictNotice}
            aria-label="Đóng thông báo xung đột"
            className="min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {drawTargetNoteId || activeTab === "draw" ? (
        <LazyDrawingStudio
          targetNoteId={drawTargetNoteId}
          onBackFromNote={() => {
            setDrawTargetNoteId(null);
            setActiveTab("editor");
          }}
          onStickerSaved={() => {
            void refreshCustomStickers();
            scheduleDebouncedSync(reloadAfterSync);
          }}
          onDrawingAttached={async (noteId) => {
            await loadNotes();
            await handleOpenNoteFromHome(noteId);
            setDrawTargetNoteId(null);
            setActiveTab("editor");
            scheduleDebouncedSync(reloadAfterSync);
          }}
        />
      ) : editingNote ? (
        <NoteEditor
          key={editingNote.id}
          note={editingNote}
          initialDecryptedPayload={decryptedNotesMap[editingNote.id] ?? null}
          customStickers={customStickers}
          onSave={async (id, patch) => {
            const saved = await saveNotePatch(id, patch);
            scheduleDebouncedSync(reloadAfterSync);
            return saved;
          }}
          onDelete={async (id) => {
            await handleDeleteFromEditor(id);
            scheduleDebouncedSync(reloadAfterSync);
          }}
          onBack={handleBackFromEditor}
          onOpenDrawForNote={(noteId) => {
            setDrawTargetNoteId(noteId);
            setActiveTab("draw");
          }}
          onRequestSessionDek={requestSessionDek}
        />
      ) : activeTab === "home" || activeTab === "editor" ? (
        <HomeScreen
          notes={notes}
          hydrated={hydrated}
          activeCategory={activeCategory}
          searchQuery={searchQuery}
          syncStatus={syncStatus}
          onSelectCategory={setCategory}
          onSearchChange={setSearchQuery}
          onOpenNote={handleOpenNoteFromHome}
          onCreateNote={() => void handleCreateFromHome()}
          onToggleChecklist={(noteId, itemId) => {
            void toggleChecklistItem(noteId, itemId).then(() =>
              scheduleDebouncedSync(reloadAfterSync),
            );
          }}
          onOpenSettings={() => setSettingsOpen(true)}
          onLockApp={lockApp}
        />
      ) : (
        <WishingTreeScreen />
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
        storagePersisted={storagePersisted}
        deviceLinked={deviceLinked}
        syncStatus={syncStatus}
        lastSyncedAt={lastSyncedAt}
        vaultSnapshot={vaultSnapshot}
        customStickers={customStickers}
        onClose={() => setSettingsOpen(false)}
        onImportBackup={async (rawJson) => {
          const sum = await importBackup(rawJson);
          scheduleDebouncedSync(reloadAfterSync);
          return sum;
        }}
        onOpenSyncLink={() => {
          setSettingsOpen(false);
          setLinkMode("sync-link");
        }}
        onSyncNow={() => triggerSync(reloadAfterSync)}
        onVaultUpdated={async (updatedVault, dek) => {
          setSessionDek(dek);
          await updateVaultSnapshot(updatedVault);
        }}
        onDeleteCustomSticker={async (id) => {
          await softDeleteCustomSticker(id);
          await refreshCustomStickers();
          scheduleDebouncedSync(reloadAfterSync);
        }}
      />

      <PrivatePassModal
        open={privatePromptOpen}
        vaultSnapshot={vaultSnapshot}
        onClose={() => {
          setPrivatePromptOpen(false);
          pendingDekResolveRef.current?.(null);
          pendingDekResolveRef.current = null;
        }}
        onSuccess={async (dek, newlyCreatedVault) => {
          setPrivatePromptOpen(false);
          if (newlyCreatedVault) {
            await updateVaultSnapshot(newlyCreatedVault);
          }
          pendingDekResolveRef.current?.(dek);
          pendingDekResolveRef.current = null;
        }}
        onOpenRecovery={() => {
          setPrivatePromptOpen(false);
          pendingDekResolveRef.current?.(null);
          pendingDekResolveRef.current = null;
          setRecoveryOpen(true);
        }}
      />

      <DeviceLinkScreen
        open={linkMode === "sync-link"}
        mode="sync-link"
        localVaultSnapshot={vaultSnapshot}
        onClose={() => setLinkMode(null)}
        onSyncLinked={async (vault, dek) => {
          setSessionDek(dek);
          await markLinked(vault);
          await triggerSync(reloadAfterSync);
        }}
        onOpenRecovery={() => {
          setLinkMode(null);
          setRecoveryOpen(true);
        }}
      />

      <RecoveryModal
        open={recoveryOpen}
        onClose={() => setRecoveryOpen(false)}
        onRecovered={async (updatedVault, dek) => {
          setSessionDek(dek);
          await markLinked(updatedVault);
          await triggerSync(reloadAfterSync);
        }}
      />
    </AppShell>
  );
}
