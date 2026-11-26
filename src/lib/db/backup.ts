import {
  isValidId,
  isValidNoteCategory,
  isValidPaperTemplateId,
  isValidWateringId,
  isValidWishCardStyle,
} from "@/lib/validation";
import type {
  LocalCustomStickerRecord,
  LocalDrawingRecord,
  LocalNoteRecord,
  LocalWateringRecord,
  LocalWishRecord,
} from "@/types/models";
import { db, type GhiChuDatabase } from "./database";

export interface SerializedDrawingEntry {
  id: string;
  noteId: string;
  mime: "image/webp" | "image/png" | "application/octet-stream";
  isEncrypted: boolean;
  sizeBytes: number;
  updatedAt: number;
  base64: string;
}

export interface SerializedStickerEntry {
  id: string;
  rev: number;
  baseRev: number;
  updatedAt: number;
  deleted: boolean;
  deletedAt: number | null;
  name: string;
  width: number;
  height: number;
  sizeBytes: number;
  mime: "image/webp" | "image/png";
  base64: string;
}

export interface BackupBundleV2 {
  app: "ghi-chu-ngoc-nhu";
  schemaVersion: 2;
  exportedAt: number;
  notes: LocalNoteRecord[];
  wishes: LocalWishRecord[];
  waterings: LocalWateringRecord[];
  drawings: SerializedDrawingEntry[];
  customStickers: SerializedStickerEntry[];
}

export interface ImportBackupSummary {
  notesImported: number;
  wishesImported: number;
  wateringsImported: number;
  drawingsImported: number;
  stickersImported: number;
}

async function readBlobBytes(blob: Blob): Promise<Uint8Array> {
  if (typeof blob.arrayBuffer === "function") {
    return new Uint8Array(await blob.arrayBuffer());
  }
  return new Promise<Uint8Array>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(reader.result));
      } else {
        reject(new Error("Không đọc được dữ liệu nhị phân."));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("Lỗi FileReader."));
    reader.readAsArrayBuffer(blob);
  });
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = await readBlobBytes(blob);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

export function base64ToBlob(base64: string, mime: string): Blob {
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export async function exportBackupJson(
  database: GhiChuDatabase = db,
): Promise<string> {
  const [notes, wishes, waterings, drawings, stickers] = await Promise.all([
    database.notes.toArray(),
    database.wishes.toArray(),
    database.waterings.toArray(),
    database.drawings.toArray(),
    database.customStickers.toArray(),
  ]);

  const sanitizedNotes = notes.map((n) =>
    n.isLocked ? { ...n, payload: null } : n,
  );

  const serializedDrawings: SerializedDrawingEntry[] = await Promise.all(
    drawings.map(async (d) => ({
      id: d.id,
      noteId: d.noteId,
      mime: d.mime,
      isEncrypted: d.isEncrypted,
      sizeBytes: d.sizeBytes,
      updatedAt: d.updatedAt,
      base64: await blobToBase64(d.blob),
    })),
  );

  const serializedStickers: SerializedStickerEntry[] = await Promise.all(
    stickers.map(async (s) => ({
      id: s.id,
      rev: s.rev,
      baseRev: s.baseRev,
      updatedAt: s.updatedAt,
      deleted: s.deleted,
      deletedAt: s.deletedAt,
      name: s.name,
      width: s.width,
      height: s.height,
      sizeBytes: s.sizeBytes,
      mime: s.mime,
      base64: await blobToBase64(s.blob),
    })),
  );

  const bundle: BackupBundleV2 = {
    app: "ghi-chu-ngoc-nhu",
    schemaVersion: 2,
    exportedAt: Date.now(),
    notes: sanitizedNotes,
    wishes,
    waterings,
    drawings: serializedDrawings,
    customStickers: serializedStickers,
  };

  return JSON.stringify(bundle, null, 2);
}

function assertBackupBundle(parsed: unknown): asserts parsed is BackupBundleV2 {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Tệp sao lưu JSON không hợp lệ.");
  }
  const obj = parsed as Partial<BackupBundleV2>;
  if (obj.app !== "ghi-chu-ngoc-nhu" || obj.schemaVersion !== 2) {
    throw new Error("Tệp sao lưu không đúng định dạng v2 của Sổ Ngọc Như.");
  }
  if (
    !Array.isArray(obj.notes) ||
    !Array.isArray(obj.wishes) ||
    !Array.isArray(obj.waterings) ||
    !Array.isArray(obj.drawings) ||
    !Array.isArray(obj.customStickers)
  ) {
    throw new Error("Tệp sao lưu thiếu bảng dữ liệu bắt buộc.");
  }
}

export async function importBackupJson(
  rawJson: string,
  database: GhiChuDatabase = db,
): Promise<ImportBackupSummary> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error("Không đọc được JSON từ tệp sao lưu.");
  }
  assertBackupBundle(parsed);

  const summary: ImportBackupSummary = {
    notesImported: 0,
    wishesImported: 0,
    wateringsImported: 0,
    drawingsImported: 0,
    stickersImported: 0,
  };

  await database.transaction(
    "rw",
    [
      database.notes,
      database.wishes,
      database.waterings,
      database.drawings,
      database.customStickers,
    ],
    async () => {
      for (const note of parsed.notes) {
        if (
          !note ||
          !isValidId(note.id) ||
          !isValidId(note.contentId) ||
          !isValidPaperTemplateId(note.templateId) ||
          !isValidNoteCategory(note.category)
        ) {
          continue;
        }
        const existing = await database.notes.get(note.id);
        if (!existing || note.updatedAt > existing.updatedAt) {
          const normalized: LocalNoteRecord = {
            ...note,
            payload: note.isLocked ? null : note.payload,
            syncStatus: "dirty",
          };
          await database.notes.put(normalized);
          summary.notesImported += 1;
        }
      }

      for (const wish of parsed.wishes) {
        if (
          !wish ||
          !isValidId(wish.id) ||
          !isValidWishCardStyle(wish.style) ||
          typeof wish.text !== "string"
        ) {
          continue;
        }
        const existing = await database.wishes.get(wish.id);
        if (!existing || wish.updatedAt > existing.updatedAt) {
          await database.wishes.put({ ...wish, syncStatus: "dirty" });
          summary.wishesImported += 1;
        }
      }

      for (const watering of parsed.waterings) {
        if (!watering || !isValidWateringId(watering.id)) continue;
        const existing = await database.waterings.get(watering.id);
        if (!existing) {
          await database.waterings.put({ ...watering, syncStatus: "dirty" });
          summary.wateringsImported += 1;
        }
      }

      for (const drawing of parsed.drawings) {
        if (
          !drawing ||
          !isValidId(drawing.id) ||
          !isValidId(drawing.noteId) ||
          typeof drawing.base64 !== "string"
        ) {
          continue;
        }
        const existing = await database.drawings.get(drawing.id);
        if (!existing || drawing.updatedAt > existing.updatedAt) {
          const blob = base64ToBlob(drawing.base64, drawing.mime);
          const record: LocalDrawingRecord = {
            id: drawing.id,
            noteId: drawing.noteId,
            mime: drawing.mime,
            isEncrypted: Boolean(drawing.isEncrypted),
            sizeBytes: blob.size,
            updatedAt: drawing.updatedAt,
            blob,
            syncStatus: "dirty",
          };
          await database.drawings.put(record);
          summary.drawingsImported += 1;
        }
      }

      for (const sticker of parsed.customStickers) {
        if (
          !sticker ||
          !isValidId(sticker.id) ||
          typeof sticker.base64 !== "string"
        ) {
          continue;
        }
        const existing = await database.customStickers.get(sticker.id);
        if (!existing || sticker.updatedAt > existing.updatedAt) {
          const blob = base64ToBlob(sticker.base64, sticker.mime);
          const record: LocalCustomStickerRecord = {
            id: sticker.id,
            rev: sticker.rev ?? 0,
            baseRev: sticker.baseRev ?? 0,
            updatedAt: sticker.updatedAt,
            deleted: Boolean(sticker.deleted),
            deletedAt: sticker.deletedAt ?? null,
            name: sticker.name || "Sticker tự vẽ",
            width: sticker.width,
            height: sticker.height,
            sizeBytes: blob.size,
            mime: sticker.mime,
            blob,
            syncStatus: "dirty",
          };
          await database.customStickers.put(record);
          summary.stickersImported += 1;
        }
      }
    },
  );

  return summary;
}
