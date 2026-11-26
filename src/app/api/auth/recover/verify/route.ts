import { NextRequest, NextResponse } from "next/server";
import { getDriveStorage } from "@/lib/server/drive";
import {
  isRateLimited,
  recordAuthFailure,
  resetAuthFailures,
  VAULT_FILE_NAME,
} from "@/lib/server/rate-limit";
import { signRecoveryToken, verifyProofTimingSafe } from "@/lib/server/session";
import type { VaultDocument } from "@/types/models";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { recoveryProof?: unknown };
    if (typeof body.recoveryProof !== "string" || !body.recoveryProof) {
      return NextResponse.json(
        { error: "Thiếu bằng chứng mã khôi phục." },
        { status: 400 },
      );
    }

    const drive = getDriveStorage();
    const vault = await drive.readJson<VaultDocument>(VAULT_FILE_NAME);
    if (!vault) {
      return NextResponse.json(
        { error: "Chưa khởi tạo vault đồng bộ." },
        { status: 404 },
      );
    }

    const limit = isRateLimited(vault, "recovery");
    if (limit.limited) {
      return NextResponse.json(
        {
          error: "Thử sai mã khôi phục quá 5 lần. Tạm khóa 15 phút.",
          lockoutUntil: limit.lockoutUntil,
        },
        { status: 429 },
      );
    }

    const matched = verifyProofTimingSafe(
      body.recoveryProof,
      vault.recovery.verifier,
    );
    if (!matched) {
      const failRes = await recordAuthFailure(drive, vault, "recovery");
      if (failRes.locked) {
        return NextResponse.json(
          {
            error: "Sai mã khôi phục 5 lần. Tạm khóa 15 phút.",
            lockoutUntil: failRes.lockoutUntil,
          },
          { status: 429 },
        );
      }
      return NextResponse.json(
        {
          error: "Mã khôi phục chưa khớp.",
          remainingAttempts: failRes.remainingAttempts,
        },
        { status: 401 },
      );
    }

    const cleanVault = await resetAuthFailures(drive, vault, "recovery");
    const recoveryToken = await signRecoveryToken();
    return NextResponse.json(
      { recoveryToken, vault: cleanVault },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Lỗi kiểm tra mã khôi phục.",
      },
      { status: 500 },
    );
  }
}
