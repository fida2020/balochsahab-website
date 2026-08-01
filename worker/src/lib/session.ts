import type { Env, SessionRow, UserRow } from "../types";
import { createSession, deleteSession, getSessionWithUser } from "./db";

const COOKIE_NAME = "sid";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function parseCookie(request: Request, name: string): string | null {
  const header = request.headers.get("Cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

export async function hashIp(ip: string | null): Promise<string | null> {
  if (!ip) return null;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  return btoa(String.fromCharCode(...new Uint8Array(digest))).slice(0, 22);
}

export async function establishSession(
  env: Env,
  request: Request,
  userId: string
): Promise<string> {
  const ua = request.headers.get("User-Agent");
  const ip = request.headers.get("CF-Connecting-IP");
  const sessionId = await createSession(env, userId, ua, await hashIp(ip), SESSION_TTL_SECONDS);
  return sessionId;
}

export function sessionCookieHeader(sessionId: string): string {
  return `${COOKIE_NAME}=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookieHeader(): string {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export async function getCurrentSession(
  env: Env,
  request: Request
): Promise<{ session: SessionRow; user: UserRow } | null> {
  const sid = parseCookie(request, COOKIE_NAME);
  if (!sid) return null;
  return getSessionWithUser(env, sid);
}

export async function endSession(env: Env, request: Request): Promise<void> {
  const sid = parseCookie(request, COOKIE_NAME);
  if (sid) await deleteSession(env, sid);
}
