-- AlterTable
ALTER TABLE `task` ADD COLUMN `reminder_at` DATETIME(3) NULL,
    ADD COLUMN `reminder_sent` BOOLEAN NOT NULL DEFAULT false;
