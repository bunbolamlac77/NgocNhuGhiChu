import { getMetaValue, setMetaValue } from "@/lib/db/meta-repo";
import type { GhiChuDatabase } from "@/lib/db/database";
import { db } from "@/lib/db/database";
import { isValidPin } from "@/lib/validation";
import type { PinLockMeta } from "@/types/models";

export const PIN_PBKDF2_ITERATIONS = 100_000;
export const MAX_PIN_ATTEMPTS = 5;
export const PIN_LOCKOUT_MS = 5 * 60 * 1000;

export type VerifyPinResult =
  | { ok: true }
  | {
      ok: false;
      reason: "not_configured" | "invalid_format" | "wrong_pin" | "locked";
      remainingAttempts?: number;
      lockoutUntil?: number;
    };

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(encoded: string): Uint8Array<ArrayBuffer> {
  const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  const buf = new ArrayBuffer(binary.length);
  const out = new Uint8Array(buf);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

async function derivePinHashBytes(
  pin: string,
  salt: Uint8Array<ArrayBuffer>,
): Promise<Uint8Array<ArrayBuffer>> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: PIN_PBKDF2_ITERATIONS,
    },
    keyMaterial,
    256,
  );
  return new Uint8Array(bits);
}

export async function getPinLockState(
  database: GhiChuDatabase = db,
): Promise<PinLockMeta | null> {
  const value = await getMetaValue("pinLock", database);
  return value ?? null;
}

export async function hasPinConfigured(
  database: GhiChuDatabase = db,
): Promise<boolean> {
  const state = await getPinLockState(database);
  return Boolean(state?.hash && state?.salt);
}

export async function setupLocalPin(
  pin: string,
  database: GhiChuDatabase = db,
): Promise<PinLockMeta> {
  if (!isValidPin(pin)) {
    throw new Error("Mã PIN phải gồm 4 đến 6 chữ số.");
  }
  const salt = new Uint8Array(new ArrayBuffer(16));
  crypto.getRandomValues(salt);
  const hashBytes = await derivePinHashBytes(pin, salt);

  const meta: PinLockMeta = {
    salt: toBase64Url(salt),
    hash: toBase64Url(hashBytes),
    failCount: 0,
    lockoutUntil: 0,
  };
  await setMetaValue("pinLock", meta, database);
  return meta;
}

export async function verifyLocalPin(
  pin: string,
  now = Date.now(),
  database: GhiChuDatabase = db,
): Promise<VerifyPinResult> {
  const meta = await getPinLockState(database);
  if (!meta) {
    return { ok: false, reason: "not_configured" };
  }

  if (meta.lockoutUntil && now < meta.lockoutUntil) {
    return {
      ok: false,
      reason: "locked",
      lockoutUntil: meta.lockoutUntil,
      remainingAttempts: 0,
    };
  }

  if (!isValidPin(pin)) {
    return { ok: false, reason: "invalid_format" };
  }

  const saltBytes = fromBase64Url(meta.salt);
  const expectedBytes = fromBase64Url(meta.hash);
  const candidateBytes = await derivePinHashBytes(pin, saltBytes);
  const matched = constantTimeEqual(candidateBytes, expectedBytes);

  if (matched) {
    if (meta.failCount !== 0 || meta.lockoutUntil !== 0) {
      await setMetaValue(
        "pinLock",
        { ...meta, failCount: 0, lockoutUntil: 0 },
        database,
      );
    }
    return { ok: true };
  }

  const baseFails =
    meta.lockoutUntil > 0 && now >= meta.lockoutUntil ? 0 : meta.failCount;
  const nextFails = baseFails + 1;

  if (nextFails >= MAX_PIN_ATTEMPTS) {
    const lockoutUntil = now + PIN_LOCKOUT_MS;
    await setMetaValue(
      "pinLock",
      { ...meta, failCount: nextFails, lockoutUntil },
      database,
    );
    return {
      ok: false,
      reason: "locked",
      lockoutUntil,
      remainingAttempts: 0,
    };
  }

  await setMetaValue(
    "pinLock",
    { ...meta, failCount: nextFails, lockoutUntil: 0 },
    database,
  );
  return {
    ok: false,
    reason: "wrong_pin",
    remainingAttempts: MAX_PIN_ATTEMPTS - nextFails,
  };
}

export async function changeLocalPin(
  currentPin: string,
  nextPin: string,
  now = Date.now(),
  database: GhiChuDatabase = db,
): Promise<VerifyPinResult> {
  const verified = await verifyLocalPin(currentPin, now, database);
  if (!verified.ok) return verified;
  await setupLocalPin(nextPin, database);
  return { ok: true };
}

export async function resetLocalPin(
  nextPin: string,
  database: GhiChuDatabase = db,
): Promise<PinLockMeta> {
  return setupLocalPin(nextPin, database);
}
