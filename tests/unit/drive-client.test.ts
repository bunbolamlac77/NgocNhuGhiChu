// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { assertValidDriveFileName, GoogleDriveClient } from "@/lib/server/drive";

describe("B7 GoogleDriveClient & Filename Validation", () => {
  it("validates strict allowed Drive paths and rejects traversal", () => {
    expect(assertValidDriveFileName("vault.json")).toBe("vault.json");
    expect(assertValidDriveFileName("index.json")).toBe("index.json");
    expect(assertValidDriveFileName("notes/note_12345678.json")).toBe(
      "notes/note_12345678.json",
    );
    expect(assertValidDriveFileName("drawings/drw_12345678.enc")).toBe(
      "drawings/drw_12345678.enc",
    );
    expect(assertValidDriveFileName("stickers/stk_12345678.webp")).toBe(
      "stickers/stk_12345678.webp",
    );

    expect(() => assertValidDriveFileName("../secrets.json")).toThrow();
    expect(() => assertValidDriveFileName("notes/bad/id.json")).toThrow();
    expect(() => assertValidDriveFileName("notes/short.json")).toThrow();
  });

  it("caches OAuth access tokens, refreshes within 60s of expiry, and handles upload/read/delete", async () => {
    let now = 1_000_000;
    let tokenCalls = 0;

    const mockFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "https://oauth2.googleapis.com/token") {
        tokenCalls += 1;
        return new Response(
          JSON.stringify({
            access_token: `tok_${tokenCalls}`,
            expires_in: 3600,
          }),
          { status: 200 },
        );
      }
      if (url.includes("uploadType=multipart")) {
        return new Response(JSON.stringify({ id: "file_1" }), { status: 200 });
      }
      if (url.includes("uploadType=media") && init?.method === "PATCH") {
        return new Response(JSON.stringify({ id: "file_1" }), { status: 200 });
      }
      if (url.includes("/drive/v3/files?")) {
        return new Response(JSON.stringify({ files: [] }), { status: 200 });
      }
      if (url.includes("/drive/v3/files/file_1?alt=media")) {
        return new Response(JSON.stringify({ hello: "drive" }), { status: 200 });
      }
      if (url.includes("/drive/v3/files/file_1") && init?.method === "DELETE") {
        return new Response(null, { status: 204 });
      }
      return new Response("Not Found", { status: 404 });
    });

    const client = new GoogleDriveClient({
      clientId: "cid",
      clientSecret: "csec",
      refreshToken: "rtok",
      folderId: "fld",
      fetchImpl: mockFetch as unknown as typeof fetch,
      nowFn: () => now,
    });

    // Write new file -> fetches token 1, lists empty, creates file_1 (cached in fileIdCache)
    await client.writeJson("notes/note_abcdefgh.json", { hello: "drive" });
    expect(tokenCalls).toBe(1);

    // Within TTL - 60s -> reuses cached token & cached fileId (PATCH)
    now += 3500 * 1000;
    await client.writeJson("notes/note_abcdefgh.json", { hello: "updated" });
    expect(tokenCalls).toBe(1);

    // Within 60s expiry buffer (3550s elapsed >= 3540s) -> refreshes token 2!
    now += 50 * 1000;
    const read = await client.readJson<{ hello: string }>(
      "notes/note_abcdefgh.json",
    );
    expect(tokenCalls).toBe(2);
    expect(read?.hello).toBe("drive");

    await client.deleteFile("notes/note_abcdefgh.json");
  });
});
