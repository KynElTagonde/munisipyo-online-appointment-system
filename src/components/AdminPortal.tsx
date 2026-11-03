import React, { useState } from 'react';
import { Appointment, AppointmentStatus } from '../types';
import { MUNICIPAL_OFFICES, TIME_SLOTS, generateDemoReferenceCode } from '../data/initialData';
import { 
  Filter, 
  Search, 
  Printer, 
  Download, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Users, 
  Calendar, 
  Building2, 
  PlusCircle,
  X,
  RotateCcw
} from 'lucide-react';

interface AdminPortalProps {
  appointments: Appointment[];
  onUpdateStatus: (id: number, newStatus: AppointmentStatus) => void;
  onAddWalkIn: (appointment: Omit<Appointment, 'id' | 'created_at'>) => void;
  onOpenPrintSlip: (appointment: Appointment) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  appointments,
  onUpdateStatus,
  onAddWalkIn,
  onOpenPrintSlip
}) => {
  // Filters State
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterOffice, setFilterOffice] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Walk-in modal state
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInContact, setWalkInContact] = useState('');
  const [walkInOffice, setWalkInOffice] = useState(MUNICIPAL_OFFICES[0].name);
  const [walkInDate, setWalkInDate] = useState(new Date().toISOString().split('T')[0]);
  const [walkInSlot, setWalkInSlot] = useState(TIME_SLOTS[0]);

  // Master List Print Modal View state
  const [isPrintMasterOpen, setIsPrintMasterOpen] = useState(false);

  // Filter Logic
  const filteredAppointments = appointments.filter(app => {
    if (filterDate && app.appointment_date !== filterDate) return false;
    if (filterOffice && app.office_name !== filterOffice) return false;
    if (filterStatus && app.status !== filterStatus) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = app.full_name.toLowerCase().includes(q);
      const matchRef = app.reference_code.toLowerCase().includes(q);
      const matchContact = app.contact_no.toLowerCase().includes(q);
      if (!matchName && !matchRef && !matchContact) return false;
    }
    return true;
  });

  // Database Backup SQL Generator
  const handleDownloadBackup = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `munisipyo_db_backup_${timestamp}.sql`;

    let sql = `-- ==========================================================\n`;
    sql += `-- Munisipyo Online Appointment Web System - SQL Dump Backup\n`;
    sql += `-- Generated on: ${new Date().toISOString()}\n`;
    sql += `-- Database: munisipyo_db (Strictly 2 Tables)\n`;
    sql += `-- ==========================================================\n\n`;

    sql += `CREATE DATABASE IF NOT EXISTS \`munisipyo_db\` DEFAULT CHARACTER SET utf8mb4;\nUSE \`munisipyo_db\`;\n\n`;

    sql += `-- Table: users\n`;
    sql += `CREATE TABLE IF NOT EXISTS \`users\` (\n  \`id\` INT AUTO_INCREMENT PRIMARY KEY,\n  \`username\` VARCHAR(50) NOT NULL UNIQUE,\n  \`password\` VARCHAR(255) NOT NULL,\n  \`role\` ENUM('admin', 'resident') NOT NULL DEFAULT 'resident',\n  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
    sql += `INSERT IGNORE INTO \`users\` (\`username\`, \`password\`, \`role\`) VALUES\n('admin', '$2y$10$tM.yFfq2W6u1y/O9Gk.u8.4uYVwLwJz1LSmwZ8wV7m7bNfXG2LhK6', 'admin');\n\n`;

    sql += `-- Table: appointments\n`;
    sql += `CREATE TABLE IF NOT EXISTS \`appointments\` (\n  \`id\` INT AUTO_INCREMENT PRIMARY KEY,\n  \`reference_code\` VARCHAR(32) NOT NULL UNIQUE,\n  \`full_name\` VARCHAR(100) NOT NULL,\n  \`contact_no\` VARCHAR(20) NOT NULL,\n  \`office_name\` VARCHAR(100) NOT NULL,\n  \`appointment_date\` DATE NOT NULL,\n  \`time_slot\` VARCHAR(50) NOT NULL,\n  \`status\` ENUM('Pending', 'Approved', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending',\n  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  INDEX \`idx_reference_code\` (\`reference_code\`),\n  INDEX \`idx_appointment_date\` (\`appointment_date\`),\n  INDEX \`idx_slot_lookup\` (\`appointment_date\`, \`time_slot\`, \`office_name\`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\nALTER TABLE \`appointments\` MODIFY \`reference_code\` VARCHAR(32) NOT NULL;\n\n`;

    if (appointments.length > 0) {
      sql += `-- Data for appointments (${appointments.length} rows)\n`;
      sql += `INSERT IGNORE INTO \`appointments\` (\`reference_code\`, \`full_name\`, \`contact_no\`, \`office_name\`, \`appointment_date\`, \`time_slot\`, \`status\`, \`created_at\`) VALUES\n`;
      
      const rowsSql = appointments.map(a => {
        const esc = (s: string) => "'" + s.replace(/'/g, "\\'") + "'";
        return `(${esc(a.reference_code)}, ${esc(a.full_name)}, ${esc(a.contact_no)}, ${esc(a.office_name)}, ${esc(a.appointment_date)}, ${esc(a.time_slot)}, ${esc(a.status)}, ${esc(a.created_at)})`;
      }).join(',\n');
      
      sql += rowsSql + `;\n\n`;
    }

    sql += `-- Backup export complete.\n`;

    const blob = new Blob([sql], { type: 'application/sql' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleWalkInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName.trim() || !walkInContact.trim()) return;

    onAddWalkIn({
      reference_code: generateDemoReferenceCode(),
      full_name: walkInName.trim(),
      contact_no: walkInContact.trim(),
      office_name: walkInOffice,
      appointment_date: walkInDate,
      time_slot: walkInSlot,
      status: 'Approved' // Walk-ins directly approved at desk
    });

    setWalkInName('');
    setWalkInContact('');
    setIsWalkInModalOpen(false);
  };

  // Counts
  const totalCount = appointments.length;
  const pendingCount = appointments.filter(a => a.status === 'Pending').length;
  const approvedCount = appointments.filter(a => a.status === 'Approved').length;
  const completedCount = appointments.filter(a => a.status === 'Completed').length;
  const cancelledCount = appointments.filter(a => a.status === 'Cancelled').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-950">
        Standalone demo dashboard only. It has no authentication and is not connected to the PHP/MySQL system. Do not enter real resident information.
      </div>
      
      {/* Top Admin Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Local Demo Admin</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-0.5">
            Municipal Appointment Control Center
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add Walk-in */}
          <button
            onClick={() => setIsWalkInModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Walk-in Booking</span>
          </button>

          {/* Master List Print Button */}
          <button
            onClick={() => setIsPrintMasterOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Master List</span>
          </button>

          {/* Download DB Backup */}
          <button
            onClick={handleDownloadBackup}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
            title="Download complete database as .sql file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download DB Backup (.sql)</span>
          </button>

        </div>
      </div>

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Bookings</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200/70 shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Pending</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200/70 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Approved</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{approvedCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-200/70 shadow-xs">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">Completed</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{completedCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-rose-200/70 shadow-xs">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">Cancelled</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{cancelledCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Filter by Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Filter by Office
            </label>
            <select
              value={filterOffice}
              onChange={(e) => setFilterOffice(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
            >
              <option value="">All Municipal Offices</option>
              {MUNICIPAL_OFFICES.map(o => (
                <option key={o.name} value={o.name}>{o.name}</option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Search Resident / Code
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name or MUN-..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="lg:col-span-1 flex">
            <button
              onClick={() => {
                setFilterDate('');
                setFilterOffice('');
                setFilterStatus('');
                setSearchTerm('');
              }}
              className="w-full py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              title="Reset Filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

        </div>
      </div>

      {/* Appointments Master Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Appointments Master List</h3>
            <span className="text-xs text-slate-500">
              Showing {filteredAppointments.length} of {appointments.length} record(s)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Reference Code</th>
                <th className="py-3 px-4">Resident Name</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Municipal Office</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Time Slot</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Quick Status Changer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No appointments found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onOpenPrintSlip(app)}
                        className="font-mono font-bold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {app.reference_code}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {app.full_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {app.contact_no}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {app.office_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {app.appointment_date}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {app.time_slot}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        {app.status !== 'Approved' && (
                          <button
                            onClick={() => onUpdateStatus(app.id, 'Approved')}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded text-[11px] transition-colors border border-emerald-200 cursor-pointer"
                            title="Approve Appointment"
                          >
                            Approve
                          </button>
                        )}
                        {app.status !== 'Completed' && (
                          <button
                            onClick={() => onUpdateStatus(app.id, 'Completed')}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded text-[11px] transition-colors border border-blue-200 cursor-pointer"
                            title="Mark as Completed"
                          >
                            Complete
                          </button>
                        )}
                        {app.status !== 'Cancelled' && (
                          <button
                            onClick={() => onUpdateStatus(app.id, 'Cancelled')}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded text-[11px] transition-colors border border-rose-200 cursor-pointer"
                            title="Cancel Appointment"
                          >
                            Cancel
                          </button>
                        )}
                        {app.status !== 'Pending' && (
                          <button
                            onClick={() => onUpdateStatus(app.id, 'Pending')}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] transition-colors border border-slate-200 cursor-pointer"
                            title="Set to Pending"
                          >
                            Pending
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Walk-in Booking Modal */}
      {isWalkInModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-700" />
                <h3 className="font-bold text-slate-900 text-base">New Walk-In Appointment</h3>
              </div>
              <button
                onClick={() => setIsWalkInModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWalkInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resident Full Name
                </label>
                <input
                  type="text"
                  required
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="Juan C. Dela Cruz"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Number
                </label>
                <input
                  type="tel"
                  required
                  value={walkInContact}
                  onChange={(e) => setWalkInContact(e.target.value)}
                  placeholder="09171234567"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Municipal Department
                </label>
                <select
                  value={walkInOffice}
                  onChange={(e) => setWalkInOffice(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                >
                  {MUNICIPAL_OFFICES.map(o => (
                    <option key={o.name} value={o.name}>{o.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={walkInDate}
                    onChange={(e) => setWalkInDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Time Slot
                  </label>
                  <select
                    value={walkInSlot}
                    onChange={(e) => setWalkInSlot(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                  >
                    {TIME_SLOTS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsWalkInModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  Save & Approve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Master List Modal View (CSS @media print optimized) */}
      {isPrintMasterOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl border border-slate-200 print:max-w-none print:w-full print:h-auto print:border-none print:shadow-none print:p-0">
            
            {/* Top Toolbar (Hidden on print) */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-800" />
                <h3 className="font-bold text-slate-900 text-base">Print Master List Preview</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Send to Printer / Save PDF</span>
                </button>
                <button
                  onClick={() => setIsPrintMasterOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Municipal Print Document */}
            <div>
              {/* Header */}
              <div className="text-center pb-4 border-b-2 border-slate-800 mb-5">
                <div className="text-xs uppercase tracking-widest text-slate-600 font-semibold mb-0.5">
                  Republic of the Philippines &bull; Province of Batangas
                </div>
                <h2 className="text-xl font-black text-slate-900">
                  MUNICIPALITY OF SAN JOSE
                </h2>
                <div className="text-xs text-slate-600 font-medium">
                  Office of the Municipal Mayor &bull; Receiving & Citizen Records Division
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mt-3 underline underline-offset-4">
                  Daily Appointment Master List & Attendance Sheet
                </h3>
                <div className="text-xs text-slate-500 mt-1">
                  Report Date: <strong>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                  {filterOffice && ` • Office: ${filterOffice}`}
                  {filterDate && ` • Filter Date: ${filterDate}`}
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-left text-xs border border-slate-300 mb-8">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-slate-700">
                  <tr>
                    <th className="p-2 border-r border-slate-300">#</th>
                    <th className="p-2 border-r border-slate-300">Ref Code</th>
                    <th className="p-2 border-r border-slate-300">Resident Full Name</th>
                    <th className="p-2 border-r border-slate-300">Department</th>
                    <th className="p-2 border-r border-slate-300">Date & Slot</th>
                    <th className="p-2 border-r border-slate-300">Status</th>
                    <th className="p-2 text-center" style={{ width: '120px' }}>Signature</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAppointments.map((app, index) => (
                    <tr key={app.id}>
                      <td className="p-2 border-r border-slate-200 font-mono text-slate-500">{index + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-mono font-bold">{app.reference_code}</td>
                      <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">{app.full_name}</td>
                      <td className="p-2 border-r border-slate-200">{app.office_name}</td>
                      <td className="p-2 border-r border-slate-200">{app.appointment_date} <br/> <span className="text-[10px] text-slate-500">{app.time_slot}</span></td>
                      <td className="p-2 border-r border-slate-200 font-bold">{app.status}</td>
                      <td className="p-2 text-center border-b border-slate-200 h-10"></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-300 text-xs">
                <div>
                  <div className="text-slate-500 mb-8">Prepared & Verified By:</div>
                  <div className="w-48 border-b border-slate-800 mb-1"></div>
                  <div className="font-bold text-slate-800">Admin Receiving Officer</div>
                  <div className="text-[10px] text-slate-500">Municipal Hall Security & Reception</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-500 mb-8">Noted & Approved By:</div>
                  <div className="w-48 border-b border-slate-800 mb-1 ml-auto"></div>
                  <div className="font-bold text-slate-800">HON. MUNICIPAL MAYOR</div>
                  <div className="text-[10px] text-slate-500">Municipality of San Jose</div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
