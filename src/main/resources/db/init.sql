-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS mstreamer DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mstreamer;

-- 初始化用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    create_time DATETIME NOT NULL,
    last_login_time DATETIME,
    CONSTRAINT uk_username UNIQUE (username)
);

-- 插入默认管理员账号 (密码: admin123)
INSERT INTO users (username, password, role, status, create_time) 
VALUES ('admin', '$2a$10$rTb8hXuCH3aMGk5pEwj3K.GQoSo0V.1Kl.EJ0T0CJEkSDQxG9Reuu', 'ADMIN', 'ACTIVE', NOW())
ON DUPLICATE KEY UPDATE password = VALUES(password);