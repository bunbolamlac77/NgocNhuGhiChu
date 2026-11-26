// @vitest-environment node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE_NAME, signSessionToken } from "@/lib/server/session";
import type { NoteDocument } from "@/types/models";

const cookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieJar.get(name);
      return value ? { name, value } : undefined;
    },
  }),
}));

import { GET as indexGet } from "@/app/api/sync/index/route";
import { GET as itemGet, PUT as itemPut } from "@/app/api/sync/items/[kind]/[id]/route";
import {
  DELETE as assetDelete,
  GET as assetGet,
  PUT as assetPut,
} from "@/app/api/sync/assets/[type]/[id]/route";
import { POST as purgePost } from "@/app/api/sync/purge/route";

describe("B7 Sync API Routes Integration", () => {
  let driveDir: string;

  beforeEach(async () => {
    driveDir = fs.mkdtempSync(path.join(os.tmpdir(), "ngocnhu-sync-api-"));
    process.env.NGOCNHU_TEST_DRIVE_DIR = driveDir;
    process.env.APP_SESSION_SECRET = "test-only-ngocnhu-session-secret-32b!";
    cookieJar.clear();
  });

  afterEach(() => {
    fs.rmSync(driveDir, { recursive: true, force: true });
    delete process.env.NGOCNHU_TEST_DRIVE_DIR;
  });

  async function authenticate() {
    const token = await signSessionToken();
    cookieJar.set(SESSION_COOKIE_NAME, token);
  }

  function makeNote(id: string, title: string, deletedAt: number | null = null): NoteDocument {
    return {
      id,
      contentId: `cnt_${id}`,
      rev: 0,
      updatedAt: Date.now(),
      createdAt: Date.now(),
      deleted: deletedAt !== null,
      deletedAt,
      isLocked: false,
      templateId: "sakura-dashed",
      category: "diary",
      dateTag: "2026-11-26",
      payload: {
        title,
        body: "Noi dung dong bo",
        checklist: [],
        stickers: [],
        drawingIds: ["drw_11111111"],
      },
      encryptedPayload: null,
    };
  }

  it("enforces auth 401, ID 400, size cap 413, rev conflict 409, assets, and >30d purge", async () => {
    // 1. Unauthenticated -> 401
    expect((await indexGet()).status).toBe(401);

    await authenticate();

    // 2. Invalid ID -> 400
    const badPut = await itemPut(
      new NextRequest("http://127.0.0.1:3000/api/sync/items/notes/bad", {
        method: "PUT",
        body: JSON.stringify({ item: {}, baseRev: 0 }),
      }),
      { params: Promise.resolve({ kind: "notes", id: "bad" }) },
    );
    expect(badPut.status).toBe(400);

    // 3. Oversized note > 120 KB -> 413
    const hugeNote = makeNote("note_huge1234", "Big");
    hugeNote.payload!.body = "x".repeat(130 * 1024);
    const overPut = await itemPut(
      new NextRequest("http://127.0.0.1:3000/api/sync/items/notes/note_huge1234", {
        method: "PUT",
        body: JSON.stringify({ item: hugeNote, baseRev: 0 }),
      }),
      { params: Promise.resolve({ kind: "notes", id: "note_huge1234" }) },
    );
    expect(overPut.status).toBe(413);

    // 4. Create note rev=1 -> stale baseRev=0 triggers 409 conflict with remote note
    const note = makeNote("note_11111111", "Ghi chú v1");
    const put1 = await itemPut(
      new NextRequest("http://127.0.0.1:3000/api/sync/items/notes/note_11111111", {
        method: "PUT",
        body: JSON.stringify({ item: note, baseRev: 0 }),
      }),
      { params: Promise.resolve({ kind: "notes", id: "note_11111111" }) },
    );
    expect(put1.status).toBe(200);
    expect(await put1.json()).toEqual({ rev: 1 });

    const stalePut = await itemPut(
      new NextRequest("http://127.0.0.1:3000/api/sync/items/notes/note_11111111", {
        method: "PUT",
        body: JSON.stringify({ item: note, baseRev: 0 }),
      }),
      { params: Promise.resolve({ kind: "notes", id: "note_11111111" }) },
    );
    expect(stalePut.status).toBe(409);
    const conflictData = (await stalePut.json()) as {
      error: string;
      remote: NoteDocument;
    };
    expect(conflictData.error).toBe("CONFLICT");
    expect(conflictData.remote.rev).toBe(1);

    const fetched = await itemGet(
      new NextRequest("http://127.0.0.1:3000/api/sync/items/notes/note_11111111"),
      { params: Promise.resolve({ kind: "notes", id: "note_11111111" }) },
    );
    expect(fetched.status).toBe(200);

    // 5. Asset upload cap (413 if sticker > 60 KB), PUT/GET/DELETE & encrypted drawing
    const bigSticker = new Uint8Array(65 * 1024);
    const overStk = await assetPut(
      new NextRequest("http://127.0.0.1:3000/api/sync/assets/stickers/stk_11111111", {
        method: "PUT",
        headers: { "Content-Type": "image/webp" },
        body: bigSticker,
      }),
      { params: Promise.resolve({ type: "stickers", id: "stk_11111111" }) },
    );
    expect(overStk.status).toBe(413);

    const encDrw = new Uint8Array([1, 2, 3, 4, 5, 6]);
    const putDrw = await assetPut(
      new NextRequest("http://127.0.0.1:3000/api/sync/assets/drawings/drw_11111111", {
        method: "PUT",
        headers: {
          "Content-Type": "application/octet-stream",
          "x-ngocnhu-encrypted": "1",
        },
        body: encDrw,
      }),
      { params: Promise.resolve({ type: "drawings", id: "drw_11111111" }) },
    );
    expect(putDrw.status).toBe(200);

    const getDrw = await assetGet(
      new NextRequest("http://127.0.0.1:3000/api/sync/assets/drawings/drw_11111111"),
      { params: Promise.resolve({ type: "drawings", id: "drw_11111111" }) },
    );
    expect(getDrw.status).toBe(200);
    expect(getDrw.headers.get("Cache-Control")).toContain("private");

    // 6. Soft-delete note > 30 days ago and verify purge deletes note + associated drawing
    const oldDeletedAt = Date.now() - 35 * 24 * 60 * 60 * 1000;
    const oldNote = makeNote("note_11111111", "Old deleted", oldDeletedAt);
    await itemPut(
      new NextRequest("http://127.0.0.1:3000/api/sync/items/notes/note_11111111", {
        method: "PUT",
        body: JSON.stringify({ item: oldNote, baseRev: 1 }),
      }),
      { params: Promise.resolve({ kind: "notes", id: "note_11111111" }) },
    );

    const purgeRes = await purgePost();
    expect(purgeRes.status).toBe(200);
    expect(await purgeRes.json()).toEqual({ purged: 1 });

    // Associated drawing was also removed
    const missingDrw = await assetGet(
      new NextRequest("http://127.0.0.1:3000/api/sync/assets/drawings/drw_11111111"),
      { params: Promise.resolve({ type: "drawings", id: "drw_11111111" }) },
    );
    expect(missingDrw.status).toBe(404);

    // Delete endpoint check
    const delRes = await assetDelete(
      new NextRequest("http://127.0.0.1:3000/api/sync/assets/drawings/drw_11111111", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ type: "drawings", id: "drw_11111111" }) },
    );
    expect(delRes.status).toBe(200);
  });
});
