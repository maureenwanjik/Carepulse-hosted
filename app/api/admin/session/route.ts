import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

const isMatch = (candidate: string, expected: string) => {
  const left = Buffer.from(candidate);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
};

const clientKey = (request: NextRequest) =>
  request.headers.get("x-real-ip") ??
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
  "unknown";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const key = clientKey(request);
  const now = Date.now();
  if (attempts.size > 10_000) {
    attempts.forEach((attempt, attemptKey) => {
      if (attempt.resetAt <= now) attempts.delete(attemptKey);
    });
  }
  const record = attempts.get(key);
  if (record && record.resetAt > now && record.count >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "Too many attempts." }, {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((record.resetAt - now) / 1000)) },
    });
  }

  let passkey: unknown;
  try {
    ({ passkey } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const expected = process.env.ADMIN_PASSKEY;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  if (!expected || expected.length < 12 || expected.length > 128 || !sessionSecret || Buffer.byteLength(sessionSecret) < 32) {
    console.error("Admin authentication is not configured securely.");
    return NextResponse.json({ error: "Admin authentication is unavailable." }, { status: 503 });
  }

  if (typeof passkey !== "string" || passkey.length > 128 || !isMatch(passkey, expected)) {
    const current = attempts.get(key);
    attempts.set(key, current && current.resetAt > now
      ? { ...current, count: current.count + 1 }
      : { count: 1, resetAt: now + WINDOW_MS });
    return NextResponse.json({ error: "Invalid passkey." }, { status: 401 });
  }

  attempts.delete(key);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
