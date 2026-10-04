-- AlterTable
ALTER TABLE `content_items` ADD COLUMN `category` VARCHAR(96) NULL,
    MODIFY `kind` ENUM('WEBINAR', 'TUTORIAL', 'HELP', 'PROMO') NOT NULL;

