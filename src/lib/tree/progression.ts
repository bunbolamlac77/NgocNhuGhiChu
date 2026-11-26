import { getLocalDateString } from "@/lib/ids";
import { isValidDateTag } from "@/lib/validation";
import type {
  LocalNoteRecord,
  LocalWateringRecord,
  LocalWishRecord,
  TreeProgress,
  TreeStage,
} from "@/types/models";

export interface StageMeta {
  stage: TreeStage;
  label: string;
  minXp: number;
  nextXp: number | null;
}

export const TREE_STAGES: readonly StageMeta[] = [
  { stage: 1, label: "Mầm nhỏ", minXp: 0, nextXp: 20 },
  { stage: 2, label: "Cây non", minXp: 20, nextXp: 60 },
  { stage: 3, label: "Ra nụ", minXp: 60, nextXp: 130 },
  { stage: 4, label: "Nở hoa", minXp: 130, nextXp: 220 },
  { stage: 5, label: "Cây cổ thụ phép màu", minXp: 220, nextXp: null },
];

export const WISH_BRANCH_SLOTS: readonly { x: number; y: number }[] = [
  { x: 96, y: 192 },
  { x: 158, y: 176 },
  { x: 214, y: 178 },
  { x: 264, y: 192 },
  { x: 126, y: 184 },
  { x: 238, y: 184 },
  { x: 184, y: 162 },
  { x: 74, y: 188 },
];

export function getTreeStageForXp(xp: number): TreeStage {
  if (xp >= 220) return 5;
  if (xp >= 130) return 4;
  if (xp >= 60) return 3;
  if (xp >= 20) return 2;
  return 1;
}

export function getStageMeta(stage: TreeStage): StageMeta {
  return TREE_STAGES[stage - 1] ?? TREE_STAGES[0]!;
}

/** Shifts a YYYY-MM-DD calendar string by deltaDays using UTC-noon math cleanly without DST drift. */
export function shiftDateString(dateStr: string, deltaDays: number): string {
  const parts = dateStr.split("-");
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  const utc = Date.UTC(y, m - 1, d + deltaDays);
  const dt = new Date(utc);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function extractWateringDate(wateringId: string): string | null {
  if (!wateringId.startsWith("w-")) return null;
  const datePart = wateringId.slice(2);
  return isValidDateTag(datePart) ? datePart : null;
}

export function extractNoteDate(note: LocalNoteRecord): string {
  if (note.dateTag && isValidDateTag(note.dateTag)) {
    return note.dateTag;
  }
  return getLocalDateString(new Date(note.createdAt));
}

export function computeStreakDays(
  activityDates: Iterable<string>,
  todayLocalDate: string = getLocalDateString(),
): number {
  const activeSet = new Set<string>();
  for (const dateStr of activityDates) {
    if (isValidDateTag(dateStr)) {
      activeSet.add(dateStr);
    }
  }
  if (activeSet.size === 0) return 0;

  let cursor: string;
  if (activeSet.has(todayLocalDate)) {
    cursor = todayLocalDate;
  } else {
    const yesterday = shiftDateString(todayLocalDate, -1);
    if (!activeSet.has(yesterday)) {
      return 0;
    }
    cursor = yesterday;
  }

  let streak = 0;
  while (activeSet.has(cursor)) {
    streak += 1;
    cursor = shiftDateString(cursor, -1);
  }
  return streak;
}

export interface ComputeTreeProgressInput {
  notes: readonly LocalNoteRecord[];
  wishes: readonly LocalWishRecord[];
  waterings: readonly LocalWateringRecord[];
  todayLocalDate?: string;
}

export function computeTreeProgress({
  notes,
  wishes,
  waterings,
  todayLocalDate = getLocalDateString(),
}: ComputeTreeProgressInput): TreeProgress {
  const activeNotes = notes.filter((n) => !n.deleted);
  const activeWishes = wishes.filter((w) => !w.deleted);
  const activeWaterings = waterings.filter((w) => !w.deleted);

  const noteDateSet = new Set<string>();
  for (const note of activeNotes) {
    noteDateSet.add(extractNoteDate(note));
  }

  const wateringDateSet = new Set<string>();
  for (const w of activeWaterings) {
    const datePart = extractWateringDate(w.id);
    if (datePart) {
      wateringDateSet.add(datePart);
    }
  }

  const noteDays = noteDateSet.size;
  const wateringsCount = wateringDateSet.size;
  const wishesCount = activeWishes.length;
  const wishesDoneCount = activeWishes.filter((w) => w.done).length;

  const xp =
    10 * noteDays + 5 * wateringsCount + 5 * wishesCount + 25 * wishesDoneCount;
  const stage = getTreeStageForXp(xp);
  const wateredToday = wateringDateSet.has(todayLocalDate);

  const streakDays = computeStreakDays(noteDateSet, todayLocalDate);

  return {
    xp,
    stage,
    streakDays,
    noteDays,
    wateringsCount,
    wishesCount,
    wishesDoneCount,
    wateredToday,
  };
}
