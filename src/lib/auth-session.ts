import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "studenthub_session";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

interface SessionPayload {
  userId: string;
  exp: number;
}

function getSessionSecret(): string {
  const secret = process.env.STUDENTHUB_SESSION_SECRET;

  if (secret && secret.trim().length >= 32) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("STUDENTHUB_SESSION_SECRET must be set in production (min 32 chars).");
  }

  return "dev-only-studenthub-session-secret-change-me-now";
}

function sign(input: string): string {
  return createHmac("sha256", getSessionSecret()).update(input).digest("base64url");
}

export function createSessionToken(userId: string): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${userId}.${exp}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [userIdRaw, expRaw, signature] = parts;
  const payload = `${userIdRaw}.${expRaw}`;
  const expected = sign(payload);

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  const exp = Number.parseInt(expRaw, 10);

  if (!userIdRaw || !Number.isFinite(exp) || exp <= 0) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (exp <= now) {
    return null;
  }

  return { userId: userIdRaw, exp };
}

export function getSessionTtlSeconds(): number {
  return SESSION_TTL_SECONDS;
}
