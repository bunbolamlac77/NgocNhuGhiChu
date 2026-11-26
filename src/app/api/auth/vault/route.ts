import { NextRequest, NextResponse } from "next/server";
import { getDriveStorage } from "@/lib/server/drive";
import { VAULT_FILE_NAME } from "@/lib/server/rate-limit";
import {
  attachSessionCookie,
  isAuthenticatedRequest,
  verifyProofTimingSafe,
} from "@/lib/server/session";
import type { VaultDocument } from "@/types/models";

export const runtime = "nodejs";

export async function PUT(request: NextRequest) {
  try {
    if (!(await isAuthenticatedRequest())) {
      return NextResponse.json({ error: "Chưa xác thực phiên." }, { status: 401 });
    }

    const body = (await request.json()) as {
      currentProof?: unknown;
      updatedVault?: unknown;
    };
    if (typeof body.currentProof !== "string" || !body.currentProof) {
      return NextResponse.json(
        { error: "Thiếu bằng chứng mật khẩu hiện tại." },
        { status: 400 },
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
        { error: "Dữ liệu vault mới không hợp lệ." },
        { status: 400 },
      );
    }

    const drive = getDriveStorage();
    const existing = await drive.readJson<VaultDocument>(VAULT_FILE_NAME);
    if (!existing) {
      return NextResponse.json({ error: "Vault chưa tồn tại." }, { status: 404 });
    }

    if (!verifyProofTimingSafe(body.currentProof, existing.password.verifier)) {
      return NextResponse.json(
        { error: "Mật khẩu sổ hiện tại chưa đúng." },
        { status: 401 },
      );
    }

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
        error: err instanceof Error ? err.message : "Không cập nhật được vault.",
      },
      { status: 500 },
    );
  }
}
