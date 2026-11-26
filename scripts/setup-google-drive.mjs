#!/usr/bin/env node
/**
 * One-time local CLI helper to obtain Google Drive OAuth2 credentials (`drive.file` scope)
 * and create the Restricted "Ghi Chú Của Ngọc Như" folder for Vercel environment variables.
 * Uses only Node 22 built-ins + native fetch (no googleapis dependency).
 */
import http from "node:http";
import crypto from "node:crypto";
import { URL } from "node:url";

const SCOPE = "https://www.googleapis.com/auth/drive.file";
const FOLDER_NAME = "Ghi Chú Của Ngọc Như";

const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

if (!clientId || !clientSecret) {
  console.error(
    "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables.\n" +
      "Usage: GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... node scripts/setup-google-drive.mjs",
  );
  process.exit(1);
}

const state = crypto.randomBytes(16).toString("hex");

const server = http.createServer();
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const port = typeof address === "object" && address ? address.port : 0;
const redirectUri = `http://127.0.0.1:${port}/oauth2callback`;

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", clientId);
authUrl.searchParams.set("redirect_uri", redirectUri);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", SCOPE);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");
authUrl.searchParams.set("state", state);

console.log("\n1) Mở liên kết sau trên trình duyệt để cấp quyền scope drive.file:");
console.log(authUrl.toString(), "\n");

const authCode = await new Promise((resolve, reject) => {
  server.on("request", (req, res) => {
    const reqUrl = new URL(req.url || "/", redirectUri);
    if (reqUrl.pathname !== "/oauth2callback") {
      res.writeHead(404).end("Not found");
      return;
    }
    const gotState = reqUrl.searchParams.get("state");
    const code = reqUrl.searchParams.get("code");
    const error = reqUrl.searchParams.get("error");
    if (error || gotState !== state || !code) {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Xác thực thất bại hoặc bị hủy.");
      server.close();
      reject(new Error(error || "Invalid OAuth state/code"));
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h2>Đã ủy quyền thành công! Bạn có thể đóng tab này và quay lại terminal.</h2>");
    server.close();
    resolve(code);
  });
});

const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    code: String(authCode),
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  }),
});

if (!tokenRes.ok) {
  console.error("Failed to exchange OAuth code:", await tokenRes.text());
  process.exit(1);
}

const tokenJson = await tokenRes.json();
const accessToken = tokenJson.access_token;
const refreshToken = tokenJson.refresh_token;

if (!accessToken || !refreshToken) {
  console.error("Did not receive refresh_token. Revoke previous app grant and try again with prompt=consent.");
  process.exit(1);
}

// Find or create restricted app folder
const query = `name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
const listRes = await fetch(
  `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
  { headers: { Authorization: `Bearer ${accessToken}` } },
);
const listJson = await listRes.json();
let folderId = listJson.files?.[0]?.id;

if (!folderId) {
  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
      writersCanShare: false,
      copyRequiresWriterPermission: true,
    }),
  });
  if (!createRes.ok) {
    console.error("Failed creating Drive folder:", await createRes.text());
    process.exit(1);
  }
  const created = await createRes.json();
  folderId = created.id;
}

const sessionSecret = crypto.randomBytes(32).toString("base64url");

console.log("\n2) Dán 5 biến môi trường sau vào Vercel Project Settings -> Environment Variables:\n");
console.log(`GOOGLE_CLIENT_ID=${clientId}`);
console.log(`GOOGLE_CLIENT_SECRET=${clientSecret}`);
console.log(`GOOGLE_REFRESH_TOKEN=${refreshToken}`);
console.log(`GOOGLE_DRIVE_FOLDER_ID=${folderId}`);
console.log(`APP_SESSION_SECRET=${sessionSecret}`);
console.log("\n(Lưu ý giữ bí mật các giá trị trên, không commit vào Git.)");
