import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import type { TimelineItem } from "@/types/student";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";
import { getPrismaClient } from "@/lib/prisma";

interface RequestBody {
  achievementIndex?: number;
  verifierUserId?: number;
}

function parseSessionUserId(rawCookie: string | undefined): number | null {
  if (!rawCookie) {
    return null;
  }

  const session = verifySessionToken(rawCookie);
  return session?.userId ?? null;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isValidAchievement(item: TimelineItem | undefined) {
  return Boolean(item && typeof item.title === "string" && item.title.trim() && typeof item.period === "string" && item.period.trim());
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
      student: {
        select: {
          id: true,
          achievements: true,
        },
      },
    },
  });

  if (!user || !user.is_active || user.user_type !== "STUDENT" || !user.student) {
    return { ok: false as const, response: Response.json({ error: "Forbidden." }, { status: 403 }) };
  }

  const achievements = Array.isArray(user.student.achievements)
    ? (user.student.achievements as TimelineItem[])
    : [];

  return {
    ok: true as const,
    userId: user.id,
    studentId: user.student.id,
    achievements,
  };
}

export async function POST(request: Request) {
  const auth = await requireStudentUser();
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

  const payload = body as RequestBody;

  if (typeof payload.achievementIndex !== "number" || !Number.isInteger(payload.achievementIndex) || payload.achievementIndex < 0) {
    return Response.json({ error: "achievementIndex must be a non-negative integer." }, { status: 400 });
  }

  if (!isPositiveInteger(payload.verifierUserId)) {
    return Response.json({ error: "verifierUserId must be a positive integer." }, { status: 400 });
  }

  const selectedAchievement = auth.achievements[payload.achievementIndex];
  if (!isValidAchievement(selectedAchievement)) {
    return Response.json({ error: "Achievement not found." }, { status: 404 });
  }

  if (selectedAchievement?.verifiedBy) {
    return Response.json({ error: "This achievement is already verified." }, { status: 409 });
  }

  if (selectedAchievement?.pendingVerification) {
    return Response.json({ error: "This achievement already has a pending verification request." }, { status: 409 });
  }

  const prisma = getPrismaClient();
  const verifierRows = await prisma.$queryRaw<Array<{ id: number; name: string }>>`
    SELECT DISTINCT u.id, u.name
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.id
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE u.id = ${payload.verifierUserId}
      AND u.user_type = 'ADMINISTRATION'
      AND u.is_active = true
      AND p.key = 'achievements.verify'
    LIMIT 1
  `;

  if (verifierRows.length === 0) {
    return Response.json({ error: "Selected verifier is not eligible." }, { status: 400 });
  }

  const verifier = verifierRows[0];

  const existingPending = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id
    FROM achievement_verification_requests
    WHERE student_id = ${auth.studentId}
      AND achievement_index = ${payload.achievementIndex}
      AND status = 'PENDING'
    LIMIT 1
  `;

  if (existingPending.length > 0) {
    return Response.json({ error: "A pending verification request already exists for this achievement." }, { status: 409 });
  }

  const requestedAt = new Date();
  const nextAchievements = auth.achievements.map((entry, index) =>
    index === payload.achievementIndex
      ? {
          ...entry,
          pendingVerification: {
            requestedAt: requestedAt.toISOString(),
            verifierUserId: verifier.id,
            verifierName: verifier.name,
          },
        }
      : entry,
  );

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: auth.studentId },
        data: {
          achievements: nextAchievements as Prisma.InputJsonValue,
        },
      });

      await tx.$executeRaw`
        INSERT INTO achievement_verification_requests (
          student_id,
          achievement_index,
          assigned_verifier_user_id,
          status,
          requested_at
        )
        VALUES (
          ${auth.studentId},
          ${payload.achievementIndex},
          ${verifier.id},
          'PENDING',
          ${requestedAt}
        )
      `;

      const rows = await tx.$queryRaw<Array<{ id: number }>>`
        SELECT id
        FROM achievement_verification_requests
        WHERE student_id = ${auth.studentId}
          AND achievement_index = ${payload.achievementIndex}
          AND status = 'PENDING'
        ORDER BY id DESC
        LIMIT 1
      `;

      return rows[0]?.id ?? null;
    });

    return Response.json({
      requestId: result,
      verifier: {
        id: verifier.id,
        name: verifier.name,
      },
      requestedAt: requestedAt.toISOString(),
    });
  } catch (error) {
    console.error("[/api/onboard/achievement-verifications][POST] Unexpected error:", error);
    return Response.json({ error: "Unable to submit verification request." }, { status: 500 });
  }
}
