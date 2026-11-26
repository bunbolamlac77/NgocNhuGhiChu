// @vitest-environment node
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { GhiChuDatabase } from "@/lib/db/database";
import { recordWateringForDate } from "@/lib/db/wishes-repo";
import {
  computeStreakDays,
  computeTreeProgress,
  getTreeStageForXp,
} from "@/lib/tree/progression";
import type {
  LocalNoteRecord,
  LocalWateringRecord,
  LocalWishRecord,
} from "@/types/models";

function makeNote(dateTag: string, deleted = false): LocalNoteRecord {
  return {
    id: `note_${dateTag}_${Math.random().toString(36).slice(2, 8)}`,
    contentId: `cnt_${dateTag}`,
    rev: 0,
    baseRev: 0,
    updatedAt: Date.now(),
    createdAt: Date.now(),
    deleted,
    deletedAt: deleted ? Date.now() : null,
    isLocked: false,
    templateId: "sakura-dashed",
    category: "diary",
    dateTag,
    payload: { title: "N", body: "", checklist: [], stickers: [], drawingIds: [] },
    encryptedPayload: null,
    syncStatus: "dirty",
  };
}

function makeWish(id: string, done = false, deleted = false): LocalWishRecord {
  return {
    id,
    rev: 0,
    baseRev: 0,
    updatedAt: Date.now(),
    deleted,
    deletedAt: deleted ? Date.now() : null,
    text: "Điều ước",
    style: "ema",
    done,
    doneAt: done ? Date.now() : null,
    syncStatus: "dirty",
  };
}

function makeWatering(dateStr: string, deleted = false): LocalWateringRecord {
  return {
    id: `w-${dateStr}`,
    rev: 0,
    baseRev: 0,
    updatedAt: Date.now(),
    deleted,
    deletedAt: deleted ? Date.now() : null,
    syncStatus: "dirty",
  };
}

describe("Wishing Tree Progression & Watering", () => {
  let db: GhiChuDatabase;

  beforeEach(async () => {
    db = new GhiChuDatabase(`tree_test_${Math.random().toString(36).slice(2)}`);
    await db.open();
  });

  it("computes exact XP formula and ignores soft-deleted items", () => {
    const progress = computeTreeProgress({
      notes: [
        makeNote("2026-11-24"),
        makeNote("2026-11-24"), // same day counts once
        makeNote("2026-11-25"),
        makeNote("2026-11-20", true), // deleted ignored
      ],
      wishes: [
        makeWish("wish_1", false),
        makeWish("wish_2", true),
        makeWish("wish_3", true, true), // deleted ignored
      ],
      waterings: [
        makeWatering("2026-11-25"),
        makeWatering("2026-11-26"),
        makeWatering("2026-11-21", true), // deleted ignored
      ],
      todayLocalDate: "2026-11-26",
    });

    // 2 noteDays * 10 + 2 waterings * 5 + 2 wishes * 5 + 1 wishesDone * 25 = 65 XP
    expect(progress.noteDays).toBe(2);
    expect(progress.wateringsCount).toBe(2);
    expect(progress.wishesCount).toBe(2);
    expect(progress.wishesDoneCount).toBe(1);
    expect(progress.xp).toBe(65);
    expect(progress.stage).toBe(3);
    expect(progress.wateredToday).toBe(true);
    expect(progress.streakDays).toBe(2); // 24 & 25, continuing across midnight to 26
  });

  it("maps exact XP stage thresholds 0-19, 20-59, 60-129, 130-219, 220+", () => {
    expect(getTreeStageForXp(0)).toBe(1);
    expect(getTreeStageForXp(19)).toBe(1);
    expect(getTreeStageForXp(20)).toBe(2);
    expect(getTreeStageForXp(59)).toBe(2);
    expect(getTreeStageForXp(60)).toBe(3);
    expect(getTreeStageForXp(129)).toBe(3);
    expect(getTreeStageForXp(130)).toBe(4);
    expect(getTreeStageForXp(219)).toBe(4);
    expect(getTreeStageForXp(220)).toBe(5);
    expect(getTreeStageForXp(500)).toBe(5);
  });

  it("computes consecutive streak correctly across midnight and gaps", () => {
    expect(
      computeStreakDays(["2026-11-24", "2026-11-25", "2026-11-26"], "2026-11-26"),
    ).toBe(3);
    // Yesterday active, today not yet written -> streak remains alive across midnight
    expect(
      computeStreakDays(["2026-11-24", "2026-11-25"], "2026-11-26"),
    ).toBe(2);
    // Missed yesterday -> streak resets
    expect(
      computeStreakDays(["2026-11-23", "2026-11-24"], "2026-11-26"),
    ).toBe(0);
  });

  it("enforces at most 1 watering record w-YYYY-MM-DD per day", async () => {
    const first = await recordWateringForDate("2026-11-26", db);
    expect(first.created).toBe(true);
    expect(first.record.id).toBe("w-2026-11-26");

    const duplicate = await recordWateringForDate("2026-11-26", db);
    expect(duplicate.created).toBe(false);
    expect(duplicate.record.id).toBe("w-2026-11-26");
  });
});
