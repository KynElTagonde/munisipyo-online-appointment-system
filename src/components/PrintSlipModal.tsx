import React from 'react';
import { Appointment } from '../types';
import { Printer, X, CheckCircle2, Building2, Calendar, Clock, Phone, User, ShieldCheck } from 'lucide-react';

interface PrintSlipModalProps {
  appointment: Appointment;
  onClose: () => void;
}

export const PrintSlipModal: React.FC<PrintSlipModalProps> = ({ appointment, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 print:border-none print:shadow-none print:max-w-none print:w-full">
        
        {/* Header Action Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Official Municipal Appointment Slip Preview</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Printable Slip Body */}
        <div className="p-8 print:p-0">
          
          {/* Municipal Letterhead */}
          <div className="text-center pb-5 border-b border-slate-300 mb-6">
            <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-0.5">
              Republic of the Philippines &bull; Province of Batangas
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              MUNICIPALITY OF SAN JOSE
            </h2>
            <div className="text-xs text-slate-600 font-medium">
              Municipal Hall Complex, Poblacion, San Jose, Batangas
            </div>
            <div className="inline-block mt-3 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold uppercase rounded-md tracking-wider border border-slate-300">
              Official Appointment Confirmation Slip
            </div>
          </div>

          {/* Reference Code & Status Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6">
            <div>
              <span className="text-xs font-medium text-slate-500 block">Appointment Reference Code</span>
              <div className="font-mono text-xl sm:text-2xl font-black text-blue-900 tracking-wider mt-0.5">
                {appointment.reference_code}
              </div>
            </div>
            <div className="sm:text-right">
              <span className="text-xs font-medium text-slate-500 block">Current Status</span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mt-1 ${getStatusBadge(appointment.status)}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {appointment.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Simulated Barcode */}
          <div className="text-center mb-6 py-2 px-4 bg-slate-100 border border-dashed border-slate-300 rounded-lg">
            <div className="font-mono tracking-[0.4em] text-slate-800 text-lg sm:text-xl font-bold select-all">
              ||| |||| | ||||| ||| || |||||| | ||
            </div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">
              SCAN AT ENTRANCE SECURITY KIOSK &bull; {appointment.reference_code}
            </div>
          </div>

          {/* Appointment Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm">
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-blue-600" /> Resident Name
              </span>
              <span className="font-bold text-slate-900 text-base">{appointment.full_name}</span>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1">
                <Phone className="w-3.5 h-3.5 text-blue-600" /> Contact Number
              </span>
              <span className="font-semibold text-slate-900">{appointment.contact_no}</span>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-white sm:col-span-2">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1">
                <Building2 className="w-3.5 h-3.5 text-blue-600" /> Municipal Office / Department
              </span>
              <span className="font-bold text-blue-900 text-base">{appointment.office_name}</span>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" /> Scheduled Date
              </span>
              <span className="font-bold text-slate-900">
                {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" /> Scheduled Time Slot
              </span>
              <span className="font-bold text-slate-900">{appointment.time_slot}</span>
            </div>
          </div>

          {/* Resident Reminders */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 mb-6">
            <div className="font-bold mb-1.5 flex items-center gap-1 text-amber-800">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Guidelines & Reminders for Applicant:
            </div>
            <ul className="list-disc list-inside space-y-1 text-amber-800/90">
              <li>Arrive 10 to 15 minutes before your designated schedule window.</li>
              <li>Present this printed slip or a clear mobile screenshot to the front desk.</li>
              <li>Bring 1 valid government-issued ID (e.g. PhilSys ID, Driver's License, Voter's ID).</li>
              <li>Observe appropriate dress code inside the Municipal Building.</li>
            </ul>
          </div>

          {/* Footer Validation Signature */}
          <div className="pt-4 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
            <div>
              <span>Generated on: {new Date().toLocaleString()}</span>
              <div className="text-[10px] text-slate-400">Munisipyo Online Appointment System (PDO/MySQL)</div>
            </div>
            <div className="text-right">
              <div className="h-9 w-32 border-b border-slate-400 mb-1 ml-auto"></div>
              <span className="font-semibold text-slate-700">Municipal Receiving Desk</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
