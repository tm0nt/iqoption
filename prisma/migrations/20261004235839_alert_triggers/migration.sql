-- AlterTable
ALTER TABLE `price_alerts` ADD COLUMN `created_quote` DECIMAL(18, 8) NOT NULL;

-- CreateTable
CREATE TABLE `price_alert_triggers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `alert_id` INTEGER NULL,
    `user_id` INTEGER NOT NULL,
    `asset_id` INTEGER NOT NULL,
    `type` VARCHAR(24) NOT NULL DEFAULT 'price',
    `value` DECIMAL(18, 8) NOT NULL,
    `quote` DECIMAL(18, 8) NOT NULL,
    `fired_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `price_alert_triggers_user_id_fired_at_idx`(`user_id`, `fired_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `price_alert_triggers` ADD CONSTRAINT `price_alert_triggers_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

