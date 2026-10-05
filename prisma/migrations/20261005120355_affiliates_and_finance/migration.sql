-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `bonus` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `fee` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `promo_code_id` INTEGER NULL,
    ADD COLUMN `settled_by_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `affiliates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `code` VARCHAR(32) NOT NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'PENDING',
    `plan` ENUM('CPA', 'REVSHARE', 'HYBRID') NULL,
    `cpa_amount` DECIMAL(18, 2) NULL,
    `revshare_percent` DECIMAL(5, 2) NULL,
    `postback_url` VARCHAR(1024) NULL,
    `note` TEXT NULL,
    `approved_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `affiliates_user_id_key`(`user_id`),
    UNIQUE INDEX `affiliates_code_key`(`code`),
    INDEX `affiliates_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `affiliate_clicks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `affiliate_id` INTEGER NOT NULL,
    `sub_id` VARCHAR(64) NULL,
    `utm_source` VARCHAR(128) NULL,
    `utm_medium` VARCHAR(128) NULL,
    `utm_campaign` VARCHAR(128) NULL,
    `landing` VARCHAR(512) NULL,
    `referer` VARCHAR(512) NULL,
    `ip` VARCHAR(45) NULL,
    `user_agent` VARCHAR(255) NULL,
    `country` CHAR(2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `affiliate_clicks_affiliate_id_created_at_idx`(`affiliate_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `referrals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `affiliate_id` INTEGER NOT NULL,
    `click_id` INTEGER NULL,
    `sub_id` VARCHAR(64) NULL,
    `ip` VARCHAR(45) NULL,
    `ftd_at` DATETIME(3) NULL,
    `ftd_amount` DECIMAL(18, 2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `referrals_user_id_key`(`user_id`),
    INDEX `referrals_affiliate_id_created_at_idx`(`affiliate_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `affiliate_commissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `affiliate_id` INTEGER NOT NULL,
    `referred_user_id` INTEGER NULL,
    `kind` ENUM('CPA', 'REVSHARE', 'ADJUSTMENT') NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `base` DECIMAL(18, 2) NULL,
    `rate` DECIMAL(5, 2) NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `source_id` INTEGER NULL,
    `note` VARCHAR(255) NULL,
    `earned_at` DATETIME(3) NOT NULL,
    `available_at` DATETIME(3) NOT NULL,
    `reversed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `affiliate_commissions_affiliate_id_earned_at_idx`(`affiliate_id`, `earned_at`),
    UNIQUE INDEX `affiliate_commissions_kind_source_id_key`(`kind`, `source_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `affiliate_payouts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `affiliate_id` INTEGER NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `method` VARCHAR(64) NOT NULL,
    `destination` VARCHAR(255) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `settled_at` DATETIME(3) NULL,
    `settled_by_id` INTEGER NULL,

    INDEX `affiliate_payouts_affiliate_id_created_at_idx`(`affiliate_id`, `created_at`),
    INDEX `affiliate_payouts_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `affiliate_postbacks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `affiliate_id` INTEGER NOT NULL,
    `event` VARCHAR(24) NOT NULL,
    `url` VARCHAR(1024) NOT NULL,
    `status` INTEGER NULL,
    `error` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `affiliate_postbacks_affiliate_id_created_at_idx`(`affiliate_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `affiliates` ADD CONSTRAINT `affiliates_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `affiliate_clicks` ADD CONSTRAINT `affiliate_clicks_affiliate_id_fkey` FOREIGN KEY (`affiliate_id`) REFERENCES `affiliates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_affiliate_id_fkey` FOREIGN KEY (`affiliate_id`) REFERENCES `affiliates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_click_id_fkey` FOREIGN KEY (`click_id`) REFERENCES `affiliate_clicks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `affiliate_commissions` ADD CONSTRAINT `affiliate_commissions_affiliate_id_fkey` FOREIGN KEY (`affiliate_id`) REFERENCES `affiliates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `affiliate_payouts` ADD CONSTRAINT `affiliate_payouts_affiliate_id_fkey` FOREIGN KEY (`affiliate_id`) REFERENCES `affiliates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `affiliate_postbacks` ADD CONSTRAINT `affiliate_postbacks_affiliate_id_fkey` FOREIGN KEY (`affiliate_id`) REFERENCES `affiliates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
