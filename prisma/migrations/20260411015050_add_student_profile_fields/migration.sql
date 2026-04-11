/*
  Warnings:

  - Added the required column `achievements` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projects` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `skills` to the `students` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `students` ADD COLUMN `achievements` JSON NOT NULL,
    ADD COLUMN `image_url` MEDIUMTEXT NULL,
    ADD COLUMN `projects` JSON NOT NULL,
    ADD COLUMN `skills` JSON NOT NULL,
    ADD COLUMN `summary` TEXT NULL;
