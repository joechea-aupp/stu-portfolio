import { cookies } from "next/headers";
import { getPrismaClient } from "@/lib/prisma";
import { createSessionToken, getSessionTtlSeconds, SESSION_COOKIE_NAME } from "@/lib/auth-session";
import { hashPassword } from "@/lib/password";
import { ensureRbacBootstrap } from "@/lib/rbac-bootstrap";

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  userType: "STUDENT" | "ADMINISTRATION";
  cfTurnstileToken: string;
}

function validate(body: unknown): { ok: true; data: RegisterPayload } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid payload." };
  }

  const data = body as Partial<RegisterPayload>;

  const name = data.name?.trim();
  const email = data.email?.trim().toLowerCase();
  const password = data.password;
  const userType =
    typeof data.userType === "string" ? data.userType.trim().toUpperCase() : "STUDENT";

  if (!name || !email || !password) {
    return { ok: false, error: "All fields are required." };
  }

  if (!email.includes("@")) {
    return { ok: false, error: "Please enter a valid email." };
  }

  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  if (userType !== "STUDENT" && userType !== "ADMINISTRATION") {
    return { ok: false, error: "userType must be STUDENT or ADMINISTRATION." };
  }

  const cfToken = (data as Partial<RegisterPayload>).cfTurnstileToken?.trim();
  if (!cfToken) {
    return { ok: false, error: "Please complete the CAPTCHA." };
  }

  return {
    ok: true,
    data: {
      name,
      email,
      password,
      userType: userType as "STUDENT" | "ADMINISTRATION",
      cfTurnstileToken: cfToken,
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

function parseInteger(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export async function POST(request: Request) {
  await ensureRbacBootstrap();

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

  // Verify Turnstile token with Cloudflare
  const turnstileRes = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: validation.data.cfTurnstileToken,
      }),
    },
  );
  const turnstileData = (await turnstileRes.json()) as { success: boolean };
  if (!turnstileData.success) {
    return Response.json({ error: "CAPTCHA verification failed. Please try again." }, { status: 400 });
  }

  const prisma = getPrismaClient();

  try {
    const created = await prisma.users.create({
      data: {
        name,
        email,
        password: hashPassword(password),
        user_type: validation.data.userType,
      },
      select: {
        id: true,
        user_type: true,
      },
    });

    if (created.user_type === "ADMINISTRATION") {
      const adminCountRows = await prisma.$queryRaw<Array<{ total: unknown }>>`
        SELECT COUNT(*) AS total
        FROM users
        WHERE user_type = 'ADMINISTRATION'
      `;
      const adminCount = adminCountRows.length > 0 ? parseInteger(adminCountRows[0].total) : 0;
      const defaultRoleName = adminCount <= 1 ? "ADMIN_SUPER" : "ADMIN_STAFF";

      const roleRows = await prisma.$queryRaw<Array<{ id: number }>>`
        SELECT id
        FROM roles
        WHERE name = ${defaultRoleName}
        LIMIT 1
      `;

      if (roleRows.length === 0) {
        return Response.json({ error: "Default administration role is not configured." }, { status: 500 });
      }

      await prisma.$executeRaw`
        INSERT INTO user_roles (user_id, role_id)
        VALUES (${created.id}, ${roleRows[0].id})
      `;
    }

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
        userType: created.user_type,
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
