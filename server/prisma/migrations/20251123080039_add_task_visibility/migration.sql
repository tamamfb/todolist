-- AlterTable
ALTER TABLE `task` ADD COLUMN `visibility` ENUM('private', 'public') NOT NULL DEFAULT 'private';
