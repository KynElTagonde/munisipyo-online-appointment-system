<?php
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
    } elseif (!preg_match('/^[0-9+\-\s]{7,20}$/', $contactNo)) {
        $errorMsg = 'Please enter a valid contact number.';
    } elseif (!preg_match('/^.{1,100}$/u', $fullName)) {
        $errorMsg = 'Please enter a name of 100 characters or fewer.';
    } elseif (!in_array($officeName, MUNICIPAL_OFFICES, true)) {
        $errorMsg = 'Please select a valid municipal office.';
    } elseif (!in_array($timeSlot, APPOINTMENT_TIME_SLOTS, true)) {
        $errorMsg = 'Please select a valid appointment time slot.';
    } elseif (
        !($date = DateTimeImmutable::createFromFormat('!Y-m-d', $appointmentDate))
        || $date->format('Y-m-d') !== $appointmentDate
    ) {
        $errorMsg = 'Please enter a valid appointment date.';
    } elseif ($date < new DateTimeImmutable('tomorrow')) {
        $errorMsg = 'Appointments must be scheduled at least 1 day in advance.';
    } else {
        $lockName = 'slot:' . substr(hash('sha256', $appointmentDate . "\0" . $timeSlot . "\0" . $officeName), 0, 59);

        try {
            $lockStmt = $pdo->prepare('SELECT GET_LOCK(?, 5)');
            $lockStmt->execute([$lockName]);

            if ((int)$lockStmt->fetchColumn() !== 1) {
                $errorMsg = 'This appointment slot is being reserved. Please try again.';
            } else {
                try {
                    $pdo->beginTransaction();
                    $availability = checkSlotAvailability($pdo, $appointmentDate, $timeSlot, $officeName);

                    if (!$availability['available']) {
                        $pdo->rollBack();
                        $errorMsg = 'Sorry! Maximum slot capacity (' . MAX_SLOTS_PER_PERIOD . ' persons) for <strong>'
                            . htmlspecialchars($officeName, ENT_QUOTES, 'UTF-8') . '</strong> on <strong>'
                            . htmlspecialchars($appointmentDate, ENT_QUOTES, 'UTF-8') . ' ('
                            . htmlspecialchars($timeSlot, ENT_QUOTES, 'UTF-8')
                            . ')</strong> has been reached. Please choose a different date or time slot.';
                    } else {
                        $refCode = generateReferenceCode($pdo);
                        $stmt = $pdo->prepare("
                            INSERT INTO appointments (reference_code, full_name, contact_no, office_name, appointment_date, time_slot, status)
                            VALUES (?, ?, ?, ?, ?, ?, 'Pending')
                        ");
                        $stmt->execute([$refCode, $fullName, $contactNo, $officeName, $appointmentDate, $timeSlot]);
                        $pdo->commit();

                        $generatedRef = $refCode;
                        $successMsg = "Appointment successfully booked! Your reference code is: <strong>{$refCode}</strong>";
                    }
                } catch (PDOException $e) {
                    if ($pdo->inTransaction()) {
                        $pdo->rollBack();
                    }
                    error_log('Appointment reservation failed: ' . $e->getMessage());
                    $errorMsg = 'A database error occurred while reserving your slot. Please try again.';
                } finally {
                    $releaseStmt = $pdo->prepare('SELECT RELEASE_LOCK(?)');
                    $releaseStmt->execute([$lockName]);
                }
            }
        } catch (PDOException $e) {
            error_log('Appointment slot lock failed: ' . $e->getMessage());
            $errorMsg = 'The appointment slot could not be reserved. Please try again.';
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
    <style>
        :root {
            --muni-primary: #0f4c81;
            --muni-accent: #f59e0b;
        }
        body {
            background-color: #f8fafc;
            font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        }
        .navbar-muni {
            background: linear-gradient(135deg, #0f4c81 0%, #1e3a8a 100%);
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        .hero-banner {
            background: linear-gradient(rgba(15, 76, 129, 0.92), rgba(30, 58, 138, 0.95));
            color: #ffffff;
            padding: 3rem 1rem 3.5rem;
            border-bottom: 4px solid var(--muni-accent);
        }
        .card-custom {
            border: none;
            border-radius: 1rem;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
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
        .badge-slot {
            font-size: 0.85rem;
            padding: 0.35rem 0.65rem;
        }
    </style>
</head>
<body>

    <!-- Municipal Header Navbar -->
    <nav class="navbar navbar-expand-lg navbar-dark navbar-muni py-3">
        <div class="container">
            <a class="navbar-brand d-flex align-items-center gap-2 fw-bold" href="index.php">
                <i class="bi bi-bank2 fs-3 text-warning"></i>
                <div>
                    <div class="lh-1"><?= MUNICIPALITY_NAME ?></div>
                    <small class="text-white-50 fw-normal fs-6"><?= MUNICIPALITY_PROVINCE ?></small>
                </div>
            </a>
            <div class="d-flex align-items-center gap-3">
                <a href="#track-section" class="btn btn-outline-light btn-sm rounded-pill px-3">
                    <i class="bi bi-search me-1"></i> Check Status
                </a>
                <a href="login.php" class="btn btn-warning btn-sm rounded-pill px-3 fw-semibold text-dark">
                    <i class="bi bi-shield-lock-fill me-1"></i> Admin Portal
                </a>
            </div>
        </div>
    </nav>

    <!-- Hero Section with Public Track / Status Checker -->
    <header class="hero-banner text-center mb-5">
        <div class="container">
            <span class="badge bg-warning text-dark px-3 py-2 rounded-pill fw-bold text-uppercase mb-3 tracking-wide">
                Public Service Portal
            </span>
            <h1 class="display-6 fw-bold mb-2">Online Municipal Appointment System</h1>
            <p class="lead text-white-50 mx-auto mb-4" style="max-width: 680px;">
                Skip the long lines. Book your scheduled appointment in municipal offices or track the live status of your reservation with your Reference Code.
            </p>

            <!-- 4. Public Track/Status Checker Search Bar -->
            <div id="track-section" class="card card-custom p-3 mx-auto shadow-lg" style="max-width: 600px;">
                <form action="track.php" method="GET" class="d-flex flex-column flex-sm-row gap-2">
                    <div class="input-group">
                        <span class="input-group-text bg-white border-end-0 text-muted">
                            <i class="bi bi-upc-scan fs-5"></i>
                        </span>
                        <input type="text" name="ref" class="form-control form-control-lg border-start-0 text-uppercase fw-bold" 
                               placeholder="e.g. MUN-2026-1001" required pattern="MUN-[0-9]{4}-[0-9]{4}" 
                               title="Format: MUN-YYYY-XXXX">
                    </div>
                    <button type="submit" class="btn btn-muni btn-lg px-4 text-nowrap">
                        <i class="bi bi-search me-1"></i> Track Status
                    </button>
                </form>
                <div class="form-text text-start mt-2 text-muted">
                    <i class="bi bi-info-circle me-1"></i> Enter the reference code issued to you upon booking.
                </div>
            </div>
        </div>
    </header>

    <!-- Main Container -->
    <div class="container pb-5">
        
        <!-- Alerts -->
        <?php if (!empty($errorMsg)): ?>
            <div class="alert alert-danger alert-dismissible fade show card-custom mb-4" role="alert">
                <i class="bi bi-exclamation-triangle-fill fs-5 me-2"></i>
                <?= $errorMsg ?>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        <?php endif; ?>

        <?php if (!empty($successMsg)): ?>
            <div class="alert alert-success card-custom p-4 mb-4" role="alert">
                <div class="d-flex align-items-start gap-3">
                    <i class="bi bi-check-circle-fill text-success fs-1"></i>
                    <div class="flex-grow-1">
                        <h4 class="alert-heading fw-bold">Reservation Successful!</h4>
                        <p class="mb-2"><?= $successMsg ?></p>
                        <p class="small text-muted mb-3">Please save or screenshot your Reference Code. Present it at the municipal gate along with 1 valid ID.</p>
                        <a href="track.php?ref=<?= urlencode($generatedRef) ?>" class="btn btn-success fw-bold">
                            <i class="bi bi-printer me-1"></i> View & Print Appointment Slip
                        </a>
                    </div>
                </div>
            </div>
        <?php endif; ?>

        <div class="row g-4">
            <!-- Left Column: Booking Form -->
            <div class="col-lg-8">
                <div class="card card-custom p-4 p-md-5">
                    <div class="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
                        <div class="bg-primary-subtle text-primary p-3 rounded-circle">
                            <i class="bi bi-calendar-check fs-3"></i>
                        </div>
                        <div>
                            <h3 class="fw-bold mb-0 text-dark">Book an Appointment Slot</h3>
                            <p class="text-muted small mb-0">Fill in your information to reserve an official municipal slot</p>
                        </div>
                    </div>

                    <form action="index.php" method="POST" id="appointmentForm" novalidate>
                        <input type="hidden" name="action" value="book_slot">

                        <h5 class="fw-semibold text-primary mb-3">1. Personal Information</h5>
                        <div class="row g-3 mb-4">
                            <div class="col-md-7">
                                <label for="fullName" class="form-label fw-semibold">Full Name <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="fullName" name="full_name" 
                                       placeholder="Juan C. Dela Cruz" required maxlength="100">
                                <div class="invalid-feedback">Please enter your full name.</div>
                            </div>
                            <div class="col-md-5">
                                <label for="contactNo" class="form-label fw-semibold">Contact Number <span class="text-danger">*</span></label>
                                <input type="tel" class="form-control" id="contactNo" name="contact_no" 
                                       placeholder="09171234567" required pattern="[0-9+\-\s]{7,20}">
                                <div class="invalid-feedback">Valid contact number required.</div>
                            </div>
                        </div>

                        <h5 class="fw-semibold text-primary mb-3">2. Municipal Office & Schedule</h5>
                        <div class="row g-3 mb-4">
                            <div class="col-md-12">
                                <label for="officeName" class="form-label fw-semibold">Target Municipal Office <span class="text-danger">*</span></label>
                                <select class="form-select" id="officeName" name="office_name" required onchange="updateRequirements(this.value)">
                                    <option value="" selected disabled>-- Select Municipal Department --</option>
                                    <option value="Local Civil Registrar">Local Civil Registrar (Birth, Marriage, Death Certificates)</option>
                                    <option value="Mayor's Office">Office of the Municipal Mayor (Endorsements & Financial Assistance)</option>
                                    <option value="Municipal Assessor">Municipal Assessor's Office (Tax Declarations & Property Assessment)</option>
                                    <option value="Municipal Treasury">Municipal Treasury (Cedula, Business Permits & Local Taxes)</option>
                                    <option value="Municipal Health Office">Municipal Health Office (Sanitary Permits & Health Cards)</option>
                                    <option value="Municipal Engineering / MPDC">Municipal Engineering (Building & Occupancy Permits)</option>
                                </select>
                                <div class="invalid-feedback">Please select an office.</div>
                            </div>

                            <div class="col-md-6">
                                <label for="appointmentDate" class="form-label fw-semibold">Appointment Date <span class="text-danger">*</span></label>
                                <input type="date" class="form-control" id="appointmentDate" name="appointment_date" 
                                       min="<?= date('Y-m-d', strtotime('+1 day')) ?>" required>
                                <div class="form-text">Appointments must be scheduled at least 1 day in advance.</div>
                            </div>

                            <div class="col-md-6">
                                <label for="timeSlot" class="form-label fw-semibold">Time Slot <span class="text-danger">*</span></label>
                                <select class="form-select" id="timeSlot" name="time_slot" required>
                                    <option value="" selected disabled>-- Choose Time Slot --</option>
                                    <option value="08:00 AM - 09:30 AM">08:00 AM - 09:30 AM (Morning Batch 1)</option>
                                    <option value="10:00 AM - 11:30 AM">10:00 AM - 11:30 AM (Morning Batch 2)</option>
                                    <option value="01:00 PM - 02:30 PM">01:00 PM - 02:30 PM (Afternoon Batch 1)</option>
                                    <option value="03:00 PM - 04:30 PM">03:00 PM - 04:30 PM (Afternoon Batch 2)</option>
                                </select>
                                <div class="invalid-feedback">Please choose a preferred time slot.</div>
                            </div>
                        </div>

                        <!-- Capacity Notice -->
                        <div class="alert alert-info py-2 px-3 small d-flex align-items-center gap-2 mb-4">
                            <i class="bi bi-shield-check fs-5"></i>
                            <div>
                                <strong>Automated Slot Protection:</strong> Each batch is capped at <strong><?= MAX_SLOTS_PER_PERIOD ?> slots</strong> to prevent municipal crowding and guarantee fast service.
                            </div>
                        </div>

                        <!-- Submit Button -->
                        <div class="d-grid">
                            <button type="submit" class="btn btn-muni btn-lg py-3 fw-bold">
                                <i class="bi bi-calendar-plus me-1"></i> Confirm & Book Reservation
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Right Column: Municipal Office Guide & Requirements -->
            <div class="col-lg-4">
                <!-- Requirements Card -->
                <div class="card card-custom p-4 mb-4">
                    <h5 class="fw-bold text-dark mb-3">
                        <i class="bi bi-folder-check text-warning me-2"></i>Requirements Checklist
                    </h5>
                    <div id="requirementsBox" class="text-muted small">
                        <p class="mb-2">Select a municipal office in the form to preview the required documentary requirements.</p>
                        <div class="p-3 bg-light rounded-3 border">
                            <strong class="d-block text-dark mb-1">Standard Requirements:</strong>
                            <ul class="ps-3 mb-0">
                                <li>1 Valid Government-issued Photo ID</li>
                                <li>Printed or digital copy of Reference Code</li>
                                <li>Barangay Certificate of Residency (if requested)</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Operating Hours & Reminders -->
                <div class="card card-custom p-4">
                    <h5 class="fw-bold text-dark mb-3">
                        <i class="bi bi-clock-history text-primary me-2"></i>Municipal Guidelines
                    </h5>
                    <ul class="list-unstyled small text-muted mb-0 d-flex flex-column gap-2">
                        <li class="d-flex align-items-start gap-2">
                            <i class="bi bi-check-circle text-success mt-1"></i>
                            <span>Office Hours: Monday to Friday, 8:00 AM – 5:00 PM (No Noon Break).</span>
                        </li>
                        <li class="d-flex align-items-start gap-2">
                            <i class="bi bi-check-circle text-success mt-1"></i>
                            <span>Arrive 15 minutes before your scheduled batch window.</span>
                        </li>
                        <li class="d-flex align-items-start gap-2">
                            <i class="bi bi-check-circle text-success mt-1"></i>
                            <span>Strict compliance with the "No Facilitator / Anti-Fixer" Act (RA 9485).</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="bg-white border-top py-4 mt-auto text-center text-muted small">
        <div class="container">
            <p class="mb-1">&copy; <?= date('Y') ?> <?= MUNICIPALITY_NAME ?>. All Rights Reserved.</p>
            <p class="mb-0">Powered by Municipal IT & Management Services Office &bull; Strictly 2-Table MySQL System</p>
        </div>
    </footer>

    <!-- Bootstrap 5 JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // Dynamic Requirements Checklist
        const officeRequirements = {
            "Local Civil Registrar": [
                "PSA/NSO Document copy (if correction)",
                "Barangay Certification of indigency or residency",
                "Valid Government ID of registered person / parent"
            ],
            "Mayor's Office": [
                "Barangay Endorsement Letter",
                "Valid ID and proof of indigency (for medical/burial assistance)",
                "Formal letter addressed to the Municipal Mayor"
            ],
            "Municipal Assessor": [
                "Previous Tax Declaration",
                "Official Title / Deed of Sale / Transfer Document",
                "Real Property Tax Clearance from Treasury"
            ],
            "Municipal Treasury": [
                "DTI / SEC Registration (for Business Permits)",
                "Barangay Business Clearance",
                "Community Tax Certificate (Cedula) fee preparation"
            ],
            "Municipal Health Office": [
                "1x1 ID Picture (2 copies)",
                "Stool / Urine / Chest X-ray laboratory results",
                "Valid ID"
            ],
            "Municipal Engineering / MPDC": [
                "5 sets of Architectural / Structural Plans signed by Engr./Arch.",
                "Land Title or Contract of Lease",
                "Zoning Clearance & Barangay Construction Clearance"
            ]
        };

        function updateRequirements(office) {
            const box = document.getElementById('requirementsBox');
            if (!office || !officeRequirements[office]) return;

            let html = `<div class="p-3 bg-light rounded-3 border">
                <strong class="d-block text-primary mb-2"><i class="bi bi-pin-angle-fill me-1"></i> ${office} Checklist:</strong>
                <ul class="ps-3 mb-2">`;
            
            officeRequirements[office].forEach(req => {
                html += `<li>${req}</li>`;
            });

            html += `</ul>
                <div class="text-secondary" style="font-size:0.75rem;"><i class="bi bi-info-circle me-1"></i> Plus 1 Valid Government ID and your Appointment Slip.</div>
            </div>`;
            box.innerHTML = html;
        }

        // Bootstrap Client Validation
        (() => {
            'use strict';
            const forms = document.querySelectorAll('#appointmentForm');
            Array.from(forms).forEach(form => {
                form.addEventListener('submit', event => {
                    if (!form.checkValidity()) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                    form.classList.add('was-validated');
                }, false);
            });
        })();
    </script>
</body>
</html>
