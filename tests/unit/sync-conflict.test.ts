// @vitest-environment node
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { GhiChuDatabase } from "@/lib/db/database";
import {
  resolveNoteConflict,
  resolveStickerConflict,
  resolveWateringConflict,
  resolveWishConflict,
} from "@/lib/sync/conflict";
import type {
  CustomStickerMeta,
  LocalCustomStickerRecord,
  LocalNoteRecord,
  LocalWishRecord,
  NoteDocument,
  Watering,
  WishItem,
} from "@/types/models";

describe("B7 Conflict Resolution Rules", () => {
  let db: GhiChuDatabase;

  beforeEach(async () => {
    db = new GhiChuDatabase(`conflict_test_${Math.random().toString(36).slice(2)}`);
    await db.open();
  });

  it("duplicates unlocked conflicting note with (Bản sao xung đột) and keeps remote winner", async () => {
    const local: LocalNoteRecord = {
      id: "note_shared1",
      contentId: "cnt_original",
      rev: 1,
      baseRev: 1,
      updatedAt: 2000,
      createdAt: 1000,
      deleted: false,
      deletedAt: null,
      isLocked: false,
      templateId: "sakura-dashed",
      category: "diary",
      dateTag: "2026-11-26",
      payload: {
        title: "Nhật ký chiều",
        body: "Bản ở máy A",
        checklist: [],
        stickers: [],
        drawingIds: [],
      },
      encryptedPayload: null,
      syncStatus: "dirty",
    };
    const remote: NoteDocument = {
      ...local,
      rev: 2,
      updatedAt: 3000,
      payload: {
        title: "Nhật ký chiều",
        body: "Bản ở máy B",
        checklist: [],
        stickers: [],
        drawingIds: [],
      },
    };

    const res = await resolveNoteConflict(local, remote, db);
    expect(res.winner.id).toBe("note_shared1");
    expect(res.winner.baseRev).toBe(2);
    expect(res.winner.payload?.body).toBe("Bản ở máy B");

    expect(res.conflictCopy.id).not.toBe("note_shared1");
    expect(res.conflictCopy.contentId).toBe("cnt_original");
    expect(res.conflictCopy.payload?.title).toBe("Nhật ký chiều (Bản sao xung đột)");
    expect(res.conflictCopy.payload?.body).toBe("Bản ở máy A");
    expect(res.conflictCopy.syncStatus).toBe("dirty");
  });

  it("preserves contentId and encryptedPayload on locked note conflict without needing DEK", async () => {
    const local: LocalNoteRecord = {
      id: "note_priv1",
      contentId: "cnt_secret_99",
      rev: 1,
      baseRev: 1,
      updatedAt: 2000,
      createdAt: 1000,
      deleted: false,
      deletedAt: null,
      isLocked: true,
      templateId: "heart-grid",
      category: "private",
      dateTag: "2026-11-26",
      payload: null,
      encryptedPayload: {
        v: 1,
        alg: "AES-256-GCM",
        iv: "iv_local",
        ct: "ct_local",
      },
      syncStatus: "dirty",
    };
    const remote: NoteDocument = {
      ...local,
      rev: 2,
      encryptedPayload: {
        v: 1,
        alg: "AES-256-GCM",
        iv: "iv_remote",
        ct: "ct_remote",
      },
    };

    const res = await resolveNoteConflict(local, remote, db);
    expect(res.winner.encryptedPayload?.ct).toBe("ct_remote");
    expect(res.conflictCopy.isLocked).toBe(true);
    expect(res.conflictCopy.payload).toBeNull();
    expect(res.conflictCopy.contentId).toBe("cnt_secret_99");
    expect(res.conflictCopy.encryptedPayload?.ct).toBe("ct_local");
  });

  it("merges wishes with OR done flag, treats waterings immutable, and lets remote sticker meta win", async () => {
    const localWish: LocalWishRecord = {
      id: "wish_11111111",
      rev: 1,
      baseRev: 1,
      updatedAt: 5000,
      deleted: false,
      deletedAt: null,
      text: "Bản local mới",
      style: "star",
      done: false,
      doneAt: null,
      syncStatus: "dirty",
    };
    const remoteWish: WishItem = {
      id: "wish_11111111",
      rev: 2,
      updatedAt: 4000,
      deleted: false,
      deletedAt: null,
      text: "Bản remote cũ",
      style: "star",
      done: true,
      doneAt: 4000,
    };
    const mergedWish = await resolveWishConflict(localWish, remoteWish, db);
    expect(mergedWish.done).toBe(true);
    expect(mergedWish.text).toBe("Bản local mới");
    expect(mergedWish.baseRev).toBe(2);

    const remoteWatering: Watering = {
      id: "w-2026-11-26",
      rev: 3,
      updatedAt: 4000,
      deleted: false,
      deletedAt: null,
    };
    const syncedWater = await resolveWateringConflict(remoteWatering, db);
    expect(syncedWater.baseRev).toBe(3);
    expect(syncedWater.syncStatus).toBe("synced");

    const localStk: LocalCustomStickerRecord = {
      id: "stk_11111111",
      rev: 1,
      baseRev: 1,
      updatedAt: 2000,
      deleted: false,
      deletedAt: null,
      name: "Local",
      width: 100,
      height: 100,
      sizeBytes: 20,
      mime: "image/webp",
      blob: new Blob([new Uint8Array(new ArrayBuffer(20))], { type: "image/webp" }),
      syncStatus: "dirty",
    };
    await db.customStickers.put(localStk);
    const remoteStk: CustomStickerMeta = {
      id: "stk_11111111",
      rev: 2,
      updatedAt: 3000,
      deleted: false,
      deletedAt: null,
      name: "Remote Sticker",
      width: 120,
      height: 120,
      sizeBytes: 24,
      mime: "image/webp",
    };
    const resolvedStk = await resolveStickerConflict(remoteStk, db);
    expect(resolvedStk?.name).toBe("Remote Sticker");
    expect(resolvedStk?.baseRev).toBe(2);
    expect(resolvedStk?.syncStatus).toBe("synced");
  });
});
