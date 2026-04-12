import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import type { TimelineItem } from "@/types/student";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";
import { getPrismaClient } from "@/lib/prisma";
import { ensureRbacBootstrap } from "@/lib/rbac-bootstrap";
import { getUserRbacSnapshot, hasPermission, RBAC_PERMISSION } from "@/lib/rbac";

type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";
type ReviewAction = "approve" | "reject";

interface ReviewPayload {
  requestId?: number;
  action?: ReviewAction;
  rejectionReason?: string;
}

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
      name: true,
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
    userId: user.id,
    userName: user.name,
    roleLabel: snapshot.roles[0]?.name ?? "Administration",
  };
}

function normalizeStatus(value: string | null): RequestStatus {
  if (value === "APPROVED" || value === "REJECTED") {
    return value;
  }

  return "PENDING";
}

function parseTimelineItems(value: unknown): TimelineItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value as TimelineItem[];
}

export async function GET(request: Request) {
  await ensureRbacBootstrap();

  const auth = await requireVerifierAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const status = normalizeStatus(searchParams.get("status"));
  const limitRaw = Number.parseInt(searchParams.get("limit") ?? "20", 10);
  const limit = Number.isInteger(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 20;

  const prisma = getPrismaClient();
  const requests = await prisma.$queryRaw<
    Array<{
      id: number;
      student_id: number;
      student_name: string;
      achievement_index: number;
      assigned_verifier_user_id: number;
      assigned_verifier_name: string;
      status: string;
      requested_at: Date;
      reviewed_at: Date | null;
      rejection_reason: string | null;
    }>
  >`
    SELECT
      avr.id,
      avr.student_id,
      su.name AS student_name,
      avr.achievement_index,
      avr.assigned_verifier_user_id,
      vu.name AS assigned_verifier_name,
      avr.status,
      avr.requested_at,
      avr.reviewed_at,
      avr.rejection_reason
    FROM achievement_verification_requests avr
    JOIN students s ON s.id = avr.student_id
    JOIN users su ON su.id = s.user_id
    JOIN users vu ON vu.id = avr.assigned_verifier_user_id
    WHERE avr.assigned_verifier_user_id = ${auth.userId}
      AND avr.status = ${status}
    ORDER BY avr.requested_at DESC
    LIMIT ${limit}
  `;

  const studentIds = Array.from(new Set(requests.map((entry) => entry.student_id)));
  const studentRows = studentIds.length
    ? await prisma.student.findMany({
        where: {
          id: {
            in: studentIds,
          },
        },
        select: {
          id: true,
          achievements: true,
        },
      })
    : [];

  const achievementMap = new Map<number, TimelineItem[]>();
  for (const row of studentRows) {
    achievementMap.set(row.id, parseTimelineItems(row.achievements));
  }

  return Response.json({
    requests: requests.map((entry) => {
      const achievement = achievementMap.get(entry.student_id)?.[entry.achievement_index];

      return {
        id: entry.id,
        status: entry.status,
        requestedAt: entry.requested_at,
        reviewedAt: entry.reviewed_at,
        rejectionReason: entry.rejection_reason,
        student: {
          id: entry.student_id,
          name: entry.student_name,
        },
        assignedVerifier: {
          id: entry.assigned_verifier_user_id,
          name: entry.assigned_verifier_name,
        },
        achievementIndex: entry.achievement_index,
        achievement: achievement
          ? {
              title: achievement.title,
              period: achievement.period,
              details: achievement.details ?? "",
            }
          : null,
      };
    }),
  });
}

export async function PATCH(request: Request) {
  await ensureRbacBootstrap();

  const auth = await requireVerifierAdminSession();
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

  const payload = body as ReviewPayload;
  const requestId = payload.requestId;

  if (typeof requestId !== "number" || !Number.isInteger(requestId) || requestId <= 0) {
    return Response.json({ error: "requestId must be a positive integer." }, { status: 400 });
  }

  if (payload.action !== "approve" && payload.action !== "reject") {
    return Response.json({ error: "action must be approve or reject." }, { status: 400 });
  }

  if (payload.action === "reject" && (!payload.rejectionReason || !payload.rejectionReason.trim())) {
    return Response.json({ error: "rejectionReason is required when rejecting." }, { status: 400 });
  }

  const prisma = getPrismaClient();
  const requestRows = await prisma.$queryRaw<
    Array<{ id: number; student_id: number; achievement_index: number; assigned_verifier_user_id: number; status: string }>
  >`
    SELECT id, student_id, achievement_index, assigned_verifier_user_id, status
    FROM achievement_verification_requests
    WHERE id = ${requestId}
    LIMIT 1
  `;

  if (requestRows.length === 0) {
    return Response.json({ error: "Verification request not found." }, { status: 404 });
  }

  const verificationRequest = requestRows[0];

  if (verificationRequest.assigned_verifier_user_id !== auth.userId) {
    return Response.json({ error: "This request is assigned to another verifier." }, { status: 403 });
  }

  if (verificationRequest.status !== "PENDING") {
    return Response.json({ error: "Only pending requests can be reviewed." }, { status: 409 });
  }

  const student = await prisma.student.findUnique({
    where: { id: verificationRequest.student_id },
    select: {
      id: true,
      achievements: true,
    },
  });

  if (!student) {
    return Response.json({ error: "Student not found for this request." }, { status: 404 });
  }

  const achievements = parseTimelineItems(student.achievements);
  const target = achievements[verificationRequest.achievement_index];

  if (!target || !target.title || !target.period) {
    return Response.json({ error: "Achievement no longer exists at the requested index." }, { status: 409 });
  }

  const reviewedAt = new Date();
  const nextAchievements = achievements.map((entry, index) => {
    if (index !== verificationRequest.achievement_index) {
      return entry;
    }

    const nextEntry: TimelineItem = { ...entry };
    delete nextEntry.pendingVerification;

    if (payload.action === "approve") {
      nextEntry.verifiedBy = {
        name: auth.userName,
        role: auth.roleLabel,
      };
    } else {
      delete nextEntry.verifiedBy;
    }

    return nextEntry;
  });

  const status: RequestStatus = payload.action === "approve" ? "APPROVED" : "REJECTED";

  try {
    await prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: student.id },
        data: {
          achievements: nextAchievements as Prisma.InputJsonValue,
        },
      });

      await tx.$executeRaw`
        UPDATE achievement_verification_requests
        SET
          status = ${status},
          reviewed_at = ${reviewedAt},
          reviewed_by_id = ${auth.userId},
          rejection_reason = ${payload.action === "reject" ? payload.rejectionReason?.trim() ?? null : null}
        WHERE id = ${verificationRequest.id}
      `;
    });

    return Response.json({
      requestId: verificationRequest.id,
      status,
      reviewedAt: reviewedAt.toISOString(),
    });
  } catch (error) {
    console.error("[/api/administration/achievement-verifications][PATCH] Unexpected error:", error);
    return Response.json({ error: "Unable to review verification request." }, { status: 500 });
  }
}
