import { createId, createWateringId, getLocalDateString } from "@/lib/ids";
import { isValidWateringId, validateWishText } from "@/lib/validation";
import type {
  LocalWateringRecord,
  LocalWishRecord,
  WishCardStyle,
} from "@/types/models";
import { db, type GhiChuDatabase } from "./database";

export async function createLocalWish(
  text: string,
  style: WishCardStyle,
  database: GhiChuDatabase = db,
): Promise<LocalWishRecord> {
  const checked = validateWishText(text);
  if (!checked.valid) {
    throw new Error(checked.reason);
  }
  const now = Date.now();
  const record: LocalWishRecord = {
    id: createId("wish"),
    rev: 0,
    baseRev: 0,
    updatedAt: now,
    deleted: false,
    deletedAt: null,
    text: checked.normalized,
    style,
    done: false,
    doneAt: null,
    syncStatus: "dirty",
  };
  await database.wishes.put(record);
  return record;
}

export async function listActiveWishes(
  database: GhiChuDatabase = db,
): Promise<LocalWishRecord[]> {
  const all = await database.wishes.toArray();
  return all
    .filter((w) => !w.deleted)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function listAllWishes(
  database: GhiChuDatabase = db,
): Promise<LocalWishRecord[]> {
  return database.wishes.toArray();
}

export async function toggleWishDone(
  id: string,
  database: GhiChuDatabase = db,
): Promise<LocalWishRecord> {
  const existing = await database.wishes.get(id);
  if (!existing) {
    throw new Error("Không tìm thấy điều ước.");
  }
  const now = Date.now();
  const nextDone = !existing.done;
  const updated: LocalWishRecord = {
    ...existing,
    done: nextDone,
    doneAt: nextDone ? now : null,
    updatedAt: now,
    syncStatus: "dirty",
  };
  await database.wishes.put(updated);
  return updated;
}

export async function softDeleteWish(
  id: string,
  database: GhiChuDatabase = db,
): Promise<LocalWishRecord> {
  const existing = await database.wishes.get(id);
  if (!existing) {
    throw new Error("Không tìm thấy điều ước để xóa.");
  }
  const now = Date.now();
  const updated: LocalWishRecord = {
    ...existing,
    deleted: true,
    deletedAt: now,
    updatedAt: now,
    syncStatus: "dirty",
  };
  await database.wishes.put(updated);
  return updated;
}

export async function recordWateringForDate(
  localDate: string = getLocalDateString(),
  database: GhiChuDatabase = db,
): Promise<{ created: boolean; record: LocalWateringRecord }> {
  const id = createWateringId(localDate);
  if (!isValidWateringId(id)) {
    throw new Error("Ngày tưới sương không hợp lệ.");
  }
  const existing = await database.waterings.get(id);
  if (existing) {
    return { created: false, record: existing };
  }
  const record: LocalWateringRecord = {
    id,
    rev: 0,
    baseRev: 0,
    updatedAt: Date.now(),
    deleted: false,
    deletedAt: null,
    syncStatus: "dirty",
  };
  await database.waterings.put(record);
  return { created: true, record };
}

export async function listAllWaterings(
  database: GhiChuDatabase = db,
): Promise<LocalWateringRecord[]> {
  return database.waterings.toArray();
}
