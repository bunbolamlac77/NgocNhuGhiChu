import type {
  AssetType,
  NoteCategory,
  PaperTemplateId,
  PlacedSticker,
  SyncItemKind,
  WishCardStyle,
} from "@/types/models";

export const ID_REGEX = /^[a-zA-Z0-9_-]{8,64}$/;
export const WATERING_ID_REGEX = /^w-(\d{4})-(\d{2})-(\d{2})$/;
export const DATE_TAG_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
export const PIN_REGEX = /^\d{4,6}$/;
export const RECOVERY_CODE_REGEX = /^[A-Z2-7]{32}$/;

export const MAX_NOTE_BYTES = 120 * 1024;
export const MAX_STICKER_UPLOAD_BYTES = 60 * 1024;
export const MAX_STICKER_CLIENT_BYTES = 45 * 1024;
export const MAX_DRAWING_UPLOAD_BYTES = 250 * 1024;
export const MAX_DRAWING_CLIENT_BYTES = 150 * 1024;
export const MAX_STICKERS_PER_NOTE = 20;
export const MAX_WISH_CHARS = 140;
export const MIN_VAULT_PASSWORD_LENGTH = 10;

const VALID_ITEM_KINDS = new Set<SyncItemKind>([
  "notes",
  "wishes",
  "waterings",
  "stickers",
]);
const VALID_ASSET_TYPES = new Set<AssetType>(["drawings", "stickers"]);
const VALID_PAPER_TEMPLATES = new Set<PaperTemplateId>([
  "sakura-dashed",
  "piggy-plaid",
  "cloud-frame",
  "botanical-garden",
  "strawberry-stripe",
  "heart-grid",
]);
const VALID_NOTE_CATEGORIES = new Set<NoteCategory>([
  "diary",
  "checklist",
  "draw",
  "private",
]);
const VALID_WISH_STYLES = new Set<WishCardStyle>([
  "ema",
  "heart",
  "star",
  "lantern",
]);

function isRealCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const probe = new Date(year, month - 1, day);
  return (
    probe.getFullYear() === year &&
    probe.getMonth() === month - 1 &&
    probe.getDate() === day
  );
}

export function isValidId(value: unknown): value is string {
  return typeof value === "string" && ID_REGEX.test(value);
}

export function isValidDateTag(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = DATE_TAG_REGEX.exec(value);
  if (!match) return false;
  return isRealCalendarDate(Number(match[1]), Number(match[2]), Number(match[3]));
}

export function isValidWateringId(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = WATERING_ID_REGEX.exec(value);
  if (!match) return false;
  return isRealCalendarDate(Number(match[1]), Number(match[2]), Number(match[3]));
}

export function isValidSyncItemKind(value: unknown): value is SyncItemKind {
  return typeof value === "string" && VALID_ITEM_KINDS.has(value as SyncItemKind);
}

export function isValidAssetType(value: unknown): value is AssetType {
  return typeof value === "string" && VALID_ASSET_TYPES.has(value as AssetType);
}

export function isValidPaperTemplateId(value: unknown): value is PaperTemplateId {
  return (
    typeof value === "string" &&
    VALID_PAPER_TEMPLATES.has(value as PaperTemplateId)
  );
}

export function isValidNoteCategory(value: unknown): value is NoteCategory {
  return typeof value === "string" && VALID_NOTE_CATEGORIES.has(value as NoteCategory);
}

export function isValidWishCardStyle(value: unknown): value is WishCardStyle {
  return typeof value === "string" && VALID_WISH_STYLES.has(value as WishCardStyle);
}

export function isValidPin(pin: unknown): pin is string {
  return typeof pin === "string" && PIN_REGEX.test(pin);
}

export function validateVaultPassword(
  password: unknown,
): { valid: true } | { valid: false; reason: string } {
  if (typeof password !== "string" || password.length < MIN_VAULT_PASSWORD_LENGTH) {
    return {
      valid: false,
      reason: `Mật khẩu sổ cần ít nhất ${MIN_VAULT_PASSWORD_LENGTH} ký tự.`,
    };
  }
  if (/^\d+$/.test(password)) {
    return {
      valid: false,
      reason: "Mật khẩu sổ không được chỉ gồm toàn chữ số.",
    };
  }
  return { valid: true };
}

export function normalizeRecoveryCode(raw: string): string {
  return raw.toUpperCase().replace(/[\s-]+/g, "");
}

export function isValidRecoveryCode(raw: unknown): boolean {
  if (typeof raw !== "string") return false;
  return RECOVERY_CODE_REGEX.test(normalizeRecoveryCode(raw));
}

export function validateWishText(
  text: unknown,
): { valid: true; normalized: string } | { valid: false; reason: string } {
  if (typeof text !== "string") {
    return { valid: false, reason: "Nội dung điều ước không hợp lệ." };
  }
  const trimmed = text.trim();
  if (!trimmed) {
    return { valid: false, reason: "Hãy viết điều ước trước khi treo lên cây." };
  }
  if ([...trimmed].length > MAX_WISH_CHARS) {
    return {
      valid: false,
      reason: `Điều ước tối đa ${MAX_WISH_CHARS} ký tự.`,
    };
  }
  return { valid: true, normalized: trimmed };
}

export function validatePayloadByteSize(
  payload: string | Uint8Array | ArrayBuffer,
  maxBytes: number,
): boolean {
  if (typeof payload === "string") {
    return new TextEncoder().encode(payload).byteLength <= maxBytes;
  }
  return payload.byteLength <= maxBytes;
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function clampPlacedSticker(sticker: PlacedSticker): PlacedSticker {
  const clampedRot = clamp(sticker.rotation, -180, 180);
  return {
    ...sticker,
    xPct: Math.round(clamp(sticker.xPct, 4, 96) * 10) / 10,
    yPct: Math.round(clamp(sticker.yPct, 4, 96) * 10) / 10,
    scale: Math.round(clamp(sticker.scale, 0.5, 2.2) * 100) / 100,
    rotation: Math.round(clampedRot),
    zIndex: Math.max(0, Math.round(Number.isFinite(sticker.zIndex) ? sticker.zIndex : 0)),
  };
}

const SYSTEM_EMOJI_REGEX =
  /(?:\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]|[#*0-9]\uFE0F?\u20E3)/u;

export function containsSystemEmoji(text: string): boolean {
  return SYSTEM_EMOJI_REGEX.test(text);
}
