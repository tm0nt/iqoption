-- AlterTable
ALTER TABLE `users` ADD COLUMN `avatar_url` VARCHAR(512) NULL,
    ADD COLUMN `citizenship` CHAR(2) NULL,
    ADD COLUMN `date_of_birth` DATE NULL,
    ADD COLUMN `first_name` VARCHAR(191) NULL,
    ADD COLUMN `is_us_person` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `kyc_status` ENUM('NONE', 'PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'NONE',
    ADD COLUMN `last_name` VARCHAR(191) NULL;
