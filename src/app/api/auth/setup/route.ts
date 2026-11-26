import { NextRequest, NextResponse } from "next/server";
import { getDriveStorage } from "@/lib/server/drive";
import { createEmptyIndex, INDEX_FILE_NAME } from "@/lib/server/index-store";
import { VAULT_FILE_NAME } from "@/lib/server/rate-limit";
import { attachSessionCookie } from "@/lib/server/session";
import type { VaultDocument } from "@/types/models";

export const runtime = "nodejs";

function isValidVaultStructure(vault: unknown): vault is VaultDocument {
  if (!vault || typeof vault !== "object") return false;
  const v = vault as VaultDocument;
  return (
    v.schemaVersion === 2 &&
    v.kdf?.alg === "PBKDF2-SHA256" &&
    v.kdf?.iterations === 600000 &&
    Boolean(v.password?.verifier) &&
    Boolean(v.password?.saltKek) &&
    Boolean(v.password?.saltVerifier) &&
    Boolean(v.password?.wrappedDek?.ct) &&
    Boolean(v.recovery?.verifier) &&
    Boolean(v.recovery?.saltKek) &&
    Boolean(v.recovery?.saltVerifier) &&
    Boolean(v.recovery?.wrappedDek?.ct)
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { vault?: unknown };
    if (!isValidVaultStructure(body.vault)) {
      return NextResponse.json(
        { error: "Dữ liệu vault không hợp lệ." },
        { status: 400 },
      );
    }

    const drive = getDriveStorage();
    const existing = await drive.readJson<VaultDocument>(VAULT_FILE_NAME);
    if (existing) {
      return NextResponse.json(
        { error: "Sổ đồng bộ đã được thiết lập trước đó." },
        { status: 409 },
      );
    }

    const cleanVault: VaultDocument = {
      ...body.vault,
      rateLimit: {
        passwordFailedCount: 0,
        passwordLockoutUntil: 0,
        recoveryFailedCount: 0,
        recoveryLockoutUntil: 0,
      },
    };
    await drive.writeJson(VAULT_FILE_NAME, cleanVault);
    const existingIndex = await drive.readJson(INDEX_FILE_NAME);
    if (!existingIndex) {
      await drive.writeJson(INDEX_FILE_NAME, createEmptyIndex());
    }

    const response = NextResponse.json({ ok: true }, { status: 201 });
    return attachSessionCookie(response);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Không thiết lập được kho đồng bộ.",
      },
      { status: 500 },
    );
  }
}
