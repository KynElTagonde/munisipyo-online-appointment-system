<?php
/**
 * Logout script for Admin session
 */
require_once 'config.php';

// Unset all session values
$_SESSION = [];

// Destroy session cookie if present
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

// Destroy session
session_destroy();

// Redirect back to login with notification
header('Location: login.php?logout=1');
exit;
?>
