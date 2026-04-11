import { randomBytes, scryptSync } from "node:crypto";
import { cookies } from "next/headers";
import { getPrismaClient } from "@/lib/prisma";
import { createSessionToken, getSessionTtlSeconds, SESSION_COOKIE_NAME } from "@/lib/auth-session";

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function validate(body: unknown): { ok: true; data: RegisterPayload } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid payload." };
  }

  const data = body as Partial<RegisterPayload>;

  const name = data.name?.trim();
  const email = data.email?.trim().toLowerCase();
  const password = data.password;

  if (!name || !email || !password) {
    return { ok: false, error: "All fields are required." };
  }

  if (!email.includes("@")) {
    return { ok: false, error: "Please enter a valid email." };
  }

  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  return {
    ok: true,
    data: {
      name,
      email,
      password,
    },
  };
}

function isKnownPrismaErrorWithCode(error: unknown, code: string): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  return (
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string" &&
    (error as { code: string }).code === code
  );
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

  const { name, email, password } = validation.data;
  const prisma = getPrismaClient();

  try {
    const created = await prisma.users.create({
      data: {
        name,
        email,
        password: hashPassword(password),
      },
      select: {
        id: true,
      },
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, createSessionToken(created.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: getSessionTtlSeconds(),
    });

    return Response.json(
      {
        registered: true,
      },
      { status: 201 },
    );
  } catch (error) {
    if (isKnownPrismaErrorWithCode(error, "P2002")) {
      return Response.json({ error: "Email is already registered." }, { status: 409 });
    }

    return Response.json({ error: "Failed to create account." }, { status: 500 });
  }
}
