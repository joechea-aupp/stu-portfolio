import { cookies } from "next/headers";
import { getPrismaClient } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";
import { hashPassword } from "@/lib/password";

type UserType = "STUDENT" | "ADMINISTRATION";
type AdministrationRole = "ADMIN_SUPER" | "ADMIN_MANAGER" | "ADMIN_STAFF";
type UserAction = "enable" | "disable" | "edit" | "resetPassword";

interface UpdatePayload {
  userId: number;
  action: UserAction;
  name?: string;
  email?: string;
  userType?: UserType;
  administrationRole?: AdministrationRole;
  canAssignRoles?: boolean;
  newPassword?: string;
}

function parseSessionUserId(rawCookie: string | undefined): number | null {
  if (!rawCookie) {
    return null;
  }

  const session = verifySessionToken(rawCookie);
  return session?.userId ?? null;
}

function coerceBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "bigint") {
    return value !== BigInt(0);
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true";
  }

  return false;
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

function parseOptionalBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  return null;
}

function parseAdministrationRole(value: unknown): AdministrationRole | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (normalized === "ADMIN_SUPER" || normalized === "ADMIN_MANAGER" || normalized === "ADMIN_STAFF") {
    return normalized;
  }

  return null;
}

function parseInteger(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

async function getUserSecurity(userId: number): Promise<{
  administrationRole: AdministrationRole | null;
  canAssignRoles: boolean;
}> {
  const prisma = getPrismaClient();
  const rows = await prisma.$queryRaw<Array<{ administration_role: unknown; can_assign_roles: unknown }>>`
    SELECT administration_role, can_assign_roles
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return { administrationRole: null, canAssignRoles: false };
  }

  return {
    administrationRole: parseAdministrationRole(rows[0].administration_role),
    canAssignRoles: coerceBoolean(rows[0].can_assign_roles),
  };
}

async function getActiveRoleAssignerCount(): Promise<number> {
  const prisma = getPrismaClient();
  const rows = await prisma.$queryRaw<Array<{ total: unknown }>>`
    SELECT COUNT(*) AS total
    FROM users
    WHERE user_type = 'ADMINISTRATION'
      AND can_assign_roles = true
      AND is_active = true
  `;

  return rows.length > 0 ? parseInteger(rows[0].total) : 0;
}

async function isBootstrapRoleAssigner(userId: number): Promise<boolean> {
  const assignerCount = await getActiveRoleAssignerCount();
  if (assignerCount > 0) {
    return false;
  }

  const prisma = getPrismaClient();
  const firstActiveAdminRows = await prisma.$queryRaw<Array<{ id: unknown }>>`
    SELECT id
    FROM users
    WHERE user_type = 'ADMINISTRATION'
      AND is_active = true
    ORDER BY createdAt ASC, id ASC
    LIMIT 1
  `;

  if (firstActiveAdminRows.length === 0) {
    return false;
  }

  return parseInteger(firstActiveAdminRows[0].id) === userId;
}

async function getIsUserActive(userId: number): Promise<boolean> {
  const prisma = getPrismaClient();
  const rows = await prisma.$queryRaw<Array<{ is_active: unknown }>>`
    SELECT is_active
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

  return rows.length > 0 ? coerceBoolean(rows[0].is_active) : false;
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

  if (user.user_type !== "ADMINISTRATION") {
    return { ok: false as const, response: Response.json({ error: "Forbidden." }, { status: 403 }) };
  }

  const isActive = await getIsUserActive(user.id);
  if (!isActive) {
    cookieStore.delete(SESSION_COOKIE_NAME);
    return { ok: false as const, response: Response.json({ error: "Forbidden." }, { status: 403 }) };
  }

  const security = await getUserSecurity(user.id);

  const bootstrapCanAssignRoles = !security.canAssignRoles && (await isBootstrapRoleAssigner(user.id));

  return {
    ok: true as const,
    userId: user.id,
    administrationRole: security.administrationRole,
    canAssignRoles: security.canAssignRoles || bootstrapCanAssignRoles,
  };
}

async function buildUserSummary(userId: number) {
  const prisma = getPrismaClient();

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      user_type: true,
      createdAt: true,
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
    return null;
  }

  const isActive = await getIsUserActive(user.id);
  const security = await getUserSecurity(user.id);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    userType: user.user_type,
    administrationRole: security.administrationRole,
    canAssignRoles: security.canAssignRoles,
    isActive,
    createdAt: user.createdAt,
    hasProfile: user.user_type === "ADMINISTRATION" ? Boolean(user.administration) : Boolean(user.student),
  };
}

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  const prisma = getPrismaClient();
  const users = await prisma.users.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      user_type: true,
      createdAt: true,
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

  const userSecurityRows = await prisma.$queryRaw<Array<{
    id: number;
    is_active: unknown;
    administration_role: unknown;
    can_assign_roles: unknown;
  }>>`
    SELECT id, is_active, administration_role, can_assign_roles
    FROM users
  `;

  const securityByUserId = new Map<
    number,
    { isActive: boolean; administrationRole: AdministrationRole | null; canAssignRoles: boolean }
  >(
    userSecurityRows.map((row) => [
      row.id,
      {
        isActive: coerceBoolean(row.is_active),
        administrationRole: parseAdministrationRole(row.administration_role),
        canAssignRoles: coerceBoolean(row.can_assign_roles),
      },
    ]),
  );

  return Response.json({
    currentUserId: auth.userId,
    currentUserAdministrationRole: auth.administrationRole,
    currentUserCanAssignRoles: auth.canAssignRoles,
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.user_type,
      administrationRole: securityByUserId.get(user.id)?.administrationRole ?? null,
      canAssignRoles: securityByUserId.get(user.id)?.canAssignRoles ?? false,
      isActive: securityByUserId.get(user.id)?.isActive ?? false,
      createdAt: user.createdAt,
      hasProfile: user.user_type === "ADMINISTRATION" ? Boolean(user.administration) : Boolean(user.student),
    })),
  });
}

export async function PATCH(request: Request) {
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

  const payload = body as Partial<UpdatePayload>;
  const userId =
    typeof payload.userId === "number"
      ? payload.userId
      : typeof payload.userId === "string"
        ? Number.parseInt(payload.userId, 10)
        : NaN;

  if (!Number.isFinite(userId) || userId <= 0) {
    return Response.json({ error: "userId must be a positive integer." }, { status: 400 });
  }

  const action = payload.action;
  if (action !== "enable" && action !== "disable" && action !== "edit" && action !== "resetPassword") {
    return Response.json({ error: "action must be enable, disable, edit, or resetPassword." }, { status: 400 });
  }

  const prisma = getPrismaClient();
  const target = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      user_type: true,
    },
  });

  if (!target) {
    return Response.json({ error: "User not found." }, { status: 404 });
  }

  const targetSecurity = await getUserSecurity(target.id);
  const targetIsActive = await getIsUserActive(target.id);

  if (action === "disable") {
    if (target.id === auth.userId) {
      return Response.json({ error: "You cannot disable your own account." }, { status: 400 });
    }

    if (targetSecurity.canAssignRoles && target.user_type === "ADMINISTRATION" && targetIsActive) {
      const assignerCount = await getActiveRoleAssignerCount();
      if (assignerCount <= 1) {
        return Response.json(
          { error: "Cannot disable the last active role-assignment administrator." },
          { status: 400 },
        );
      }
    }

    await prisma.$executeRaw`
      UPDATE users
      SET is_active = false
      WHERE id = ${target.id}
    `;

    const updated = await buildUserSummary(target.id);
    return Response.json({ updated });
  }

  if (action === "enable") {
    await prisma.$executeRaw`
      UPDATE users
      SET is_active = true
      WHERE id = ${target.id}
    `;

    const updated = await buildUserSummary(target.id);
    return Response.json({ updated });
  }

  if (action === "resetPassword") {
    const newPassword = typeof payload.newPassword === "string" ? payload.newPassword : "";
    if (newPassword.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    await prisma.users.update({
      where: { id: target.id },
      data: {
        password: hashPassword(newPassword),
      },
    });

    const updated = await buildUserSummary(target.id);
    return Response.json({ updated });
  }

  const trimmedName = typeof payload.name === "string" ? payload.name.trim() : "";
  const trimmedEmail = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const normalizedUserType =
    typeof payload.userType === "string" ? payload.userType.trim().toUpperCase() : "";
  const normalizedAdministrationRole =
    typeof payload.administrationRole === "string"
      ? payload.administrationRole.trim().toUpperCase()
      : "";
  const canAssignRolesUpdate = parseOptionalBoolean(payload.canAssignRoles);

  const updateData: {
    name?: string;
    email?: string;
    user_type?: UserType;
  } = {};

  if (trimmedName) {
    updateData.name = trimmedName;
  }

  if (trimmedEmail) {
    if (!trimmedEmail.includes("@")) {
      return Response.json({ error: "Please enter a valid email." }, { status: 400 });
    }

    updateData.email = trimmedEmail;
  }

  if (normalizedUserType) {
    if (normalizedUserType !== "STUDENT" && normalizedUserType !== "ADMINISTRATION") {
      return Response.json({ error: "userType must be STUDENT or ADMINISTRATION." }, { status: 400 });
    }

    if (normalizedUserType !== target.user_type && !auth.canAssignRoles) {
      return Response.json({ error: "You do not have permission to change account type." }, { status: 403 });
    }

    if (
      target.user_type === "ADMINISTRATION" &&
      targetSecurity.canAssignRoles &&
      normalizedUserType === "STUDENT" &&
      targetIsActive
    ) {
      const assignerCount = await getActiveRoleAssignerCount();
      if (assignerCount <= 1) {
        return Response.json(
          { error: "Cannot remove role-assignment access from the last active administrator." },
          { status: 400 },
        );
      }
    }

    updateData.user_type = normalizedUserType as UserType;
  }

  if (
    normalizedAdministrationRole &&
    normalizedAdministrationRole !== "ADMIN_SUPER" &&
    normalizedAdministrationRole !== "ADMIN_MANAGER" &&
    normalizedAdministrationRole !== "ADMIN_STAFF"
  ) {
    return Response.json(
      { error: "administrationRole must be ADMIN_SUPER, ADMIN_MANAGER, or ADMIN_STAFF." },
      { status: 400 },
    );
  }

  const hasSecurityFieldUpdate = Boolean(normalizedAdministrationRole) || canAssignRolesUpdate !== null;

  if (hasSecurityFieldUpdate && !auth.canAssignRoles) {
    return Response.json({ error: "You do not have permission to assign roles." }, { status: 403 });
  }

  const effectiveUserType = (updateData.user_type ?? target.user_type) as UserType;
  if (hasSecurityFieldUpdate && effectiveUserType !== "ADMINISTRATION") {
    return Response.json(
      { error: "Roles and role-assignment permissions can only be assigned to administration accounts." },
      { status: 400 },
    );
  }

  const nextCanAssignRoles =
    effectiveUserType === "ADMINISTRATION"
      ? (canAssignRolesUpdate ?? targetSecurity.canAssignRoles)
      : false;

  if (
    target.user_type === "ADMINISTRATION" &&
    targetSecurity.canAssignRoles &&
    !nextCanAssignRoles &&
    targetIsActive
  ) {
    const assignerCount = await getActiveRoleAssignerCount();
    if (assignerCount <= 1) {
      return Response.json(
        { error: "Cannot remove role-assignment access from the last active administrator." },
        { status: 400 },
      );
    }
  }

  if (Object.keys(updateData).length === 0 && !hasSecurityFieldUpdate) {
    return Response.json({ error: "Provide at least one editable field." }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) {
        await tx.users.update({
          where: { id: target.id },
          data: updateData,
        });
      }

      const nextAdministrationRole: AdministrationRole | null =
        effectiveUserType === "ADMINISTRATION"
          ? (normalizedAdministrationRole
              ? (normalizedAdministrationRole as AdministrationRole)
              : (targetSecurity.administrationRole ?? "ADMIN_STAFF"))
          : null;

      await tx.$executeRaw`
        UPDATE users
        SET administration_role = ${nextAdministrationRole},
            can_assign_roles = ${nextCanAssignRoles}
        WHERE id = ${target.id}
      `;
    });
  } catch (error) {
    if (isKnownPrismaErrorWithCode(error, "P2002")) {
      return Response.json({ error: "Email is already in use." }, { status: 409 });
    }

    return Response.json({ error: "Failed to update user." }, { status: 500 });
  }

  const updated = await buildUserSummary(target.id);
  return Response.json({ updated });
}
