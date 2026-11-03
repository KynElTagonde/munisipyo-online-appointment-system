<?php
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
define('MUNICIPAL_OFFICES', [
    'Local Civil Registrar',
    "Mayor's Office",
    'Municipal Assessor',
    'Municipal Treasury',
    'Municipal Health Office',
    'Municipal Engineering / MPDC',
]);
define('APPOINTMENT_TIME_SLOTS', [
    '08:00 AM - 09:30 AM',
    '10:00 AM - 11:30 AM',
    '01:00 PM - 02:30 PM',
    '03:00 PM - 04:30 PM',
]);

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
 * Generate a hard-to-guess Reference Code (e.g., MUN-2026-A1B2C3D4E5F6)
 * @param PDO $pdo
 * @return string
 */
function generateReferenceCode($pdo) {
    $year = date('Y');
    do {
        $randomSuffix = strtoupper(bin2hex(random_bytes(6)));
        $code = "MUN-{$year}-{$randomSuffix}";
        
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
    return is_string($data) ? trim($data) : '';
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
?>
