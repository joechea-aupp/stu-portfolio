import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";
import { getPrismaClient } from "@/lib/prisma";
import { ensureRbacBootstrap } from "@/lib/rbac-bootstrap";
import { getUserRbacSnapshot } from "@/lib/rbac";

function unauthorizedResponse() {
  return Response.json({ authenticated: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  await ensureRbacBootstrap();

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

  const userRbac = await getUserRbacSnapshot(user.id);
  const isActive = userRbac?.isActive ?? false;

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
        roles: userRbac?.roles ?? [],
        permissions: userRbac?.permissionKeys ?? [],
        hasProfile,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
