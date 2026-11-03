# Munisipyo Online Appointment System

The primary application is the PHP/MySQL system in the project root, built with **PHP (PDO)**, **MySQL**, **HTML5**, **Bootstrap 5**, and **JavaScript**.

> **Important:** `src/` is a separate, browser-only React UI demo. It stores sample data in the current browser and is not connected to the PHP/MySQL application. It has no real authentication. Do not enter real resident information into the demo.

---

## 🏛️ System Features

1. **Online Slot Reservation Form (`index.php`)**:
   - Clean single-page booking form for municipal residents.
   - Target municipal department selector (Local Civil Registrar, Mayor's Office, Municipal Assessor, Municipal Treasury, Municipal Health Office, MPDC/Engineering).
   - Dynamic documentary requirements checklist updated upon department selection.
   - Date picker (minimum next-day reservation) and 4 daily time-slot windows.
   - Resident contact info validation.

2. **Automated Slot Limit Logic (`config.php` & `index.php`)**:
   - Caps capacity at **5 residents per office, per date, per time slot** (`MAX_SLOTS_PER_PERIOD`).
   - Serializes reservations for each slot and checks active bookings before insertion.
   - If slot is full, gracefully blocks booking with an informative alert and prompts user to select another slot.

3. **Resident Booking Record Storage & Unique Reference Code (`MUN-2026-A1B2C3D4E5F6`)**:
   - Saves record directly to MySQL via secure PDO prepared statements.
   - Generates an unpredictable reference code such as `MUN-2026-A1B2C3D4E5F6`.

4. **Public Track / Status Checker (`track.php`)**:
   - Quick lookup by Reference Code. Public lookup shows booking status and schedule, not the resident's name or contact number.
   - Live status indicator: `Pending`, `Approved`, `Completed`, `Cancelled`.
   - Printable official appointment confirmation slip with municipal letterhead and barcode simulation.
   - Pre-configured `@media print` CSS for clean letterhead printing or saving as PDF.

5. **Admin Dashboard & Master List Print View (`admin/dashboard.php`)**:
   - Protected authentication requiring admin credentials (`admin` / `admin123`).
   - Statistical counters (Total, Pending, Approved, Completed, Cancelled).
   - Real-time filters by Date, Municipal Office, Status, and Resident Search.
   - Quick Status Changer (Approve, Complete, Cancel, Pending) without leaving the table.
   - **Print Master List Button**: Clean print-optimized layout hiding UI controls and displaying the formal Municipal Daily Master List with signature lines.
   - **Download DB Backup Button (`admin/backup.php`)**: Exports all table structures and rows into a `.sql` file download.

---

## 🗄️ Database Architecture (Strictly 2 Tables)

```sql
users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'resident') DEFAULT 'resident',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference_code VARCHAR(32) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  contact_no VARCHAR(20) NOT NULL,
  office_name VARCHAR(100) NOT NULL,
  appointment_date DATE NOT NULL,
  time_slot VARCHAR(50) NOT NULL,
  status ENUM('Pending', 'Approved', 'Completed', 'Cancelled') DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reference_code (reference_code),
  INDEX idx_appointment_date (appointment_date),
  INDEX idx_slot_lookup (appointment_date, time_slot, office_name)
);
```

---

## 🚀 Quick Setup & Deployment Guide (XAMPP / WAMP)

1. **Copy Files**:
   Place all files into your web server directory (e.g., `C:/xampp/htdocs/munisipyo/` or `/var/www/html/munisipyo/`).

2. **Import Database**:
   - Open **phpMyAdmin** (`http://localhost/phpmyadmin`).
   - Create a database named `munisipyo_db` or directly click **Import**.
   - Choose `database.sql` and click **Import / Go**.

3. **Configure Database Connection**:
   Open `config.php` and verify credentials:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'munisipyo_db');
   define('DB_USER', 'root');
   define('DB_PASS', '');
   ```

4. **Launch Application**:
   - Public Resident Portal: `http://localhost/munisipyo/index.php`
   - Admin Login: `http://localhost/munisipyo/login.php`
     - **Username**: `admin`
     - **Password**: `admin123`
   - Change the seeded admin password before making the PHP app accessible outside a trusted local environment.

The seeded `admin / admin123` account is for local development only. It is publicly documented in this demo project and must never be used on a public server.

`database.sql` uses `CREATE TABLE IF NOT EXISTS` and `INSERT IGNORE`; importing it again preserves existing appointments and users. It widens the reference-code column to support the new codes.

## Optional React UI Demo

The React app is for local UI exploration only; it is not the municipal service and must not be deployed as a replacement for the PHP/MySQL app.

```powershell
npm install
npm run dev
```

Open the Vite URL shown in the terminal (typically `http://localhost:3000`). All demo appointments are stored in that browser's local storage. The demo dashboard is intentionally unauthenticated and is clearly labeled as such.
