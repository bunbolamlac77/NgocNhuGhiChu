import { NextResponse } from "next/server";
import { getDriveStorage } from "@/lib/server/drive";
import { purgeDeletedItems } from "@/lib/server/index-store";
import { attachSessionCookie, isAuthenticatedRequest } from "@/lib/server/session";

export const runtime = "nodejs";

export async function POST() {
  if (!(await isAuthenticatedRequest())) {
    return NextResponse.json({ error: "Chưa xác thực phiên." }, { status: 401 });
  }

  try {
    const drive = getDriveStorage();
    const purged = await purgeDeletedItems(drive);
    const response = NextResponse.json({ purged }, { status: 200 });
    return attachSessionCookie(response);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Không dọn dẹp được mục đã xóa quá 30 ngày.",
      },
      { status: 500 },
    );
  }
}
