import { describe, expect, it } from "vitest";
import { createId, createWateringId, getLocalDateString } from "@/lib/ids";
import {
  clampPlacedSticker,
  containsSystemEmoji,
  isValidAssetType,
  isValidDateTag,
  isValidId,
  isValidNoteCategory,
  isValidPaperTemplateId,
  isValidPin,
  isValidRecoveryCode,
  isValidSyncItemKind,
  isValidWateringId,
  isValidWishCardStyle,
  MAX_DRAWING_CLIENT_BYTES,
  MAX_DRAWING_UPLOAD_BYTES,
  MAX_NOTE_BYTES,
  MAX_STICKER_CLIENT_BYTES,
  MAX_STICKER_UPLOAD_BYTES,
  MAX_WISH_CHARS,
  normalizeRecoveryCode,
  validatePayloadByteSize,
  validateVaultPassword,
  validateWishText,
} from "@/lib/validation";
import { buildCspHeader } from "@/middleware";

describe("ids & date helpers", () => {
  it("tạo ID ngẫu nhiên hợp lệ khớp chuẩn Drive", () => {
    const id1 = createId("note");
    const id2 = createId();
    expect(isValidId(id1)).toBe(true);
    expect(isValidId(id2)).toBe(true);
    expect(id1).not.toBe(id2);
  });

  it("tạo dateTag và wateringId đúng giờ máy", () => {
    const sample = new Date(2026, 10, 26, 8, 30, 0);
    expect(getLocalDateString(sample)).toBe("2026-11-26");
    expect(createWateringId(getLocalDateString(sample))).toBe("w-2026-11-26");
  });
});

describe("validation rules", () => {
  it("chấp nhận ID hợp lệ và chặn ký tự query injection", () => {
    expect(isValidId("note_AbCd1234-xyz")).toBe(true);
    expect(isValidId("short")).toBe(false);
    expect(isValidId("a".repeat(65))).toBe(false);
    expect(isValidId("note' or name='vault.json")).toBe(false);
    expect(isValidId("../secrets")).toBe(false);
    expect(isValidId("id with space")).toBe(false);
  });

  it("kiểm tra dateTag và wateringId chặt chẽ theo lịch", () => {
    expect(isValidDateTag("2026-11-26")).toBe(true);
    expect(isValidDateTag("2026-02-29")).toBe(false);
    expect(isValidDateTag("2024-02-29")).toBe(true);
    expect(isValidDateTag("26-11-2026")).toBe(false);

    expect(isValidWateringId("w-2026-11-26")).toBe(true);
    expect(isValidWateringId("w-2026-02-30")).toBe(false);
    expect(isValidWateringId("2026-11-26")).toBe(false);
  });

  it("kiểm tra enum kind, asset, template, category, wishStyle", () => {
    expect(isValidSyncItemKind("notes")).toBe(true);
    expect(isValidSyncItemKind("vault")).toBe(false);
    expect(isValidAssetType("drawings")).toBe(true);
    expect(isValidAssetType("notes")).toBe(false);
    expect(isValidPaperTemplateId("sakura-dashed")).toBe(true);
    expect(isValidPaperTemplateId("unknown")).toBe(false);
    expect(isValidNoteCategory("private")).toBe(true);
    expect(isValidNoteCategory("work")).toBe(false);
    expect(isValidWishCardStyle("lantern")).toBe(true);
    expect(isValidWishCardStyle("card")).toBe(false);
  });

  it("kiểm tra PIN 4–6 số, Mật khẩu sổ >= 10 ký tự và Mã khôi phục 128-bit", () => {
    expect(isValidPin("1234")).toBe(true);
    expect(isValidPin("123456")).toBe(true);
    expect(isValidPin("123")).toBe(false);
    expect(isValidPin("1234567")).toBe(false);
    expect(isValidPin("12ab")).toBe(false);

    expect(validateVaultPassword("123456789").valid).toBe(false);
    expect(validateVaultPassword("1234567890").valid).toBe(false);
    expect(validateVaultPassword("NgocNhu@2026").valid).toBe(true);

    const code = "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ23-4567";
    expect(normalizeRecoveryCode(code)).toBe("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567");
    expect(isValidRecoveryCode(code)).toBe(true);
    expect(isValidRecoveryCode("ABCD-0189")).toBe(false);
  });

  it("kiểm tra điều ước tối đa 140 ký tự", () => {
    expect(validateWishText("   ").valid).toBe(false);
    const exact = "a".repeat(MAX_WISH_CHARS);
    const over = "a".repeat(MAX_WISH_CHARS + 1);
    expect(validateWishText(`  ${exact}  `).valid).toBe(true);
    expect(validateWishText(over).valid).toBe(false);
  });

  it("kiểm tra giới hạn kích thước payload và kẹp tọa độ sticker", () => {
    expect(validatePayloadByteSize("x".repeat(MAX_NOTE_BYTES), MAX_NOTE_BYTES)).toBe(true);
    expect(validatePayloadByteSize("x".repeat(MAX_NOTE_BYTES + 1), MAX_NOTE_BYTES)).toBe(false);
    expect(validatePayloadByteSize(new Uint8Array(MAX_STICKER_CLIENT_BYTES), MAX_STICKER_CLIENT_BYTES)).toBe(true);
    expect(validatePayloadByteSize(new Uint8Array(MAX_STICKER_UPLOAD_BYTES + 1), MAX_STICKER_UPLOAD_BYTES)).toBe(false);
    expect(validatePayloadByteSize(new Uint8Array(MAX_DRAWING_CLIENT_BYTES), MAX_DRAWING_CLIENT_BYTES)).toBe(true);
    expect(validatePayloadByteSize(new Uint8Array(MAX_DRAWING_UPLOAD_BYTES + 1), MAX_DRAWING_UPLOAD_BYTES)).toBe(false);

    expect(
      clampPlacedSticker({
        uid: "s1",
        source: "builtin",
        assetId: "bunny",
        xPct: -10,
        yPct: 120,
        scale: 3.5,
        rotation: -240,
        zIndex: -2,
      }),
    ).toEqual({
      uid: "s1",
      source: "builtin",
      assetId: "bunny",
      xPct: 4,
      yPct: 96,
      scale: 2.2,
      rotation: -180,
      zIndex: 0,
    });
  });

  it("phát hiện đúng emoji hệ thống và không báo nhầm tiếng Việt", () => {
    expect(containsSystemEmoji("Ghi Chú Của Ngọc Như — B1 #4A2C3A")).toBe(false);
    expect(containsSystemEmoji("Xin chào 🌸")).toBe(true);
    expect(containsSystemEmoji("Thỏ Mochi 🐰")).toBe(true);
  });

  it("tạo CSP header có nonce và tắt unsafe-eval ở production", () => {
    const prodCsp = buildCspHeader("abc123==", false);
    expect(prodCsp).toContain("'nonce-abc123=='");
    expect(prodCsp).not.toContain("'unsafe-eval'");
    expect(buildCspHeader("abc123==", true)).toContain("'unsafe-eval'");
  });
});
