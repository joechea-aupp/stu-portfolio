/*
  Warnings:

  - The primary key for the `students` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE `achievement_verification_requests` DROP FOREIGN KEY `achievement_verification_requests_student_id_fkey`;

-- DropForeignKey
ALTER TABLE `student_kudos` DROP FOREIGN KEY `student_kudos_student_id_fkey`;

-- DropIndex
DROP INDEX `avr_student_status_idx` ON `achievement_verification_requests`;

-- DropIndex
DROP INDEX `avr_requested_at_idx` ON `achievement_verification_requests`;

-- AlterTable
ALTER TABLE `students` DROP PRIMARY KEY,
  MODIFY `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `achievement_verification_requests` MODIFY `student_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL;

-- AlterTable
ALTER TABLE `student_kudos` MODIFY `student_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL;

-- CreateIndex
CREATE INDEX `avr_student_status_idx` ON `achievement_verification_requests`(`student_id`, `status`);

-- CreateIndex
CREATE INDEX `avr_requested_at_idx` ON `achievement_verification_requests`(`requested_at`);

-- AddForeignKey
ALTER TABLE `achievement_verification_requests` ADD CONSTRAINT `achievement_verification_requests_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_kudos` ADD CONSTRAINT `student_kudos_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
