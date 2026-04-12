import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";
import { getPrismaClient } from "@/lib/prisma";
import { ensureRbacBootstrap } from "@/lib/rbac-bootstrap";
import { getUserRbacSnapshot, hasPermission, RBAC_PERMISSION } from "@/lib/rbac";

function parseSessionUserId(rawCookie: string | undefined): number | null {
  if (!rawCookie) {
    return null;
  }

  const session = verifySessionToken(rawCookie);
  return session?.userId ?? null;
}

async function requireVerifierAdminSession() {
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
    },
  });

  if (!user || !user.is_active || user.user_type !== "ADMINISTRATION") {
    cookieStore.delete(SESSION_COOKIE_NAME);
    return { ok: false as const, response: Response.json({ error: "Forbidden." }, { status: 403 }) };
  }

  const snapshot = await getUserRbacSnapshot(user.id);

  if (!snapshot || !snapshot.isActive || snapshot.userType !== "ADMINISTRATION") {
    cookieStore.delete(SESSION_COOKIE_NAME);
    return { ok: false as const, response: Response.json({ error: "Forbidden." }, { status: 403 }) };
  }

  if (!hasPermission(snapshot.permissionKeys, RBAC_PERMISSION.ACHIEVEMENTS_VERIFY)) {
    return {
      ok: false as const,
      response: Response.json({ error: "You do not have permission to verify achievements." }, { status: 403 }),
    };
  }

  return {
    ok: true as const,
    userId: snapshot.userId,
  };
}

export async function GET() {
  await ensureRbacBootstrap();

  const auth = await requireVerifierAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  const prisma = getPrismaClient();
  const rows = await prisma.$queryRaw<Array<{ total: number }>>`
    SELECT COUNT(*) AS total
    FROM achievement_verification_requests
    WHERE assigned_verifier_user_id = ${auth.userId}
      AND status = 'PENDING'
  `;

  return Response.json({ pendingCount: rows[0]?.total ?? 0 });
}
