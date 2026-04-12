import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";
import { getPrismaClient } from "@/lib/prisma";

function parseSessionUserId(rawCookie: string | undefined): string | null {
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
    Array<{ id: string; name: string; email: string; title: string | null; occupation: string | null }>
  >`
    SELECT
      u.id,
      u.name,
      u.email,
      a.title,
      a.occupation
    FROM users u
    JOIN administrations a ON a.user_id = u.id
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    LEFT JOIN role_permissions rp ON rp.role_id = r.id
    LEFT JOIN permissions p ON p.id = rp.permission_id
    WHERE u.user_type = 'ADMINISTRATION'
      AND u.is_active = true
      AND p.key = 'achievements.verify'
      AND (${query} = '' OR LOWER(u.name) LIKE LOWER(CONCAT('%', ${query}, '%')))
    GROUP BY u.id, u.name, u.email, a.title, a.occupation
    ORDER BY u.name ASC
    LIMIT 50
  `;

  function formatTitle(value: string | null): string {
    if (value === "MR") {
      return "Mr.";
    }

    if (value === "MS") {
      return "Ms.";
    }

    if (value === "DR") {
      return "Dr.";
    }

    return "";
  }

  return Response.json({
    verifiers: verifiers.map((entry) => ({
      id: entry.id,
      name: entry.name,
      email: entry.email,
      title: formatTitle(entry.title),
      occupation: entry.occupation ?? "Administration",
    })),
  });
}
