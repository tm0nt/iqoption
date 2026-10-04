-- AlterTable
ALTER TABLE `trading_sessions` ADD COLUMN `ip` VARCHAR(45) NULL,
    ADD COLUMN `user_agent` VARCHAR(255) NULL;

