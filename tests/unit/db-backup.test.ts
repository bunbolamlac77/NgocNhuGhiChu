// @vitest-environment node
import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { GhiChuDatabase } from "@/lib/db/database";
import {
  createLocalNote,
  getNoteById,
  listActiveNotes,
  restoreNote,
  searchAndFilterNotes,
  softDeleteNote,
  toggleNoteChecklistItem,
  updateLocalNote,
} from "@/lib/db/notes-repo";
import {
  getLocalCustomSticker,
  getLocalDrawing,
  listActiveCustomStickers,
  saveLocalCustomSticker,
  saveLocalDrawing,
  softDeleteCustomSticker,
} from "@/lib/db/assets-repo";
import {
  createLocalWish,
  listActiveWishes,
  listAllWaterings,
  recordWateringForDate,
  toggleWishDone,
} from "@/lib/db/wishes-repo";
import { getMetaValue, setMetaValue } from "@/lib/db/meta-repo";
import {
  blobToBase64,
  exportBackupJson,
  importBackupJson,
} from "@/lib/db/backup";

const dbsToCleanup: GhiChuDatabase[] = [];

function createTestDb(suffix: string): GhiChuDatabase {
  const testDb = new GhiChuDatabase(`test-db-${suffix}-${Date.now()}-${Math.random()}`);
  dbsToCleanup.push(testDb);
  return testDb;
}

afterEach(async () => {
  while (dbsToCleanup.length > 0) {
    const instance = dbsToCleanup.pop();
    if (instance) {
      await instance.delete();
    }
  }
});

describe("Dexie repositories & backup", () => {
  it("tạo, sửa, tick checklist, xóa mềm và khôi phục ghi chú với syncStatus = dirty", async () => {
    const testDb = createTestDb("notes");
    const created = await createLocalNote(
      {
        title: "Chiều uống trà dâu",
        body: "Mua bánh kem gấu và đi dạo",
        templateId: "sakura-dashed",
        category: "diary",
        checklist: [
          { id: "chk_1", text: "Uống đủ 2L nước", checked: false },
          { id: "chk_2", text: "Đọc 10 trang sách", checked: true },
        ],
      },
      testDb,
    );
    expect(created.syncStatus).toBe("dirty");

    const updated = await updateLocalNote(
      created.id,
      {
        templateId: "piggy-plaid",
        payload: {
          ...created.payload!,
          title: "Chiều uống trà dâu (đã sửa)",
        },
      },
      testDb,
    );
    expect(updated.templateId).toBe("piggy-plaid");
    expect(updated.syncStatus).toBe("dirty");

    const toggled = await toggleNoteChecklistItem(created.id, "chk_1", testDb);
    expect(toggled.payload?.checklist[0]?.checked).toBe(true);
    expect(toggled.syncStatus).toBe("dirty");

    await softDeleteNote(created.id, testDb);
    expect(await listActiveNotes(testDb)).toHaveLength(0);

    const restored = await restoreNote(created.id, testDb);
    expect(restored.deleted).toBe(false);
    expect(restored.syncStatus).toBe("dirty");
    expect(await listActiveNotes(testDb)).toHaveLength(1);
  });

  it("lọc 5 danh mục, tìm kiếm toàn văn tiếng Việt và không lộ ghi chú khóa", async () => {
    const testDb = createTestDb("search");
    const n1 = await createLocalNote(
      {
        title: "Nhật ký hoa đào",
        body: "Buổi sáng yên bình",
        category: "diary",
      },
      testDb,
    );
    const n2 = await createLocalNote(
      {
        title: "Việc cần làm",
        category: "checklist",
        checklist: [{ id: "c1", text: "Tưới sen đá", checked: false }],
      },
      testDb,
    );
    const n3 = await createLocalNote(
      {
        title: "Bí mật riêng tư",
        body: "Nội dung không được phép lưu rõ",
        isLocked: true,
        category: "private",
        encryptedPayload: {
          v: 1,
          alg: "AES-256-GCM",
          iv: "iv-test",
          ct: "cipher-secret",
        },
      },
      testDb,
    );

    expect(n3.payload).toBeNull();
    const all = [n1, n2, n3];

    expect(searchAndFilterNotes(all, "all", "")).toHaveLength(3);
    expect(searchAndFilterNotes(all, "diary", "")).toEqual([n1]);
    expect(searchAndFilterNotes(all, "checklist", "")).toEqual([n2]);
    expect(searchAndFilterNotes(all, "private", "")).toEqual([n3]);

    expect(searchAndFilterNotes(all, "all", "hoa dao")).toEqual([n1]);
    expect(searchAndFilterNotes(all, "all", "sen đá")).toEqual([n2]);
    expect(searchAndFilterNotes(all, "all", "Bí mật")).toEqual([]);
    expect(searchAndFilterNotes(all, "all", "cipher-secret")).toEqual([]);
  });

  it("xuất sao lưu .json và nhập lại vào DB trống khôi phục đủ 5 bảng", async () => {
    const srcDb = createTestDb("export");
    const dstDb = createTestDb("import");

    const note = await createLocalNote(
      {
        title: "Ghi chú có ảnh vẽ",
        body: "Lưu cùng sticker",
        category: "draw",
      },
      srcDb,
    );
    const lockedNote = await createLocalNote(
      {
        isLocked: true,
        category: "private",
        encryptedPayload: {
          v: 1,
          alg: "AES-256-GCM",
          iv: "iv-abc",
          ct: "ct-xyz",
        },
      },
      srcDb,
    );

    const drawingBytes = new Uint8Array([1, 2, 3, 4, 5, 6]);
    const drawing = await saveLocalDrawing(
      {
        noteId: note.id,
        mime: "image/png",
        isEncrypted: false,
        blob: new Blob([drawingBytes], { type: "image/png" }),
      },
      srcDb,
    );

    const stickerBytes = new Uint8Array([10, 20, 30, 40]);
    const sticker = await saveLocalCustomSticker(
      {
        name: "Ngôi sao nhỏ",
        width: 128,
        height: 128,
        mime: "image/webp",
        blob: new Blob([stickerBytes], { type: "image/webp" }),
      },
      srcDb,
    );

    const wish = await createLocalWish("Đi Đà Lạt ngắm hoa", "ema", srcDb);
    await toggleWishDone(wish.id, srcDb);
    const watering = await recordWateringForDate("2026-11-26", srcDb);
    expect(watering.created).toBe(true);
    expect((await recordWateringForDate("2026-11-26", srcDb)).created).toBe(false);

    await setMetaValue("preferredAtmosphere", "day", srcDb);

    const json = await exportBackupJson(srcDb);
    expect(json).not.toContain("preferredAtmosphere");

    const summary = await importBackupJson(json, dstDb);
    expect(summary).toEqual({
      notesImported: 2,
      wishesImported: 1,
      wateringsImported: 1,
      drawingsImported: 1,
      stickersImported: 1,
    });

    const restoredNotes = await listActiveNotes(dstDb);
    expect(restoredNotes).toHaveLength(2);
    const restoredLocked = await getNoteById(lockedNote.id, dstDb);
    expect(restoredLocked?.payload).toBeNull();
    expect(restoredLocked?.encryptedPayload?.ct).toBe("ct-xyz");

    const restoredDrawing = await getLocalDrawing(drawing.id, dstDb);
    expect(restoredDrawing).toBeDefined();
    expect(await blobToBase64(restoredDrawing!.blob)).toBe(
      await blobToBase64(new Blob([drawingBytes], { type: "image/png" })),
    );

    const restoredSticker = await getLocalCustomSticker(sticker.id, dstDb);
    expect(restoredSticker?.name).toBe("Ngôi sao nhỏ");
    expect(await blobToBase64(restoredSticker!.blob)).toBe(
      await blobToBase64(new Blob([stickerBytes], { type: "image/webp" })),
    );

    expect(await listActiveWishes(dstDb)).toHaveLength(1);
    expect(await listAllWaterings(dstDb)).toHaveLength(1);
    expect(await getMetaValue("preferredAtmosphere", dstDb)).toBeUndefined();

    await softDeleteCustomSticker(sticker.id, dstDb);
    expect(await listActiveCustomStickers(dstDb)).toHaveLength(0);
    await expect(importBackupJson("{not-json", dstDb)).rejects.toThrow();
  });
});
