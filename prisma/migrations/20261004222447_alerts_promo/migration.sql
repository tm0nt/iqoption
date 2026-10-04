-- CreateTable
CREATE TABLE `price_alerts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `asset_id` INTEGER NOT NULL,
    `instrument_types` JSON NOT NULL,
    `type` VARCHAR(24) NOT NULL DEFAULT 'price',
    `activations` INTEGER NOT NULL DEFAULT 1,
    `value` DECIMAL(18, 8) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `price_alerts_user_id_asset_id_idx`(`user_id`, `asset_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `promo_codes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(48) NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `description` TEXT NULL,
    `description_short` VARCHAR(255) NULL,
    `type` VARCHAR(32) NOT NULL DEFAULT 'deposit_bonus',
    `params` JSON NULL,
    `instructions` JSON NULL,
    `information` JSON NULL,
    `ends_at` DATETIME(3) NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `promo_codes_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `promo_code_uses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `promo_code_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `used_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `promo_code_uses_promo_code_id_user_id_key`(`promo_code_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `price_alerts` ADD CONSTRAINT `price_alerts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promo_code_uses` ADD CONSTRAINT `promo_code_uses_promo_code_id_fkey` FOREIGN KEY (`promo_code_id`) REFERENCES `promo_codes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promo_code_uses` ADD CONSTRAINT `promo_code_uses_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

