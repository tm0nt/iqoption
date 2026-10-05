-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `card_id` INTEGER NULL,
    ADD COLUMN `provider_ref` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `payment_cards` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `provider` VARCHAR(32) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `fingerprint` VARCHAR(64) NOT NULL,
    `brand` VARCHAR(16) NOT NULL,
    `last4` CHAR(4) NOT NULL,
    `exp_month` SMALLINT NOT NULL,
    `exp_year` SMALLINT NOT NULL,
    `holder` VARCHAR(64) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `removed_at` DATETIME(3) NULL,

    INDEX `payment_cards_user_id_removed_at_idx`(`user_id`, `removed_at`),
    UNIQUE INDEX `payment_cards_provider_token_key`(`provider`, `token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `payment_cards` ADD CONSTRAINT `payment_cards_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
