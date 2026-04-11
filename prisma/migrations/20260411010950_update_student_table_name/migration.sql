/*
  Warnings:

  - You are about to drop the `Student` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Student` DROP FOREIGN KEY `Student_user_id_fkey`;

-- DropTable
DROP TABLE `Student`;

-- CreateTable
CREATE TABLE `students` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `major` VARCHAR(191) NOT NULL,
    `graduation_year` INTEGER NOT NULL,
    `classification` ENUM('FRESHMAN', 'SOPHOMORE', 'JUNIOR', 'SENIOR') NOT NULL,

    UNIQUE INDEX `students_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
