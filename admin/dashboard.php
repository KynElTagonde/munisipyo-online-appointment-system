<?php
require_once '../config.php';

// Authentication Guard
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

// Filters & Query Logic
$filterDate = sanitize($_GET['filter_date'] ?? '');
$filterOffice = sanitize($_GET['filter_office'] ?? '');
$filterStatus = sanitize($_GET['filter_status'] ?? '');
$search = sanitize($_GET['search'] ?? '');

$sql = "SELECT * FROM appointments WHERE 1=1";
$params = [];

if (!empty($filterDate)) {
    $sql .= " AND appointment_date = ?";
    $params[] = $filterDate;
}

if (!empty($filterOffice)) {
    $sql .= " AND office_name = ?";
    $params[] = $filterOffice;
}

if (!empty($filterStatus)) {
    $sql .= " AND status = ?";
    $params[] = $filterStatus;
}

if (!empty($search)) {
    $sql .= " AND (reference_code LIKE ? OR full_name LIKE ? OR contact_no LIKE ?)";
    $searchTerm = "%{$search}%";
    $params[] = $searchTerm;
    $params[] = $searchTerm;
    $params[] = $searchTerm;
}

$sql .= " ORDER BY appointment_date ASC, time_slot ASC, id DESC";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$appointments = $stmt->fetchAll();

// Statistics Counters
$totalAppointments = $pdo->query("SELECT COUNT(*) FROM appointments")->fetchColumn();
$pendingCount = $pdo->query("SELECT COUNT(*) FROM appointments WHERE status = 'Pending'")->fetchColumn();
$approvedCount = $pdo->query("SELECT COUNT(*) FROM appointments WHERE status = 'Approved'")->fetchColumn();
$completedCount = $pdo->query("SELECT COUNT(*) FROM appointments WHERE status = 'Completed'")->fetchColumn();
$cancelledCount = $pdo->query("SELECT COUNT(*) FROM appointments WHERE status = 'Cancelled'")->fetchColumn();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - <?= MUNICIPALITY_NAME ?></title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <style>
        :root {
            --muni-primary: #0f4c81;
        }
        body {
            background-color: #f1f5f9;
            font-family: system-ui, -apple-system, sans-serif;
        }
        .navbar-admin {
            background: linear-gradient(135deg, #0f4c81 0%, #1e3a8a 100%);
        }
        .card-custom {
            border: none;
            border-radius: 0.85rem;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05);
        }
        .stat-card {
            border-left: 4px solid;
        }
        .stat-total { border-color: #0f4c81; }
        .stat-pending { border-color: #f59e0b; }
        .stat-approved { border-color: #10b981; }
        .stat-completed { border-color: #3b82f6; }

        /* Print Media Styling for Daily Master List */
        @media print {
            .no-print {
                display: none !important;
            }
            body {
                background: white !important;
                color: black !important;
                font-size: 11pt;
            }
            .card-custom {
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
            }
            .print-only-header {
                display: block !important;
            }
            .table-responsive {
                overflow: visible !important;
            }
            table {
                width: 100% !important;
                border-collapse: collapse !important;
            }
            th, td {
                border: 1px solid #333 !important;
                padding: 6px 8px !important;
            }
            .action-column {
                display: none !important;
            }
            .print-footer {
                display: block !important;
                margin-top: 40px;
            }
        }

        .print-only-header, .print-footer {
            display: none;
        }
    </style>
</head>
<body>

    <!-- Admin Navigation Bar (Hidden on Print) -->
    <nav class="navbar navbar-expand-lg navbar-dark navbar-admin py-2 px-3 no-print sticky-top">
        <div class="container-fluid">
            <a class="navbar-brand d-flex align-items-center gap-2 fw-bold" href="dashboard.php">
                <i class="bi bi-bank2 text-warning fs-4"></i>
                <span class="fs-5"><?= MUNICIPALITY_NAME ?> &bull; Admin Portal</span>
            </a>
            
            <div class="d-flex align-items-center gap-3">
                <span class="text-white-50 small d-none d-md-inline">
                    <i class="bi bi-person-circle me-1"></i> Logged in: <strong class="text-white"><?= htmlspecialchars($_SESSION['admin_user']) ?></strong>
                </span>
                <!-- Download DB Backup Button -->
                <a href="backup.php" class="btn btn-warning btn-sm fw-semibold" title="Export complete database as .sql file">
                    <i class="bi bi-database-down me-1"></i> Download DB Backup
                </a>
                <a href="../index.php" target="_blank" class="btn btn-outline-light btn-sm" title="View Resident Public Portal">
                    <i class="bi bi-box-arrow-up-right me-1"></i> Public Site
                </a>
                <a href="../logout.php" class="btn btn-outline-danger btn-sm text-white" title="Sign out">
                    <i class="bi bi-power me-1"></i> Logout
                </a>
            </div>
        </div>
    </nav>

    <!-- Master List Print Header (Visible ONLY on Print) -->
    <div class="print-only-header text-center my-3 pb-3 border-bottom">
        <div class="text-uppercase small fw-semibold">Republic of the Philippines &bull; <?= MUNICIPALITY_PROVINCE ?></div>
        <h3 class="fw-bold mb-1"><?= MUNICIPALITY_NAME ?></h3>
        <h5 class="text-uppercase text-secondary fw-semibold">Official Daily Appointment Master List</h5>
        <div class="small text-muted">
            Report Generated on: <strong><?= date('F d, Y h:i A') ?></strong>
            <?php if (!empty($filterDate)): ?> &bull; Filter Date: <strong><?= date('F d, Y', strtotime($filterDate)) ?></strong><?php endif; ?>
            <?php if (!empty($filterOffice)): ?> &bull; Office: <strong><?= htmlspecialchars($filterOffice) ?></strong><?php endif; ?>
        </div>
    </div>

    <div class="container-fluid py-4 px-3 px-md-4">
        
        <!-- Flash Alerts (Hidden on Print) -->
        <?php if (!empty($message)): ?>
            <div class="alert alert-success alert-dismissible fade show card-custom py-2 px-3 mb-3 no-print" role="alert">
                <i class="bi bi-check-circle-fill me-2"></i> <?= $message ?>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        <?php endif; ?>

        <?php if (!empty($error)): ?>
            <div class="alert alert-danger alert-dismissible fade show card-custom py-2 px-3 mb-3 no-print" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i> <?= $error ?>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        <?php endif; ?>

        <!-- Stats Counter Cards (Hidden on Print) -->
        <div class="row g-3 mb-4 no-print">
            <div class="col-6 col-md-3">
                <div class="card card-custom stat-card stat-total p-3 bg-white">
                    <small class="text-muted text-uppercase fw-semibold">Total Bookings</small>
                    <div class="fs-3 fw-bold text-dark mt-1"><?= $totalAppointments ?></div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="card card-custom stat-card stat-pending p-3 bg-white">
                    <small class="text-muted text-uppercase fw-semibold">Pending Review</small>
                    <div class="fs-3 fw-bold text-warning mt-1"><?= $pendingCount ?></div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="card card-custom stat-card stat-approved p-3 bg-white">
                    <small class="text-muted text-uppercase fw-semibold">Approved</small>
                    <div class="fs-3 fw-bold text-success mt-1"><?= $approvedCount ?></div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="card card-custom stat-card stat-completed p-3 bg-white">
                    <small class="text-muted text-uppercase fw-semibold">Completed</small>
                    <div class="fs-3 fw-bold text-primary mt-1"><?= $completedCount ?></div>
                </div>
            </div>
        </div>

        <!-- Filter and Search Toolbar (Hidden on Print) -->
        <div class="card card-custom p-3 mb-4 bg-white no-print">
            <form action="dashboard.php" method="GET" class="row g-2 align-items-center">
                <div class="col-12 col-md-3">
                    <label class="form-label small text-muted mb-1">Filter by Date</label>
                    <input type="date" name="filter_date" class="form-control form-control-sm" value="<?= htmlspecialchars($filterDate) ?>">
                </div>
                <div class="col-12 col-md-3">
                    <label class="form-label small text-muted mb-1">Filter by Office</label>
                    <select name="filter_office" class="form-select form-select-sm">
                        <option value="">All Offices</option>
                        <option value="Local Civil Registrar" <?= $filterOffice === 'Local Civil Registrar' ? 'selected' : '' ?>>Local Civil Registrar</option>
                        <option value="Mayor's Office" <?= $filterOffice === "Mayor's Office" ? 'selected' : '' ?>>Mayor's Office</option>
                        <option value="Municipal Assessor" <?= $filterOffice === 'Municipal Assessor' ? 'selected' : '' ?>>Municipal Assessor</option>
                        <option value="Municipal Treasury" <?= $filterOffice === 'Municipal Treasury' ? 'selected' : '' ?>>Municipal Treasury</option>
                        <option value="Municipal Health Office" <?= $filterOffice === 'Municipal Health Office' ? 'selected' : '' ?>>Municipal Health Office</option>
                        <option value="Municipal Engineering / MPDC" <?= $filterOffice === 'Municipal Engineering / MPDC' ? 'selected' : '' ?>>Municipal Engineering / MPDC</option>
                    </select>
                </div>
                <div class="col-12 col-md-2">
                    <label class="form-label small text-muted mb-1">Status</label>
                    <select name="filter_status" class="form-select form-select-sm">
                        <option value="">All Statuses</option>
                        <option value="Pending" <?= $filterStatus === 'Pending' ? 'selected' : '' ?>>Pending</option>
                        <option value="Approved" <?= $filterStatus === 'Approved' ? 'selected' : '' ?>>Approved</option>
                        <option value="Completed" <?= $filterStatus === 'Completed' ? 'selected' : '' ?>>Completed</option>
                        <option value="Cancelled" <?= $filterStatus === 'Cancelled' ? 'selected' : '' ?>>Cancelled</option>
                    </select>
                </div>
                <div class="col-12 col-md-2">
                    <label class="form-label small text-muted mb-1">Search Resident / Ref</label>
                    <input type="text" name="search" class="form-control form-control-sm" placeholder="Name or MUN-..." value="<?= htmlspecialchars($search) ?>">
                </div>
                <div class="col-12 col-md-2 d-flex gap-1 align-self-end">
                    <button type="submit" class="btn btn-primary btn-sm flex-grow-1">
                        <i class="bi bi-filter"></i> Filter
                    </button>
                    <a href="dashboard.php" class="btn btn-outline-secondary btn-sm" title="Reset Filters">
                        <i class="bi bi-arrow-counterclockwise"></i>
                    </a>
                </div>
            </form>
        </div>

        <!-- Appointments Master Table Card -->
        <div class="card card-custom bg-white p-3 p-md-4">
            
            <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3 pb-2 border-bottom no-print">
                <div>
                    <h5 class="fw-bold mb-0 text-dark">Resident Appointments List</h5>
                    <small class="text-muted">Showing <?= count($appointments) ?> appointment record(s)</small>
                </div>
                <div class="d-flex gap-2">
                    <!-- Clean Browser Print Button -->
                    <button onclick="window.print()" class="btn btn-outline-dark btn-sm fw-semibold">
                        <i class="bi bi-printer me-1"></i> Print Master List
                    </button>
                </div>
            </div>

            <!-- The Appointments Table -->
            <div class="table-responsive">
                <table class="table table-hover table-striped align-middle mb-0">
                    <thead class="table-light">
                        <tr class="small text-uppercase text-secondary">
                            <th style="width: 14%;">Reference Code</th>
                            <th style="width: 18%;">Resident Name</th>
                            <th style="width: 12%;">Contact No</th>
                            <th style="width: 18%;">Municipal Office</th>
                            <th style="width: 13%;">Appointment Date</th>
                            <th style="width: 11%;">Time Slot</th>
                            <th style="width: 8%;">Status</th>
                            <th style="width: 16%;" class="action-column text-end">Quick Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($appointments)): ?>
                            <tr>
                                <td colspan="8" class="text-center py-4 text-muted">
                                    <i class="bi bi-inbox fs-2 d-block mb-1"></i>
                                    No appointment records found matching the current filters.
                                </td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($appointments as $row): ?>
                                <tr>
                                    <td>
                                        <a href="../track.php?ref=<?= urlencode($row['reference_code']) ?>" target="_blank" class="fw-bold text-decoration-none font-monospace">
                                            <?= htmlspecialchars($row['reference_code']) ?>
                                        </a>
                                    </td>
                                    <td class="fw-semibold text-dark">
                                        <?= htmlspecialchars($row['full_name']) ?>
                                    </td>
                                    <td><?= htmlspecialchars($row['contact_no']) ?></td>
                                    <td>
                                        <span class="text-primary fw-medium"><?= htmlspecialchars($row['office_name']) ?></span>
                                    </td>
                                    <td><?= date('M d, Y', strtotime($row['appointment_date'])) ?></td>
                                    <td class="small"><?= htmlspecialchars($row['time_slot']) ?></td>
                                    <td>
                                        <span class="badge <?= getStatusBadgeClass($row['status']) ?>">
                                            <?= htmlspecialchars($row['status']) ?>
                                        </span>
                                    </td>
                                    <td class="action-column text-end">
                                        <!-- Quick Status Changer Form -->
                                        <div class="dropdown d-inline-block">
                                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle py-0 px-2" type="button" data-bs-toggle="dropdown">
                                                Update Status
                                            </button>
                                            <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                                                <li>
                                                    <form action="dashboard.php<?= !empty($_SERVER['QUERY_STRING']) ? '?' . htmlspecialchars($_SERVER['QUERY_STRING']) : '' ?>" method="POST" class="d-inline">
                                                        <input type="hidden" name="action" value="update_status">
                                                        <input type="hidden" name="appointment_id" value="<?= $row['id'] ?>">
                                                        <input type="hidden" name="new_status" value="Approved">
                                                        <button type="submit" class="dropdown-item text-success"><i class="bi bi-check-circle me-1"></i> Approve</button>
                                                    </form>
                                                </li>
                                                <li>
                                                    <form action="dashboard.php<?= !empty($_SERVER['QUERY_STRING']) ? '?' . htmlspecialchars($_SERVER['QUERY_STRING']) : '' ?>" method="POST" class="d-inline">
                                                        <input type="hidden" name="action" value="update_status">
                                                        <input type="hidden" name="appointment_id" value="<?= $row['id'] ?>">
                                                        <input type="hidden" name="new_status" value="Completed">
                                                        <button type="submit" class="dropdown-item text-primary"><i class="bi bi-check2-all me-1"></i> Mark Completed</button>
                                                    </form>
                                                </li>
                                                <li>
                                                    <form action="dashboard.php<?= !empty($_SERVER['QUERY_STRING']) ? '?' . htmlspecialchars($_SERVER['QUERY_STRING']) : '' ?>" method="POST" class="d-inline">
                                                        <input type="hidden" name="action" value="update_status">
                                                        <input type="hidden" name="appointment_id" value="<?= $row['id'] ?>">
                                                        <input type="hidden" name="new_status" value="Cancelled">
                                                        <button type="submit" class="dropdown-item text-danger"><i class="bi bi-x-circle me-1"></i> Cancel</button>
                                                    </form>
                                                </li>
                                                <li><hr class="dropdown-divider"></li>
                                                <li>
                                                    <form action="dashboard.php<?= !empty($_SERVER['QUERY_STRING']) ? '?' . htmlspecialchars($_SERVER['QUERY_STRING']) : '' ?>" method="POST" class="d-inline">
                                                        <input type="hidden" name="action" value="update_status">
                                                        <input type="hidden" name="appointment_id" value="<?= $row['id'] ?>">
                                                        <input type="hidden" name="new_status" value="Pending">
                                                        <button type="submit" class="dropdown-item text-secondary"><i class="bi bi-hourglass me-1"></i> Set Pending</button>
                                                    </form>
                                                </li>
                                            </ul>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>

            <!-- Print View Signatures (Visible ONLY when printing) -->
            <div class="print-footer row">
                <div class="col-6">
                    <p class="mb-5 small text-muted">Prepared By:</p>
                    <div style="border-bottom: 1px solid #000; width: 220px;" class="mb-1"></div>
                    <strong><?= htmlspecialchars($_SESSION['admin_user']) ?></strong><br>
                    <small class="text-muted">Municipal Receiving Officer</small>
                </div>
                <div class="col-6 text-end">
                    <p class="mb-5 small text-muted">Approved & Noted By:</p>
                    <div style="border-bottom: 1px solid #000; width: 220px; margin-left: auto;" class="mb-1"></div>
                    <strong>HON. MUNICIPAL MAYOR</strong><br>
                    <small class="text-muted"><?= MUNICIPALITY_NAME ?></small>
                </div>
            </div>

        </div>
    </div>

    <!-- Bootstrap 5 JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
