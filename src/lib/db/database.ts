import Dexie, { type EntityTable } from "dexie";
import type {
  LocalCustomStickerRecord,
  LocalDrawingRecord,
  LocalNoteRecord,
  LocalWateringRecord,
  LocalWishRecord,
  MetaRecord,
} from "@/types/models";

export class GhiChuDatabase extends Dexie {
  notes!: EntityTable<LocalNoteRecord, "id">;
  drawings!: EntityTable<LocalDrawingRecord, "id">;
  customStickers!: EntityTable<LocalCustomStickerRecord, "id">;
  wishes!: EntityTable<LocalWishRecord, "id">;
  waterings!: EntityTable<LocalWateringRecord, "id">;
  meta!: EntityTable<MetaRecord, "key">;

  constructor(name = "ghi-chu-ngoc-nhu-db") {
    super(name);
    this.version(1).stores({
      notes: "id, updatedAt, category, isLocked, deleted, syncStatus",
      drawings: "id, noteId, syncStatus",
      customStickers: "id, deleted, syncStatus",
      wishes: "id, done, deleted, syncStatus",
      waterings: "id, syncStatus",
      meta: "key",
    });
  }
}

export const db = new GhiChuDatabase();
