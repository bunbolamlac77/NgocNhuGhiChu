import { NextRequest, NextResponse } from "next/server";
import { getDriveStorage } from "@/lib/server/drive";
import {
  isRateLimited,
  recordAuthFailure,
  resetAuthFailures,
  VAULT_FILE_NAME,
} from "@/lib/server/rate-limit";
import { attachSessionCookie, verifyProofTimingSafe } from "@/lib/server/session";
import type { VaultDocument } from "@/types/models";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { proof?: unknown };
    if (typeof body.proof !== "string" || !body.proof) {
      return NextResponse.json(
        { error: "Thiếu bằng chứng mật khẩu sổ." },
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

    const limit = isRateLimited(vault, "password");
    if (limit.limited) {
      return NextResponse.json(
        {
          error: "Thử sai mật khẩu quá 5 lần. Vui lòng đợi hết thời gian khóa.",
          lockoutUntil: limit.lockoutUntil,
        },
        { status: 429 },
      );
    }

    const matched = verifyProofTimingSafe(body.proof, vault.password.verifier);
    if (!matched) {
      const failRes = await recordAuthFailure(drive, vault, "password");
      if (failRes.locked) {
        return NextResponse.json(
          {
            error: "Sai mật khẩu sổ 5 lần. Tạm khóa 5 phút.",
            lockoutUntil: failRes.lockoutUntil,
          },
          { status: 429 },
        );
      }
      return NextResponse.json(
        {
          error: "Sai mật khẩu sổ.",
          remainingAttempts: failRes.remainingAttempts,
        },
        { status: 401 },
      );
    }

    const cleanVault = await resetAuthFailures(drive, vault, "password");
    const response = NextResponse.json({ vault: cleanVault }, { status: 200 });
    return attachSessionCookie(response);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Lỗi xác thực mật khẩu sổ.",
      },
      { status: 500 },
    );
  }
}
