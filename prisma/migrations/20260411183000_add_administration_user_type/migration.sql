ALTER TABLE `users`
  ADD COLUMN `user_type` ENUM('STUDENT', 'ADMINISTRATION') NOT NULL DEFAULT 'STUDENT';

CREATE TABLE `administrations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `occupation` VARCHAR(191) NOT NULL,
  `company` VARCHAR(191) NOT NULL,
  `phone_number` VARCHAR(191) NOT NULL,
  `gender` VARCHAR(191) NOT NULL,
  `summary` TEXT NOT NULL,
  `profile_pic_url` MEDIUMTEXT NOT NULL,
  `title` ENUM('MR', 'MS', 'DR') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `administrations_user_id_key`(`user_id`),
  CONSTRAINT `administrations_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
