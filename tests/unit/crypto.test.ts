// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  decryptJsonWithAad,
  drawingAad,
  encryptJsonWithAad,
  noteAad,
  openBinaryWithAad,
  sealBinaryWithAad,
} from "@/lib/crypto/aead";
import { PBKDF2_ITERATIONS } from "@/lib/crypto/kdf";
import {
  createVaultAndDek,
  derivePasswordProof,
  deriveRecoveryProof,
  resetVaultPasswordWithRecovery,
  rotateVaultWithPassword,
  unwrapDekWithPassword,
  unwrapDekWithRecoveryCode,
} from "@/lib/crypto/vault";
import { isValidRecoveryCode } from "@/lib/validation";

describe("B7 Vault Crypto & AEAD", () => {
  it("creates vault with 600,000 PBKDF2 iterations, distinct salts, and wraps/unwraps DEK", async () => {
    const pw = "NgocNhuSecret2026!";
    const { vault, recoveryCode, dek } = await createVaultAndDek(pw);

    expect(vault.schemaVersion).toBe(2);
    expect(vault.kdf.iterations).toBe(600_000);
    expect(PBKDF2_ITERATIONS).toBe(600_000);
    expect(vault.password.saltKek).not.toBe(vault.password.saltVerifier);
    expect(vault.password.saltKek).not.toBe(vault.recovery.saltKek);
    expect(isValidRecoveryCode(recoveryCode)).toBe(true);

    // Encrypt note payload with DEK & note contentId AAD
    const contentId = "cnt_note_1234";
    const payload = {
      title: "Bi mat nho",
      body: "Khong luu ban ro",
      checklist: [],
      stickers: [],
      drawingIds: [],
    };
    const envelope = await encryptJsonWithAad(dek, payload, noteAad(contentId));

    // Decrypt using DEK unwrapped from Vault Password
    const dekFromPw = await unwrapDekWithPassword(vault, pw);
    expect(await decryptJsonWithAad(dekFromPw, envelope, noteAad(contentId))).toEqual(
      payload,
    );

    // Wrong password fails to unwrap
    await expect(unwrapDekWithPassword(vault, "WrongPassword99!")).rejects.toThrow();

    // Tampered AAD fails AEAD authentication
    await expect(
      decryptJsonWithAad(dekFromPw, envelope, noteAad("cnt_other_9999")),
    ).rejects.toThrow();

    // Decrypt using DEK unwrapped from Recovery Code
    const dekFromRec = await unwrapDekWithRecoveryCode(vault, recoveryCode);
    expect(await decryptJsonWithAad(dekFromRec, envelope, noteAad(contentId))).toEqual(
      payload,
    );

    // Binary .enc drawing round-trip & AAD check
    const rawDrawing = new Uint8Array(new ArrayBuffer(64));
    rawDrawing.set([10, 20, 30, 40], 0);
    const sealed = await sealBinaryWithAad(dek, rawDrawing, drawingAad("drw_11111111"));
    const opened = await openBinaryWithAad(
      dekFromPw,
      sealed,
      drawingAad("drw_11111111"),
    );
    expect(Array.from(opened.slice(0, 4))).toEqual([10, 20, 30, 40]);
    await expect(
      openBinaryWithAad(dekFromPw, sealed, drawingAad("drw_wrongid1")),
    ).rejects.toThrow();
  });

  it("rotates password & resets via recovery without losing ability to decrypt existing data", async () => {
    // Use lower iteration only for the rotation stress steps after verifying 600k above
    const fastIter = 1000;
    const pw1 = "OldPassword2026!";
    const pw2 = "NewPassword2026!";
    const pw3 = "RecoveredPass2026!";

    const { vault, recoveryCode, dek } = await createVaultAndDek(pw1, fastIter);
    const envelope = await encryptJsonWithAad(
      dek,
      { secret: "keep-forever" },
      noteAad("cnt_keep_1"),
    );

    const rotated = await rotateVaultWithPassword(
      { ...vault, kdf: { alg: "PBKDF2-SHA256", iterations: fastIter as 600000 } },
      pw1,
      { newPassword: pw2, regenerateRecovery: true },
      fastIter,
    );
    expect(rotated.newRecoveryCode).toBeTruthy();

    const proofNew = await derivePasswordProof(rotated.updatedVault, pw2, fastIter);
    expect(proofNew.length).toBeGreaterThan(20);
    const recProof = await deriveRecoveryProof(
      rotated.updatedVault,
      rotated.newRecoveryCode!,
      fastIter,
    );
    expect(recProof.length).toBeGreaterThan(20);

    // Old password can no longer unwrap
    await expect(
      unwrapDekWithPassword(rotated.updatedVault, pw1, fastIter),
    ).rejects.toThrow();

    // Reset via recovery code
    const recovered = await resetVaultPasswordWithRecovery(
      rotated.updatedVault,
      rotated.newRecoveryCode!,
      pw3,
      false,
      fastIter,
    );

    const dekFinal = await unwrapDekWithPassword(recovered.updatedVault, pw3, fastIter);
    expect(
      await decryptJsonWithAad(dekFinal, envelope, noteAad("cnt_keep_1")),
    ).toEqual({ secret: "keep-forever" });
    expect(recoveryCode).not.toBe(rotated.newRecoveryCode);
  });
});
