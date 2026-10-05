-- AlterTable
ALTER TABLE `users` ADD COLUMN `two_factor_enabled_at` DATETIME(3) NULL,
    ADD COLUMN `two_factor_failures` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `two_factor_last_step` INTEGER NULL,
    ADD COLUMN `two_factor_locked_until` DATETIME(3) NULL,
    ADD COLUMN `two_factor_recovery` JSON NULL,
    ADD COLUMN `two_factor_secret` VARCHAR(255) NULL;
