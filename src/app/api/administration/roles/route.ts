import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";
import { getPrismaClient } from "@/lib/prisma";
import { ensureRbacBootstrap } from "@/lib/rbac-bootstrap";
import {
  getAllPermissions,
  getAllRolesWithPermissions,
  getUserRbacSnapshot,
  hasPermission,
  RBAC_PERMISSION,
} from "@/lib/rbac";

type RoleAction = "attachPermission" | "detachPermission";

interface RolePatchPayload {
  action: RoleAction;
  roleId: number;
  permissionId: number;
}

interface RoleCreatePayload {
  name: string;
  description?: string;
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

  const canViewRoles =
    hasPermission(auth.permissionKeys, RBAC_PERMISSION.ROLES_CREATE) ||
    hasPermission(auth.permissionKeys, RBAC_PERMISSION.ROLES_UPDATE) ||
    hasPermission(auth.permissionKeys, RBAC_PERMISSION.ROLES_ASSIGN);

  if (!canViewRoles) {
    return Response.json({ error: "You do not have permission to view roles." }, { status: 403 });
  }

  const [roles, permissions] = await Promise.all([getAllRolesWithPermissions(), getAllPermissions()]);

  return Response.json({
    currentUserPermissions: auth.permissionKeys,
    roles,
    permissions,
  });
}

export async function POST(request: Request) {
  await ensureRbacBootstrap();

  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  if (!hasPermission(auth.permissionKeys, RBAC_PERMISSION.ROLES_CREATE)) {
    return Response.json({ error: "You do not have permission to create roles." }, { status: 403 });
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

  const payload = body as Partial<RoleCreatePayload>;
  const name = typeof payload.name === "string" ? payload.name.trim().toUpperCase() : "";
  const description = typeof payload.description === "string" ? payload.description.trim() : "";

  if (!name) {
    return Response.json({ error: "Role name is required." }, { status: 400 });
  }

  const normalized = name.replace(/[^A-Z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");

  if (!normalized) {
    return Response.json({ error: "Role name must contain letters or numbers." }, { status: 400 });
  }

  const prisma = getPrismaClient();

  const existingRoleRows = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id
    FROM roles
    WHERE name = ${normalized}
    LIMIT 1
  `;

  if (existingRoleRows.length > 0) {
    return Response.json({ error: "Role already exists." }, { status: 409 });
  }

  try {
    await prisma.$executeRaw`
      INSERT INTO roles (name, description, is_system, createdAt, updatedAt)
      VALUES (${normalized}, ${description || null}, false, NOW(3), NOW(3))
    `;
  } catch {
    return Response.json({ error: "Role could not be created." }, { status: 500 });
  }

  const roles = await getAllRolesWithPermissions();
  return Response.json({ roles }, { status: 201 });
}

export async function PATCH(request: Request) {
  await ensureRbacBootstrap();

  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  if (!hasPermission(auth.permissionKeys, RBAC_PERMISSION.ROLES_UPDATE)) {
    return Response.json({ error: "You do not have permission to update role permissions." }, { status: 403 });
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

  const payload = body as Partial<RolePatchPayload>;
  const action = payload.action;
  const roleId = parsePositiveInteger(payload.roleId);
  const permissionId = parsePositiveInteger(payload.permissionId);

  if (action !== "attachPermission" && action !== "detachPermission") {
    return Response.json({ error: "action must be attachPermission or detachPermission." }, { status: 400 });
  }

  if (!roleId || !permissionId) {
    return Response.json({ error: "roleId and permissionId must be positive integers." }, { status: 400 });
  }

  const prisma = getPrismaClient();

  const roleRows = await prisma.$queryRaw<Array<{ id: number; is_system: number }>>`
    SELECT id, is_system
    FROM roles
    WHERE id = ${roleId}
    LIMIT 1
  `;

  if (roleRows.length === 0) {
    return Response.json({ error: "Role not found." }, { status: 404 });
  }

  const permissionRows = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id
    FROM permissions
    WHERE id = ${permissionId}
    LIMIT 1
  `;

  if (permissionRows.length === 0) {
    return Response.json({ error: "Permission not found." }, { status: 404 });
  }

  if (action === "attachPermission") {
    await prisma.$executeRaw`
      INSERT IGNORE INTO role_permissions (role_id, permission_id)
      VALUES (${roleId}, ${permissionId})
    `;
  } else {
    await prisma.$executeRaw`
      DELETE FROM role_permissions
      WHERE role_id = ${roleId} AND permission_id = ${permissionId}
    `;
  }

  const roles = await getAllRolesWithPermissions();
  return Response.json({ roles });
}
