import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";
import { getPrismaClient } from "@/lib/prisma";
import { isValidUuid } from "@/lib/uuid";

function parseUuid(raw: string | null): string | null {
  return isValidUuid(raw) ? raw : null;
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = parseUuid(searchParams.get("studentId"));
  const userId = parseUuid(searchParams.get("userId"));

  if (!studentId && !userId) {
    return Response.json(
      { error: "Provide studentId or userId as a query parameter." },
      { status: 400 },
    );
  }

  const prisma = getPrismaClient();
  const student = await prisma.student.findUnique({
    where: studentId ? { id: studentId } : { user_id: userId as string },
    select: {
      id: true,
      user_id: true,
      kudo_count: true,
      view_count: true,
    },
  });

  if (!student) {
    return Response.json({ error: "Student not found." }, { status: 404 });
  }

  return Response.json({
    studentId: student.id,
    userId: student.user_id,
    metrics: {
      kudos: student.kudo_count,
      views: student.view_count,
    },
  });
}

export async function PATCH(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid payload." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const action = payload.action;
  const rawStudentId = payload.studentId;
  const rawUserId = payload.userId;

  const studentId =
    typeof rawStudentId === "string" && isValidUuid(rawStudentId)
      ? rawStudentId
      : null;
  const userId =
    typeof rawUserId === "string" && isValidUuid(rawUserId)
      ? rawUserId
      : null;

  if (!studentId && !userId) {
    return Response.json({ error: "studentId or userId is required." }, { status: 400 });
  }

  if (action !== "view" && action !== "kudo" && action !== "unkudo") {
    return Response.json({ error: "action must be 'view', 'kudo', or 'unkudo'." }, { status: 400 });
  }

  // Kudo and unkudo require an authenticated session.
  if (action === "kudo" || action === "unkudo") {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? verifySessionToken(token) : null;

    if (!session) {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }

    const prisma = getPrismaClient();

    // Resolve the target student's id.
    const resolvedStudent = await prisma.student.findUnique({
      where: studentId
        ? { id: studentId }
        : { user_id: userId as string },
      select: { id: true, user_id: true, kudo_count: true, view_count: true },
    });

    if (!resolvedStudent) {
      return Response.json({ error: "Student not found." }, { status: 404 });
    }

    try {
      let updated: { id: string; user_id: string; kudo_count: number; view_count: number };

      if (action === "kudo") {
        // Create the kudo record and increment the counter atomically.
        await prisma.studentKudo.create({
          data: { user_id: session.userId, student_id: resolvedStudent.id },
        });
        updated = await prisma.student.update({
          where: { id: resolvedStudent.id },
          data: { kudo_count: { increment: 1 } },
          select: { id: true, user_id: true, kudo_count: true, view_count: true },
        });
      } else {
        // Delete the kudo record and decrement the counter atomically.
        await prisma.studentKudo.delete({
          where: {
            user_id_student_id: { user_id: session.userId, student_id: resolvedStudent.id },
          },
        });
        updated = await prisma.student.update({
          where: { id: resolvedStudent.id },
          data: { kudo_count: { decrement: 1 } },
          select: { id: true, user_id: true, kudo_count: true, view_count: true },
        });
      }

      return Response.json({
        studentId: updated.id,
        userId: updated.user_id,
        metrics: {
          kudos: Math.max(0, updated.kudo_count),
          views: updated.view_count,
        },
        updated: action,
      });
    } catch (error) {
      // P2002 = unique constraint violation (already kudoed)
      if (isKnownPrismaErrorWithCode(error, "P2002")) {
        return Response.json({ error: "Already kudoed." }, { status: 409 });
      }
      // P2025 = record not found (not kudoed, or student missing)
      if (isKnownPrismaErrorWithCode(error, "P2025")) {
        return Response.json({ error: "Kudo not found." }, { status: 409 });
      }

      console.error("[/api/student-metrics] Unexpected error:", error);
      return Response.json({ error: "Internal server error." }, { status: 500 });
    }
  }

  const prisma = getPrismaClient();

  try {
    const updated = await prisma.student.update({
      where: studentId
        ? { id: studentId }
        : { user_id: userId as string },
      data: { view_count: { increment: 1 } },
      select: {
        id: true,
        user_id: true,
        kudo_count: true,
        view_count: true,
      },
    });

    return Response.json({
      studentId: updated.id,
      userId: updated.user_id,
      metrics: {
        kudos: updated.kudo_count,
        views: updated.view_count,
      },
      updated: action,
    });
  } catch (error) {
    if (isKnownPrismaErrorWithCode(error, "P2025")) {
      return Response.json({ error: "Student not found." }, { status: 404 });
    }

    console.error("[/api/student-metrics] Unexpected error:", error);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}
