-- CreateTable
CREATE TABLE `calendar_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `country` CHAR(2) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `ticker` VARCHAR(64) NULL,
    `period` VARCHAR(32) NULL,
    `importance` INTEGER NOT NULL DEFAULT 2,
    `category_group` VARCHAR(32) NULL,
    `released_at` DATETIME(3) NOT NULL,
    `actual` VARCHAR(32) NULL,
    `forecast` VARCHAR(32) NULL,
    `previous` VARCHAR(32) NULL,
    `description` TEXT NULL,
    `asset_ids` JSON NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `calendar_events_released_at_idx`(`released_at`),
    INDEX `calendar_events_country_importance_idx`(`country`, `importance`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

