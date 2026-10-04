-- AlterTable
ALTER TABLE `users` ADD COLUMN `closed_at` DATETIME(3) NULL,
    ADD COLUMN `deletion_requested_at` DATETIME(3) NULL,
    ADD COLUMN `display_name` VARCHAR(64) NULL,
    ADD COLUMN `notifications` JSON NULL,
    ADD COLUMN `public_profile` BOOLEAN NOT NULL DEFAULT true;

