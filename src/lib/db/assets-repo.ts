import { createId } from "@/lib/ids";
import {
  isValidId,
  MAX_DRAWING_CLIENT_BYTES,
  MAX_STICKER_CLIENT_BYTES,
} from "@/lib/validation";
import type {
  LocalCustomStickerRecord,
  LocalDrawingRecord,
} from "@/types/models";
import { db, type GhiChuDatabase } from "./database";

export interface SaveDrawingInput {
  id?: string;
  noteId: string;
  mime: "image/webp" | "image/png" | "application/octet-stream";
  isEncrypted: boolean;
  blob: Blob;
}

export async function saveLocalDrawing(
  input: SaveDrawingInput,
  database: GhiChuDatabase = db,
): Promise<LocalDrawingRecord> {
  if (!isValidId(input.noteId)) {
    throw new Error("Mã ghi chú đính kèm ảnh vẽ không hợp lệ.");
  }
  if (input.blob.size > MAX_DRAWING_CLIENT_BYTES && !input.isEncrypted) {
    throw new Error("Ảnh vẽ vượt quá giới hạn 150 KB.");
  }
  const id = input.id && isValidId(input.id) ? input.id : createId("drw");
  const record: LocalDrawingRecord = {
    id,
    noteId: input.noteId,
    mime: input.mime,
    isEncrypted: input.isEncrypted,
    sizeBytes: input.blob.size,
    updatedAt: Date.now(),
    blob: input.blob,
    syncStatus: "dirty",
  };
  await database.drawings.put(record);
  return record;
}

export async function getLocalDrawing(
  id: string,
  database: GhiChuDatabase = db,
): Promise<LocalDrawingRecord | undefined> {
  if (!isValidId(id)) return undefined;
  return database.drawings.get(id);
}

export async function listDrawingsByNote(
  noteId: string,
  database: GhiChuDatabase = db,
): Promise<LocalDrawingRecord[]> {
  if (!isValidId(noteId)) return [];
  return database.drawings.where("noteId").equals(noteId).toArray();
}

export async function listAllDrawings(
  database: GhiChuDatabase = db,
): Promise<LocalDrawingRecord[]> {
  return database.drawings.toArray();
}

export async function deleteLocalDrawing(
  id: string,
  database: GhiChuDatabase = db,
): Promise<void> {
  if (!isValidId(id)) return;
  await database.drawings.delete(id);
}

export interface SaveCustomStickerInput {
  id?: string;
  name: string;
  width: number;
  height: number;
  mime: "image/webp" | "image/png";
  blob: Blob;
}

export async function saveLocalCustomSticker(
  input: SaveCustomStickerInput,
  database: GhiChuDatabase = db,
): Promise<LocalCustomStickerRecord> {
  if (input.blob.size > MAX_STICKER_CLIENT_BYTES) {
    throw new Error("Sticker tự vẽ vượt quá giới hạn 45 KB.");
  }
  const now = Date.now();
  const id = input.id && isValidId(input.id) ? input.id : createId("stk");
  const cleanName = input.name.trim().slice(0, 40) || "Sticker tự vẽ";

  const record: LocalCustomStickerRecord = {
    id,
    rev: 0,
    baseRev: 0,
    updatedAt: now,
    deleted: false,
    deletedAt: null,
    name: cleanName,
    width: input.width,
    height: input.height,
    sizeBytes: input.blob.size,
    mime: input.mime,
    blob: input.blob,
    syncStatus: "dirty",
  };
  await database.customStickers.put(record);
  return record;
}

export async function getLocalCustomSticker(
  id: string,
  database: GhiChuDatabase = db,
): Promise<LocalCustomStickerRecord | undefined> {
  if (!isValidId(id)) return undefined;
  return database.customStickers.get(id);
}

export async function listActiveCustomStickers(
  database: GhiChuDatabase = db,
): Promise<LocalCustomStickerRecord[]> {
  const all = await database.customStickers.toArray();
  return all
    .filter((s) => !s.deleted)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function listAllCustomStickers(
  database: GhiChuDatabase = db,
): Promise<LocalCustomStickerRecord[]> {
  return database.customStickers.toArray();
}

export async function softDeleteCustomSticker(
  id: string,
  database: GhiChuDatabase = db,
): Promise<LocalCustomStickerRecord | undefined> {
  const existing = await database.customStickers.get(id);
  if (!existing) return undefined;
  const now = Date.now();
  const updated: LocalCustomStickerRecord = {
    ...existing,
    deleted: true,
    deletedAt: now,
    updatedAt: now,
    syncStatus: "dirty",
  };
  await database.customStickers.put(updated);
  return updated;
}
