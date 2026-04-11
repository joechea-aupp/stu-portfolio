import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";
import { getPrismaClient } from "@/lib/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return Response.json({ kudoedStudentIds: [] });
  }

  const session = verifySessionToken(token);

  if (!session) {
    return Response.json({ kudoedStudentIds: [] });
  }

  const prisma = getPrismaClient();
  const records = await prisma.studentKudo.findMany({
    where: { user_id: session.userId },
    select: { student_id: true },
  });

  return Response.json({
    kudoedStudentIds: records.map((r) => String(r.student_id)),
  });
}
