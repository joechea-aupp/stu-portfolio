import { getPrismaClient } from "@/lib/prisma";

let didBootstrap = false;
let bootstrapPromise: Promise<void> | null = null;

async function runBootstrap() {
  const prisma = getPrismaClient();

  const roleTableRows = await prisma.$queryRaw<Array<{ total: number }>>`
    SELECT COUNT(*) AS total
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'roles'
  `;

  if ((roleTableRows[0]?.total ?? 0) === 0) {
    return;
  }

  await prisma.$executeRaw`
    INSERT INTO permissions (\`key\`, label, description, createdAt, updatedAt)
    SELECT seeded.key_name, seeded.label_name, seeded.description_name, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
    FROM (
      SELECT 'users.manage' AS key_name, 'Manage Users' AS label_name, 'Enable, disable, edit, and reset user accounts.' AS description_name
      UNION ALL SELECT 'roles.create', 'Create Roles', 'Create new administration roles.'
      UNION ALL SELECT 'roles.update', 'Update Roles', 'Attach or detach permissions from roles.'
      UNION ALL SELECT 'roles.assign', 'Assign Roles', 'Assign roles to users.'
    ) seeded
    WHERE NOT EXISTS (
      SELECT 1
      FROM permissions p
      WHERE p.\`key\` = seeded.key_name
    )
  `;

  await prisma.$executeRaw`
    INSERT INTO roles (name, description, is_system, createdAt, updatedAt)
    SELECT seeded.role_name, seeded.role_description, seeded.system_role, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
    FROM (
      SELECT 'ADMIN_SUPER' AS role_name, 'Full administration access.' AS role_description, true AS system_role
      UNION ALL SELECT 'ADMIN_MANAGER', 'Management access for users and role assignment.', true
      UNION ALL SELECT 'ADMIN_STAFF', 'Standard administration access.', true
      UNION ALL SELECT 'ROLE_ASSIGNER', 'Legacy bridge role for users who could assign roles.', true
    ) seeded
    WHERE NOT EXISTS (
      SELECT 1
      FROM roles r
      WHERE r.name = seeded.role_name
    )
  `;

  await prisma.$executeRaw`
    INSERT IGNORE INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM roles r
    JOIN permissions p ON p.\`key\` IN ('users.manage', 'roles.create', 'roles.update', 'roles.assign')
    WHERE r.name = 'ADMIN_SUPER'
  `;

  await prisma.$executeRaw`
    INSERT IGNORE INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM roles r
    JOIN permissions p ON p.\`key\` IN ('users.manage', 'roles.assign')
    WHERE r.name = 'ADMIN_MANAGER'
  `;

  await prisma.$executeRaw`
    INSERT IGNORE INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM roles r
    JOIN permissions p ON p.\`key\` IN ('users.manage')
    WHERE r.name = 'ADMIN_STAFF'
  `;

  await prisma.$executeRaw`
    INSERT IGNORE INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM roles r
    JOIN permissions p ON p.\`key\` IN ('roles.assign')
    WHERE r.name = 'ROLE_ASSIGNER'
  `;

  const hasLegacyColumnsRows = await prisma.$queryRaw<Array<{ total: number }>>`
    SELECT COUNT(*) AS total
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND column_name IN ('administration_role', 'can_assign_roles')
  `;

  if ((hasLegacyColumnsRows[0]?.total ?? 0) >= 2) {
    await prisma.$executeRaw`
      INSERT IGNORE INTO user_roles (user_id, role_id)
      SELECT u.id, r.id
      FROM users u
      JOIN roles r ON r.name = COALESCE(u.administration_role, 'ADMIN_STAFF')
      WHERE u.user_type = 'ADMINISTRATION'
    `;

    await prisma.$executeRaw`
      INSERT IGNORE INTO user_roles (user_id, role_id)
      SELECT u.id, r.id
      FROM users u
      JOIN roles r ON r.name = 'ROLE_ASSIGNER'
      WHERE u.user_type = 'ADMINISTRATION' AND u.can_assign_roles = true
    `;
  } else {
    await prisma.$executeRaw`
      INSERT IGNORE INTO user_roles (user_id, role_id)
      SELECT u.id, r.id
      FROM users u
      JOIN roles r ON r.name = 'ADMIN_STAFF'
      WHERE u.user_type = 'ADMINISTRATION'
    `;
  }

  didBootstrap = true;
}

/**
 * Initializes RBAC seed data at runtime to keep Prisma migration files DDL-only
 * for environments where shadow DB users are denied DML privileges.
 */
export async function ensureRbacBootstrap() {
  if (didBootstrap) {
    return;
  }

  if (!bootstrapPromise) {
    bootstrapPromise = runBootstrap().finally(() => {
      bootstrapPromise = null;
    });
  }

  await bootstrapPromise;
}
