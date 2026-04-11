import { getPrismaClient } from "@/lib/prisma";

function parsePositiveInt(raw: string | null): number | null {
  if (!raw) {
    return null;
  }

  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return value;
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
  const studentId = parsePositiveInt(searchParams.get("studentId"));
  const userId = parsePositiveInt(searchParams.get("userId"));

  if (!studentId && !userId) {
    return Response.json(
      { error: "Provide studentId or userId as a query parameter." },
      { status: 400 },
    );
  }

  const prisma = getPrismaClient();
  const student = await prisma.student.findUnique({
    where: studentId ? { id: studentId } : { user_id: userId as number },
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
    typeof rawStudentId === "number"
      ? rawStudentId
      : typeof rawStudentId === "string"
        ? Number.parseInt(rawStudentId, 10)
        : NaN;
  const userId =
    typeof rawUserId === "number"
      ? rawUserId
      : typeof rawUserId === "string"
        ? Number.parseInt(rawUserId, 10)
        : NaN;

  if (!Number.isFinite(studentId) && !Number.isFinite(userId)) {
    return Response.json({ error: "studentId or userId is required." }, { status: 400 });
  }

  if (action !== "view" && action !== "kudo") {
    return Response.json({ error: "action must be 'view' or 'kudo'." }, { status: 400 });
  }

  const prisma = getPrismaClient();

  try {
    const updated = await prisma.student.update({
      where: Number.isFinite(studentId)
        ? { id: studentId }
        : { user_id: userId as number },
      data:
        action === "view"
          ? { view_count: { increment: 1 } }
          : { kudo_count: { increment: 1 } },
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
