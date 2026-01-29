-- Better Auth Schema for MySQL
-- Run this after starting MySQL

-- User table
CREATE TABLE IF NOT EXISTS `user` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `emailVerified` BOOLEAN NOT NULL DEFAULT FALSE,
  `image` TEXT,
  `role` VARCHAR(50) DEFAULT 'user',
  `banned` BOOLEAN DEFAULT FALSE,
  `banReason` TEXT,
  `banExpires` DATETIME,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Session table
CREATE TABLE IF NOT EXISTS `session` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(36) NOT NULL,
  `token` VARCHAR(255) NOT NULL UNIQUE,
  `expiresAt` DATETIME NOT NULL,
  `ipAddress` VARCHAR(255),
  `userAgent` TEXT,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE
);

-- Account table
CREATE TABLE IF NOT EXISTS `account` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(36) NOT NULL,
  `accountId` VARCHAR(255) NOT NULL,
  `providerId` VARCHAR(255) NOT NULL,
  `accessToken` TEXT,
  `refreshToken` TEXT,
  `accessTokenExpiresAt` DATETIME,
  `refreshTokenExpiresAt` DATETIME,
  `scope` TEXT,
  `idToken` TEXT,
  `password` VARCHAR(255),
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE
);

-- Verification table
CREATE TABLE IF NOT EXISTS `verification` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `identifier` VARCHAR(255) NOT NULL,
  `value` TEXT NOT NULL,
  `expiresAt` DATETIME NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS `idx_session_userId` ON `session`(`userId`);
CREATE INDEX IF NOT EXISTS `idx_session_token` ON `session`(`token`);
CREATE INDEX IF NOT EXISTS `idx_account_userId` ON `account`(`userId`);
CREATE INDEX IF NOT EXISTS `idx_user_email` ON `user`(`email`);
