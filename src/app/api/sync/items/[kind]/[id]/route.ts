import { NextRequest, NextResponse } from "next/server";
import { getDriveStorage } from "@/lib/server/drive";
import { noteFileName, putSyncItem } from "@/lib/server/index-store";
import { attachSessionCookie, isAuthenticatedRequest } from "@/lib/server/session";
import {
  isValidId,
  isValidSyncItemKind,
  isValidWateringId,
  MAX_NOTE_BYTES,
  validatePayloadByteSize,
} from "@/lib/validation";
import type { SyncItemPayloadMap } from "@/types/api";
import type { NoteDocument } from "@/types/models";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ kind: string; id: string }> },
) {
  if (!(await isAuthenticatedRequest())) {
    return NextResponse.json({ error: "Chưa xác thực phiên." }, { status: 401 });
  }

  const { kind, id } = await context.params;
  if (kind !== "notes" || !isValidId(id)) {
    return NextResponse.json({ error: "Tham số không hợp lệ." }, { status: 400 });
  }

  try {
    const drive = getDriveStorage();
    const note = await drive.readJson<NoteDocument>(noteFileName(id));
    if (!note) {
      return NextResponse.json({ error: "Không tìm thấy ghi chú." }, { status: 404 });
    }
    const response = NextResponse.json({ note }, { status: 200 });
    return attachSessionCookie(response);
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Không đọc được ghi chú.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ kind: string; id: string }> },
) {
  if (!(await isAuthenticatedRequest())) {
    return NextResponse.json({ error: "Chưa xác thực phiên." }, { status: 401 });
  }

  const { kind, id } = await context.params;
  if (!isValidSyncItemKind(kind)) {
    return NextResponse.json({ error: "Loại mục không hợp lệ." }, { status: 400 });
  }
  const validId =
    kind === "waterings" ? isValidWateringId(id) : isValidId(id);
  if (!validId) {
    return NextResponse.json({ error: "Mã mục không hợp lệ." }, { status: 400 });
  }

  try {
    const rawText = await request.text();
    if (
      kind === "notes" &&
      !validatePayloadByteSize(rawText, MAX_NOTE_BYTES)
    ) {
      return NextResponse.json(
        { error: "Ghi chú vượt quá giới hạn 120 KB." },
        { status: 413 },
      );
    }

    const body = JSON.parse(rawText) as {
      item?: SyncItemPayloadMap[typeof kind];
      baseRev?: unknown;
    };
    if (
      !body.item ||
      typeof body.baseRev !== "number" ||
      !Number.isInteger(body.baseRev) ||
      body.baseRev < 0
    ) {
      return NextResponse.json(
        { error: "Dữ liệu item hoặc baseRev không hợp lệ." },
        { status: 400 },
      );
    }

    const drive = getDriveStorage();
    const res = await putSyncItem(drive, kind, id, body.item, body.baseRev);
    if (res.conflict) {
      return NextResponse.json(
        { error: "CONFLICT", remote: res.remote },
        { status: 409 },
      );
    }

    const response = NextResponse.json({ rev: res.rev }, { status: 200 });
    return attachSessionCookie(response);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Không lưu được mục đồng bộ.",
      },
      { status: 500 },
    );
  }
}
