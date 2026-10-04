-- CreateTable
CREATE TABLE `tournaments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(160) NOT NULL,
    `description` TEXT NULL,
    `image_url` VARCHAR(512) NULL,
    `status` ENUM('REGISTERING', 'RUNNING', 'FINISHED') NOT NULL DEFAULT 'REGISTERING',
    `cost` DECIMAL(18, 2) NOT NULL,
    `rebuy` BOOLEAN NOT NULL DEFAULT false,
    `rebuy_cost` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `starting_balance` DECIMAL(18, 2) NOT NULL DEFAULT 1000,
    `prize_pool` DECIMAL(18, 2) NOT NULL,
    `prize_type` VARCHAR(24) NOT NULL DEFAULT 'prizes',
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `countries` JSON NULL,
    `starts_at` DATETIME(3) NOT NULL,
    `ends_at` DATETIME(3) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `tournaments_status_starts_at_idx`(`status`, `starts_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tournament_entries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tournament_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `balance_id` INTEGER NULL,
    `pnl` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `registered_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tournament_entries_tournament_id_pnl_idx`(`tournament_id`, `pnl`),
    UNIQUE INDEX `tournament_entries_tournament_id_user_id_key`(`tournament_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tournament_entries` ADD CONSTRAINT `tournament_entries_tournament_id_fkey` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tournament_entries` ADD CONSTRAINT `tournament_entries_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

