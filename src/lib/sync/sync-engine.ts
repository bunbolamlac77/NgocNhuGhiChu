import { db, type GhiChuDatabase } from "@/lib/db/database";
import { getMetaValue, setMetaValue } from "@/lib/db/meta-repo";
import type {
  IndexDocument,
  LocalCustomStickerRecord,
  LocalDrawingRecord,
  LocalNoteRecord,
  LocalWateringRecord,
  LocalWishRecord,
  NoteDocument,
  SyncItemKind,
  Watering,
  WishItem,
} from "@/types/models";
import {
  resolveNoteConflict,
  resolveStickerConflict,
  resolveWateringConflict,
  resolveWishConflict,
} from "./conflict";

export class SyncAuthError extends Error {
  constructor(message = "Phiên đồng bộ đã hết hạn. Vui lòng nhập lại Mật khẩu sổ.") {
    super(message);
    this.name = "SyncAuthError";
  }
}

export interface SyncRunSummary {
  pulled: number;
  pushed: number;
  conflicts: number;
  purged: number;
}

const DAILY_PURGE_INTERVAL_MS = 24 * 60 * 60 * 1000;
let syncInFlight: Promise<SyncRunSummary> | null = null;

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (res.status === 401) {
    throw new SyncAuthError();
  }
  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(errBody.error || `Lỗi đồng bộ (${res.status}).`);
  }
  return (await res.json()) as T;
}

export async function fetchRemoteAssetBlob(
  type: "drawings" | "stickers",
  id: string,
): Promise<{
  blob: Blob;
  mime: "image/webp" | "image/png" | "application/octet-stream";
  isEncrypted: boolean;
} | null> {
  const res = await fetch(`/api/sync/assets/${type}/${encodeURIComponent(id)}`);
  if (res.status === 401) {
    throw new SyncAuthError();
  }
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Không tải được tệp đính kèm (${res.status}).`);
  }
  const contentType = res.headers.get("content-type") ?? "image/webp";
  const isEncrypted = contentType.includes("application/octet-stream");
  const mime = isEncrypted
    ? "application/octet-stream"
    : contentType.includes("image/png")
      ? "image/png"
      : "image/webp";
  const buf = await res.arrayBuffer();
  return {
    blob: new Blob([buf], { type: mime }),
    mime,
    isEncrypted,
  };
}

async function uploadAssetBlob(
  type: "drawings" | "stickers",
  id: string,
  blob: Blob,
  isEncrypted: boolean,
): Promise<void> {
  const headers: Record<string, string> = {
    "Content-Type": isEncrypted
      ? "application/octet-stream"
      : blob.type || "image/webp",
  };
  if (isEncrypted) {
    headers["x-ngocnhu-encrypted"] = "1";
  }
  const bytes = await blob.arrayBuffer();
  const res = await fetch(`/api/sync/assets/${type}/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers,
    body: bytes,
  });
  if (res.status === 401) {
    throw new SyncAuthError();
  }
  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(errBody.error || `Tải tệp đính kèm lên thất bại (${res.status}).`);
  }
}

async function pushSingleItem<T>(
  kind: SyncItemKind,
  id: string,
  item: T,
  baseRev: number,
): Promise<
  | { conflict: false; rev: number }
  | { conflict: true; remote: T }
> {
  const res = await fetch(
    `/api/sync/items/${kind}/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item, baseRev }),
    },
  );
  if (res.status === 401) {
    throw new SyncAuthError();
  }
  if (res.status === 409) {
    const data = (await res.json()) as { remote: T };
    return { conflict: true, remote: data.remote };
  }
  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(errBody.error || `Đồng bộ mục ${kind} thất bại (${res.status}).`);
  }
  const data = (await res.json()) as { rev: number };
  return { conflict: false, rev: data.rev };
}

function toCleanNoteDocument(rec: LocalNoteRecord): NoteDocument {
  return {
    id: rec.id,
    contentId: rec.contentId,
    rev: rec.rev,
    updatedAt: rec.updatedAt,
    createdAt: rec.createdAt,
    deleted: rec.deleted,
    deletedAt: rec.deletedAt,
    isLocked: rec.isLocked,
    templateId: rec.templateId,
    category: rec.category,
    dateTag: rec.dateTag,
    payload: rec.isLocked ? null : rec.payload,
    encryptedPayload: rec.encryptedPayload,
  };
}

function toCleanWishItem(rec: LocalWishRecord): WishItem {
  return {
    id: rec.id,
    rev: rec.rev,
    updatedAt: rec.updatedAt,
    deleted: rec.deleted,
    deletedAt: rec.deletedAt,
    text: rec.text,
    style: rec.style,
    done: rec.done,
    doneAt: rec.doneAt,
  };
}

function toCleanWatering(rec: LocalWateringRecord): Watering {
  return {
    id: rec.id,
    rev: rec.rev,
    updatedAt: rec.updatedAt,
    deleted: rec.deleted,
    deletedAt: rec.deletedAt,
  };
}

async function executeSync(database: GhiChuDatabase): Promise<SyncRunSummary> {
  let pulled = 0;
  let pushed = 0;
  let conflicts = 0;

  // 1. Pull remote index
  const { index } = await fetchJson<{ index: IndexDocument }>("/api/sync/index");

  // 2. Pull remote notes
  for (const [id, remoteEntry] of Object.entries(index.notes)) {
    const local = await database.notes.get(id);
    const shouldPull =
      !local || (remoteEntry.rev > local.baseRev && local.syncStatus !== "dirty");
    if (!shouldPull) continue;

    try {
      const { note } = await fetchJson<{ note: NoteDocument }>(
        `/api/sync/items/notes/${encodeURIComponent(id)}`,
      );
      await database.notes.put({
        ...note,
        baseRev: note.rev,
        syncStatus: "synced",
      });
      if (!note.deleted && note.payload?.drawingIds) {
        for (const drwId of note.payload.drawingIds) {
          const existsDrw = await database.drawings.get(drwId);
          if (!existsDrw) {
            const downloaded = await fetchRemoteAssetBlob("drawings", drwId);
            if (downloaded) {
              await database.drawings.put({
                id: drwId,
                noteId: note.id,
                mime: downloaded.mime,
                isEncrypted: downloaded.isEncrypted,
                sizeBytes: downloaded.blob.size,
                updatedAt: note.updatedAt,
                blob: downloaded.blob,
                syncStatus: "synced",
              });
            }
          }
        }
      }
      pulled += 1;
    } catch (err) {
      if (err instanceof SyncAuthError) throw err;
    }
  }

  // 3. Pull remote wishes
  for (const [id, remoteWish] of Object.entries(index.wishes)) {
    const local = await database.wishes.get(id);
    if (!local || (remoteWish.rev > local.baseRev && local.syncStatus !== "dirty")) {
      await database.wishes.put({
        ...remoteWish,
        baseRev: remoteWish.rev,
        syncStatus: "synced",
      });
      pulled += 1;
    }
  }

  // 4. Pull remote waterings
  for (const [id, remoteWatering] of Object.entries(index.waterings)) {
    const local = await database.waterings.get(id);
    if (!local || remoteWatering.rev > local.baseRev) {
      await database.waterings.put({
        ...remoteWatering,
        baseRev: remoteWatering.rev,
        syncStatus: "synced",
      });
      pulled += 1;
    }
  }

  // 5. Pull remote stickers
  for (const [id, remoteStk] of Object.entries(index.stickers)) {
    const local = await database.customStickers.get(id);
    if (!local || (remoteStk.rev > local.baseRev && local.syncStatus !== "dirty")) {
      if (remoteStk.deleted && local) {
        await database.customStickers.put({
          ...local,
          ...remoteStk,
          baseRev: remoteStk.rev,
          syncStatus: "synced",
        });
        pulled += 1;
      } else if (!remoteStk.deleted) {
        const downloaded = await fetchRemoteAssetBlob("stickers", id);
        if (downloaded) {
          await database.customStickers.put({
            ...remoteStk,
            baseRev: remoteStk.rev,
            blob: downloaded.blob,
            syncStatus: "synced",
          });
          pulled += 1;
        }
      }
    }
  }

  // 6. Push dirty drawings first
  const dirtyDrawings: LocalDrawingRecord[] = await database.drawings
    .where("syncStatus")
    .equals("dirty")
    .toArray();
  for (const drw of dirtyDrawings) {
    if (drw.blob instanceof Blob) {
      await uploadAssetBlob("drawings", drw.id, drw.blob, drw.isEncrypted);
      await database.drawings.put({ ...drw, syncStatus: "synced" });
      pushed += 1;
    }
  }

  // 7. Push dirty custom stickers
  const dirtyStickers: LocalCustomStickerRecord[] = await database.customStickers
    .where("syncStatus")
    .equals("dirty")
    .toArray();
  for (const stk of dirtyStickers) {
    if (!stk.deleted && stk.blob instanceof Blob) {
      await uploadAssetBlob("stickers", stk.id, stk.blob, false);
    }
    const metaPayload = {
      id: stk.id,
      rev: stk.rev,
      updatedAt: stk.updatedAt,
      deleted: stk.deleted,
      deletedAt: stk.deletedAt,
      name: stk.name,
      width: stk.width,
      height: stk.height,
      sizeBytes: stk.sizeBytes,
      mime: stk.mime,
    };
    const res = await pushSingleItem("stickers", stk.id, metaPayload, stk.baseRev);
    if (res.conflict) {
      await resolveStickerConflict(res.remote, database);
      conflicts += 1;
    } else {
      await database.customStickers.put({
        ...stk,
        rev: res.rev,
        baseRev: res.rev,
        syncStatus: "synced",
      });
      pushed += 1;
    }
  }

  // 8. Push dirty wishes
  const dirtyWishes = await database.wishes
    .where("syncStatus")
    .equals("dirty")
    .toArray();
  for (const wish of dirtyWishes) {
    const res = await pushSingleItem(
      "wishes",
      wish.id,
      toCleanWishItem(wish),
      wish.baseRev,
    );
    if (res.conflict) {
      const merged = await resolveWishConflict(wish, res.remote, database);
      const retry = await pushSingleItem(
        "wishes",
        merged.id,
        toCleanWishItem(merged),
        merged.baseRev,
      );
      if (!retry.conflict) {
        await database.wishes.put({
          ...merged,
          rev: retry.rev,
          baseRev: retry.rev,
          syncStatus: "synced",
        });
      }
      conflicts += 1;
    } else {
      await database.wishes.put({
        ...wish,
        rev: res.rev,
        baseRev: res.rev,
        syncStatus: "synced",
      });
      pushed += 1;
    }
  }

  // 9. Push dirty waterings
  const dirtyWaterings = await database.waterings
    .where("syncStatus")
    .equals("dirty")
    .toArray();
  for (const watering of dirtyWaterings) {
    const res = await pushSingleItem(
      "waterings",
      watering.id,
      toCleanWatering(watering),
      watering.baseRev,
    );
    if (res.conflict) {
      await resolveWateringConflict(res.remote, database);
    } else {
      await database.waterings.put({
        ...watering,
        rev: res.rev,
        baseRev: res.rev,
        syncStatus: "synced",
      });
      pushed += 1;
    }
  }

  // 10. Push dirty notes (resolve 409 with conflict copy)
  const dirtyNotes = await database.notes
    .where("syncStatus")
    .equals("dirty")
    .toArray();
  for (const note of dirtyNotes) {
    const res = await pushSingleItem(
      "notes",
      note.id,
      toCleanNoteDocument(note),
      note.baseRev,
    );
    if (res.conflict) {
      const { conflictCopy } = await resolveNoteConflict(
        note,
        res.remote,
        database,
      );
      const copyPush = await pushSingleItem(
        "notes",
        conflictCopy.id,
        toCleanNoteDocument(conflictCopy),
        0,
      );
      if (!copyPush.conflict) {
        await database.notes.put({
          ...conflictCopy,
          rev: copyPush.rev,
          baseRev: copyPush.rev,
          syncStatus: "synced",
        });
      }
      conflicts += 1;
    } else {
      await database.notes.put({
        ...note,
        rev: res.rev,
        baseRev: res.rev,
        syncStatus: "synced",
      });
      pushed += 1;
    }
  }

  // 11. Daily purge of >30-day deleted items
  let purged = 0;
  const lastPurgeAt = (await getMetaValue("lastPurgeAt", database)) ?? 0;
  const now = Date.now();
  if (now - lastPurgeAt >= DAILY_PURGE_INTERVAL_MS) {
    try {
      const purgeRes = await fetchJson<{ purged: number }>("/api/sync/purge", {
        method: "POST",
      });
      purged = purgeRes.purged;
      await setMetaValue("lastPurgeAt", now, database);
    } catch (err) {
      if (err instanceof SyncAuthError) throw err;
    }
  }

  return { pulled, pushed, conflicts, purged };
}

export async function runSyncCycle(
  database: GhiChuDatabase = db,
): Promise<SyncRunSummary> {
  if (syncInFlight) {
    return syncInFlight;
  }
  syncInFlight = executeSync(database).finally(() => {
    syncInFlight = null;
  });
  return syncInFlight;
}
