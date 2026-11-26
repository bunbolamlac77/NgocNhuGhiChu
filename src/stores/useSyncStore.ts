import { create } from "zustand";
import { db } from "@/lib/db/database";
import { getMetaValue, setMetaValue } from "@/lib/db/meta-repo";
import { runSyncCycle, SyncAuthError } from "@/lib/sync/sync-engine";
import type { VaultDocument } from "@/types/models";

export type SyncUiState =
  | "unlinked"
  | "idle"
  | "syncing"
  | "offline"
  | "needs-auth"
  | "error";

interface SyncStoreState {
  deviceLinked: boolean;
  vaultSnapshot: VaultDocument | null;
  status: SyncUiState;
  lastSyncedAt: number | null;
  conflictNotice: string | null;
  errorMessage: string | null;

  hydrateSyncMeta: () => Promise<void>;
  markLinked: (vault: VaultDocument) => Promise<void>;
  updateVaultSnapshot: (vault: VaultDocument) => Promise<void>;
  triggerSync: (onDataUpdated?: () => Promise<void> | void) => Promise<boolean>;
  scheduleDebouncedSync: (onDataUpdated?: () => Promise<void> | void) => void;
  clearConflictNotice: () => void;
}

const BACKOFF_STEPS_MS = [1000, 3000, 10_000, 30_000];
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let backoffTimer: ReturnType<typeof setTimeout> | null = null;
let backoffAttempt = 0;

function clearTimers() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  if (backoffTimer) {
    clearTimeout(backoffTimer);
    backoffTimer = null;
  }
}

export const useSyncStore = create<SyncStoreState>((set, get) => ({
  deviceLinked: false,
  vaultSnapshot: null,
  status: "unlinked",
  lastSyncedAt: null,
  conflictNotice: null,
  errorMessage: null,

  hydrateSyncMeta: async () => {
    const [linked, vault] = await Promise.all([
      getMetaValue("deviceLinked", db),
      getMetaValue("vaultSnapshot", db),
    ]);
    const isLinked = Boolean(linked && vault);
    set({
      deviceLinked: isLinked,
      vaultSnapshot: vault ?? null,
      status: isLinked
        ? typeof navigator !== "undefined" && !navigator.onLine
          ? "offline"
          : "idle"
        : "unlinked",
    });
  },

  markLinked: async (vault) => {
    await setMetaValue("vaultSnapshot", vault, db);
    await setMetaValue("deviceLinked", true, db);
    backoffAttempt = 0;
    set({
      deviceLinked: true,
      vaultSnapshot: vault,
      status: "idle",
      errorMessage: null,
    });
  },

  updateVaultSnapshot: async (vault) => {
    await setMetaValue("vaultSnapshot", vault, db);
    set({ vaultSnapshot: vault });
  },

  triggerSync: async (onDataUpdated) => {
    const { deviceLinked } = get();
    if (!deviceLinked) {
      set({ status: "unlinked" });
      return false;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      set({ status: "offline" });
      return false;
    }

    set({ status: "syncing", errorMessage: null });
    try {
      const summary = await runSyncCycle(db);
      backoffAttempt = 0;
      clearTimers();
      set({
        status: "idle",
        lastSyncedAt: Date.now(),
        conflictNotice:
          summary.conflicts > 0
            ? `Có ${summary.conflicts} bản sao xung đột đã được giữ lại an toàn.`
            : null,
      });
      if (summary.pulled > 0 || summary.conflicts > 0) {
        await onDataUpdated?.();
      }
      return true;
    } catch (err) {
      if (err instanceof SyncAuthError) {
        set({
          status: "needs-auth",
          errorMessage: err.message,
        });
        return false;
      }

      const message =
        err instanceof Error ? err.message : "Chưa thể đồng bộ dữ liệu lúc này.";
      set({
        status: "error",
        errorMessage: message,
      });

      const delay =
        BACKOFF_STEPS_MS[Math.min(backoffAttempt, BACKOFF_STEPS_MS.length - 1)] ??
        30_000;
      backoffAttempt += 1;
      if (backoffTimer) clearTimeout(backoffTimer);
      backoffTimer = setTimeout(() => {
        void get().triggerSync(onDataUpdated);
      }, delay);
      return false;
    }
  },

  scheduleDebouncedSync: (onDataUpdated) => {
    if (!get().deviceLinked) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      void get().triggerSync(onDataUpdated);
    }, 2500);
  },

  clearConflictNotice: () => set({ conflictNotice: null }),
}));
