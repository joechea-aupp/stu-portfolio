import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";
import { getPrismaClient } from "@/lib/prisma";

function parseSessionUserId(rawCookie: string | undefined): number | null {
  if (!rawCookie) {
    return null;
  }

  const session = verifySessionToken(rawCookie);
  return session?.userId ?? null;
}

async function requireStudentUser() {
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
      is_active: true,
      student: { select: { id: true } },
    },
  });

  if (!user || !user.is_active || user.user_type !== "STUDENT" || !user.student) {
    return { ok: false as const, response: Response.json({ error: "Forbidden." }, { status: 403 }) };
  }

  return {
    ok: true as const,
    userId: user.id,
  };
}

export async function GET(request: Request) {
  const auth = await requireStudentUser();
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  const prisma = getPrismaClient();
  const verifiers = await prisma.$queryRaw<
    Array<{ id: number; name: string; role_name: string | null }>
  >`
    SELECT DISTINCT u.id, u.name, r.name AS role_name
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.id
    JOIN roles r ON r.id = ur.role_id
    JOIN role_permissions rp ON rp.role_id = r.id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE u.user_type = 'ADMINISTRATION'
      AND u.is_active = true
      AND p.key = 'achievements.verify'
      AND (${query} = '' OR LOWER(u.name) LIKE LOWER(CONCAT('%', ${query}, '%')))
    ORDER BY u.name ASC
    LIMIT 50
  `;

  return Response.json({
    verifiers: verifiers.map((entry) => ({
      id: entry.id,
      name: entry.name,
      role: entry.role_name ?? "Administration",
    })),
  });
}
