-- CreateTable
CREATE TABLE `kyc_submissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `country` CHAR(2) NOT NULL,
    `document_type` ENUM('ID_CARD', 'DRIVERS_LICENSE', 'PASSPORT', 'RESIDENCE_PERMIT') NOT NULL,
    `document_number` VARCHAR(64) NOT NULL,
    `front_file` VARCHAR(96) NOT NULL,
    `back_file` VARCHAR(96) NULL,
    `selfie_file` VARCHAR(96) NOT NULL,
    `status` ENUM('NONE', 'PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `reason` TEXT NULL,
    `reviewed_by_id` INTEGER NULL,
    `reviewed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `kyc_submissions_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `kyc_submissions_status_created_at_idx`(`status`, `created_at`),
    INDEX `kyc_submissions_country_document_number_idx`(`country`, `document_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `kyc_submissions` ADD CONSTRAINT `kyc_submissions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
