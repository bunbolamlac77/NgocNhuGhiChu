import { registerOnAppLock } from "@/stores/useAuthStore";
import type { EncryptedEnvelope, NotePayload } from "@/types/models";
import {
  decryptJsonWithAad,
  drawingAad,
  encryptJsonWithAad,
  noteAad,
  openBinaryWithAad,
  sealBinaryWithAad,
} from "./aead";

let sessionDek: CryptoKey | null = null;

registerOnAppLock(() => {
  sessionDek = null;
});

export function getSessionDek(): CryptoKey | null {
  return sessionDek;
}

export function setSessionDek(dek: CryptoKey | null): void {
  sessionDek = dek;
}

export function clearSessionDek(): void {
  sessionDek = null;
}

export function hasSessionDek(): boolean {
  return sessionDek !== null;
}

export async function encryptNotePayload(
  dek: CryptoKey,
  contentId: string,
  payload: NotePayload,
): Promise<EncryptedEnvelope> {
  return encryptJsonWithAad(dek, payload, noteAad(contentId));
}

export async function decryptNotePayload(
  dek: CryptoKey,
  contentId: string,
  envelope: EncryptedEnvelope,
): Promise<NotePayload> {
  return decryptJsonWithAad<NotePayload>(dek, envelope, noteAad(contentId));
}

export async function encryptDrawingBlob(
  dek: CryptoKey,
  drawingId: string,
  plainBlob: Blob,
): Promise<Blob> {
  const arr = await plainBlob.arrayBuffer();
  const buf = new ArrayBuffer(arr.byteLength);
  new Uint8Array(buf).set(new Uint8Array(arr));
  const sealed = await sealBinaryWithAad(
    dek,
    new Uint8Array(buf),
    drawingAad(drawingId),
  );
  return new Blob([sealed], { type: "application/octet-stream" });
}

export async function decryptDrawingBlob(
  dek: CryptoKey,
  drawingId: string,
  encryptedBlob: Blob,
  mime: "image/webp" | "image/png" = "image/webp",
): Promise<Blob> {
  const arr = await encryptedBlob.arrayBuffer();
  const buf = new ArrayBuffer(arr.byteLength);
  new Uint8Array(buf).set(new Uint8Array(arr));
  const plain = await openBinaryWithAad(
    dek,
    new Uint8Array(buf),
    drawingAad(drawingId),
  );
  return new Blob([plain], { type: mime });
}
