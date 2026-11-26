import type {
  CustomStickerMeta,
  IndexDocument,
  NoteDocument,
  SyncItemKind,
  VaultDocument,
  Watering,
  WishItem,
} from "./models";

export interface AuthStatusResponse {
  initialized: boolean;
  authenticated: boolean;
  passwordSaltVerifier?: string;
  recoverySaltVerifier?: string;
}

export interface AuthSetupRequest {
  vault: VaultDocument;
}

export interface AuthSetupResponse {
  ok: true;
}

export interface AuthUnlockRequest {
  proof: string;
}

export interface AuthUnlockResponse {
  vault: VaultDocument;
}

export interface AuthErrorResponse {
  error: string;
  remainingAttempts?: number;
  lockoutUntil?: number;
}

export interface RecoverVerifyRequest {
  recoveryProof: string;
}

export interface RecoverVerifyResponse {
  recoveryToken: string;
  vault: VaultDocument;
}

export interface RecoverResetRequest {
  recoveryToken: string;
  updatedVault: VaultDocument;
}

export interface UpdateVaultRequest {
  currentProof: string;
  updatedVault: VaultDocument;
}

export interface SyncIndexResponse {
  index: IndexDocument;
}

export interface SyncNoteResponse {
  note: NoteDocument;
}

export type SyncItemPayloadMap = {
  notes: NoteDocument;
  wishes: WishItem;
  waterings: Watering;
  stickers: CustomStickerMeta;
};

export interface SyncPutItemRequest<K extends SyncItemKind = SyncItemKind> {
  item: SyncItemPayloadMap[K];
  baseRev: number;
}

export interface SyncPutItemResponse {
  rev: number;
}

export interface SyncConflictResponse<K extends SyncItemKind = SyncItemKind> {
  error: "CONFLICT";
  remote: SyncItemPayloadMap[K];
}

export interface SyncAssetUploadResponse {
  ok: true;
  sizeBytes: number;
}

export interface SyncPurgeResponse {
  purged: number;
}
