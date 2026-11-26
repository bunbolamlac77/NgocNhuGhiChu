import { create } from "zustand";
import { db } from "@/lib/db/database";
import { importBackupJson, type ImportBackupSummary } from "@/lib/db/backup";
import {
  createLocalNote,
  listActiveNotes,
  restoreNote,
  softDeleteNote,
  toggleNoteChecklistItem,
  updateLocalNote,
  type CreateNoteInput,
  type UpdateNotePatch,
} from "@/lib/db/notes-repo";
import type { LocalNoteRecord, NoteCategory } from "@/types/models";

export interface UndoToastState {
  noteId: string;
  title: string;
  expiresAt: number;
}

interface NotesStoreState {
  notes: LocalNoteRecord[];
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  activeCategory: "all" | NoteCategory;
  searchQuery: string;
  editingNoteId: string | null;
  undoToast: UndoToastState | null;

  loadNotes: () => Promise<void>;
  setCategory: (category: "all" | NoteCategory) => void;
  setSearchQuery: (query: string) => void;
  createNote: (input?: CreateNoteInput) => Promise<LocalNoteRecord>;
  openNote: (id: string) => void;
  closeEditor: () => void;
  saveNotePatch: (id: string, patch: UpdateNotePatch) => Promise<LocalNoteRecord>;
  toggleChecklistItem: (noteId: string, itemId: string) => Promise<void>;
  deleteNoteWithUndo: (id: string) => Promise<void>;
  undoLastDelete: () => Promise<void>;
  dismissUndoToast: () => void;
  importBackup: (rawJson: string) => Promise<ImportBackupSummary>;
  clearError: () => void;
  resetStore: () => void;
}

let undoTimer: ReturnType<typeof setTimeout> | null = null;

function clearUndoTimer() {
  if (undoTimer) {
    clearTimeout(undoTimer);
    undoTimer = null;
  }
}

function getFriendlyErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}

function upsertSortedNote(
  list: LocalNoteRecord[],
  updated: LocalNoteRecord,
): LocalNoteRecord[] {
  const without = list.filter((item) => item.id !== updated.id);
  return [updated, ...without].sort((a, b) => b.updatedAt - a.updatedAt);
}

export const useNotesStore = create<NotesStoreState>((set, get) => ({
  notes: [],
  hydrated: false,
  loading: false,
  error: null,
  activeCategory: "all",
  searchQuery: "",
  editingNoteId: null,
  undoToast: null,

  loadNotes: async () => {
    set({ loading: true, error: null });
    try {
      const active = await listActiveNotes(db);
      set({ notes: active, hydrated: true, loading: false });
    } catch (err) {
      set({
        loading: false,
        hydrated: true,
        error: getFriendlyErrorMessage(err, "Không tải được danh sách ghi chú cục bộ."),
      });
    }
  },

  setCategory: (category) => set({ activeCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  createNote: async (input) => {
    set({ error: null });
    try {
      const created = await createLocalNote(input, db);
      set((state) => ({
        notes: upsertSortedNote(state.notes, created),
        editingNoteId: created.id,
      }));
      return created;
    } catch (err) {
      const msg = getFriendlyErrorMessage(err, "Không thể tạo ghi chú mới.");
      set({ error: msg });
      throw err;
    }
  },

  openNote: (id) => set({ editingNoteId: id, error: null }),
  closeEditor: () => set({ editingNoteId: null }),

  saveNotePatch: async (id, patch) => {
    set({ error: null });
    try {
      const updated = await updateLocalNote(id, patch, db);
      set((state) => ({
        notes: upsertSortedNote(state.notes, updated),
      }));
      return updated;
    } catch (err) {
      const msg = getFriendlyErrorMessage(err, "Không thể lưu thay đổi ghi chú.");
      set({ error: msg });
      throw err;
    }
  },

  toggleChecklistItem: async (noteId, itemId) => {
    set({ error: null });
    try {
      const updated = await toggleNoteChecklistItem(noteId, itemId, db);
      set((state) => ({
        notes: upsertSortedNote(state.notes, updated),
      }));
    } catch (err) {
      set({
        error: getFriendlyErrorMessage(err, "Không thể cập nhật mục checklist."),
      });
    }
  },

  deleteNoteWithUndo: async (id) => {
    set({ error: null });
    try {
      const target = get().notes.find((n) => n.id === id);
      const displayTitle =
        target?.payload?.title.trim() ||
        (target?.isLocked ? "Ghi chú riêng tư" : "Ghi chú");
      await softDeleteNote(id, db);
      clearUndoTimer();
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
        editingNoteId: state.editingNoteId === id ? null : state.editingNoteId,
        undoToast: {
          noteId: id,
          title: displayTitle,
          expiresAt: Date.now() + 5000,
        },
      }));
      undoTimer = setTimeout(() => {
        set({ undoToast: null });
        undoTimer = null;
      }, 5000);
    } catch (err) {
      set({
        error: getFriendlyErrorMessage(err, "Không thể xóa ghi chú."),
      });
    }
  },

  undoLastDelete: async () => {
    const toast = get().undoToast;
    if (!toast) return;
    clearUndoTimer();
    set({ undoToast: null, error: null });
    try {
      const restored = await restoreNote(toast.noteId, db);
      set((state) => ({
        notes: upsertSortedNote(state.notes, restored),
      }));
    } catch (err) {
      set({
        error: getFriendlyErrorMessage(err, "Không thể hoàn tác xóa ghi chú."),
      });
    }
  },

  dismissUndoToast: () => {
    clearUndoTimer();
    set({ undoToast: null });
  },

  importBackup: async (rawJson) => {
    set({ error: null });
    try {
      const summary = await importBackupJson(rawJson, db);
      const active = await listActiveNotes(db);
      set({ notes: active, hydrated: true });
      return summary;
    } catch (err) {
      const msg = getFriendlyErrorMessage(err, "Không thể nhập tệp sao lưu JSON.");
      set({ error: msg });
      throw err;
    }
  },

  clearError: () => set({ error: null }),

  resetStore: () => {
    clearUndoTimer();
    set({
      notes: [],
      hydrated: false,
      loading: false,
      error: null,
      activeCategory: "all",
      searchQuery: "",
      editingNoteId: null,
      undoToast: null,
    });
  },
}));
