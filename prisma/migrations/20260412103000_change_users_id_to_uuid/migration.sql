/*
  Warnings:

  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE `achievement_verification_requests` DROP FOREIGN KEY `achievement_verification_requests_assigned_verifier_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `achievement_verification_requests` DROP FOREIGN KEY `achievement_verification_requests_reviewed_by_id_fkey`;

-- DropForeignKey
ALTER TABLE `administrations` DROP FOREIGN KEY `administrations_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `student_kudos` DROP FOREIGN KEY `student_kudos_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `students` DROP FOREIGN KEY `students_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_roles` DROP FOREIGN KEY `user_roles_user_id_fkey`;

-- DropIndex
DROP INDEX `achievement_verification_requests_reviewed_by_id_fkey` ON `achievement_verification_requests`;

-- AlterTable
ALTER TABLE `achievement_verification_requests` MODIFY `assigned_verifier_user_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  MODIFY `reviewed_by_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL;

-- AlterTable
ALTER TABLE `administrations` MODIFY `user_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL;

-- AlterTable
ALTER TABLE `student_kudos` MODIFY `user_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL;

-- AlterTable
ALTER TABLE `students` MODIFY `user_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL;

-- AlterTable
ALTER TABLE `user_roles` MODIFY `user_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL;

-- AlterTable
ALTER TABLE `users` DROP PRIMARY KEY,
  MODIFY `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `achievement_verification_requests` ADD CONSTRAINT `achievement_verification_requests_assigned_verifier_user_id_fkey` FOREIGN KEY (`assigned_verifier_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `achievement_verification_requests` ADD CONSTRAINT `achievement_verification_requests_reviewed_by_id_fkey` FOREIGN KEY (`reviewed_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `administrations` ADD CONSTRAINT `administrations_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_kudos` ADD CONSTRAINT `student_kudos_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
