import type { EncryptedEnvelope } from "@/types/models";
import { fromBase64Url, generateRandomBytes, toBase64Url } from "./kdf";

export const AAD_VAULT_WRAP = "ngocnhu:v2:vault-wrap";

export function noteAad(contentId: string): string {
  return `ngocnhu:v2:note:${contentId}`;
}

export function drawingAad(drawingId: string): string {
  return `ngocnhu:v2:drawing:${drawingId}`;
}

function encodeAad(aad: string): Uint8Array<ArrayBuffer> {
  const encoded = new TextEncoder().encode(aad);
  const buf = new ArrayBuffer(encoded.byteLength);
  const out = new Uint8Array(buf);
  out.set(encoded);
  return out;
}

export async function encryptBytesWithAad(
  key: CryptoKey,
  plaintext: Uint8Array<ArrayBuffer>,
  aad: string,
): Promise<EncryptedEnvelope> {
  const iv = generateRandomBytes(12);
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: encodeAad(aad),
    },
    key,
    plaintext,
  );
  return {
    v: 1,
    alg: "AES-256-GCM",
    iv: toBase64Url(iv),
    ct: toBase64Url(new Uint8Array(encrypted)),
  };
}

export async function decryptBytesWithAad(
  key: CryptoKey,
  envelope: EncryptedEnvelope,
  aad: string,
): Promise<Uint8Array<ArrayBuffer>> {
  if (envelope.v !== 1 || envelope.alg !== "AES-256-GCM") {
    throw new Error("Định dạng dữ liệu mã hóa không được hỗ trợ.");
  }
  const iv = fromBase64Url(envelope.iv);
  const ct = fromBase64Url(envelope.ct);
  const plainBuf = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: encodeAad(aad),
    },
    key,
    ct,
  );
  return new Uint8Array(plainBuf);
}

export async function encryptJsonWithAad<T>(
  key: CryptoKey,
  data: T,
  aad: string,
): Promise<EncryptedEnvelope> {
  const jsonBytes = new TextEncoder().encode(JSON.stringify(data));
  const buf = new ArrayBuffer(jsonBytes.byteLength);
  const out = new Uint8Array(buf);
  out.set(jsonBytes);
  return encryptBytesWithAad(key, out, aad);
}

export async function decryptJsonWithAad<T>(
  key: CryptoKey,
  envelope: EncryptedEnvelope,
  aad: string,
): Promise<T> {
  const plainBytes = await decryptBytesWithAad(key, envelope, aad);
  const jsonText = new TextDecoder().decode(plainBytes);
  return JSON.parse(jsonText) as T;
}

export async function sealBinaryWithAad(
  key: CryptoKey,
  plainBytes: Uint8Array<ArrayBuffer>,
  aad: string,
): Promise<Uint8Array<ArrayBuffer>> {
  const iv = generateRandomBytes(12);
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: encodeAad(aad),
    },
    key,
    plainBytes,
  );
  const ct = new Uint8Array(encrypted);
  const packedBuf = new ArrayBuffer(1 + 12 + ct.byteLength);
  const packed = new Uint8Array(packedBuf);
  packed[0] = 1;
  packed.set(iv, 1);
  packed.set(ct, 13);
  return packed;
}

export async function openBinaryWithAad(
  key: CryptoKey,
  sealedBytes: Uint8Array<ArrayBuffer>,
  aad: string,
): Promise<Uint8Array<ArrayBuffer>> {
  if (sealedBytes.byteLength < 14 || sealedBytes[0] !== 1) {
    throw new Error("Tệp mã hóa không đúng định dạng v1.");
  }
  const iv = new Uint8Array(sealedBytes.slice(1, 13).buffer);
  const ct = new Uint8Array(sealedBytes.slice(13).buffer);
  const plainBuf = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: encodeAad(aad),
    },
    key,
    ct,
  );
  return new Uint8Array(plainBuf);
}
