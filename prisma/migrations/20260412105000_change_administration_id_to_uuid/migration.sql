/*
  Warnings:

  - The primary key for the `administrations` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE `administrations` DROP PRIMARY KEY,
  MODIFY `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    ADD PRIMARY KEY (`id`);
