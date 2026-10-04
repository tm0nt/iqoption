-- CreateTable
CREATE TABLE `asset_groups` (
    `id` INTEGER NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `priority` INTEGER NOT NULL DEFAULT 100,
    `enabled` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `asset_groups_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assets` (
    `id` INTEGER NOT NULL,
    `ticker` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(191) NOT NULL,
    `group_id` INTEGER NOT NULL,
    `source` ENUM('BINANCE', 'SIMULATED') NOT NULL DEFAULT 'SIMULATED',
    `source_symbol` VARCHAR(191) NULL,
    `precision` INTEGER NOT NULL,
    `pip_scale` INTEGER NOT NULL DEFAULT 2,
    `spread_plus` DOUBLE NOT NULL DEFAULT 0.4,
    `spread_minus` DOUBLE NOT NULL DEFAULT 0.1,
    `profit` INTEGER NOT NULL DEFAULT 80,
    `deadtime` INTEGER NOT NULL DEFAULT 2,
    `expirations` JSON NOT NULL,
    `min_qty` DOUBLE NOT NULL DEFAULT 1,
    `qty_step` DOUBLE NOT NULL DEFAULT 1,
    `currency_left` VARCHAR(191) NOT NULL,
    `currency_right` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `time_from` VARCHAR(191) NOT NULL DEFAULT '00:00:00',
    `time_to` VARCHAR(191) NOT NULL DEFAULT '00:00:00',
    `expiration_days` JSON NOT NULL,
    `exchange` VARCHAR(191) NOT NULL DEFAULT 'na',
    `image` VARCHAR(512) NOT NULL DEFAULT '',
    `priority` INTEGER NOT NULL DEFAULT 100,
    `is_otc` BOOLEAN NOT NULL DEFAULT false,
    `is_visible` BOOLEAN NOT NULL DEFAULT true,
    `is_paused` BOOLEAN NOT NULL DEFAULT false,
    `is_suspended` BOOLEAN NOT NULL DEFAULT false,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `sim_base` DOUBLE NULL,
    `sim_volatility` DOUBLE NULL,
    `sim_period` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `assets_ticker_key`(`ticker`),
    INDEX `assets_group_id_idx`(`group_id`),
    INDEX `assets_enabled_idx`(`enabled`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `platform_settings` (
    `key` VARCHAR(191) NOT NULL,
    `value` JSON NOT NULL,
    `description` TEXT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `assets` ADD CONSTRAINT `assets_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `asset_groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
