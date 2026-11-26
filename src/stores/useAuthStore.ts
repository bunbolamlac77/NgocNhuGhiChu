import { create } from "zustand";
import { db } from "@/lib/db/database";
import {
  getPinLockState,
  MAX_PIN_ATTEMPTS,
  setupLocalPin,
  verifyLocalPin,
  type VerifyPinResult,
} from "@/lib/crypto/pin-lock";

type LockHookListener = () => void;
const lockListeners = new Set<LockHookListener>();

export function registerOnAppLock(listener: LockHookListener): () => void {
  lockListeners.add(listener);
  return () => lockListeners.delete(listener);
}

interface AuthStoreState {
  hydrated: boolean;
  hasPin: boolean;
  unlocked: boolean;
  lockoutUntil: number | null;
  remainingAttempts: number;
  hydratePinState: () => Promise<void>;
  completePinSetup: (pin: string) => Promise<void>;
  unlockWithPin: (pin: string) => Promise<VerifyPinResult>;
  lockApp: () => void;
  forceResetPin: (nextPin: string) => Promise<void>;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  hydrated: false,
  hasPin: false,
  unlocked: false,
  lockoutUntil: null,
  remainingAttempts: MAX_PIN_ATTEMPTS,

  hydratePinState: async () => {
    const state = await getPinLockState(db);
    if (!state) {
      set({
        hydrated: true,
        hasPin: false,
        unlocked: false,
        lockoutUntil: null,
        remainingAttempts: MAX_PIN_ATTEMPTS,
      });
      return;
    }
    const now = Date.now();
    const isLockedOut = Boolean(state.lockoutUntil && now < state.lockoutUntil);
    set({
      hydrated: true,
      hasPin: true,
      unlocked: false,
      lockoutUntil: isLockedOut ? state.lockoutUntil : null,
      remainingAttempts: isLockedOut
        ? 0
        : Math.max(0, MAX_PIN_ATTEMPTS - state.failCount),
    });
  },

  completePinSetup: async (pin) => {
    await setupLocalPin(pin, db);
    set({
      hydrated: true,
      hasPin: true,
      unlocked: true,
      lockoutUntil: null,
      remainingAttempts: MAX_PIN_ATTEMPTS,
    });
  },

  unlockWithPin: async (pin) => {
    const res = await verifyLocalPin(pin, Date.now(), db);
    if (res.ok) {
      set({
        unlocked: true,
        lockoutUntil: null,
        remainingAttempts: MAX_PIN_ATTEMPTS,
      });
      return res;
    }
    set({
      lockoutUntil: res.lockoutUntil ?? null,
      remainingAttempts: res.remainingAttempts ?? MAX_PIN_ATTEMPTS,
    });
    return res;
  },

  lockApp: () => {
    for (const listener of lockListeners) {
      listener();
    }
    set((prev) => ({
      unlocked: !prev.hasPin ? prev.unlocked : false,
    }));
  },

  forceResetPin: async (nextPin) => {
    await setupLocalPin(nextPin, db);
    set({
      hydrated: true,
      hasPin: true,
      unlocked: true,
      lockoutUntil: null,
      remainingAttempts: MAX_PIN_ATTEMPTS,
    });
  },
}));
