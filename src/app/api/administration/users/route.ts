import { cookies } from "next/headers";
import { getPrismaClient } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";
import { hashPassword } from "@/lib/password";

type UserType = "STUDENT" | "ADMINISTRATION";
type UserAction = "enable" | "disable" | "edit" | "resetPassword";

interface UpdatePayload {
  userId: number;
  action: UserAction;
  name?: string;
  email?: string;
  userType?: UserType;
  newPassword?: string;
}

function parseSessionUserId(rawCookie: string | undefined): number | null {
  if (!rawCookie) {
    return null;
  }

  const session = verifySessionToken(rawCookie);
  return session?.userId ?? null;
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

async function getIsUserActive(userId: number): Promise<boolean> {
  const prisma = getPrismaClient();
  const rows = await prisma.$queryRaw<Array<{ is_active: unknown }>>`
    SELECT is_active
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

  return rows.length > 0 ? coerceBoolean(rows[0].is_active) : false;
}

async function requireAdminSession() {
  const cookieStore = await cookies();
  const userId = parseSessionUserId(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!userId) {
    return { ok: false as const, response: Response.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  const prisma = getPrismaClient();
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      user_type: true,
    },
  });

  if (!user) {
    return { ok: false as const, response: Response.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  if (user.user_type !== "ADMINISTRATION") {
    return { ok: false as const, response: Response.json({ error: "Forbidden." }, { status: 403 }) };
  }

  const isActive = await getIsUserActive(user.id);
  if (!isActive) {
    cookieStore.delete(SESSION_COOKIE_NAME);
    return { ok: false as const, response: Response.json({ error: "Forbidden." }, { status: 403 }) };
  }

  return { ok: true as const, userId: user.id };
}

async function buildUserSummary(userId: number) {
  const prisma = getPrismaClient();

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      user_type: true,
      createdAt: true,
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

  if (!user) {
    return null;
  }

  const isActive = await getIsUserActive(user.id);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    userType: user.user_type,
    isActive,
    createdAt: user.createdAt,
    hasProfile: user.user_type === "ADMINISTRATION" ? Boolean(user.administration) : Boolean(user.student),
  };
}

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  const prisma = getPrismaClient();
  const users = await prisma.users.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      user_type: true,
      createdAt: true,
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

  const activeRows = await prisma.$queryRaw<Array<{ id: number; is_active: unknown }>>`
    SELECT id, is_active
    FROM users
  `;

  const activeByUserId = new Map<number, boolean>(
    activeRows.map((row) => [row.id, coerceBoolean(row.is_active)]),
  );

  return Response.json({
    currentUserId: auth.userId,
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.user_type,
      isActive: activeByUserId.get(user.id) ?? false,
      createdAt: user.createdAt,
      hasProfile: user.user_type === "ADMINISTRATION" ? Boolean(user.administration) : Boolean(user.student),
    })),
  });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid payload." }, { status: 400 });
  }

  const payload = body as Partial<UpdatePayload>;
  const userId =
    typeof payload.userId === "number"
      ? payload.userId
      : typeof payload.userId === "string"
        ? Number.parseInt(payload.userId, 10)
        : NaN;

  if (!Number.isFinite(userId) || userId <= 0) {
    return Response.json({ error: "userId must be a positive integer." }, { status: 400 });
  }

  const action = payload.action;
  if (action !== "enable" && action !== "disable" && action !== "edit" && action !== "resetPassword") {
    return Response.json({ error: "action must be enable, disable, edit, or resetPassword." }, { status: 400 });
  }

  const prisma = getPrismaClient();
  const target = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
    },
  });

  if (!target) {
    return Response.json({ error: "User not found." }, { status: 404 });
  }

  if (action === "disable") {
    if (target.id === auth.userId) {
      return Response.json({ error: "You cannot disable your own account." }, { status: 400 });
    }

    await prisma.$executeRaw`
      UPDATE users
      SET is_active = false
      WHERE id = ${target.id}
    `;

    const updated = await buildUserSummary(target.id);
    return Response.json({ updated });
  }

  if (action === "enable") {
    await prisma.$executeRaw`
      UPDATE users
      SET is_active = true
      WHERE id = ${target.id}
    `;

    const updated = await buildUserSummary(target.id);
    return Response.json({ updated });
  }

  if (action === "resetPassword") {
    const newPassword = typeof payload.newPassword === "string" ? payload.newPassword : "";
    if (newPassword.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    await prisma.users.update({
      where: { id: target.id },
      data: {
        password: hashPassword(newPassword),
      },
    });

    const updated = await buildUserSummary(target.id);
    return Response.json({ updated });
  }

  const trimmedName = typeof payload.name === "string" ? payload.name.trim() : "";
  const trimmedEmail = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const normalizedUserType =
    typeof payload.userType === "string" ? payload.userType.trim().toUpperCase() : "";

  const updateData: {
    name?: string;
    email?: string;
    user_type?: UserType;
  } = {};

  if (trimmedName) {
    updateData.name = trimmedName;
  }

  if (trimmedEmail) {
    if (!trimmedEmail.includes("@")) {
      return Response.json({ error: "Please enter a valid email." }, { status: 400 });
    }

    updateData.email = trimmedEmail;
  }

  if (normalizedUserType) {
    if (normalizedUserType !== "STUDENT" && normalizedUserType !== "ADMINISTRATION") {
      return Response.json({ error: "userType must be STUDENT or ADMINISTRATION." }, { status: 400 });
    }

    updateData.user_type = normalizedUserType as UserType;
  }

  if (Object.keys(updateData).length === 0) {
    return Response.json({ error: "Provide at least one editable field." }, { status: 400 });
  }

  try {
    await prisma.users.update({
      where: { id: target.id },
      data: updateData,
    });
  } catch (error) {
    if (isKnownPrismaErrorWithCode(error, "P2002")) {
      return Response.json({ error: "Email is already in use." }, { status: 409 });
    }

    return Response.json({ error: "Failed to update user." }, { status: 500 });
  }

  const updated = await buildUserSummary(target.id);
  return Response.json({ updated });
}
