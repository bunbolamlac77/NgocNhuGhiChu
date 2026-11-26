import type { VaultDocument } from "@/types/models";
import type { DriveStorage } from "./drive";

export const VAULT_FILE_NAME = "vault.json";
export const MAX_AUTH_ATTEMPTS = 5;
export const PASSWORD_LOCKOUT_MS = 5 * 60 * 1000;
export const RECOVERY_LOCKOUT_MS = 15 * 60 * 1000;

export type RateLimitKind = "password" | "recovery";

export function isRateLimited(
  vault: VaultDocument,
  kind: RateLimitKind,
  now = Date.now(),
): { limited: boolean; lockoutUntil: number } {
  const lockoutUntil =
    kind === "password"
      ? vault.rateLimit.passwordLockoutUntil
      : vault.rateLimit.recoveryLockoutUntil;
  return {
    limited: lockoutUntil > 0 && now < lockoutUntil,
    lockoutUntil,
  };
}

export async function recordAuthFailure(
  drive: DriveStorage,
  vault: VaultDocument,
  kind: RateLimitKind,
  now = Date.now(),
): Promise<{
  locked: boolean;
  remainingAttempts: number;
  lockoutUntil: number;
}> {
  const nextVault: VaultDocument = {
    ...vault,
    rateLimit: { ...vault.rateLimit },
  };

  if (kind === "password") {
    const base =
      nextVault.rateLimit.passwordLockoutUntil > 0 &&
      now >= nextVault.rateLimit.passwordLockoutUntil
        ? 0
        : nextVault.rateLimit.passwordFailedCount;
    const count = base + 1;
    if (count >= MAX_AUTH_ATTEMPTS) {
      const lockoutUntil = now + PASSWORD_LOCKOUT_MS;
      nextVault.rateLimit.passwordFailedCount = count;
      nextVault.rateLimit.passwordLockoutUntil = lockoutUntil;
      await drive.writeJson(VAULT_FILE_NAME, nextVault);
      return { locked: true, remainingAttempts: 0, lockoutUntil };
    }
    nextVault.rateLimit.passwordFailedCount = count;
    nextVault.rateLimit.passwordLockoutUntil = 0;
    await drive.writeJson(VAULT_FILE_NAME, nextVault);
    return {
      locked: false,
      remainingAttempts: MAX_AUTH_ATTEMPTS - count,
      lockoutUntil: 0,
    };
  }

  const base =
    nextVault.rateLimit.recoveryLockoutUntil > 0 &&
    now >= nextVault.rateLimit.recoveryLockoutUntil
      ? 0
      : nextVault.rateLimit.recoveryFailedCount;
  const count = base + 1;
  if (count >= MAX_AUTH_ATTEMPTS) {
    const lockoutUntil = now + RECOVERY_LOCKOUT_MS;
    nextVault.rateLimit.recoveryFailedCount = count;
    nextVault.rateLimit.recoveryLockoutUntil = lockoutUntil;
    await drive.writeJson(VAULT_FILE_NAME, nextVault);
    return { locked: true, remainingAttempts: 0, lockoutUntil };
  }
  nextVault.rateLimit.recoveryFailedCount = count;
  nextVault.rateLimit.recoveryLockoutUntil = 0;
  await drive.writeJson(VAULT_FILE_NAME, nextVault);
  return {
    locked: false,
    remainingAttempts: MAX_AUTH_ATTEMPTS - count,
    lockoutUntil: 0,
  };
}

export async function resetAuthFailures(
  drive: DriveStorage,
  vault: VaultDocument,
  kind: RateLimitKind,
): Promise<VaultDocument> {
  const nextVault: VaultDocument = {
    ...vault,
    rateLimit: { ...vault.rateLimit },
  };
  let changed = false;

  if (kind === "password") {
    if (
      nextVault.rateLimit.passwordFailedCount !== 0 ||
      nextVault.rateLimit.passwordLockoutUntil !== 0
    ) {
      nextVault.rateLimit.passwordFailedCount = 0;
      nextVault.rateLimit.passwordLockoutUntil = 0;
      changed = true;
    }
  } else {
    if (
      nextVault.rateLimit.recoveryFailedCount !== 0 ||
      nextVault.rateLimit.recoveryLockoutUntil !== 0
    ) {
      nextVault.rateLimit.recoveryFailedCount = 0;
      nextVault.rateLimit.recoveryLockoutUntil = 0;
      changed = true;
    }
  }

  if (changed) {
    await drive.writeJson(VAULT_FILE_NAME, nextVault);
  }
  return nextVault;
}
