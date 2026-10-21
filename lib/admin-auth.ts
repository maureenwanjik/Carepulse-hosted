import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "carepulse_admin_session";
const SESSION_SECONDS = 60 * 60 * 8;

const getSessionSecret = () => {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error("ADMIN_SESSION_SECRET must contain at least 32 bytes.");
  }
  return secret;
};

const signExpiry = (expiry: string) =>
  createHmac("sha256", getSessionSecret()).update(expiry).digest("base64url");

const safeEqual = (left: string, right: string) => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
};

export const createAdminSessionToken = () => {
  const expiry = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  return `${expiry}.${signExpiry(expiry)}`;
};

export const isValidAdminSessionToken = (token?: string) => {
  if (!token) return false;
  const [expiry, signature, extra] = token.split(".");
  if (!expiry || !signature || extra || !/^\d+$/.test(expiry)) return false;
  if (Number(expiry) <= Math.floor(Date.now() / 1000)) return false;
  try {
    return safeEqual(signature, signExpiry(expiry));
  } catch {
    return false;
  }
};

export const hasAdminSession = () =>
  isValidAdminSessionToken(cookies().get(ADMIN_SESSION_COOKIE)?.value);

export const requireAdminSession = () => {
  if (!hasAdminSession()) throw new Error("Unauthorized: admin session required.");
};

export const ADMIN_SESSION_MAX_AGE = SESSION_SECONDS;
