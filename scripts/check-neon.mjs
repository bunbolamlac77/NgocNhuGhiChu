#!/usr/bin/env node
/**
 * Check Neon PostgreSQL connection, initialize `ngocnhu_storage_objects` table,
 * and generate a fresh 32-byte APP_SESSION_SECRET if needed.
 * Usage: DATABASE_URL="postgresql://..." node scripts/check-neon.mjs
 */
import crypto from "node:crypto";
import { neon } from "@neondatabase/serverless";

const databaseUrl =
  process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim();

if (!databaseUrl) {
  console.error(
    "Missing DATABASE_URL (or POSTGRES_URL).\n" +
      'Usage: DATABASE_URL="postgresql://..." node scripts/check-neon.mjs',
  );
  process.exit(1);
}

const sql = neon(databaseUrl);

await sql`
  CREATE TABLE IF NOT EXISTS ngocnhu_storage_objects (
    path TEXT PRIMARY KEY,
    mime_type TEXT NOT NULL,
    content_base64 TEXT NOT NULL,
    updated_at BIGINT NOT NULL
  )
`;

const rows = await sql`SELECT COUNT(*)::int AS total FROM ngocnhu_storage_objects`;
const total = rows[0]?.total ?? 0;

console.log(`Neon ket noi thanh cong! So object hien co trong ngocnhu_storage_objects: ${total}`);

if (!process.env.APP_SESSION_SECRET || process.env.APP_SESSION_SECRET.length < 32) {
  const generated = crypto.randomBytes(32).toString("base64url");
  console.log("\nAPP_SESSION_SECRET goi y (dan vao Vercel Environment Variables):");
  console.log(`APP_SESSION_SECRET=${generated}`);
}
