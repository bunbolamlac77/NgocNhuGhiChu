// @vitest-environment node
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { AUTO_LOCK_MS, shouldAutoLock } from "@/hooks/useAutoLock";
import { GhiChuDatabase } from "@/lib/db/database";
import {
  changeLocalPin,
  getPinLockState,
  hasPinConfigured,
  MAX_PIN_ATTEMPTS,
  PIN_LOCKOUT_MS,
  resetLocalPin,
  setupLocalPin,
  verifyLocalPin,
} from "@/lib/crypto/pin-lock";

describe("B6 PIN Lock & Auto-lock Logic", () => {
  let db: GhiChuDatabase;

  beforeEach(async () => {
    db = new GhiChuDatabase(`pin_test_${Math.random().toString(36).slice(2)}`);
    await db.open();
  });

  it("stores salted hash (never plaintext PIN), verifies PIN, and locks 5 minutes after 5 wrong attempts", async () => {
    expect(await hasPinConfigured(db)).toBe(false);

    await setupLocalPin("2468", db);
    expect(await hasPinConfigured(db)).toBe(true);

    const saved = await getPinLockState(db);
    expect(saved?.hash).toBeTruthy();
    expect(saved?.salt).toBeTruthy();
    expect(saved?.hash).not.toContain("2468");

    const now = 1_700_000_000_000;
    for (let i = 1; i <= 4; i += 1) {
      const bad = await verifyLocalPin("0000", now + i * 1000, db);
      expect(bad.ok).toBe(false);
      if (!bad.ok) {
        expect(bad.reason).toBe("wrong_pin");
        expect(bad.remainingAttempts).toBe(MAX_PIN_ATTEMPTS - i);
      }
    }

    // 5th failure triggers 5-minute lockout
    const fifth = await verifyLocalPin("0000", now + 5000, db);
    expect(fifth.ok).toBe(false);
    if (!fifth.ok) {
      expect(fifth.reason).toBe("locked");
      expect(fifth.lockoutUntil).toBe(now + 5000 + PIN_LOCKOUT_MS);
    }

    // Correct PIN during lockout window is still blocked
    const blocked = await verifyLocalPin("2468", now + 60_000, db);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.reason).toBe("locked");
    }

    // After 5-minute lockout expires, correct PIN unlocks and resets failCount
    const unlocked = await verifyLocalPin(
      "2468",
      now + 5000 + PIN_LOCKOUT_MS + 1,
      db,
    );
    expect(unlocked).toEqual({ ok: true });
    const afterUnlock = await getPinLockState(db);
    expect(afterUnlock?.failCount).toBe(0);
    expect(afterUnlock?.lockoutUntil).toBe(0);
  });

  it("supports changeLocalPin and resetLocalPin", async () => {
    await setupLocalPin("1234", db);
    const failChange = await changeLocalPin("9999", "5678", Date.now(), db);
    expect(failChange.ok).toBe(false);

    const okChange = await changeLocalPin("1234", "5678", Date.now(), db);
    expect(okChange).toEqual({ ok: true });
    expect((await verifyLocalPin("5678", Date.now(), db)).ok).toBe(true);

    await resetLocalPin("778899", db);
    expect((await verifyLocalPin("778899", Date.now(), db)).ok).toBe(true);
  });

  it("triggers auto-lock strictly after 15 minutes hidden", () => {
    const start = 10_000_000;
    expect(shouldAutoLock(null, start + AUTO_LOCK_MS)).toBe(false);
    expect(shouldAutoLock(start, start + AUTO_LOCK_MS - 1)).toBe(false);
    expect(shouldAutoLock(start, start + AUTO_LOCK_MS)).toBe(true);
  });
});
