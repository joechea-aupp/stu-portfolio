import { cookies } from "next/headers";
import { getPrismaClient } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";
import { ensureRbacBootstrap } from "@/lib/rbac-bootstrap";
import { getUserRbacSnapshot, hasPermission, RBAC_PERMISSION } from "@/lib/rbac";
import { isValidUuid } from "@/lib/uuid";
import { normalizeMajorName } from "@/lib/majors";

type MajorAction = "edit" | "toggleActive";

interface MajorPatchPayload {
  majorId?: string;
  action?: MajorAction;
  name?: string;
}

function parseSessionUserId(rawCookie: string | undefined): string | null {
  if (!rawCookie) {
    return null;
  }

  const session = verifySessionToken(rawCookie);
  return session?.userId ?? null;
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

async function requireAdminSession() {
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
    },
  });

  if (!user) {
    return { ok: false as const, response: Response.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  const snapshot = await getUserRbacSnapshot(user.id);

  if (!snapshot || !snapshot.isActive || snapshot.userType !== "ADMINISTRATION") {
    cookieStore.delete(SESSION_COOKIE_NAME);
    return { ok: false as const, response: Response.json({ error: "Forbidden." }, { status: 403 }) };
  }

  return {
    ok: true as const,
    userId: snapshot.userId,
    permissionKeys: snapshot.permissionKeys,
  };
}

export async function GET() {
  await ensureRbacBootstrap();

  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  if (!hasPermission(auth.permissionKeys, RBAC_PERMISSION.MAJORS_VIEW)) {
    return Response.json({ error: "You do not have permission to view majors." }, { status: 403 });
  }

  const prisma = getPrismaClient();
  const majors = await prisma.major.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      is_active: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          students: true,
        },
      },
    },
  });

  return Response.json({
    currentUserPermissions: auth.permissionKeys,
    majors: majors.map((major) => ({
      id: major.id,
      name: major.name,
      isActive: major.is_active,
      studentCount: major._count.students,
      createdAt: major.createdAt,
      updatedAt: major.updatedAt,
    })),
  });
}

export async function POST(request: Request) {
  await ensureRbacBootstrap();

  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  if (!hasPermission(auth.permissionKeys, RBAC_PERMISSION.MAJORS_CREATE)) {
    return Response.json({ error: "You do not have permission to create majors." }, { status: 403 });
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

  const rawName = typeof (body as { name?: unknown }).name === "string" ? (body as { name: string }).name : "";
  const normalizedName = normalizeMajorName(rawName);

  if (!normalizedName) {
    return Response.json({ error: "name is required." }, { status: 400 });
  }

  const prisma = getPrismaClient();

  try {
    const created = await prisma.major.create({
      data: {
        name: normalizedName,
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        is_active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return Response.json(
      {
        major: {
          id: created.id,
          name: created.name,
          isActive: created.is_active,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (isKnownPrismaErrorWithCode(error, "P2002")) {
      return Response.json({ error: "A major with this name already exists." }, { status: 409 });
    }

    return Response.json({ error: "Unable to create major." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  await ensureRbacBootstrap();

  const auth = await requireAdminSession();
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

  const payload = body as Partial<MajorPatchPayload>;

  if (!payload.majorId || !isValidUuid(payload.majorId)) {
    return Response.json({ error: "majorId must be a UUID." }, { status: 400 });
  }

  if (payload.action !== "edit" && payload.action !== "toggleActive") {
    return Response.json({ error: "action must be edit or toggleActive." }, { status: 400 });
  }

  const prisma = getPrismaClient();
  const target = await prisma.major.findUnique({
    where: {
      id: payload.majorId,
    },
    select: {
      id: true,
      is_active: true,
    },
  });

  if (!target) {
    return Response.json({ error: "Major not found." }, { status: 404 });
  }

  if (payload.action === "edit") {
    if (!hasPermission(auth.permissionKeys, RBAC_PERMISSION.MAJORS_EDIT)) {
      return Response.json({ error: "You do not have permission to edit majors." }, { status: 403 });
    }

    const normalizedName = typeof payload.name === "string" ? normalizeMajorName(payload.name) : "";

    if (!normalizedName) {
      return Response.json({ error: "name is required when action is edit." }, { status: 400 });
    }

    try {
      const updated = await prisma.major.update({
        where: {
          id: payload.majorId,
        },
        data: {
          name: normalizedName,
        },
        select: {
          id: true,
          name: true,
          is_active: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return Response.json({
        major: {
          id: updated.id,
          name: updated.name,
          isActive: updated.is_active,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        },
      });
    } catch (error) {
      if (isKnownPrismaErrorWithCode(error, "P2002")) {
        return Response.json({ error: "A major with this name already exists." }, { status: 409 });
      }

      return Response.json({ error: "Unable to update major." }, { status: 500 });
    }
  }

  if (!hasPermission(auth.permissionKeys, RBAC_PERMISSION.MAJORS_TOGGLE_ACTIVE)) {
    return Response.json({ error: "You do not have permission to change major status." }, { status: 403 });
  }

  const updated = await prisma.major.update({
    where: {
      id: payload.majorId,
    },
    data: {
      is_active: !target.is_active,
    },
    select: {
      id: true,
      name: true,
      is_active: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return Response.json({
    major: {
      id: updated.id,
      name: updated.name,
      isActive: updated.is_active,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    },
  });
}
