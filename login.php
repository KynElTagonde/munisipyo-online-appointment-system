<?php
require_once 'config.php';

// If already logged in, redirect to admin dashboard
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
            session_regenerate_id(true);
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
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login - <?= MUNICIPALITY_NAME ?></title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <style>
        body {
            background-color: #f1f5f9;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: system-ui, -apple-system, sans-serif;
        }
        .login-card {
            border: none;
            border-radius: 1.25rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            overflow: hidden;
            width: 100%;
            max-width: 440px;
        }
        .login-header {
            background: linear-gradient(135deg, #0f4c81 0%, #1e3a8a 100%);
            color: white;
            padding: 2.25rem 2rem 1.75rem;
            text-align: center;
        }
        .btn-muni {
            background-color: #0f4c81;
            color: white;
            border: none;
            font-weight: 600;
        }
        .btn-muni:hover {
            background-color: #0d3d68;
            color: white;
        }
    </style>
</head>
<body>

    <div class="login-card bg-white mx-3 my-4">
        <div class="login-header">
            <div class="bg-white text-primary d-inline-flex p-3 rounded-circle shadow-sm mb-3">
                <i class="bi bi-shield-lock-fill fs-3"></i>
            </div>
            <h4 class="fw-bold mb-1">Municipal Administrator</h4>
            <p class="text-white-50 small mb-0"><?= MUNICIPALITY_NAME ?></p>
        </div>

        <div class="p-4 p-md-5">
            <?php if (isset($_GET['logout'])): ?>
                <div class="alert alert-success alert-dismissible fade show py-2 small" role="alert">
                    <i class="bi bi-check-circle me-1"></i> You have been logged out securely.
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            <?php endif; ?>

            <?php if (!empty($error)): ?>
                <div class="alert alert-danger py-2 small" role="alert">
                    <i class="bi bi-exclamation-triangle me-1"></i> <?= htmlspecialchars($error) ?>
                </div>
            <?php endif; ?>

            <form action="login.php" method="POST">
                <div class="mb-3">
                    <label for="username" class="form-label fw-semibold small text-muted">USERNAME</label>
                    <div class="input-group">
                        <span class="input-group-text bg-light text-muted border-end-0"><i class="bi bi-person"></i></span>
                        <input type="text" class="form-control border-start-0" id="username" name="username" 
                               placeholder="e.g. admin" required autofocus autocomplete="username">
                    </div>
                </div>

                <div class="mb-4">
                    <label for="password" class="form-label fw-semibold small text-muted">PASSWORD</label>
                    <div class="input-group">
                        <span class="input-group-text bg-light text-muted border-end-0"><i class="bi bi-key"></i></span>
                        <input type="password" class="form-control border-start-0" id="password" name="password" 
                               placeholder="••••••••" required autocomplete="current-password">
                    </div>
                </div>

                <div class="d-grid mb-3">
                    <button type="submit" class="btn btn-muni py-2 fs-6">
                        <i class="bi bi-box-arrow-in-right me-1"></i> Sign In to Dashboard
                    </button>
                </div>
            </form>

            <!-- Default Credentials Notice -->
            <div class="p-3 bg-light rounded-3 text-center border">
                <small class="text-muted d-block fw-semibold mb-1">Default Seed Account:</small>
                <div class="badge bg-secondary-subtle text-secondary font-monospace px-2 py-1">admin / admin123</div>
            </div>

            <div class="text-center mt-4">
                <a href="index.php" class="text-decoration-none small text-muted">
                    <i class="bi bi-arrow-left me-1"></i> Back to Public Portal
                </a>
            </div>
        </div>
    </div>

    <!-- Bootstrap 5 JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
