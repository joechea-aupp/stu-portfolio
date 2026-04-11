import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";
import { getPrismaClient } from "@/lib/prisma";

function unauthorizedResponse() {
  return Response.json({ authenticated: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
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

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return unauthorizedResponse();
  }

  const session = verifySessionToken(token);

  if (!session) {
    return unauthorizedResponse();
  }

  const prisma = getPrismaClient();
  const user = await prisma.users.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
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

  if (!user) {
    return unauthorizedResponse();
  }

  const activeRows = await prisma.$queryRaw<Array<{ is_active: unknown }>>`
    SELECT is_active
    FROM users
    WHERE id = ${user.id}
    LIMIT 1
  `;
  const isActive = activeRows.length > 0 ? coerceBoolean(activeRows[0].is_active) : false;

  if (!isActive) {
    cookieStore.delete(SESSION_COOKIE_NAME);
    return unauthorizedResponse();
  }

  const hasProfile =
    user.user_type === "ADMINISTRATION" ? Boolean(user.administration) : Boolean(user.student);

  return Response.json(
    {
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        userType: user.user_type,
        hasProfile,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
