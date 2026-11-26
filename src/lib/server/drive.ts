import fs from "node:fs/promises";
import path from "node:path";
import { getServerEnv } from "./env";
import { NeonStorageClient } from "./neon-storage";

const ALLOWED_DRIVE_PATH_REGEX =
  /^(vault\.json|index\.json|notes\/[a-zA-Z0-9_-]{8,64}\.json|drawings\/[a-zA-Z0-9_-]{8,64}\.(webp|png|enc)|stickers\/[a-zA-Z0-9_-]{8,64}\.(webp|png))$/;

export function assertValidDriveFileName(fileName: string): string {
  if (!ALLOWED_DRIVE_PATH_REGEX.test(fileName)) {
    throw new Error(`Tên tệp Drive không hợp lệ: ${fileName}`);
  }
  return fileName;
}

export interface DriveStorage {
  readBytes(fileName: string): Promise<Uint8Array | null>;
  writeBytes(
    fileName: string,
    bytes: Uint8Array,
    mimeType: string,
  ): Promise<void>;
  readJson<T>(fileName: string): Promise<T | null>;
  writeJson<T>(fileName: string, data: T): Promise<void>;
  deleteFile(fileName: string): Promise<void>;
  listFiles(prefix?: string): Promise<string[]>;
}

export interface GoogleDriveClientConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  folderId: string;
  fetchImpl?: typeof fetch;
  nowFn?: () => number;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

export class GoogleDriveClient implements DriveStorage {
  private readonly cfg: Required<
    Pick<
      GoogleDriveClientConfig,
      "clientId" | "clientSecret" | "refreshToken" | "folderId"
    >
  >;
  private readonly fetchImpl: typeof fetch;
  private readonly nowFn: () => number;
  private tokenCache: CachedToken | null = null;
  private fileIdCache = new Map<string, string>();

  constructor(config: GoogleDriveClientConfig) {
    this.cfg = {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      refreshToken: config.refreshToken,
      folderId: config.folderId,
    };
    this.fetchImpl = config.fetchImpl ?? fetch;
    this.nowFn = config.nowFn ?? Date.now;
  }

  async getAccessToken(): Promise<string> {
    const now = this.nowFn();
    if (this.tokenCache && now < this.tokenCache.expiresAt - 60_000) {
      return this.tokenCache.accessToken;
    }

    const res = await this.fetchImpl("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.cfg.clientId,
        client_secret: this.cfg.clientSecret,
        refresh_token: this.cfg.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!res.ok) {
      throw new Error(`Làm mới Google OAuth token thất bại (${res.status}).`);
    }

    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    if (!data.access_token) {
      throw new Error("Google OAuth không trả về access_token.");
    }

    const expiresInSec = data.expires_in ?? 3600;
    this.tokenCache = {
      accessToken: data.access_token,
      expiresAt: now + expiresInSec * 1000,
    };
    return data.access_token;
  }

  private async resolveFileId(fileName: string): Promise<string | null> {
    const safeName = assertValidDriveFileName(fileName);
    const cached = this.fileIdCache.get(safeName);
    if (cached) return cached;

    const token = await this.getAccessToken();
    const query = `name = '${safeName}' and '${this.cfg.folderId}' in parents and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&pageSize=1`;

    const res = await this.fetchImpl(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(`Không tìm được tệp Drive (${res.status}).`);
    }

    const json = (await res.json()) as { files?: Array<{ id: string; name: string }> };
    const found = json.files?.[0];
    if (!found) return null;
    this.fileIdCache.set(safeName, found.id);
    return found.id;
  }

  async listFiles(prefix = ""): Promise<string[]> {
    const token = await this.getAccessToken();
    const query = `'${this.cfg.folderId}' in parents and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&pageSize=1000`;
    const res = await this.fetchImpl(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(`Không liệt kê được tệp Drive (${res.status}).`);
    }
    const json = (await res.json()) as {
      files?: Array<{ id: string; name: string }>;
    };
    const names: string[] = [];
    for (const f of json.files ?? []) {
      this.fileIdCache.set(f.name, f.id);
      if (!prefix || f.name.startsWith(prefix)) {
        names.push(f.name);
      }
    }
    return names;
  }

  async readBytes(fileName: string): Promise<Uint8Array | null> {
    const fileId = await this.resolveFileId(fileName);
    if (!fileId) return null;

    const token = await this.getAccessToken();
    const res = await this.fetchImpl(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (res.status === 404) {
      this.fileIdCache.delete(fileName);
      return null;
    }
    if (!res.ok) {
      throw new Error(`Không tải được tệp Drive (${res.status}).`);
    }
    return new Uint8Array(await res.arrayBuffer());
  }

  async writeBytes(
    fileName: string,
    bytes: Uint8Array,
    mimeType: string,
  ): Promise<void> {
    const safeName = assertValidDriveFileName(fileName);
    const token = await this.getAccessToken();
    const existingId = await this.resolveFileId(safeName);
    const copyBuf = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(copyBuf).set(bytes);

    if (existingId) {
      const res = await this.fetchImpl(
        `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(existingId)}?uploadType=media`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": mimeType,
          },
          body: new Blob([copyBuf], { type: mimeType }),
        },
      );
      if (!res.ok) {
        throw new Error(`Không cập nhật được tệp Drive (${res.status}).`);
      }
      return;
    }

    const boundary = `ngocnhu_${Date.now().toString(36)}`;
    const metadata = JSON.stringify({
      name: safeName,
      parents: [this.cfg.folderId],
    });
    const encoder = new TextEncoder();
    const part1 = encoder.encode(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
        `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
    );
    const part3 = encoder.encode(`\r\n--${boundary}--`);
    const bodyBuf = new ArrayBuffer(
      part1.byteLength + bytes.byteLength + part3.byteLength,
    );
    const bodyArr = new Uint8Array(bodyBuf);
    bodyArr.set(part1, 0);
    bodyArr.set(bytes, part1.byteLength);
    bodyArr.set(part3, part1.byteLength + bytes.byteLength);

    const res = await this.fetchImpl(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: new Blob([bodyBuf]),
      },
    );

    if (!res.ok) {
      throw new Error(`Không tạo được tệp Drive (${res.status}).`);
    }
    const created = (await res.json()) as { id?: string };
    if (created.id) {
      this.fileIdCache.set(safeName, created.id);
    }
  }

  async readJson<T>(fileName: string): Promise<T | null> {
    const bytes = await this.readBytes(fileName);
    if (!bytes) return null;
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  }

  async writeJson<T>(fileName: string, data: T): Promise<void> {
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    await this.writeBytes(fileName, encoded, "application/json");
  }

  async deleteFile(fileName: string): Promise<void> {
    const fileId = await this.resolveFileId(fileName);
    if (!fileId) return;
    const token = await this.getAccessToken();
    const res = await this.fetchImpl(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    this.fileIdCache.delete(fileName);
    if (!res.ok && res.status !== 404) {
      throw new Error(`Không xóa được tệp Drive (${res.status}).`);
    }
  }
}

export class LocalFsDriveClient implements DriveStorage {
  constructor(private readonly rootDir: string) {}

  private resolveSafePath(fileName: string): string {
    const safeName = assertValidDriveFileName(fileName);
    const full = path.resolve(this.rootDir, safeName);
    const root = path.resolve(this.rootDir);
    if (!full.startsWith(root + path.sep)) {
      throw new Error("Đường dẫn tệp vượt phạm vi cho phép.");
    }
    return full;
  }

  async readBytes(fileName: string): Promise<Uint8Array | null> {
    try {
      const full = this.resolveSafePath(fileName);
      const buf = await fs.readFile(full);
      return new Uint8Array(buf);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw err;
    }
  }

  async writeBytes(fileName: string, bytes: Uint8Array): Promise<void> {
    const full = this.resolveSafePath(fileName);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, bytes);
  }

  async readJson<T>(fileName: string): Promise<T | null> {
    const bytes = await this.readBytes(fileName);
    if (!bytes) return null;
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  }

  async writeJson<T>(fileName: string, data: T): Promise<void> {
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    await this.writeBytes(fileName, encoded);
  }

  async deleteFile(fileName: string): Promise<void> {
    const full = this.resolveSafePath(fileName);
    try {
      await fs.unlink(full);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
    }
  }

  async listFiles(prefix = ""): Promise<string[]> {
    const out: string[] = [];
    const root = path.resolve(this.rootDir);

    async function walk(dir: string, relBase: string) {
      let entries;
      try {
        entries = await fs.readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        const rel = relBase ? `${relBase}/${entry.name}` : entry.name;
        const abs = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(abs, rel);
        } else if (!prefix || rel.startsWith(prefix)) {
          out.push(rel);
        }
      }
    }

    await walk(root, "");
    return out;
  }
}

let cachedClient: DriveStorage | null = null;
let cachedEnvSignature = "";

export function getDriveStorage(): DriveStorage {
  const env = getServerEnv();
  const sig =
    env.mode === "local-test"
      ? `local:${env.testDriveDir}`
      : env.mode === "neon"
        ? `neon:${env.databaseUrl}`
        : `google:${env.googleDriveFolderId}:${env.googleClientId}`;

  if (cachedClient && cachedEnvSignature === sig) {
    return cachedClient;
  }

  if (env.mode === "local-test" && env.testDriveDir) {
    cachedClient = new LocalFsDriveClient(env.testDriveDir);
  } else if (env.mode === "neon" && env.databaseUrl) {
    cachedClient = new NeonStorageClient(env.databaseUrl);
  } else {
    cachedClient = new GoogleDriveClient({
      clientId: env.googleClientId!,
      clientSecret: env.googleClientSecret!,
      refreshToken: env.googleRefreshToken!,
      folderId: env.googleDriveFolderId!,
    });
  }
  cachedEnvSignature = sig;
  return cachedClient;
}
