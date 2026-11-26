export const PBKDF2_ITERATIONS = 600_000;

export function generateRandomBytes(length: number): Uint8Array<ArrayBuffer> {
  const buf = new ArrayBuffer(length);
  const bytes = new Uint8Array(buf);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function fromBase64Url(encoded: string): Uint8Array<ArrayBuffer> {
  const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  const buf = new ArrayBuffer(binary.length);
  const out = new Uint8Array(buf);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

export async function sha256Base64Url(
  input: string | Uint8Array<ArrayBuffer>,
): Promise<string> {
  const bytes =
    typeof input === "string"
      ? (new TextEncoder().encode(input) as Uint8Array<ArrayBuffer>)
      : input;
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return toBase64Url(new Uint8Array(digest));
}

async function derivePbkdf2Bits(
  secret: string,
  saltBase64Url: string,
  iterations: number,
  bitLength = 256,
): Promise<ArrayBuffer> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: fromBase64Url(saltBase64Url),
      iterations,
    },
    keyMaterial,
    bitLength,
  );
}

export async function deriveAesKeyFromSecret(
  secret: string,
  saltKekBase64Url: string,
  iterations: number = PBKDF2_ITERATIONS,
): Promise<CryptoKey> {
  const rawBits = await derivePbkdf2Bits(secret, saltKekBase64Url, iterations, 256);
  return crypto.subtle.importKey(
    "raw",
    rawBits,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function deriveProof(
  secret: string,
  saltVerifierBase64Url: string,
  iterations: number = PBKDF2_ITERATIONS,
): Promise<string> {
  const rawBits = await derivePbkdf2Bits(
    secret,
    saltVerifierBase64Url,
    iterations,
    256,
  );
  return toBase64Url(new Uint8Array(rawBits));
}

export async function importAesGcmKey(
  rawBytes: Uint8Array<ArrayBuffer>,
  extractable = false,
): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    rawBytes,
    { name: "AES-GCM" },
    extractable,
    ["encrypt", "decrypt"],
  );
}
