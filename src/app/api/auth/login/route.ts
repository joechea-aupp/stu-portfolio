import { cookies } from "next/headers";
import { getPrismaClient } from "@/lib/prisma";
import { createSessionToken, getSessionTtlSeconds, SESSION_COOKIE_NAME } from "@/lib/auth-session";
import { verifyPassword } from "@/lib/password";

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

function coerceBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "bigint") {
    return value !== BigInt(0);
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true";
  }

  return false;
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

  const activeRows = await prisma.$queryRaw<Array<{ is_active: unknown }>>`
    SELECT is_active
    FROM users
    WHERE id = ${user.id}
    LIMIT 1
  `;
  const isActive = activeRows.length > 0 ? coerceBoolean(activeRows[0].is_active) : false;

  if (!isActive) {
    return Response.json({ error: "This account has been disabled." }, { status: 403 });
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
