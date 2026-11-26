import { NextRequest, NextResponse } from "next/server";
import { getDriveStorage } from "@/lib/server/drive";
import { attachSessionCookie, isAuthenticatedRequest } from "@/lib/server/session";
import {
  isValidAssetType,
  isValidId,
  MAX_DRAWING_UPLOAD_BYTES,
  MAX_STICKER_UPLOAD_BYTES,
} from "@/lib/validation";
import type { AssetType } from "@/types/models";

export const runtime = "nodejs";

function candidatePaths(type: AssetType, id: string): Array<{
  path: string;
  mime: string;
}> {
  if (type === "stickers") {
    return [
      { path: `stickers/${id}.webp`, mime: "image/webp" },
      { path: `stickers/${id}.png`, mime: "image/png" },
    ];
  }
  return [
    { path: `drawings/${id}.enc`, mime: "application/octet-stream" },
    { path: `drawings/${id}.webp`, mime: "image/webp" },
    { path: `drawings/${id}.png`, mime: "image/png" },
  ];
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ type: string; id: string }> },
) {
  if (!(await isAuthenticatedRequest())) {
    return NextResponse.json({ error: "Chưa xác thực phiên." }, { status: 401 });
  }

  const { type, id } = await context.params;
  if (!isValidAssetType(type) || !isValidId(id)) {
    return NextResponse.json({ error: "Tham số không hợp lệ." }, { status: 400 });
  }

  const drive = getDriveStorage();
  for (const candidate of candidatePaths(type, id)) {
    const bytes = await drive.readBytes(candidate.path);
    if (bytes) {
      const copyBuf = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(copyBuf).set(bytes);
      return new NextResponse(copyBuf, {
        status: 200,
        headers: {
          "Content-Type": candidate.mime,
          "Cache-Control": "private, max-age=3600",
        },
      });
    }
  }

  return NextResponse.json({ error: "Không tìm thấy tài nguyên." }, { status: 404 });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ type: string; id: string }> },
) {
  if (!(await isAuthenticatedRequest())) {
    return NextResponse.json({ error: "Chưa xác thực phiên." }, { status: 401 });
  }

  const { type, id } = await context.params;
  if (!isValidAssetType(type) || !isValidId(id)) {
    return NextResponse.json({ error: "Tham số không hợp lệ." }, { status: 400 });
  }

  const buf = await request.arrayBuffer();
  const maxBytes =
    type === "stickers" ? MAX_STICKER_UPLOAD_BYTES : MAX_DRAWING_UPLOAD_BYTES;
  if (buf.byteLength === 0 || buf.byteLength > maxBytes) {
    return NextResponse.json(
      {
        error:
          type === "stickers"
            ? "Sticker tải lên vượt giới hạn 60 KB."
            : "Ảnh vẽ tải lên vượt giới hạn 250 KB.",
      },
      { status: buf.byteLength === 0 ? 400 : 413 },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  const isEncrypted =
    type === "drawings" &&
    (request.headers.get("x-ngocnhu-encrypted") === "1" ||
      contentType.includes("application/octet-stream"));

  const ext = isEncrypted
    ? "enc"
    : contentType.includes("image/png")
      ? "png"
      : "webp";
  const mime = isEncrypted
    ? "application/octet-stream"
    : ext === "png"
      ? "image/png"
      : "image/webp";

  const drive = getDriveStorage();
  const targetPath = `${type}/${id}.${ext}`;
  // Clean up any stale extension variant for the same ID
  for (const candidate of candidatePaths(type, id)) {
    if (candidate.path !== targetPath) {
      await drive.deleteFile(candidate.path);
    }
  }
  await drive.writeBytes(targetPath, new Uint8Array(buf), mime);

  const response = NextResponse.json(
    { ok: true, sizeBytes: buf.byteLength },
    { status: 200 },
  );
  return attachSessionCookie(response);
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ type: string; id: string }> },
) {
  if (!(await isAuthenticatedRequest())) {
    return NextResponse.json({ error: "Chưa xác thực phiên." }, { status: 401 });
  }

  const { type, id } = await context.params;
  if (!isValidAssetType(type) || !isValidId(id)) {
    return NextResponse.json({ error: "Tham số không hợp lệ." }, { status: 400 });
  }

  const drive = getDriveStorage();
  for (const candidate of candidatePaths(type, id)) {
    await drive.deleteFile(candidate.path);
  }

  const response = NextResponse.json({ ok: true }, { status: 200 });
  return attachSessionCookie(response);
}
