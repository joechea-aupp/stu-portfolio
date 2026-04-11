-- Create scalable RBAC tables for roles and permissions.
CREATE TABLE `roles` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `is_system` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `roles_name_key`(`name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `permissions` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(191) NOT NULL,
  `label` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `permissions_key_key`(`key`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `role_permissions` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `role_id` INTEGER NOT NULL,
  `permission_id` INTEGER NOT NULL,

  UNIQUE INDEX `role_permissions_role_id_permission_id_key`(`role_id`, `permission_id`),
  INDEX `role_permissions_permission_id_idx`(`permission_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `user_roles` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `user_id` INTEGER NOT NULL,
  `role_id` INTEGER NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `user_roles_user_id_role_id_key`(`user_id`, `role_id`),
  INDEX `user_roles_role_id_idx`(`role_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_role_id_fkey`
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_permission_id_fkey`
  FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_roles`
  ADD CONSTRAINT `user_roles_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_roles`
  ADD CONSTRAINT `user_roles_role_id_fkey`
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
