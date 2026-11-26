// @vitest-environment node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createVaultAndDek,
  derivePasswordProof,
  deriveRecoveryProof,
  rotateVaultWithPassword,
} from "@/lib/crypto/vault";
import { SESSION_COOKIE_NAME } from "@/lib/server/session";

const cookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieJar.get(name);
      return value ? { name, value } : undefined;
    },
  }),
}));

import { GET as statusGet } from "@/app/api/auth/status/route";
import { POST as setupPost } from "@/app/api/auth/setup/route";
import { POST as unlockPost } from "@/app/api/auth/unlock/route";
import { POST as lockPost } from "@/app/api/auth/lock/route";
import { POST as recoverVerifyPost } from "@/app/api/auth/recover/verify/route";
import { POST as recoverResetPost } from "@/app/api/auth/recover/reset/route";
import { PUT as vaultPut } from "@/app/api/auth/vault/route";

describe("B7 Auth API Routes Integration", () => {
  let driveDir: string;

  beforeEach(() => {
    driveDir = fs.mkdtempSync(path.join(os.tmpdir(), "ngocnhu-auth-api-"));
    process.env.NGOCNHU_TEST_DRIVE_DIR = driveDir;
    process.env.APP_SESSION_SECRET = "test-only-ngocnhu-session-secret-32b!";
    cookieJar.clear();
  });

  afterEach(() => {
    fs.rmSync(driveDir, { recursive: true, force: true });
    delete process.env.NGOCNHU_TEST_DRIVE_DIR;
  });

  function jsonReq(url: string, method: string, body?: unknown): NextRequest {
    return new NextRequest(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  it("handles status, setup (201/409), unlock rate-limit (401/429), lock, vault rotation, and recovery", async () => {
    // 1. Initial status
    const s0 = await statusGet();
    expect(s0.status).toBe(200);
    expect(await s0.json()).toEqual({ initialized: false, authenticated: false });

    // 2. Setup vault once -> 201 + cookie; 2nd setup -> 409
    const { vault, recoveryCode } = await createVaultAndDek("NgocNhuPass2026!", 1000);
    const createdVault = { ...vault, kdf: { alg: "PBKDF2-SHA256" as const, iterations: 600000 as const } };
    const rSetup = await setupPost(
      jsonReq("http://127.0.0.1:3000/api/auth/setup", "POST", { vault: createdVault }),
    );
    expect(rSetup.status).toBe(201);
    const setCookie = rSetup.cookies.get(SESSION_COOKIE_NAME);
    expect(setCookie?.value).toBeTruthy();
    expect(setCookie?.httpOnly).toBe(true);
    expect(setCookie?.secure).toBe(true);
    expect(setCookie?.sameSite).toBe("lax");

    const rDup = await setupPost(
      jsonReq("http://127.0.0.1:3000/api/auth/setup", "POST", { vault: createdVault }),
    );
    expect(rDup.status).toBe(409);

    // 3. Authenticated lock without cookie -> 401; with cookie -> 200 clears cookie
    const rLockNoAuth = await lockPost();
    expect(rLockNoAuth.status).toBe(401);

    cookieJar.set(SESSION_COOKIE_NAME, setCookie!.value);
    const rLockOk = await lockPost();
    expect(rLockOk.status).toBe(200);
    cookieJar.clear();

    // 4. Wrong unlock 4 times -> 401 with remainingAttempts, 5th -> 429 lockoutUntil
    for (let i = 1; i <= 4; i += 1) {
      const bad = await unlockPost(
        jsonReq("http://127.0.0.1:3000/api/auth/unlock", "POST", {
          proof: `wrong-proof-${i}`,
        }),
      );
      expect(bad.status).toBe(401);
      const data = (await bad.json()) as { remainingAttempts: number };
      expect(data.remainingAttempts).toBe(5 - i);
    }

    const rFifth = await unlockPost(
      jsonReq("http://127.0.0.1:3000/api/auth/unlock", "POST", {
        proof: "wrong-proof-5",
      }),
    );
    expect(rFifth.status).toBe(429);

    // 5. Even right proof rejected with 429 during password lockout
    const pwProof = await derivePasswordProof(createdVault, "NgocNhuPass2026!", 1000);
    const rLockedOut = await unlockPost(
      jsonReq("http://127.0.0.1:3000/api/auth/unlock", "POST", { proof: pwProof }),
    );
    expect(rLockedOut.status).toBe(429);

    // 6. Recover via Recovery Code -> verify (200 recoveryToken) & reset (200 + Set-Cookie)
    const recProof = await deriveRecoveryProof(createdVault, recoveryCode, 1000);
    const rRecBad = await recoverVerifyPost(
      jsonReq("http://127.0.0.1:3000/api/auth/recover/verify", "POST", {
        recoveryProof: "wrong",
      }),
    );
    expect(rRecBad.status).toBe(401);

    const rRecOk = await recoverVerifyPost(
      jsonReq("http://127.0.0.1:3000/api/auth/recover/verify", "POST", {
        recoveryProof: recProof,
      }),
    );
    expect(rRecOk.status).toBe(200);
    const recData = (await rRecOk.json()) as { recoveryToken: string };
    expect(recData.recoveryToken).toBeTruthy();

    const rotated = await rotateVaultWithPassword(
      { ...createdVault, kdf: { alg: "PBKDF2-SHA256", iterations: 1000 as 600000 } },
      "NgocNhuPass2026!",
      { newPassword: "NewVaultPass2026!" },
      1000,
    );
    const newVault = {
      ...rotated.updatedVault,
      kdf: { alg: "PBKDF2-SHA256" as const, iterations: 600000 as const },
    };

    const rReset = await recoverResetPost(
      jsonReq("http://127.0.0.1:3000/api/auth/recover/reset", "POST", {
        recoveryToken: recData.recoveryToken,
        updatedVault: newVault,
      }),
    );
    expect(rReset.status).toBe(200);
    const resetCookie = rReset.cookies.get(SESSION_COOKIE_NAME);
    expect(resetCookie?.value).toBeTruthy();
    cookieJar.set(SESSION_COOKIE_NAME, resetCookie!.value);

    // 7. Authenticated PUT /api/auth/vault -> 401 on wrong currentProof, 200 on right proof
    const wrongPut = await vaultPut(
      jsonReq("http://127.0.0.1:3000/api/auth/vault", "PUT", {
        currentProof: "not-valid",
        updatedVault: newVault,
      }),
    );
    expect(wrongPut.status).toBe(401);

    const newProof = await derivePasswordProof(newVault, "NewVaultPass2026!", 1000);
    const okPut = await vaultPut(
      jsonReq("http://127.0.0.1:3000/api/auth/vault", "PUT", {
        currentProof: newProof,
        updatedVault: newVault,
      }),
    );
    expect(okPut.status).toBe(200);
  });
});
