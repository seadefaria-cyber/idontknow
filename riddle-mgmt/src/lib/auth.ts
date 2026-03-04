import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is required");
  return secret;
}
const COOKIE_NAME = "portal_session";
const MFA_PENDING_COOKIE = "portal_mfa_pending";

export interface TokenPayload {
  userId: string;
  username: string;
  role: string;
  mfaVerified: boolean;
}

export function createToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function createMfaPendingToken(userId: string, username: string, role: string): string {
  const payload: TokenPayload = { userId, username, role, mfaVerified: false };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "10m" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getMfaPendingSession(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(MFA_PENDING_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function sessionCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
}

export function mfaPendingCookieOptions(token: string) {
  return {
    name: MFA_PENDING_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  };
}

export function clearSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}

export function clearMfaPendingCookie() {
  return {
    name: MFA_PENDING_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}
