-- ==========================================================
-- Munisipyo Online Appointment Web System
-- Database Schema: 2 Tables (users & appointments)
-- This setup script preserves existing tables and records.
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `munisipyo_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `munisipyo_db`;

-- --------------------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'resident') NOT NULL DEFAULT 'resident',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `appointments`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `appointments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `reference_code` VARCHAR(32) NOT NULL UNIQUE,
  `full_name` VARCHAR(100) NOT NULL,
  `contact_no` VARCHAR(20) NOT NULL,
  `office_name` VARCHAR(100) NOT NULL,
  `appointment_date` DATE NOT NULL,
  `time_slot` VARCHAR(50) NOT NULL,
  `status` ENUM('Pending', 'Approved', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_reference_code` (`reference_code`),
  INDEX `idx_appointment_date` (`appointment_date`),
  INDEX `idx_slot_lookup` (`appointment_date`, `time_slot`, `office_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `appointments` MODIFY `reference_code` VARCHAR(32) NOT NULL;

-- --------------------------------------------------------
-- Seed Data: Admin User (Password: admin123)
-- Hash generated via password_hash('admin123', PASSWORD_BCRYPT)
-- --------------------------------------------------------
INSERT IGNORE INTO `users` (`username`, `password`, `role`) VALUES
('admin', '$2y$10$tM.yFfq2W6u1y/O9Gk.u8.4uYVwLwJz1LSmwZ8wV7m7bNfXG2LhK6', 'admin');

-- --------------------------------------------------------
-- Seed Data: Sample Booked Slots for 2 Offices
-- Sample Offices: Local Civil Registrar & Mayor's Office
-- --------------------------------------------------------
INSERT IGNORE INTO `appointments` (`reference_code`, `full_name`, `contact_no`, `office_name`, `appointment_date`, `time_slot`, `status`, `created_at`) VALUES
('MUN-2026-1001', 'Juan Dela Cruz', '09171234567', 'Local Civil Registrar', CURRENT_DATE + INTERVAL 1 DAY, '08:00 AM - 09:30 AM', 'Approved', NOW()),
('MUN-2026-1002', 'Maria Clara Santos', '09187654321', 'Local Civil Registrar', CURRENT_DATE + INTERVAL 1 DAY, '08:00 AM - 09:30 AM', 'Pending', NOW()),
('MUN-2026-1003', 'Crisostomo Ibarra', '09223334455', 'Mayor\'s Office', CURRENT_DATE + INTERVAL 1 DAY, '10:00 AM - 11:30 AM', 'Approved', NOW()),
('MUN-2026-1004', 'Leonor Rivera', '09355556677', 'Mayor\'s Office', CURRENT_DATE + INTERVAL 2 DAY, '01:00 PM - 02:30 PM', 'Pending', NOW()),
('MUN-2026-1005', 'Andres Bonifacio', '09498887766', 'Municipal Assessor', CURRENT_DATE + INTERVAL 2 DAY, '03:00 PM - 04:30 PM', 'Completed', NOW());
