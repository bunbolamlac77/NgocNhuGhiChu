import { NextResponse } from "next/server";
import { getDriveStorage } from "@/lib/server/drive";
import { readRemoteIndex } from "@/lib/server/index-store";
import { attachSessionCookie, isAuthenticatedRequest } from "@/lib/server/session";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAuthenticatedRequest())) {
    return NextResponse.json({ error: "Chưa xác thực phiên." }, { status: 401 });
  }

  try {
    const drive = getDriveStorage();
    const index = await readRemoteIndex(drive);
    const response = NextResponse.json({ index }, { status: 200 });
    return attachSessionCookie(response);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Không tải được index đồng bộ.",
      },
      { status: 500 },
    );
  }
}
