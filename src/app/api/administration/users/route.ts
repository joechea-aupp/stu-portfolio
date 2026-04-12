import { cookies } from "next/headers";
import { getPrismaClient } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";
import { hashPassword } from "@/lib/password";
import { ensureRbacBootstrap } from "@/lib/rbac-bootstrap";
import {
  getAllPermissions,
  getAllRolesWithPermissions,
  getUserRbacSnapshot,
  hasPermission,
  RBAC_PERMISSION,
} from "@/lib/rbac";

type UserType = "STUDENT" | "ADMINISTRATION";
type UserAction = "enable" | "disable" | "edit" | "resetPassword" | "assignRole";

interface UpdatePayload {
  userId: number;
  action: UserAction;
  name?: string;
  email?: string;
  userType?: UserType;
  newPassword?: string;
  roleId?: number | null;
}

function parseSessionUserId(rawCookie: string | undefined): number | null {
  if (!rawCookie) {
    return null;
  }

  const session = verifySessionToken(rawCookie);
  return session?.userId ?? null;
}

function parsePositiveInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
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

async function buildUserSummary(userId: number) {
  const prisma = getPrismaClient();

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      user_type: true,
      is_active: true,
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

  const rbac = await getUserRbacSnapshot(user.id);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    userType: user.user_type,
    isActive: user.is_active,
    createdAt: user.createdAt,
    roles: rbac?.roles ?? [],
    permissionKeys: rbac?.permissionKeys ?? [],
    hasProfile: user.user_type === "ADMINISTRATION" ? Boolean(user.administration) : Boolean(user.student),
  };
}

async function getDefaultAdministrationRoleId() {
  const prisma = getPrismaClient();
  const rows = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id
    FROM roles
    WHERE name = 'ADMIN_STAFF'
    LIMIT 1
  `;

  return rows.length > 0 ? rows[0].id : null;
}

export async function GET() {
  await ensureRbacBootstrap();

  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  const canAccessUsers = hasPermission(auth.permissionKeys, RBAC_PERMISSION.USERS_ACCESS);

  if (!canAccessUsers) {
    return Response.json({ error: "You do not have permission to access users." }, { status: 403 });
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
      is_active: true,
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

  const userRoleRows = await prisma.$queryRaw<Array<{ user_id: number; role_id: number; role_name: string }>>`
    SELECT ur.user_id, r.id AS role_id, r.name AS role_name
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    ORDER BY ur.user_id ASC, r.name ASC
  `;

  const userPermissionRows = await prisma.$queryRaw<Array<{ user_id: number; permission_key: string }>>`
    SELECT DISTINCT ur.user_id, p.key AS permission_key
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    ORDER BY ur.user_id ASC, p.key ASC
  `;

  const rolesByUserId = new Map<number, Array<{ id: number; name: string }>>();
  const permissionsByUserId = new Map<number, string[]>();

  for (const row of userRoleRows) {
    const current = rolesByUserId.get(row.user_id) ?? [];
    current.push({ id: row.role_id, name: row.role_name });
    rolesByUserId.set(row.user_id, current);
  }

  for (const row of userPermissionRows) {
    const current = permissionsByUserId.get(row.user_id) ?? [];
    current.push(row.permission_key);
    permissionsByUserId.set(row.user_id, current);
  }

  const [roles, permissions] = await Promise.all([getAllRolesWithPermissions(), getAllPermissions()]);

  return Response.json({
    currentUserId: auth.userId,
    currentUserPermissions: auth.permissionKeys,
    roles,
    permissions,
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.user_type,
      isActive: user.is_active,
      createdAt: user.createdAt,
      roles: rolesByUserId.get(user.id) ?? [],
      permissionKeys: permissionsByUserId.get(user.id) ?? [],
      hasProfile: user.user_type === "ADMINISTRATION" ? Boolean(user.administration) : Boolean(user.student),
    })),
  });
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

  const payload = body as Partial<UpdatePayload>;
  const userId = parsePositiveInteger(payload.userId);

  if (!userId) {
    return Response.json({ error: "userId must be a positive integer." }, { status: 400 });
  }

  const action = payload.action;
  if (action !== "enable" && action !== "disable" && action !== "edit" && action !== "resetPassword" && action !== "assignRole") {
    return Response.json({ error: "action must be enable, disable, edit, resetPassword, or assignRole." }, { status: 400 });
  }

  const prisma = getPrismaClient();
  const target = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      user_type: true,
    },
  });

  if (!target) {
    return Response.json({ error: "User not found." }, { status: 404 });
  }

  const canEditUsers = hasPermission(auth.permissionKeys, RBAC_PERMISSION.USERS_EDIT);
  const canToggleUserActive = hasPermission(auth.permissionKeys, RBAC_PERMISSION.USERS_TOGGLE_ACTIVE);
  const canResetUserPassword = hasPermission(auth.permissionKeys, RBAC_PERMISSION.USERS_RESET_PASSWORD);
  const canAssignRoles = hasPermission(auth.permissionKeys, RBAC_PERMISSION.ROLES_ASSIGN);

  if (action === "assignRole") {
    if (!canAssignRoles) {
      return Response.json({ error: "You do not have permission to assign roles." }, { status: 403 });
    }

    if (target.user_type !== "ADMINISTRATION") {
      return Response.json({ error: "Roles can only be assigned to administration accounts." }, { status: 400 });
    }

    const roleId = payload.roleId === null ? null : parsePositiveInteger(payload.roleId);

    if (payload.roleId !== null && !roleId) {
      return Response.json({ error: "roleId must be a positive integer or null." }, { status: 400 });
    }

    if (roleId) {
      const roleRows = await prisma.$queryRaw<Array<{ id: number }>>`
        SELECT id
        FROM roles
        WHERE id = ${roleId}
        LIMIT 1
      `;

      if (roleRows.length === 0) {
        return Response.json({ error: "Role not found." }, { status: 404 });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        DELETE FROM user_roles
        WHERE user_id = ${target.id}
      `;

      if (roleId) {
        await tx.$executeRaw`
          INSERT INTO user_roles (user_id, role_id)
          VALUES (${target.id}, ${roleId})
        `;
      }
    });

    const updated = await buildUserSummary(target.id);
    return Response.json({ updated });
  }

  if (action === "disable") {
    if (!canToggleUserActive) {
      return Response.json({ error: "You do not have permission to disable users." }, { status: 403 });
    }

    if (target.id === auth.userId) {
      return Response.json({ error: "You cannot disable your own account." }, { status: 400 });
    }

    await prisma.users.update({
      where: { id: target.id },
      data: {
        is_active: false,
      },
    });

    const updated = await buildUserSummary(target.id);
    return Response.json({ updated });
  }

  if (action === "enable") {
    if (!canToggleUserActive) {
      return Response.json({ error: "You do not have permission to enable users." }, { status: 403 });
    }

    await prisma.users.update({
      where: { id: target.id },
      data: {
        is_active: true,
      },
    });

    const updated = await buildUserSummary(target.id);
    return Response.json({ updated });
  }

  if (action === "resetPassword") {
    if (!canResetUserPassword) {
      return Response.json({ error: "You do not have permission to reset passwords." }, { status: 403 });
    }

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

  if (!canEditUsers) {
    return Response.json({ error: "You do not have permission to edit users." }, { status: 403 });
  }

  const trimmedName = typeof payload.name === "string" ? payload.name.trim() : "";
  const trimmedEmail = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const normalizedUserType = typeof payload.userType === "string" ? payload.userType.trim().toUpperCase() : "";

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

    updateData.user_type = normalizedUserType as UserType;
  }

  if (Object.keys(updateData).length === 0) {
    return Response.json({ error: "Provide at least one editable field." }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.users.update({
        where: { id: target.id },
        data: updateData,
      });

      if (updateData.user_type === "STUDENT") {
        await tx.$executeRaw`
          DELETE FROM user_roles
          WHERE user_id = ${target.id}
        `;
      }

      if (updateData.user_type === "ADMINISTRATION") {
        const defaultRoleId = await getDefaultAdministrationRoleId();

        if (!defaultRoleId) {
          throw new Error("default-administration-role-missing");
        }

        const roleCountRows = await tx.$queryRaw<Array<{ total: number }>>`
          SELECT COUNT(*) AS total
          FROM user_roles
          WHERE user_id = ${target.id}
        `;

        if ((roleCountRows[0]?.total ?? 0) === 0) {
          await tx.$executeRaw`
            INSERT INTO user_roles (user_id, role_id)
            VALUES (${target.id}, ${defaultRoleId})
          `;
        }
      }
    });
  } catch (error) {
    if (isKnownPrismaErrorWithCode(error, "P2002")) {
      return Response.json({ error: "Email is already in use." }, { status: 409 });
    }

    if (error instanceof Error && error.message === "default-administration-role-missing") {
      return Response.json({ error: "Default administration role is not configured." }, { status: 500 });
    }

    return Response.json({ error: "Failed to update user." }, { status: 500 });
  }

  const updated = await buildUserSummary(target.id);
  return Response.json({ updated });
}
