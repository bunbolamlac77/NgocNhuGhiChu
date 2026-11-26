const BASE62_ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function randomBase62(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const byte of bytes) {
    const idx = byte % BASE62_ALPHABET.length;
    out += BASE62_ALPHABET.charAt(idx);
  }
  return out;
}

export function createId(prefix?: string): string {
  const cleanPrefix = prefix
    ? prefix.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 12)
    : "";
  const randomLen = cleanPrefix ? 16 : 21;
  return cleanPrefix ? `${cleanPrefix}_${randomBase62(randomLen)}` : randomBase62(randomLen);
}

export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createWateringId(localDate: string = getLocalDateString()): string {
  return `w-${localDate}`;
}
