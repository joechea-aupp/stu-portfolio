CREATE TABLE `achievement_verification_requests` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `student_id` INTEGER NOT NULL,
  `achievement_index` INTEGER NOT NULL,
  `assigned_verifier_user_id` INTEGER NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  `requested_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `reviewed_at` DATETIME(3) NULL,
  `reviewed_by_id` INTEGER NULL,
  `rejection_reason` TEXT NULL,

  INDEX `avr_student_status_idx`(`student_id`, `status`),
  INDEX `avr_verifier_status_idx`(`assigned_verifier_user_id`, `status`),
  INDEX `avr_requested_at_idx`(`requested_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `achievement_verification_requests`
  ADD CONSTRAINT `achievement_verification_requests_student_id_fkey`
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `achievement_verification_requests`
  ADD CONSTRAINT `achievement_verification_requests_assigned_verifier_user_id_fkey`
  FOREIGN KEY (`assigned_verifier_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `achievement_verification_requests`
  ADD CONSTRAINT `achievement_verification_requests_reviewed_by_id_fkey`
  FOREIGN KEY (`reviewed_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
