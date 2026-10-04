-- DropForeignKey
ALTER TABLE `balances` DROP FOREIGN KEY `balances_user_id_fkey`;

-- DropIndex
DROP INDEX `balances_user_id_type_key` ON `balances`;

-- AlterTable
ALTER TABLE `balances` ADD COLUMN `tournament_id` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX `balances_user_id_type_tournament_id_key` ON `balances`(`user_id`, `type`, `tournament_id`);

-- AddForeignKey
ALTER TABLE `balances` ADD CONSTRAINT `balances_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

