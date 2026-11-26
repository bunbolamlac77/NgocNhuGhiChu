import { NextRequest, NextResponse } from "next/server";
import { getDriveStorage } from "@/lib/server/drive";
import { VAULT_FILE_NAME } from "@/lib/server/rate-limit";
import { attachSessionCookie, verifyRecoveryToken } from "@/lib/server/session";
import type { VaultDocument } from "@/types/models";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      recoveryToken?: unknown;
      updatedVault?: unknown;
    };
    if (
      typeof body.recoveryToken !== "string" ||
      !(await verifyRecoveryToken(body.recoveryToken))
    ) {
      return NextResponse.json(
        { error: "Phiên khôi phục đã hết hạn hoặc không hợp lệ." },
        { status: 401 },
      );
    }

    const updated = body.updatedVault as VaultDocument | undefined;
    if (
      !updated ||
      updated.schemaVersion !== 2 ||
      !updated.password?.verifier ||
      !updated.recovery?.verifier
    ) {
      return NextResponse.json(
        { error: "Vault cập nhật không hợp lệ." },
        { status: 400 },
      );
    }

    const drive = getDriveStorage();
    const cleanVault: VaultDocument = {
      ...updated,
      rateLimit: {
        passwordFailedCount: 0,
        passwordLockoutUntil: 0,
        recoveryFailedCount: 0,
        recoveryLockoutUntil: 0,
      },
    };
    await drive.writeJson(VAULT_FILE_NAME, cleanVault);

    const response = NextResponse.json({ ok: true }, { status: 200 });
    return attachSessionCookie(response);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Không thể đặt lại mật khẩu sổ.",
      },
      { status: 500 },
    );
  }
}
