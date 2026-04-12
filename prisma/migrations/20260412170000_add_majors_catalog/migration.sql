-- CreateTable
CREATE TABLE `majors` (
  `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `majors_name_key`(`name`),
  INDEX `majors_is_active_idx`(`is_active`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `students` ADD COLUMN `major_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL;

-- CreateIndex
CREATE INDEX `students_major_id_idx` ON `students`(`major_id`);

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_major_id_fkey` FOREIGN KEY (`major_id`) REFERENCES `majors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
