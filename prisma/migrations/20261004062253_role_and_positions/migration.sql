-- AlterTable
ALTER TABLE `users` ADD COLUMN `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE `positions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `balance_id` INTEGER NOT NULL,
    `active_id` INTEGER NOT NULL,
    `option_type_id` INTEGER NOT NULL,
    `direction` VARCHAR(8) NOT NULL,
    `invest` DECIMAL(18, 2) NOT NULL,
    `profit_percent` INTEGER NOT NULL,
    `profit_amount` DECIMAL(18, 2) NULL,
    `close_profit` DECIMAL(18, 2) NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `open_quote` DECIMAL(18, 8) NOT NULL,
    `close_quote` DECIMAL(18, 8) NULL,
    `open_time` INTEGER NOT NULL,
    `open_time_ms` BIGINT NOT NULL,
    `expiration_time` INTEGER NOT NULL,
    `expiration_size` INTEGER NOT NULL,
    `closed_at` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(16) NOT NULL DEFAULT 'open',
    `close_reason` VARCHAR(16) NOT NULL DEFAULT 'default',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `positions_user_id_closed_at_idx`(`user_id`, `closed_at`),
    INDEX `positions_user_id_expiration_time_idx`(`user_id`, `expiration_time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `positions` ADD CONSTRAINT `positions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- The wire's id again: `positions.id` is the `external_id` the client reads,
-- and `DealBinary::isValid()` rejects a deal whose id is zero. Starting high
-- keeps it clearly an identifier rather than a row count.
ALTER TABLE `positions` AUTO_INCREMENT = 7000001;
