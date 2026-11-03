<?php
require_once 'config.php';

$pdo = getDbConnection();
$ref = strtoupper(sanitize($_GET['ref'] ?? ''));
$appointment = null;
$error = '';

if (!empty($ref)) {
    if (preg_match('/^MUN-[0-9]{4}-(?:[0-9]{4}|[A-F0-9]{12})$/', $ref)) {
        $stmt = $pdo->prepare("SELECT reference_code, office_name, appointment_date, time_slot, status, created_at FROM appointments WHERE reference_code = ? LIMIT 1");
        $stmt->execute([$ref]);
        $appointment = $stmt->fetch();
    }

    if (!$appointment) {
        $error = 'No appointment record found for that reference code. Please verify it and try again.';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Track Appointment - <?= MUNICIPALITY_NAME ?></title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <style>
        :root {
            --muni-primary: #0f4c81;
        }
        body {
            background-color: #f8fafc;
            font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        }
        .navbar-muni {
            background: linear-gradient(135deg, #0f4c81 0%, #1e3a8a 100%);
        }
        .card-custom {
            border: none;
            border-radius: 1rem;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
        }
        .barcode-strip {
            font-family: 'Courier New', Courier, monospace;
            letter-spacing: 4px;
            font-weight: 800;
            background: #f1f5f9;
            border: 2px dashed #cbd5e1;
            padding: 0.75rem 1.5rem;
            display: inline-block;
            border-radius: 6px;
        }

        /* Print View Optimization */
        @media print {
            .no-print {
                display: none !important;
            }
            body {
                background: white !important;
                color: black !important;
            }
            .card-custom {
                box-shadow: none !important;
                border: 1px solid #000 !important;
            }
            .print-header {
                display: block !important;
            }
        }
    </style>
</head>
<body>

    <!-- Header Navigation (Hidden on Print) -->
    <nav class="navbar navbar-expand-lg navbar-dark navbar-muni py-3 no-print">
        <div class="container">
            <a class="navbar-brand d-flex align-items-center gap-2 fw-bold" href="index.php">
                <i class="bi bi-bank2 fs-3 text-warning"></i>
                <div>
                    <div class="lh-1"><?= MUNICIPALITY_NAME ?></div>
                    <small class="text-white-50 fw-normal fs-6"><?= MUNICIPALITY_PROVINCE ?></small>
                </div>
            </a>
            <div class="d-flex align-items-center gap-2">
                <a href="index.php" class="btn btn-outline-light btn-sm rounded-pill px-3">
                    <i class="bi bi-plus-circle me-1"></i> New Booking
                </a>
                <a href="login.php" class="btn btn-warning btn-sm rounded-pill px-3 fw-semibold text-dark">
                    <i class="bi bi-shield-lock-fill me-1"></i> Admin
                </a>
            </div>
        </div>
    </nav>

    <div class="container py-5" style="max-width: 820px;">

        <!-- Search Bar (Hidden on Print) -->
        <div class="card card-custom p-3 mb-4 no-print">
            <form action="track.php" method="GET" class="d-flex gap-2">
                <div class="input-group">
                    <span class="input-group-text bg-white text-muted"><i class="bi bi-search"></i></span>
                    <input type="text" name="ref" class="form-control text-uppercase fw-bold" 
                           placeholder="Enter Reference Code (e.g. MUN-2026-A1B2C3D4E5F6)" 
                           value="<?= htmlspecialchars($ref, ENT_QUOTES, 'UTF-8') ?>" required>
                </div>
                <button type="submit" class="btn btn-primary px-4 fw-semibold text-nowrap">Check Status</button>
            </form>
        </div>

        <?php if (!empty($error)): ?>
            <div class="alert alert-danger card-custom p-4 no-print text-center" role="alert">
                <i class="bi bi-exclamation-circle-fill text-danger fs-1 d-block mb-2"></i>
                <h5 class="fw-bold">Appointment Not Found</h5>
                <p class="mb-3"><?= $error ?></p>
                <a href="index.php" class="btn btn-outline-danger">Return to Home & Book Now</a>
            </div>
        <?php elseif ($appointment): ?>
            
            <!-- Printable Appointment Slip -->
            <div class="card card-custom p-4 p-md-5 bg-white">
                
                <!-- Official Municipal Letterhead -->
                <div class="text-center pb-3 border-bottom mb-4">
                    <small class="text-uppercase tracking-wider text-muted fw-semibold">Republic of the Philippines</small>
                    <h5 class="fw-bold mb-0 text-primary"><?= MUNICIPALITY_NAME ?></h5>
                    <p class="text-muted small mb-2"><?= MUNICIPALITY_PROVINCE ?></p>
                    <div class="badge bg-secondary-subtle text-secondary px-3 py-1">OFFICIAL APPOINTMENT CONFIRMATION SLIP</div>
                </div>

                <!-- Status Banner -->
                <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 p-3 rounded-3 mb-4 border bg-light">
                    <div>
                        <small class="text-muted d-block">Official Reference Code</small>
                        <div class="barcode-strip text-primary fs-5 mt-1"><?= htmlspecialchars($appointment['reference_code']) ?></div>
                    </div>
                    <div class="text-sm-end">
                        <small class="text-muted d-block">Current Booking Status</small>
                        <span class="badge <?= getStatusBadgeClass($appointment['status']) ?> fs-6 px-3 py-2 mt-1">
                            <?= htmlspecialchars($appointment['status']) ?>
                        </span>
                    </div>
                </div>

                <!-- Appointment Details Table -->
                <h6 class="fw-bold text-uppercase text-secondary small tracking-wider mb-3">Appointment & Schedule Details</h6>
                <div class="table-responsive mb-4">
                    <table class="table table-bordered table-striped align-middle mb-0">
                        <tbody>
                    <tr>
                                <th class="bg-light text-muted">Municipal Office</th>
                                <td class="fw-semibold text-primary"><?= htmlspecialchars($appointment['office_name']) ?></td>
                            </tr>
                            <tr>
                                <th class="bg-light text-muted">Scheduled Date</th>
                                <td class="fw-bold text-dark">
                                    <i class="bi bi-calendar3 me-1 text-primary"></i>
                                    <?= date('F d, Y (l)', strtotime($appointment['appointment_date'])) ?>
                                </td>
                            </tr>
                            <tr>
                                <th class="bg-light text-muted">Scheduled Time Slot</th>
                                <td class="fw-bold text-dark">
                                    <i class="bi bi-clock me-1 text-primary"></i>
                                    <?= htmlspecialchars($appointment['time_slot']) ?>
                                </td>
                            </tr>
                            <tr>
                                <th class="bg-light text-muted">Date Filed</th>
                                <td class="text-muted small"><?= date('F d, Y h:i A', strtotime($appointment['created_at'])) ?></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Reminders & Instructions -->
                <div class="p-3 bg-light-subtle rounded-3 border mb-4">
                    <h6 class="fw-bold text-dark mb-2"><i class="bi bi-info-circle text-primary me-1"></i> Important Instructions for Resident:</h6>
                    <ul class="small text-muted mb-0 ps-3">
                        <li>Please present this slip (printed or screenshot) at the Municipal Entrance Security Desk.</li>
                        <li>Bring at least one (1) valid government-issued photo ID (e.g., Driver's License, PhilID, Voter's ID, Passport).</li>
                        <li>Please arrive 10-15 minutes prior to your time window. Late arrivals may be subject to rescheduling.</li>
                        <li>Observe proper dress code (slippers and sleeveless shirts are discouraged in municipal halls).</li>
                    </ul>
                </div>

                <!-- Action Buttons (Hidden on Print) -->
                <div class="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 pt-3 border-top no-print">
                    <a href="index.php" class="btn btn-outline-secondary">
                        <i class="bi bi-arrow-left me-1"></i> Back to Home
                    </a>
                    <div class="d-flex gap-2">
                        <button onclick="window.print()" class="btn btn-primary fw-semibold">
                            <i class="bi bi-printer me-1"></i> Print / Save as PDF
                        </button>
                    </div>
                </div>

            </div>

        <?php else: ?>
            <div class="card card-custom p-5 text-center">
                <i class="bi bi-upc-scan text-muted fs-1 mb-3"></i>
                <h4 class="fw-bold">Look Up Your Appointment</h4>
                <p class="text-muted mb-4">Please enter your Reference Code (e.g., MUN-2026-1001) in the search field above to track your booking.</p>
                <a href="index.php" class="btn btn-primary mx-auto">Book New Slot</a>
            </div>
        <?php endif; ?>

    </div>

    <!-- Bootstrap 5 JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
