import {
  isValidRecoveryCode,
  normalizeRecoveryCode,
  validateVaultPassword,
} from "@/lib/validation";
import type { VaultDocument, VaultSecretSlot } from "@/types/models";
import { AAD_VAULT_WRAP, decryptBytesWithAad, encryptBytesWithAad } from "./aead";
import {
  deriveAesKeyFromSecret,
  deriveProof,
  generateRandomBytes,
  importAesGcmKey,
  PBKDF2_ITERATIONS,
  sha256Base64Url,
} from "./kdf";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function formatRecoveryCode(raw32: string): string {
  const clean = normalizeRecoveryCode(raw32);
  const groups: string[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    groups.push(clean.slice(i, i + 4));
  }
  return groups.join("-");
}

export function generateRecoveryCode(): string {
  // 32 Base32 characters = 160 bits of entropy (>= 128-bit requirement)
  const rand = generateRandomBytes(32);
  let raw = "";
  for (let i = 0; i < 32; i += 1) {
    raw += BASE32_ALPHABET[(rand[i] ?? 0) & 31] ?? "A";
  }
  return formatRecoveryCode(raw);
}

async function buildSecretSlot(
  secret: string,
  rawDekBytes: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<VaultSecretSlot> {
  const saltKek = bytesToB64(generateRandomBytes(16));
  const saltVerifier = bytesToB64(generateRandomBytes(16));

  const kek = await deriveAesKeyFromSecret(secret, saltKek, iterations);
  const wrappedDek = await encryptBytesWithAad(
    kek,
    rawDekBytes,
    AAD_VAULT_WRAP,
  );
  const proof = await deriveProof(secret, saltVerifier, iterations);
  const verifier = await sha256Base64Url(proof);

  return {
    saltKek,
    saltVerifier,
    verifier,
    wrappedDek,
  };
}

function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 1) {
    bin += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function createVaultAndDek(
  password: string,
  iterations: number = PBKDF2_ITERATIONS,
): Promise<{
  vault: VaultDocument;
  recoveryCode: string;
  dek: CryptoKey;
}> {
  const pwCheck = validateVaultPassword(password);
  if (!pwCheck.valid) {
    throw new Error(pwCheck.reason);
  }

  const rawDek = generateRandomBytes(32);
  const recoveryCode = generateRecoveryCode();
  const normalizedRecovery = normalizeRecoveryCode(recoveryCode);

  const [passwordSlot, recoverySlot, dek] = await Promise.all([
    buildSecretSlot(password, rawDek, iterations),
    buildSecretSlot(normalizedRecovery, rawDek, iterations),
    importAesGcmKey(rawDek, false),
  ]);

  rawDek.fill(0);

  const vault: VaultDocument = {
    schemaVersion: 2,
    kdf: {
      alg: "PBKDF2-SHA256",
      iterations: PBKDF2_ITERATIONS,
    },
    password: passwordSlot,
    recovery: recoverySlot,
    rateLimit: {
      passwordFailedCount: 0,
      passwordLockoutUntil: 0,
      recoveryFailedCount: 0,
      recoveryLockoutUntil: 0,
    },
  };

  return { vault, recoveryCode, dek };
}

async function unwrapRawDekFromSlot(
  secret: string,
  slot: VaultSecretSlot,
  iterations: number,
): Promise<Uint8Array<ArrayBuffer>> {
  const kek = await deriveAesKeyFromSecret(secret, slot.saltKek, iterations);
  return decryptBytesWithAad(kek, slot.wrappedDek, AAD_VAULT_WRAP);
}

export async function unwrapDekWithPassword(
  vault: VaultDocument,
  password: string,
  iterations: number = vault.kdf.iterations,
): Promise<CryptoKey> {
  const rawDek = await unwrapRawDekFromSlot(password, vault.password, iterations);
  const dek = await importAesGcmKey(rawDek, false);
  rawDek.fill(0);
  return dek;
}

export async function unwrapDekWithRecoveryCode(
  vault: VaultDocument,
  recoveryCode: string,
  iterations: number = vault.kdf.iterations,
): Promise<CryptoKey> {
  if (!isValidRecoveryCode(recoveryCode)) {
    throw new Error("Mã khôi phục phải gồm 32 ký tự chữ in và số 2-7.");
  }
  const normalized = normalizeRecoveryCode(recoveryCode);
  const rawDek = await unwrapRawDekFromSlot(normalized, vault.recovery, iterations);
  const dek = await importAesGcmKey(rawDek, false);
  rawDek.fill(0);
  return dek;
}

export async function derivePasswordProof(
  vault: VaultDocument,
  password: string,
  iterations: number = vault.kdf.iterations,
): Promise<string> {
  return deriveProof(password, vault.password.saltVerifier, iterations);
}

export async function deriveRecoveryProof(
  vault: VaultDocument,
  recoveryCode: string,
  iterations: number = vault.kdf.iterations,
): Promise<string> {
  const normalized = normalizeRecoveryCode(recoveryCode);
  return deriveProof(normalized, vault.recovery.saltVerifier, iterations);
}

export async function rotateVaultWithPassword(
  vault: VaultDocument,
  currentPassword: string,
  options: {
    newPassword?: string;
    regenerateRecovery?: boolean;
  },
  iterations: number = vault.kdf.iterations,
): Promise<{
  updatedVault: VaultDocument;
  newRecoveryCode?: string;
  dek: CryptoKey;
}> {
  const nextPw = options.newPassword ?? currentPassword;
  const pwCheck = validateVaultPassword(nextPw);
  if (!pwCheck.valid) {
    throw new Error(pwCheck.reason);
  }

  const rawDek = await unwrapRawDekFromSlot(
    currentPassword,
    vault.password,
    iterations,
  );
  const newRecoveryCode = options.regenerateRecovery
    ? generateRecoveryCode()
    : undefined;

  const [passwordSlot, recoverySlot, dek] = await Promise.all([
    buildSecretSlot(nextPw, rawDek, iterations),
    newRecoveryCode
      ? buildSecretSlot(normalizeRecoveryCode(newRecoveryCode), rawDek, iterations)
      : Promise.resolve(vault.recovery),
    importAesGcmKey(rawDek, false),
  ]);

  rawDek.fill(0);

  return {
    updatedVault: {
      ...vault,
      password: passwordSlot,
      recovery: recoverySlot,
      rateLimit: {
        passwordFailedCount: 0,
        passwordLockoutUntil: 0,
        recoveryFailedCount: 0,
        recoveryLockoutUntil: 0,
      },
    },
    newRecoveryCode,
    dek,
  };
}

export async function resetVaultPasswordWithRecovery(
  vault: VaultDocument,
  recoveryCode: string,
  newPassword: string,
  regenerateRecovery = false,
  iterations: number = vault.kdf.iterations,
): Promise<{
  updatedVault: VaultDocument;
  newRecoveryCode?: string;
  dek: CryptoKey;
}> {
  if (!isValidRecoveryCode(recoveryCode)) {
    throw new Error("Mã khôi phục không đúng định dạng.");
  }
  const pwCheck = validateVaultPassword(newPassword);
  if (!pwCheck.valid) {
    throw new Error(pwCheck.reason);
  }

  const normalized = normalizeRecoveryCode(recoveryCode);
  const rawDek = await unwrapRawDekFromSlot(normalized, vault.recovery, iterations);
  const newRecoveryCode = regenerateRecovery ? generateRecoveryCode() : undefined;

  const [passwordSlot, recoverySlot, dek] = await Promise.all([
    buildSecretSlot(newPassword, rawDek, iterations),
    newRecoveryCode
      ? buildSecretSlot(normalizeRecoveryCode(newRecoveryCode), rawDek, iterations)
      : Promise.resolve(vault.recovery),
    importAesGcmKey(rawDek, false),
  ]);

  rawDek.fill(0);

  return {
    updatedVault: {
      ...vault,
      password: passwordSlot,
      recovery: recoverySlot,
      rateLimit: {
        passwordFailedCount: 0,
        passwordLockoutUntil: 0,
        recoveryFailedCount: 0,
        recoveryLockoutUntil: 0,
      },
    },
    newRecoveryCode,
    dek,
  };
}
