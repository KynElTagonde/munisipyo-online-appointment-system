import React, { useState, useEffect } from 'react';
import { Appointment, AppointmentStatus } from './types';
import { INITIAL_APPOINTMENTS } from './data/initialData';
import { ResidentPortal } from './components/ResidentPortal';
import { AdminPortal } from './components/AdminPortal';
import { PrintSlipModal } from './components/PrintSlipModal';
import { 
  Building2, 
  Calendar, 
  ShieldCheck, 
  PhoneCall, 
  Clock,
} from 'lucide-react';

export default function App() {
  // Appointments State with LocalStorage Persistence
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('munisipyo_appointments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse stored appointments:', e);
      }
    }
    return INITIAL_APPOINTMENTS;
  });

  useEffect(() => {
    localStorage.setItem('munisipyo_appointments', JSON.stringify(appointments));
  }, [appointments]);

  const [activeTab, setActiveTab] = useState<'resident' | 'admin'>('resident');

  // Print Slip Modal State
  const [activePrintSlip, setActivePrintSlip] = useState<Appointment | null>(null);

  // Add Appointment handler
  const handleBookAppointment = (data: Omit<Appointment, 'id' | 'created_at'>): Appointment => {
    const newId = appointments.length > 0 ? Math.max(...appointments.map(a => a.id)) + 1 : 1;
    const newAppointment: Appointment = {
      ...data,
      id: newId,
      created_at: new Date().toISOString()
    };
    setAppointments(prev => [newAppointment, ...prev]);
    return newAppointment;
  };

  // Update Status handler
  const handleUpdateStatus = (id: number, newStatus: AppointmentStatus) => {
    setAppointments(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, status: newStatus };
      }
      return a;
    }));
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      
      {/* Top Municipal Notification Ribbon */}
      <div className="bg-slate-950 text-slate-300 text-[11px] py-1.5 px-4 border-b border-slate-800 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-semibold text-white">Republic of the Philippines</span>
            <span>&bull; Standalone appointment UI preview</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" /> Mon - Fri: 8:00 AM - 5:00 PM
            </span>
            <span className="flex items-center gap-1">
              <PhoneCall className="w-3 h-3 text-emerald-400" /> Hotline: (043) 726-2000
            </span>
          </div>
        </div>
      </div>

      {/* Main Header / Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Logo & Seal */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-linear-to-br from-blue-900 to-indigo-900 text-amber-400 flex items-center justify-center shadow-md border border-blue-800">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-900 text-lg leading-tight tracking-tight">
                  MUNISIPYO ONLINE
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                  UI DEMO
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Municipality of San Jose &bull; Province of Batangas
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('resident')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'resident'
                  ? 'bg-white text-blue-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Resident Portal</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-blue-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Demo Dashboard</span>
            </button>

          </div>

        </div>
      </header>

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <strong>Standalone UI demo:</strong> This React app stores sample bookings only in this browser. It is not connected to the PHP/MySQL application and provides no real authentication. Do not enter real resident information.
        </div>
        {activeTab === 'resident' && (
          <ResidentPortal
            appointments={appointments}
            onBookAppointment={handleBookAppointment}
            onOpenPrintSlip={(app) => setActivePrintSlip(app)}
            onNavigateToAdmin={() => setActiveTab('admin')}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPortal
            appointments={appointments}
            onUpdateStatus={handleUpdateStatus}
            onAddWalkIn={handleBookAppointment}
            onOpenPrintSlip={(app) => setActivePrintSlip(app)}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-700">Municipality of San Jose</span> &bull; Online Appointment Portal
          </div>
          <div className="flex items-center gap-3">
            <span>Standalone browser-only demo</span>
          </div>
        </div>
      </footer>

      {/* Printable Appointment Slip Modal */}
      {activePrintSlip && (
        <PrintSlipModal
          appointment={activePrintSlip}
          onClose={() => setActivePrintSlip(null)}
        />
      )}

    </div>
  );
}
