-- CreateTable
CREATE TABLE `content_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kind` ENUM('WEBINAR', 'TUTORIAL', 'NEWS', 'HELP', 'PROMO') NOT NULL,
    `locale` CHAR(2) NULL,
    `title` VARCHAR(255) NOT NULL,
    `summary` VARCHAR(512) NULL,
    `body` TEXT NULL,
    `image_url` VARCHAR(512) NULL,
    `link_url` VARCHAR(512) NULL,
    `author` VARCHAR(128) NULL,
    `starts_at` DATETIME(3) NULL,
    `duration_mins` INTEGER NULL,
    `ends_at` DATETIME(3) NULL,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `content_items_kind_enabled_priority_idx`(`kind`, `enabled`, `priority`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
