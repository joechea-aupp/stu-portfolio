import { scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getPrismaClient } from "@/lib/prisma";
import { createSessionToken, getSessionTtlSeconds, SESSION_COOKIE_NAME } from "@/lib/auth-session";

interface LoginPayload {
  email: string;
  password: string;
}

function validate(body: unknown): { ok: true; data: LoginPayload } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid payload." };
  }

  const data = body as Partial<LoginPayload>;
  const email = data.email?.trim().toLowerCase();
  const password = data.password;

  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }

  if (!email.includes("@")) {
    return { ok: false, error: "Please enter a valid email." };
  }

  return { ok: true, data: { email, password } };
}

function verifyPassword(password: string, storedHash: string): boolean {
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

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validation = validate(body);
  if (!validation.ok) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  const { email, password } = validation.data;
  const prisma = getPrismaClient();

  const user = await prisma.users.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      password: true,
      user_type: true,
      student: {
        select: {
          id: true,
        },
      },
      administration: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!user || !verifyPassword(password, user.password)) {
    return Response.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, createSessionToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getSessionTtlSeconds(),
  });

  const hasProfile =
    user.user_type === "ADMINISTRATION" ? Boolean(user.administration) : Boolean(user.student);

  return Response.json({
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      userType: user.user_type,
      hasProfile,
    },
  });
}
