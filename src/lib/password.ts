import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [algorithm, salt, hash] = storedHash.split(":");

  if (algorithm !== "scrypt" || !salt || !hash) {
    return false;
  }

  const derived = scryptSync(password, salt, 64).toString("hex");
  const derivedBuffer = Buffer.from(derived);
  const hashBuffer = Buffer.from(hash);

  if (derivedBuffer.length !== hashBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedBuffer, hashBuffer);
}
