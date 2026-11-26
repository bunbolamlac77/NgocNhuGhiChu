// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { getServerEnv } from "@/lib/server/env";
import { NeonStorageClient, type NeonSqlRunner } from "@/lib/server/neon-storage";

function createInMemoryNeonRunner() {
  const rows = new Map<
    string,
    { mime_type: string; content_base64: string; updated_at: number }
  >();
  let ddlCalls = 0;

  const runner: NeonSqlRunner = async (strings, ...values) => {
    const query = strings.join("?").replace(/\s+/g, " ").trim();

    if (query.startsWith("CREATE TABLE IF NOT EXISTS ngocnhu_storage_objects")) {
      ddlCalls += 1;
      return [];
    }

    if (query.startsWith("SELECT content_base64 FROM ngocnhu_storage_objects")) {
      const targetPath = String(values[0]);
      const found = rows.get(targetPath);
      return found ? [{ content_base64: found.content_base64 }] : [];
    }

    if (query.startsWith("INSERT INTO ngocnhu_storage_objects")) {
      const path = String(values[0]);
      const mimeType = String(values[1]);
      const contentBase64 = String(values[2]);
      const updatedAt = Number(values[3]);
      rows.set(path, {
        mime_type: mimeType,
        content_base64: contentBase64,
        updated_at: updatedAt,
      });
      return [];
    }

    if (query.startsWith("DELETE FROM ngocnhu_storage_objects")) {
      const targetPath = String(values[0]);
      rows.delete(targetPath);
      return [];
    }

    if (query.startsWith("SELECT path FROM ngocnhu_storage_objects")) {
      const prefixPattern = values[0] ? String(values[0]) : "";
      const prefix = prefixPattern.endsWith("%")
        ? prefixPattern.slice(0, -1).replace(/\\([%_\\])/g, "$1")
        : prefixPattern;
      return Array.from(rows.keys())
        .filter((k) => !prefix || k.startsWith(prefix))
        .sort()
        .map((path) => ({ path }));
    }

    throw new Error(`Unexpected SQL in mock: ${query}`);
  };

  return { runner, getDdlCalls: () => ddlCalls };
}

describe("NeonStorageClient & Env Selection", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("ensures schema once, reads/writes JSON & binary blobs, lists by prefix, deletes, and rejects invalid paths", async () => {
    const { runner, getDdlCalls } = createInMemoryNeonRunner();
    const client = new NeonStorageClient(
      "postgresql://user:pw@ep-test.neon.tech/neondb?sslmode=require",
      runner,
    );

    expect(await client.readJson("index.json")).toBeNull();
    await client.writeJson("index.json", { schemaVersion: 2, notes: { a: 1 } });
    await client.writeJson("notes/note_12345678.json", { title: "Xin chao" });
    await client.writeBytes(
      "drawings/drw_12345678.enc",
      new Uint8Array([1, 2, 3, 4]),
      "application/octet-stream",
    );

    // Schema initialization runs only once per client instance
    expect(getDdlCalls()).toBe(1);

    expect(await client.readJson("notes/note_12345678.json")).toEqual({
      title: "Xin chao",
    });
    const bin = await client.readBytes("drawings/drw_12345678.enc");
    expect(bin ? Array.from(bin) : []).toEqual([1, 2, 3, 4]);

    expect(await client.listFiles("notes/")).toEqual(["notes/note_12345678.json"]);
    expect(await client.listFiles()).toEqual([
      "drawings/drw_12345678.enc",
      "index.json",
      "notes/note_12345678.json",
    ]);

    await client.deleteFile("notes/note_12345678.json");
    expect(await client.readJson("notes/note_12345678.json")).toBeNull();

    await expect(client.readBytes("../etc/passwd")).rejects.toThrow();
  });

  it("selects neon mode from DATABASE_URL or POSTGRES_URL when local test dir is unset", () => {
    delete process.env.NGOCNHU_TEST_DRIVE_DIR;
    process.env.APP_SESSION_SECRET = "test-only-ngocnhu-session-secret-32b!";
    process.env.DATABASE_URL =
      "postgresql://user:pw@ep-1.neon.tech/neondb?sslmode=require";
    delete process.env.POSTGRES_URL;

    expect(getServerEnv()).toEqual({
      mode: "neon",
      sessionSecret: "test-only-ngocnhu-session-secret-32b!",
      databaseUrl: "postgresql://user:pw@ep-1.neon.tech/neondb?sslmode=require",
    });

    delete process.env.DATABASE_URL;
    process.env.POSTGRES_URL =
      "postgresql://user:pw@ep-2.neon.tech/neondb?sslmode=require";
    expect(getServerEnv().mode).toBe("neon");
    expect(getServerEnv().databaseUrl).toBe(
      "postgresql://user:pw@ep-2.neon.tech/neondb?sslmode=require",
    );
  });
});
