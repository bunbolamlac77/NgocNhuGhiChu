import { NextResponse } from "next/server";
import { getDriveStorage } from "@/lib/server/drive";
import { VAULT_FILE_NAME } from "@/lib/server/rate-limit";
import { isAuthenticatedRequest } from "@/lib/server/session";
import type { AuthStatusResponse } from "@/types/api";
import type { VaultDocument } from "@/types/models";

export const runtime = "nodejs";

export async function GET() {
  try {
    const drive = getDriveStorage();
    const vault = await drive.readJson<VaultDocument>(VAULT_FILE_NAME);
    if (!vault) {
      const payload: AuthStatusResponse = {
        initialized: false,
        authenticated: false,
      };
      return NextResponse.json(payload);
    }

    const authenticated = await isAuthenticatedRequest();
    const payload: AuthStatusResponse = {
      initialized: true,
      authenticated,
      passwordSaltVerifier: vault.password.saltVerifier,
      recoverySaltVerifier: vault.recovery.saltVerifier,
    };
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      {
        initialized: false,
        authenticated: false,
      } satisfies AuthStatusResponse,
      { status: 200 },
    );
  }
}
