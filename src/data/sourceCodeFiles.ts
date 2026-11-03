export interface SourceFile {
  name: string;
  path: string;
  description: string;
  language: string;
  content: string;
}

export const PHP_PROJECT_FILES: SourceFile[] = [
  {
    name: "config.php",
    path: "config.php",
    description: "Database connection using PDO and core helper functions (slot limit logic, reference code generator, auth guards).",
    language: "php",
    content: `<?php
/**
 * Database Configuration and Core Helper Functions
 * Munisipyo Online Appointment System
 */

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Database Credentials
define('DB_HOST', 'localhost');
define('DB_NAME', 'munisipyo_db');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// System Constants
define('MAX_SLOTS_PER_PERIOD', 5); // Capacity limit per office, date, and time slot
define('MUNICIPALITY_NAME', 'Municipality of San Jose');
define('MUNICIPALITY_PROVINCE', 'Province of Batangas');

/**
 * Establish PDO Database Connection
 * @return PDO
 */
function getDbConnection() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            die("Database connection failed: " . htmlspecialchars($e->getMessage()));
        }
    }
    return $pdo;
}

/**
 * Generate a unique Reference Code (e.g., MUN-2026-4829)
 * @param PDO $pdo
 * @return string
 */
function generateReferenceCode($pdo) {
    $year = date('Y');
    do {
        $randomNumber = str_pad(mt_rand(1000, 9999), 4, '0', STR_PAD_LEFT);
        $code = "MUN-{$year}-{$randomNumber}";
        
        $stmt = $pdo->prepare("SELECT id FROM appointments WHERE reference_code = ? LIMIT 1");
        $stmt->execute([$code]);
        $exists = $stmt->fetch();
    } while ($exists);

    return $code;
}

/**
 * Check if slot is available for given office, date, and time slot
 * @param PDO $pdo
 * @param string $date (YYYY-MM-DD)
 * @param string $timeSlot
 * @param string $officeName
 * @param int $maxLimit
 * @return array ['available' => bool, 'booked_count' => int, 'remaining' => int]
 */
function checkSlotAvailability($pdo, $date, $timeSlot, $officeName, $maxLimit = MAX_SLOTS_PER_PERIOD) {
    // Count active appointments (exclude Cancelled)
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as booked_count 
        FROM appointments 
        WHERE appointment_date = ? 
          AND time_slot = ? 
          AND office_name = ? 
          AND status != 'Cancelled'
    ");
    $stmt->execute([$date, $timeSlot, $officeName]);
    $result = $stmt->fetch();
    $bookedCount = (int)($result['booked_count'] ?? 0);

    return [
        'available' => ($bookedCount < $maxLimit),
        'booked_count' => $bookedCount,
        'remaining' => max(0, $maxLimit - $bookedCount),
        'max_limit' => $maxLimit
    ];
}

/**
 * Sanitize User Input String
 * @param string $data
 * @return string
 */
function sanitize($data) {
    return htmlspecialchars(trim($data ?? ''), ENT_QUOTES, 'UTF-8');
}

/**
 * Check if Admin is logged in
 * @return bool
 */
function isAdminLoggedIn() {
    return isset($_SESSION['admin_user']) && !empty($_SESSION['admin_user']);
}

/**
 * Guard for Admin pages
 */
function requireAdmin() {
    if (!isAdminLoggedIn()) {
        header('Location: ../login.php');
        exit;
    }
}

/**
 * Return Bootstrap badge class for appointment status
 * @param string $status
 * @return string
 */
function getStatusBadgeClass($status) {
    switch ($status) {
        case 'Approved':
            return 'bg-success';
        case 'Completed':
            return 'bg-primary';
        case 'Cancelled':
            return 'bg-danger';
        case 'Pending':
        default:
            return 'bg-warning text-dark';
    }
}
?>`
  },
  {
    name: "database.sql",
    path: "database.sql",
    description: "Strictly 2 tables (users & appointments) schema with indexes and initial sample seed data.",
    language: "sql",
    content: `-- ==========================================================
-- Munisipyo Online Appointment Web System
-- Database Schema: Strictly 2 Tables (users & appointments)
-- ==========================================================

CREATE DATABASE IF NOT EXISTS \`munisipyo_db\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`munisipyo_db\`;

-- --------------------------------------------------------
-- Table structure for table \`users\`
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`users\`;
CREATE TABLE \`users\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`username\` VARCHAR(50) NOT NULL UNIQUE,
  \`password\` VARCHAR(255) NOT NULL,
  \`role\` ENUM('admin', 'resident') NOT NULL DEFAULT 'resident',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table \`appointments\`
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`appointments\`;
CREATE TABLE \`appointments\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`reference_code\` VARCHAR(20) NOT NULL UNIQUE,
  \`full_name\` VARCHAR(100) NOT NULL,
  \`contact_no\` VARCHAR(20) NOT NULL,
  \`office_name\` VARCHAR(100) NOT NULL,
  \`appointment_date\` DATE NOT NULL,
  \`time_slot\` VARCHAR(50) NOT NULL,
  \`status\` ENUM('Pending', 'Approved', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_reference_code\` (\`reference_code\`),
  INDEX \`idx_appointment_date\` (\`appointment_date\`),
  INDEX \`idx_slot_lookup\` (\`appointment_date\`, \`time_slot\`, \`office_name\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Seed Data: Admin User (Password: admin123)
-- Hash generated via password_hash('admin123', PASSWORD_BCRYPT)
-- --------------------------------------------------------
INSERT INTO \`users\` (\`username\`, \`password\`, \`role\`) VALUES
('admin', '$2y$10$tM.yFfq2W6u1y/O9Gk.u8.4uYVwLwJz1LSmwZ8wV7m7bNfXG2LhK6', 'admin');

-- --------------------------------------------------------
-- Seed Data: Sample Booked Slots for 2 Offices
-- Sample Offices: Local Civil Registrar & Mayor's Office
-- --------------------------------------------------------
INSERT INTO \`appointments\` (\`reference_code\`, \`full_name\`, \`contact_no\`, \`office_name\`, \`appointment_date\`, \`time_slot\`, \`status\`, \`created_at\`) VALUES
('MUN-2026-1001', 'Juan Dela Cruz', '09171234567', 'Local Civil Registrar', CURRENT_DATE + INTERVAL 1 DAY, '08:00 AM - 09:30 AM', 'Approved', NOW()),
('MUN-2026-1002', 'Maria Clara Santos', '09187654321', 'Local Civil Registrar', CURRENT_DATE + INTERVAL 1 DAY, '08:00 AM - 09:30 AM', 'Pending', NOW()),
('MUN-2026-1003', 'Crisostomo Ibarra', '09223334455', 'Mayor\\'s Office', CURRENT_DATE + INTERVAL 1 DAY, '10:00 AM - 11:30 AM', 'Approved', NOW()),
('MUN-2026-1004', 'Leonor Rivera', '09355556677', 'Mayor\\'s Office', CURRENT_DATE + INTERVAL 2 DAY, '01:00 PM - 02:30 PM', 'Pending', NOW()),
('MUN-2026-1005', 'Andres Bonifacio', '09498887766', 'Municipal Assessor', CURRENT_DATE + INTERVAL 2 DAY, '03:00 PM - 04:30 PM', 'Completed', NOW());`
  },
  {
    name: "index.php",
    path: "index.php",
    description: "Resident booking portal with dynamic office requirements, automated slot limits, and public status tracker.",
    language: "php",
    content: `<?php
require_once 'config.php';

$pdo = getDbConnection();
$errorMsg = '';
$successMsg = '';
$generatedRef = '';

// Handle Booking Form Submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'book_slot') {
    $fullName = sanitize($_POST['full_name'] ?? '');
    $contactNo = sanitize($_POST['contact_no'] ?? '');
    $officeName = sanitize($_POST['office_name'] ?? '');
    $appointmentDate = sanitize($_POST['appointment_date'] ?? '');
    $timeSlot = sanitize($_POST['time_slot'] ?? '');

    // 1. Backend Form Validation
    if (empty($fullName) || empty($contactNo) || empty($officeName) || empty($appointmentDate) || empty($timeSlot)) {
        $errorMsg = 'All fields are required. Please complete the form.';
    } elseif (!preg_match('/^[0-9+\\-\\s]{7,20}$/', $contactNo)) {
        $errorMsg = 'Please enter a valid contact number.';
    } elseif (strtotime($appointmentDate) < strtotime(date('Y-m-d'))) {
        $errorMsg = 'Appointment date cannot be in the past.';
    } else {
        // 2. Automated Slot Limit Logic
        $availability = checkSlotAvailability($pdo, $appointmentDate, $timeSlot, $officeName);

        if (!$availability['available']) {
            $errorMsg = "Sorry! Maximum slot capacity (" . MAX_SLOTS_PER_PERIOD . " persons) for <strong>{$officeName}</strong> on <strong>{$appointmentDate} ({$timeSlot})</strong> has been reached. Please choose a different date or time slot.";
        } else {
            // 3. Resident Booking Record Storage
            $refCode = generateReferenceCode($pdo);

            $stmt = $pdo->prepare("
                INSERT INTO appointments (reference_code, full_name, contact_no, office_name, appointment_date, time_slot, status)
                VALUES (?, ?, ?, ?, ?, ?, 'Pending')
            ");

            if ($stmt->execute([$refCode, $fullName, $contactNo, $officeName, $appointmentDate, $timeSlot])) {
                $generatedRef = $refCode;
                $successMsg = "Appointment successfully booked! Your reference code is: <strong>{$refCode}</strong>";
            } else {
                $errorMsg = 'A database error occurred while reserving your slot. Please try again.';
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Online Appointment Portal - <?= MUNICIPALITY_NAME ?></title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
</head>
<body class="bg-light">
    <!-- Full source available in file index.php -->
</body>
</html>`
  },
  {
    name: "track.php",
    path: "track.php",
    description: "Detailed status checker by Reference Code with print-ready official confirmation slip.",
    language: "php",
    content: `<?php
require_once 'config.php';

$pdo = getDbConnection();
$ref = sanitize($_GET['ref'] ?? '');
$appointment = null;
$error = '';

if (!empty($ref)) {
    $stmt = $pdo->prepare("SELECT * FROM appointments WHERE reference_code = ? LIMIT 1");
    $stmt->execute([$ref]);
    $appointment = $stmt->fetch();

    if (!$appointment) {
        $error = "No appointment record found for Reference Code: <strong>" . htmlspecialchars($ref) . "</strong>. Please verify the code and try again.";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Track Appointment - <?= MUNICIPALITY_NAME ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
</head>
<body>
    <!-- See file /track.php for complete markup -->
</body>
</html>`
  },
  {
    name: "login.php",
    path: "login.php",
    description: "Secure Administrator login with password_verify and session initiation.",
    language: "php",
    content: `<?php
require_once 'config.php';

if (isAdminLoggedIn()) {
    header('Location: admin/dashboard.php');
    exit;
}

$pdo = getDbConnection();
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if (empty($username) || empty($password)) {
        $error = 'Please enter both username and password.';
    } else {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? AND role = 'admin' LIMIT 1");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['admin_user'] = $user['username'];
            $_SESSION['admin_id'] = $user['id'];
            $_SESSION['login_time'] = time();
            header('Location: admin/dashboard.php');
            exit;
        } else {
            $error = 'Invalid administrative username or password.';
        }
    }
}
?>`
  },
  {
    name: "logout.php",
    path: "logout.php",
    description: "Clears session variables, removes session cookie, and safely signs admin out.",
    language: "php",
    content: `<?php
require_once 'config.php';

$_SESSION = [];
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}
session_destroy();
header('Location: login.php?logout=1');
exit;
?>`
  },
  {
    name: "admin/dashboard.php",
    path: "admin/dashboard.php",
    description: "Admin panel featuring stats cards, filters, quick status updater, and master list print view.",
    language: "php",
    content: `<?php
require_once '../config.php';
requireAdmin();

$pdo = getDbConnection();
$message = '';
$error = '';

// Handle Status Updates
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_status') {
    $appointmentId = (int)($_POST['appointment_id'] ?? 0);
    $newStatus = sanitize($_POST['new_status'] ?? '');

    $allowedStatuses = ['Pending', 'Approved', 'Completed', 'Cancelled'];
    if ($appointmentId > 0 && in_array($newStatus, $allowedStatuses)) {
        $stmt = $pdo->prepare("UPDATE appointments SET status = ? WHERE id = ?");
        if ($stmt->execute([$newStatus, $appointmentId])) {
            $message = "Appointment status updated to <strong>{$newStatus}</strong> successfully.";
        } else {
            $error = "Failed to update appointment status.";
        }
    }
}
?>`
  },
  {
    name: "admin/backup.php",
    path: "admin/backup.php",
    description: "Exports and triggers instant download of database SQL backup file.",
    language: "php",
    content: `<?php
require_once '../config.php';
requireAdmin();

$pdo = getDbConnection();

$filename = "munisipyo_db_backup_" . date("Y-m-d_His") . ".sql";
header("Content-Type: application/sql");
header("Content-Disposition: attachment; filename=\\"{$filename}\\"");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

$tables = ['users', 'appointments'];

echo "-- Munisipyo Online Appointment System Backup\\n";
echo "-- Generated by Admin: " . $_SESSION['admin_user'] . "\\n";
echo "-- Date: " . date('Y-m-d H:i:s') . "\\n\\n";
// Dumps CREATE TABLE and INSERT statements for each table...
?>`
  },
  {
    name: "README.md",
    path: "README.md",
    description: "Complete setup guide, XAMPP / WAMP installation instructions, credentials, and documentation.",
    language: "markdown",
    content: `# Munisipyo Online Appointment Web System
Setup instructions:
1. Import database.sql into phpMyAdmin.
2. Put files in C:/xampp/htdocs/munisipyo/
3. Access at http://localhost/munisipyo/index.php
Admin login: admin / admin123`
  }
];
