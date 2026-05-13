CREATE DATABASE IF NOT EXISTS communifield CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE communifield;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  username VARCHAR(30) NOT NULL UNIQUE,
  email VARCHAR(120) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  role ENUM('gestor','player') NOT NULL DEFAULT 'gestor',
  provider ENUM('credentials','google','apple') NOT NULL DEFAULT 'credentials',
  provider_id VARCHAR(255) NULL,
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  failed_attempts INT NOT NULL DEFAULT 0,
  blocked_until DATETIME NULL,
  last_login_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_phone (phone)
);
