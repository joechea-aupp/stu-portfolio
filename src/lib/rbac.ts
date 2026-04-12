import { getPrismaClient } from "@/lib/prisma";

export const RBAC_PERMISSION = {
  USERS_MANAGE: "users.manage",
  USERS_ACCESS: "users.access",
  USERS_EDIT: "users.edit",
  USERS_TOGGLE_ACTIVE: "users.toggle-active",
  USERS_RESET_PASSWORD: "users.reset-password",
  ROLES_CREATE: "roles.create",
  ROLES_UPDATE: "roles.update",
  ROLES_ASSIGN: "roles.assign",
  ACHIEVEMENTS_VERIFY: "achievements.verify",
} as const;

export type RbacPermission = (typeof RBAC_PERMISSION)[keyof typeof RBAC_PERMISSION];

export interface RoleSummary {
  id: number;
  name: string;
  description: string | null;
  isSystem: boolean;
}

export interface PermissionSummary {
  id: number;
  key: string;
  label: string;
  description: string | null;
}

export interface UserRbacSnapshot {
  userId: string;
  userType: "STUDENT" | "ADMINISTRATION";
  isActive: boolean;
  roles: RoleSummary[];
  permissionKeys: string[];
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

export function hasPermission(permissionKeys: string[], permission: string): boolean {
  return permissionKeys.includes(permission);
}

export async function getUserRbacSnapshot(userId: string): Promise<UserRbacSnapshot | null> {
  const prisma = getPrismaClient();

  const userRows = await prisma.$queryRaw<Array<{ id: string; user_type: "STUDENT" | "ADMINISTRATION"; is_active: unknown }>>`
    SELECT id, user_type, is_active
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

  if (userRows.length === 0) {
    return null;
  }

  const roles = await prisma.$queryRaw<Array<{ id: number; name: string; description: string | null; is_system: unknown }>>`
    SELECT r.id, r.name, r.description, r.is_system
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = ${userId}
    ORDER BY r.name ASC
  `;

  const permissionRows = await prisma.$queryRaw<Array<{ permission_key: string }>>`
    SELECT DISTINCT p.\`key\` AS permission_key
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = ${userId}
    ORDER BY p.\`key\` ASC
  `;

  return {
    userId: userRows[0].id,
    userType: userRows[0].user_type,
    isActive: coerceBoolean(userRows[0].is_active),
    roles: roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: coerceBoolean(role.is_system),
    })),
    permissionKeys: permissionRows.map((permission) => permission.permission_key),
  };
}

export async function getAllRolesWithPermissions(): Promise<
  Array<RoleSummary & { permissions: PermissionSummary[] }>
> {
  const prisma = getPrismaClient();

  const roles = await prisma.$queryRaw<Array<{ id: number; name: string; description: string | null; is_system: unknown }>>`
    SELECT id, name, description, is_system
    FROM roles
    ORDER BY name ASC
  `;

  const rolePermissions = await prisma.$queryRaw<
    Array<{
      role_id: number;
      permission_id: number;
      permission_key: string;
      permission_label: string;
      permission_description: string | null;
    }>
  >`
    SELECT rp.role_id, p.id AS permission_id, p.\`key\` AS permission_key, p.label AS permission_label, p.description AS permission_description
    FROM role_permissions rp
    JOIN permissions p ON p.id = rp.permission_id
    ORDER BY rp.role_id ASC, p.\`key\` ASC
  `;

  const permissionsByRole = new Map<number, PermissionSummary[]>();

  for (const entry of rolePermissions) {
    const current = permissionsByRole.get(entry.role_id) ?? [];
    current.push({
      id: entry.permission_id,
      key: entry.permission_key,
      label: entry.permission_label,
      description: entry.permission_description,
    });
    permissionsByRole.set(entry.role_id, current);
  }

  return roles.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    isSystem: coerceBoolean(role.is_system),
    permissions: permissionsByRole.get(role.id) ?? [],
  }));
}

export async function getAllPermissions(): Promise<PermissionSummary[]> {
  const prisma = getPrismaClient();

  const rows = await prisma.$queryRaw<Array<{ id: number; permission_key: string; label: string; description: string | null }>>`
    SELECT id, \`key\` AS permission_key, label, description
    FROM permissions
    ORDER BY \`key\` ASC
  `;

  return rows.map((row) => ({
    id: row.id,
    key: row.permission_key,
    label: row.label,
    description: row.description,
  }));
}
