import { neon } from "@neondatabase/serverless";
import { assertValidDriveFileName, type DriveStorage } from "./drive";

export type NeonSqlRunner = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<Array<Record<string, unknown>>>;

function escapeLikePrefix(prefix: string): string {
  return prefix.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

export class NeonStorageClient implements DriveStorage {
  private sqlRunner: NeonSqlRunner | null;
  private schemaReady: Promise<void> | null = null;

  constructor(
    private readonly databaseUrl: string,
    customSqlRunner?: NeonSqlRunner,
  ) {
    this.sqlRunner = customSqlRunner ?? null;
  }

  private getSql(): NeonSqlRunner {
    if (!this.sqlRunner) {
      this.sqlRunner = neon(this.databaseUrl) as unknown as NeonSqlRunner;
    }
    return this.sqlRunner;
  }

  private async ensureSchema(): Promise<void> {
    if (!this.schemaReady) {
      const sql = this.getSql();
      this.schemaReady = sql`
        CREATE TABLE IF NOT EXISTS ngocnhu_storage_objects (
          path TEXT PRIMARY KEY,
          mime_type TEXT NOT NULL,
          content_base64 TEXT NOT NULL,
          updated_at BIGINT NOT NULL
        )
      `.then(() => undefined);
    }
    try {
      await this.schemaReady;
    } catch (err) {
      this.schemaReady = null;
      throw err;
    }
  }

  async readBytes(fileName: string): Promise<Uint8Array | null> {
    const safeName = assertValidDriveFileName(fileName);
    await this.ensureSchema();
    const sql = this.getSql();
    const rows = await sql`
      SELECT content_base64
      FROM ngocnhu_storage_objects
      WHERE path = ${safeName}
      LIMIT 1
    `;
    const encoded = rows[0]?.content_base64;
    if (typeof encoded !== "string") return null;
    return new Uint8Array(Buffer.from(encoded, "base64"));
  }

  async writeBytes(
    fileName: string,
    bytes: Uint8Array,
    mimeType = "application/octet-stream",
  ): Promise<void> {
    const safeName = assertValidDriveFileName(fileName);
    await this.ensureSchema();
    const sql = this.getSql();
    const encoded = Buffer.from(bytes).toString("base64");
    const updatedAt = Date.now();
    await sql`
      INSERT INTO ngocnhu_storage_objects (path, mime_type, content_base64, updated_at)
      VALUES (${safeName}, ${mimeType}, ${encoded}, ${updatedAt})
      ON CONFLICT (path) DO UPDATE SET
        mime_type = EXCLUDED.mime_type,
        content_base64 = EXCLUDED.content_base64,
        updated_at = EXCLUDED.updated_at
    `;
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
    const safeName = assertValidDriveFileName(fileName);
    await this.ensureSchema();
    const sql = this.getSql();
    await sql`DELETE FROM ngocnhu_storage_objects WHERE path = ${safeName}`;
  }

  async listFiles(prefix = ""): Promise<string[]> {
    await this.ensureSchema();
    const sql = this.getSql();
    const rows = prefix
      ? await sql`
          SELECT path
          FROM ngocnhu_storage_objects
          WHERE path LIKE ${escapeLikePrefix(prefix) + "%"} ESCAPE '\\'
          ORDER BY path ASC
        `
      : await sql`
          SELECT path
          FROM ngocnhu_storage_objects
          ORDER BY path ASC
        `;
    return rows
      .map((row) => row.path)
      .filter((p): p is string => typeof p === "string");
  }
}
