import { NextResponse } from "next/server";
import { clearSessionCookie, isAuthenticatedRequest } from "@/lib/server/session";

export const runtime = "nodejs";

export async function POST() {
  const authed = await isAuthenticatedRequest();
  if (!authed) {
    return NextResponse.json(
      { error: "Chưa đăng nhập phiên đồng bộ." },
      { status: 401 },
    );
  }
  const response = NextResponse.json({ ok: true }, { status: 200 });
  return clearSessionCookie(response);
}
