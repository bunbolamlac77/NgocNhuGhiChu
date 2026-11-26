import crypto from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import type { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerEnv } from "./env";

export const SESSION_COOKIE_NAME = "ngocnhu_session";
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;
export const RECOVERY_TOKEN_TTL_SECONDS = 5 * 60;

function getJwtKey(): Uint8Array {
  const { sessionSecret } = getServerEnv();
  return new TextEncoder().encode(sessionSecret);
}

export function hashProofForVerifier(proof: string): string {
  return crypto
    .createHash("sha256")
    .update(proof, "utf8")
    .digest("base64url");
}

export function verifyProofTimingSafe(
  candidateProof: string,
  expectedVerifierHash: string,
): boolean {
  if (!candidateProof || !expectedVerifierHash) return false;
  const candidateHash = hashProofForVerifier(candidateProof);
  const bufA = Buffer.from(candidateHash, "utf8");
  const bufB = Buffer.from(expectedVerifierHash, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function signSessionToken(): Promise<string> {
  return new SignJWT({ typ: "session", sub: "ngocnhu" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getJwtKey());
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getJwtKey(), {
      algorithms: ["HS256"],
    });
    return payload.typ === "session" && payload.sub === "ngocnhu";
  } catch {
    return false;
  }
}

export async function signRecoveryToken(): Promise<string> {
  return new SignJWT({ typ: "recovery", sub: "ngocnhu" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${RECOVERY_TOKEN_TTL_SECONDS}s`)
    .sign(getJwtKey());
}

export async function verifyRecoveryToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getJwtKey(), {
      algorithms: ["HS256"],
    });
    return payload.typ === "recovery" && payload.sub === "ngocnhu";
  } catch {
    return false;
  }
}

export async function isAuthenticatedRequest(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}

export async function attachSessionCookie(
  response: NextResponse,
): Promise<NextResponse> {
  const token = await signSessionToken();
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
