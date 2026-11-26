import { isValidId, isValidWateringId } from "@/lib/validation";
import type {
  CustomStickerMeta,
  IndexDocument,
  NoteDocument,
  NoteIndexEntry,
  Watering,
  WishItem,
} from "@/types/models";
import type { SyncItemPayloadMap } from "@/types/api";
import type { DriveStorage } from "./drive";

export const INDEX_FILE_NAME = "index.json";
export const PURGE_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function createEmptyIndex(): IndexDocument {
  return {
    schemaVersion: 2,
    notes: {},
    wishes: {},
    waterings: {},
    stickers: {},
  };
}

export async function readRemoteIndex(
  drive: DriveStorage,
): Promise<IndexDocument> {
  const existing = await drive.readJson<IndexDocument>(INDEX_FILE_NAME);
  if (!existing || existing.schemaVersion !== 2) {
    return createEmptyIndex();
  }
  return {
    schemaVersion: 2,
    notes: existing.notes ?? {},
    wishes: existing.wishes ?? {},
    waterings: existing.waterings ?? {},
    stickers: existing.stickers ?? {},
  };
}

export function noteFileName(id: string): string {
  return `notes/${id}.json`;
}

function buildSnippet(note: NoteDocument): {
  title: string | null;
  snippet: string | null;
} {
  if (note.isLocked || !note.payload) {
    return { title: null, snippet: null };
  }
  const title = note.payload.title.trim().slice(0, 120);
  const body = note.payload.body.trim().replace(/\s+/g, " ").slice(0, 140);
  return { title, snippet: body };
}

export type PutItemResult<K extends keyof SyncItemPayloadMap> =
  | { conflict: false; rev: number }
  | { conflict: true; remote: SyncItemPayloadMap[K] };

export async function putSyncItem<K extends keyof SyncItemPayloadMap>(
  drive: DriveStorage,
  kind: K,
  id: string,
  item: SyncItemPayloadMap[K],
  baseRev: number,
): Promise<PutItemResult<K>> {
  if (kind === "waterings") {
    if (!isValidWateringId(id)) {
      throw new Error("Mã ngày tưới không hợp lệ.");
    }
  } else if (!isValidId(id)) {
    throw new Error("Mã mục đồng bộ không hợp lệ.");
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const index = await readRemoteIndex(drive);

    if (kind === "notes") {
      const incoming = item as NoteDocument;
      const existingEntry = index.notes[id];
      const currentRev = existingEntry?.rev ?? 0;

      if (baseRev !== currentRev && existingEntry) {
        const remoteNote =
          (await drive.readJson<NoteDocument>(noteFileName(id))) ??
          ({
            id: existingEntry.id,
            contentId: existingEntry.id,
            rev: existingEntry.rev,
            updatedAt: existingEntry.updatedAt,
            deleted: existingEntry.deleted,
            deletedAt: existingEntry.deletedAt,
            createdAt: existingEntry.createdAt,
            isLocked: existingEntry.isLocked,
            templateId: existingEntry.templateId,
            category: existingEntry.category,
            dateTag: existingEntry.dateTag,
            payload: null,
            encryptedPayload: null,
          } satisfies NoteDocument);
        return {
          conflict: true,
          remote: remoteNote as SyncItemPayloadMap[K],
        };
      }

      if (baseRev !== 0 && !existingEntry) {
        return {
          conflict: true,
          remote: {
            ...incoming,
            rev: 0,
            deleted: true,
          } as SyncItemPayloadMap[K],
        };
      }

      const nextRev = currentRev + 1;
      const sanitizedNote: NoteDocument = {
        ...incoming,
        id,
        rev: nextRev,
        payload: incoming.isLocked ? null : incoming.payload,
      };
      await drive.writeJson(noteFileName(id), sanitizedNote);

      const { title, snippet } = buildSnippet(sanitizedNote);
      const nextEntry: NoteIndexEntry = {
        id,
        rev: nextRev,
        updatedAt: sanitizedNote.updatedAt,
        deleted: sanitizedNote.deleted,
        deletedAt: sanitizedNote.deletedAt,
        isLocked: sanitizedNote.isLocked,
        templateId: sanitizedNote.templateId,
        category: sanitizedNote.category,
        dateTag: sanitizedNote.dateTag,
        createdAt: sanitizedNote.createdAt,
        title,
        snippet,
      };
      index.notes[id] = nextEntry;
      await drive.writeJson(INDEX_FILE_NAME, index);
      return { conflict: false, rev: nextRev };
    }

    if (kind === "wishes") {
      const incoming = item as WishItem;
      const existing = index.wishes[id];
      const currentRev = existing?.rev ?? 0;
      if (existing && baseRev !== currentRev) {
        return { conflict: true, remote: existing as SyncItemPayloadMap[K] };
      }
      const nextRev = currentRev + 1;
      index.wishes[id] = { ...incoming, id, rev: nextRev };
      await drive.writeJson(INDEX_FILE_NAME, index);
      return { conflict: false, rev: nextRev };
    }

    if (kind === "waterings") {
      const incoming = item as Watering;
      const existing = index.waterings[id];
      const currentRev = existing?.rev ?? 0;
      if (existing && baseRev !== currentRev) {
        return { conflict: true, remote: existing as SyncItemPayloadMap[K] };
      }
      const nextRev = currentRev + 1;
      index.waterings[id] = { ...incoming, id, rev: nextRev };
      await drive.writeJson(INDEX_FILE_NAME, index);
      return { conflict: false, rev: nextRev };
    }

    const incoming = item as CustomStickerMeta;
    const existing = index.stickers[id];
    const currentRev = existing?.rev ?? 0;
    if (existing && baseRev !== currentRev) {
      return { conflict: true, remote: existing as SyncItemPayloadMap[K] };
    }
    const nextRev = currentRev + 1;
    index.stickers[id] = { ...incoming, id, rev: nextRev };
    await drive.writeJson(INDEX_FILE_NAME, index);
    return { conflict: false, rev: nextRev };
  }

  throw new Error("Xung đột đồng thời khi cập nhật index trên Drive.");
}

export async function purgeDeletedItems(
  drive: DriveStorage,
  now = Date.now(),
): Promise<number> {
  const cutoff = now - PURGE_AGE_MS;
  const index = await readRemoteIndex(drive);
  let purged = 0;

  for (const [id, entry] of Object.entries(index.notes)) {
    if (entry.deleted && entry.deletedAt !== null && entry.deletedAt < cutoff) {
      const noteBody = await drive.readJson<NoteDocument>(noteFileName(id));
      const drawingIds = noteBody?.payload?.drawingIds ?? [];
      await drive.deleteFile(noteFileName(id));
      for (const drwId of drawingIds) {
        await drive.deleteFile(`drawings/${drwId}.webp`);
        await drive.deleteFile(`drawings/${drwId}.png`);
        await drive.deleteFile(`drawings/${drwId}.enc`);
      }
      delete index.notes[id];
      purged += 1;
    }
  }

  for (const [id, wish] of Object.entries(index.wishes)) {
    if (wish.deleted && wish.deletedAt !== null && wish.deletedAt < cutoff) {
      delete index.wishes[id];
      purged += 1;
    }
  }

  for (const [id, watering] of Object.entries(index.waterings)) {
    if (
      watering.deleted &&
      watering.deletedAt !== null &&
      watering.deletedAt < cutoff
    ) {
      delete index.waterings[id];
      purged += 1;
    }
  }

  for (const [id, stk] of Object.entries(index.stickers)) {
    if (stk.deleted && stk.deletedAt !== null && stk.deletedAt < cutoff) {
      await drive.deleteFile(`stickers/${id}.webp`);
      await drive.deleteFile(`stickers/${id}.png`);
      delete index.stickers[id];
      purged += 1;
    }
  }

  if (purged > 0) {
    await drive.writeJson(INDEX_FILE_NAME, index);
  }
  return purged;
}
