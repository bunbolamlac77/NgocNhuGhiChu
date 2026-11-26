import { createId, getLocalDateString } from "@/lib/ids";
import {
  clampPlacedSticker,
  isValidDateTag,
  isValidId,
  MAX_NOTE_BYTES,
  MAX_STICKERS_PER_NOTE,
  validatePayloadByteSize,
} from "@/lib/validation";
import type {
  ChecklistItem,
  EncryptedEnvelope,
  LocalNoteRecord,
  NoteCategory,
  NotePayload,
  PaperTemplateId,
  PlacedSticker,
} from "@/types/models";
import { db, type GhiChuDatabase } from "./database";

export interface CreateNoteInput {
  id?: string;
  contentId?: string;
  templateId?: PaperTemplateId;
  category?: NoteCategory;
  dateTag?: string | null;
  title?: string;
  body?: string;
  checklist?: ChecklistItem[];
  stickers?: PlacedSticker[];
  drawingIds?: string[];
  isLocked?: boolean;
  encryptedPayload?: EncryptedEnvelope | null;
}

export interface UpdateNotePatch {
  templateId?: PaperTemplateId;
  category?: NoteCategory;
  dateTag?: string | null;
  payload?: NotePayload | null;
  isLocked?: boolean;
  encryptedPayload?: EncryptedEnvelope | null;
}

function sanitizePayload(payload: NotePayload): NotePayload {
  return {
    title: payload.title,
    body: payload.body,
    checklist: payload.checklist.map((item) => ({
      id: item.id,
      text: item.text,
      checked: Boolean(item.checked),
    })),
    stickers: payload.stickers
      .slice(0, MAX_STICKERS_PER_NOTE)
      .map(clampPlacedSticker),
    drawingIds: payload.drawingIds.filter(isValidId),
  };
}

function assertNoteWithinByteLimit(record: LocalNoteRecord): void {
  const serialized = JSON.stringify(record);
  if (!validatePayloadByteSize(serialized, MAX_NOTE_BYTES)) {
    throw new Error("Ghi chú vượt quá giới hạn dung lượng 120 KB.");
  }
}

export async function createLocalNote(
  input: CreateNoteInput = {},
  database: GhiChuDatabase = db,
): Promise<LocalNoteRecord> {
  const now = Date.now();
  const isLocked = Boolean(input.isLocked);
  const id = input.id && isValidId(input.id) ? input.id : createId("note");
  const contentId =
    input.contentId && isValidId(input.contentId)
      ? input.contentId
      : createId("cnt");

  const rawPayload: NotePayload = {
    title: input.title ?? "",
    body: input.body ?? "",
    checklist: input.checklist ?? [],
    stickers: input.stickers ?? [],
    drawingIds: input.drawingIds ?? [],
  };

  const dateTag =
    input.dateTag === null
      ? null
      : input.dateTag && isValidDateTag(input.dateTag)
        ? input.dateTag
        : getLocalDateString(new Date(now));

  const record: LocalNoteRecord = {
    id,
    contentId,
    rev: 0,
    baseRev: 0,
    syncStatus: "dirty",
    createdAt: now,
    updatedAt: now,
    deleted: false,
    deletedAt: null,
    isLocked,
    templateId: input.templateId ?? "sakura-dashed",
    category: input.category ?? (isLocked ? "private" : "diary"),
    dateTag,
    payload: isLocked ? null : sanitizePayload(rawPayload),
    encryptedPayload: isLocked ? (input.encryptedPayload ?? null) : null,
  };

  assertNoteWithinByteLimit(record);
  await database.notes.put(record);
  return record;
}

export async function getNoteById(
  id: string,
  database: GhiChuDatabase = db,
): Promise<LocalNoteRecord | undefined> {
  if (!isValidId(id)) return undefined;
  return database.notes.get(id);
}

export async function listActiveNotes(
  database: GhiChuDatabase = db,
): Promise<LocalNoteRecord[]> {
  const all = await database.notes.orderBy("updatedAt").reverse().toArray();
  return all.filter((n) => !n.deleted);
}

export async function listAllNotes(
  database: GhiChuDatabase = db,
): Promise<LocalNoteRecord[]> {
  return database.notes.orderBy("updatedAt").reverse().toArray();
}

export async function updateLocalNote(
  id: string,
  patch: UpdateNotePatch,
  database: GhiChuDatabase = db,
): Promise<LocalNoteRecord> {
  const existing = await database.notes.get(id);
  if (!existing) {
    throw new Error("Không tìm thấy ghi chú để cập nhật.");
  }

  const nextLocked =
    patch.isLocked !== undefined ? patch.isLocked : existing.isLocked;
  const nextPayload = nextLocked
    ? null
    : patch.payload !== undefined
      ? patch.payload
        ? sanitizePayload(patch.payload)
        : null
      : existing.payload;
  const nextDateTag =
    patch.dateTag === undefined
      ? existing.dateTag
      : patch.dateTag === null || isValidDateTag(patch.dateTag)
        ? patch.dateTag
        : existing.dateTag;

  const updated: LocalNoteRecord = {
    ...existing,
    templateId: patch.templateId ?? existing.templateId,
    category: patch.category ?? existing.category,
    dateTag: nextDateTag,
    isLocked: nextLocked,
    payload: nextPayload,
    encryptedPayload: nextLocked
      ? patch.encryptedPayload !== undefined
        ? patch.encryptedPayload
        : existing.encryptedPayload
      : null,
    updatedAt: Date.now(),
    syncStatus: "dirty",
  };

  assertNoteWithinByteLimit(updated);
  await database.notes.put(updated);
  return updated;
}

export async function toggleNoteChecklistItem(
  noteId: string,
  itemId: string,
  database: GhiChuDatabase = db,
): Promise<LocalNoteRecord> {
  const existing = await database.notes.get(noteId);
  if (!existing) {
    throw new Error("Không tìm thấy ghi chú.");
  }
  if (existing.isLocked || !existing.payload) {
    throw new Error("Không thể đánh dấu checklist khi ghi chú đang khóa.");
  }

  const nextChecklist = existing.payload.checklist.map((item) =>
    item.id === itemId ? { ...item, checked: !item.checked } : item,
  );
  return updateLocalNote(
    noteId,
    {
      payload: {
        ...existing.payload,
        checklist: nextChecklist,
      },
    },
    database,
  );
}

export async function softDeleteNote(
  id: string,
  database: GhiChuDatabase = db,
): Promise<LocalNoteRecord> {
  const existing = await database.notes.get(id);
  if (!existing) {
    throw new Error("Không tìm thấy ghi chú để xóa.");
  }
  const now = Date.now();
  const deletedRecord: LocalNoteRecord = {
    ...existing,
    deleted: true,
    deletedAt: now,
    updatedAt: now,
    syncStatus: "dirty",
  };
  await database.notes.put(deletedRecord);
  return deletedRecord;
}

export async function restoreNote(
  id: string,
  database: GhiChuDatabase = db,
): Promise<LocalNoteRecord> {
  const existing = await database.notes.get(id);
  if (!existing) {
    throw new Error("Không tìm thấy ghi chú để khôi phục.");
  }
  const restored: LocalNoteRecord = {
    ...existing,
    deleted: false,
    deletedAt: null,
    updatedAt: Date.now(),
    syncStatus: "dirty",
  };
  await database.notes.put(restored);
  return restored;
}

function foldVietnamese(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

export function searchAndFilterNotes(
  notes: LocalNoteRecord[],
  category: "all" | NoteCategory,
  query: string,
): LocalNoteRecord[] {
  const trimmed = query.trim();
  const qLower = trimmed.toLowerCase();
  const qFolded = foldVietnamese(trimmed);

  return notes.filter((note) => {
    if (note.deleted) return false;

    if (category !== "all") {
      if (category === "private") {
        if (!note.isLocked && note.category !== "private") return false;
      } else if (note.category !== category) {
        return false;
      }
    }

    if (!trimmed) return true;
    // Ghi chú khóa không bao giờ lộ nội dung khi tìm kiếm văn bản
    if (note.isLocked || !note.payload) return false;

    const haystacks = [
      note.payload.title,
      note.payload.body,
      ...note.payload.checklist.map((item) => item.text),
    ];

    return haystacks.some((text) => {
      const lower = text.toLowerCase();
      if (lower.includes(qLower)) return true;
      return foldVietnamese(text).includes(qFolded);
    });
  });
}
