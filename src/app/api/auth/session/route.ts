import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";
import { getPrismaClient } from "@/lib/prisma";

function unauthorizedResponse() {
  return Response.json({ authenticated: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
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
    },
  });

  if (!user) {
    return unauthorizedResponse();
  }

  return Response.json(
    {
      authenticated: true,
      user,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
