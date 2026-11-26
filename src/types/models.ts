export type PaperTemplateId =
  | "sakura-dashed"
  | "piggy-plaid"
  | "cloud-frame"
  | "botanical-garden"
  | "strawberry-stripe"
  | "heart-grid";

export type NoteCategory = "diary" | "checklist" | "draw" | "private";
export type WishCardStyle = "ema" | "heart" | "star" | "lantern";
export type TreeAtmosphere = "auto" | "day" | "sunset" | "night";
export type SyncStatus = "dirty" | "synced";
export type SyncItemKind = "notes" | "wishes" | "waterings" | "stickers";
export type AssetType = "drawings" | "stickers";
export type TreeStage = 1 | 2 | 3 | 4 | 5;

export interface EncryptedEnvelope {
  v: 1;
  alg: "AES-256-GCM";
  iv: string;
  ct: string;
}

export interface SyncMeta {
  id: string;
  rev: number;
  updatedAt: number;
  deleted: boolean;
  deletedAt: number | null;
}

export interface LocalSyncFields {
  baseRev: number;
  syncStatus: SyncStatus;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface PlacedSticker {
  uid: string;
  source: "builtin" | "custom";
  assetId: string;
  xPct: number;
  yPct: number;
  scale: number;
  rotation: number;
  zIndex: number;
}

export interface NotePayload {
  title: string;
  body: string;
  checklist: ChecklistItem[];
  stickers: PlacedSticker[];
  drawingIds: string[];
}

export interface NoteDocument extends SyncMeta {
  contentId: string;
  createdAt: number;
  isLocked: boolean;
  templateId: PaperTemplateId;
  category: NoteCategory;
  dateTag: string | null;
  payload: NotePayload | null;
  encryptedPayload: EncryptedEnvelope | null;
}

export type LocalNoteRecord = NoteDocument & LocalSyncFields;

export interface NoteIndexEntry extends SyncMeta {
  isLocked: boolean;
  templateId: PaperTemplateId;
  category: NoteCategory;
  dateTag: string | null;
  createdAt: number;
  title: string | null;
  snippet: string | null;
}

export interface WishItem extends SyncMeta {
  text: string;
  style: WishCardStyle;
  done: boolean;
  doneAt: number | null;
}

export type LocalWishRecord = WishItem & LocalSyncFields;

export interface Watering extends SyncMeta {
  /** Định dạng cố định w-YYYY-MM-DD */
  id: string;
}

export type LocalWateringRecord = Watering & LocalSyncFields;

export interface CustomStickerMeta extends SyncMeta {
  name: string;
  width: number;
  height: number;
  sizeBytes: number;
  mime: "image/webp" | "image/png";
}

export interface LocalCustomStickerRecord
  extends CustomStickerMeta,
    LocalSyncFields {
  blob: Blob;
}

export interface LocalDrawingRecord {
  id: string;
  noteId: string;
  mime: "image/webp" | "image/png" | "application/octet-stream";
  isEncrypted: boolean;
  sizeBytes: number;
  updatedAt: number;
  blob: Blob;
  syncStatus: SyncStatus;
}

export interface IndexDocument {
  schemaVersion: 2;
  notes: Record<string, NoteIndexEntry>;
  wishes: Record<string, WishItem>;
  waterings: Record<string, Watering>;
  stickers: Record<string, CustomStickerMeta>;
}

export interface VaultSecretSlot {
  saltKek: string;
  saltVerifier: string;
  verifier: string;
  wrappedDek: EncryptedEnvelope;
}

export interface VaultRateLimit {
  passwordFailedCount: number;
  passwordLockoutUntil: number;
  recoveryFailedCount: number;
  recoveryLockoutUntil: number;
}

export interface VaultDocument {
  schemaVersion: 2;
  kdf: {
    alg: "PBKDF2-SHA256";
    iterations: 600000;
  };
  password: VaultSecretSlot;
  recovery: VaultSecretSlot;
  rateLimit: VaultRateLimit;
}

export interface PinLockMeta {
  salt: string;
  hash: string;
  failCount: number;
  lockoutUntil: number;
}

export interface TreeProgress {
  xp: number;
  stage: TreeStage;
  streakDays: number;
  noteDays: number;
  wateringsCount: number;
  wishesCount: number;
  wishesDoneCount: number;
  wateredToday: boolean;
}

export type MetaRecord =
  | { key: "pinLock"; value: PinLockMeta }
  | { key: "vaultSnapshot"; value: VaultDocument }
  | { key: "deviceLinked"; value: boolean }
  | { key: "lastPurgeAt"; value: number }
  | { key: "preferredAtmosphere"; value: TreeAtmosphere };
