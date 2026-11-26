import { createId } from "@/lib/ids";
import { db, type GhiChuDatabase } from "@/lib/db/database";
import type {
  CustomStickerMeta,
  LocalCustomStickerRecord,
  LocalNoteRecord,
  LocalWateringRecord,
  LocalWishRecord,
  NoteDocument,
  Watering,
  WishItem,
} from "@/types/models";

function withConflictSuffix(title: string): string {
  const trimmed = title.trim();
  if (trimmed.endsWith("(Bản sao xung đột)")) {
    return trimmed;
  }
  return trimmed ? `${trimmed} (Bản sao xung đột)` : "Ghi chú (Bản sao xung đột)";
}

export async function resolveNoteConflict(
  local: LocalNoteRecord,
  remote: NoteDocument,
  database: GhiChuDatabase = db,
): Promise<{
  winner: LocalNoteRecord;
  conflictCopy: LocalNoteRecord;
}> {
  const winner: LocalNoteRecord = {
    ...remote,
    baseRev: remote.rev,
    syncStatus: "synced",
  };
  await database.notes.put(winner);

  const conflictCopy: LocalNoteRecord = {
    ...local,
    id: createId("note"),
    // Keep contentId and encryptedPayload untouched so locked notes need no DEK
    contentId: local.contentId,
    rev: 0,
    baseRev: 0,
    updatedAt: Date.now(),
    syncStatus: "dirty",
    payload:
      local.isLocked || local.payload === null
        ? null
        : {
            ...local.payload,
            title: withConflictSuffix(local.payload.title),
          },
  };
  await database.notes.put(conflictCopy);

  return { winner, conflictCopy };
}

export async function resolveWishConflict(
  local: LocalWishRecord,
  remote: WishItem,
  database: GhiChuDatabase = db,
): Promise<LocalWishRecord> {
  const mergedDone = Boolean(local.done || remote.done);
  const mergedDoneAt = mergedDone
    ? local.doneAt ?? remote.doneAt ?? Date.now()
    : null;

  const merged: LocalWishRecord = {
    ...local,
    done: mergedDone,
    doneAt: mergedDoneAt,
    rev: remote.rev,
    baseRev: remote.rev,
    updatedAt: Math.max(local.updatedAt, remote.updatedAt),
    syncStatus: "dirty",
  };
  await database.wishes.put(merged);
  return merged;
}

export async function resolveWateringConflict(
  remote: Watering,
  database: GhiChuDatabase = db,
): Promise<LocalWateringRecord> {
  const synced: LocalWateringRecord = {
    ...remote,
    baseRev: remote.rev,
    syncStatus: "synced",
  };
  await database.waterings.put(synced);
  return synced;
}

export async function resolveStickerConflict(
  remote: CustomStickerMeta,
  database: GhiChuDatabase = db,
): Promise<LocalCustomStickerRecord | null> {
  const existing = await database.customStickers.get(remote.id);
  if (!existing) return null;
  const updated: LocalCustomStickerRecord = {
    ...existing,
    ...remote,
    baseRev: remote.rev,
    syncStatus: "synced",
  };
  await database.customStickers.put(updated);
  return updated;
}
