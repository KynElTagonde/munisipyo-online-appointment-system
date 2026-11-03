import React, { useState } from 'react';
import { Appointment, MunicipalOffice } from '../types';
import { MUNICIPAL_OFFICES, TIME_SLOTS, MAX_CAPACITY_PER_SLOT, generateDemoReferenceCode } from '../data/initialData';
import { 
  Building2, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  FileText, 
  Printer, 
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';

interface ResidentPortalProps {
  appointments: Appointment[];
  onBookAppointment: (appointment: Omit<Appointment, 'id' | 'created_at'>) => Appointment;
  onOpenPrintSlip: (appointment: Appointment) => void;
  onNavigateToAdmin: () => void;
}

export const ResidentPortal: React.FC<ResidentPortalProps> = ({
  appointments,
  onBookAppointment,
  onOpenPrintSlip,
  onNavigateToAdmin
}) => {
  // Booking Form State
  const [fullName, setFullName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [selectedOffice, setSelectedOffice] = useState<MunicipalOffice | null>(MUNICIPAL_OFFICES[0]);
  
  // Default to tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split('T')[0];
  const [appointmentDate, setAppointmentDate] = useState<string>(minDateStr);
  const [timeSlot, setTimeSlot] = useState<string>(TIME_SLOTS[0]);

  // Form error & success states
  const [formError, setFormError] = useState<string | null>(null);
  const [bookedResult, setBookedResult] = useState<Appointment | null>(null);

  // Track / Search State
  const [searchRef, setSearchRef] = useState('');
  const [searchedAppointment, setSearchedAppointment] = useState<Appointment | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Calculate capacity for a given date, office, and time slot
  const getSlotCount = (date: string, office: string, slot: string) => {
    return appointments.filter(
      app => app.appointment_date === date && 
             app.office_name === office && 
             app.time_slot === slot &&
             app.status !== 'Cancelled'
    ).length;
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim() || !contactNo.trim() || !selectedOffice || !appointmentDate || !timeSlot) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (!/^[0-9+\-\s]{7,20}$/.test(contactNo)) {
      setFormError('Please enter a valid contact number (at least 7 digits).');
      return;
    }

    // Automated Slot Limit Check
    const currentBookedCount = getSlotCount(appointmentDate, selectedOffice.name, timeSlot);
    if (currentBookedCount >= MAX_CAPACITY_PER_SLOT) {
      setFormError(`Maximum capacity (${MAX_CAPACITY_PER_SLOT} slots) reached for ${selectedOffice.name} on ${appointmentDate} (${timeSlot}). Please choose another date or time slot.`);
      return;
    }

    // Generate unique reference code
    const newApp = onBookAppointment({
      reference_code: generateDemoReferenceCode(),
      full_name: fullName.trim(),
      contact_no: contactNo.trim(),
      office_name: selectedOffice.name,
      appointment_date: appointmentDate,
      time_slot: timeSlot,
      status: 'Pending'
    });

    setBookedResult(newApp);
    // Reset form fields
    setFullName('');
    setContactNo('');
  };

  const handleSearchTrack = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    setSearchError(null);

    const clean = searchRef.trim().toUpperCase();
    if (!clean) return;

    const found = appointments.find(a => a.reference_code.toUpperCase() === clean);
    if (found) {
      setSearchedAppointment(found);
      setSearchError(null);
    } else {
      setSearchedAppointment(null);
      setSearchError(`No appointment found with Reference Code "${clean}". Please verify your code.`);
    }
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
    <div className="space-y-10">
      
      {/* Hero Banner with Public Reference Code Search */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-8 sm:p-12 shadow-xl border border-blue-900/50">
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Sample UI Demo Only
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
            Online Municipal Appointment System
          </h1>
          <p className="text-slate-300 text-base sm:text-lg mb-8 leading-relaxed">
            Explore sample booking and tracking workflows. This preview does not submit real reservations or connect to a municipal database.
          </p>

          {/* 4. Public Track/Status Checker Search Bar */}
          <div className="bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl shadow-2xl text-slate-800 border border-white/20">
            <form onSubmit={handleSearchTrack} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchRef}
                  onChange={(e) => setSearchRef(e.target.value)}
                  placeholder="Enter Reference Code (e.g. MUN-2026-A1B2C3D4E5F6)"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Track Status</span>
              </button>
            </form>

            <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2 px-1">
              <span>Demo sample reference codes:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setSearchRef('MUN-2026-1001'); }}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 text-blue-700 font-mono rounded border border-slate-200 transition-colors cursor-pointer"
                >
                  MUN-2026-1001
                </button>
                <button
                  type="button"
                  onClick={() => { setSearchRef('MUN-2026-1003'); }}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 text-blue-700 font-mono rounded border border-slate-200 transition-colors cursor-pointer"
                >
                  MUN-2026-1003
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Track Result Display (if search performed) */}
      {hasSearched && (
        <section className="scroll-mt-6" id="search-result">
          {searchedAppointment ? (
            <div className="bg-white rounded-2xl border-2 border-blue-500/30 p-6 sm:p-8 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 mb-6">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Search Result</span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                    Appointment Details
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border ${getStatusBadge(searchedAppointment.status)}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    STATUS: {searchedAppointment.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-medium block">Reference Code</span>
                  <span className="font-mono text-base font-black text-blue-900">{searchedAppointment.reference_code}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-medium block">Department / Office</span>
                  <span className="text-sm font-bold text-slate-800">{searchedAppointment.office_name}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-medium block">Schedule</span>
                  <span className="text-sm font-bold text-slate-800">
                    {searchedAppointment.appointment_date} ({searchedAppointment.time_slot.split(' ')[0]})
                  </span>
                </div>
              </div>

              {/* Status explanation helper */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong>What does your status mean?</strong>
                  {searchedAppointment.status === 'Pending' && ' Your booking is registered and queued for verification. Please keep your Reference Code ready.'}
                  {searchedAppointment.status === 'Approved' && ' Your booking is confirmed! You may visit the Municipal Hall on your scheduled date and time slot.'}
                  {searchedAppointment.status === 'Completed' && ' This appointment has been successfully serviced and completed by the department.'}
                  {searchedAppointment.status === 'Cancelled' && ' This reservation has been cancelled. If you believe this is an error, please file a new appointment.'}
                </div>
              </div>
            </div>
          ) : searchError ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-800">
              <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <div className="font-bold text-base mb-1">Appointment Not Found</div>
              <p className="text-xs text-rose-700 max-w-md mx-auto">{searchError}</p>
            </div>
          ) : null}
        </section>
      )}

      {/* Success Booking Modal / Banner */}
      {bookedResult && (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-6 sm:p-8 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Slot Confirmed</span>
                <h3 className="text-xl font-black text-emerald-950">
                  Appointment Successfully Booked!
                </h3>
                <p className="text-xs text-emerald-800 mt-1">
                  Your reference code is: <strong className="font-mono text-sm bg-emerald-200 px-2 py-0.5 rounded text-emerald-950">{bookedResult.reference_code}</strong>
                </p>
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => onOpenPrintSlip(bookedResult)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors shadow cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>View & Print Slip</span>
              </button>
              <button
                onClick={() => setBookedResult(null)}
                className="px-4 py-2.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Reservation Section (Form + Office Requirements Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: 1. Online Slot Reservation Form */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 pb-5 border-b border-slate-100 mb-6">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Book an Appointment Slot</h2>
                <p className="text-xs text-slate-500">Pick an office, choose your batch time, and enter your details</p>
              </div>
            </div>

            {formError && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Booking Error:</strong>
                  {formError}
                </div>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-6">
              
              {/* Personal Information */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-blue-900 block mb-3">
                  1. Personal Information
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Juan C. Dela Cruz"
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Contact Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={contactNo}
                        onChange={(e) => setContactNo(e.target.value)}
                        placeholder="e.g. 09171234567"
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Department Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-blue-900 block mb-3">
                  2. Select Municipal Department
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={selectedOffice?.name || ''}
                    onChange={(e) => {
                      const found = MUNICIPAL_OFFICES.find(o => o.name === e.target.value);
                      if (found) setSelectedOffice(found);
                    }}
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-medium text-slate-800"
                  >
                    {MUNICIPAL_OFFICES.map(office => (
                      <option key={office.name} value={office.name}>
                        {office.name}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedOffice && (
                  <p className="text-xs text-slate-500 mt-1.5 italic">
                    {selectedOffice.description}
                  </p>
                )}
              </div>

              {/* Schedule (Date & Time Slot with Capacity Checker) */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-blue-900 block mb-3">
                  3. Select Appointment Date & Time Window
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Appointment Date <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="date"
                        min={minDateStr}
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-medium text-slate-800"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Appointments are booked at least 1 day in advance.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Batch Time Slot <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <select
                        value={timeSlot}
                        onChange={(e) => setTimeSlot(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-medium text-slate-800"
                      >
                        {TIME_SLOTS.map(slot => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Automated Slot Limit Logic Live Feedback */}
                {selectedOffice && appointmentDate && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        Live Slot Availability for {selectedOffice.name}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Cap: {MAX_CAPACITY_PER_SLOT} slots per batch
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {TIME_SLOTS.map(slot => {
                        const count = getSlotCount(appointmentDate, selectedOffice.name, slot);
                        const isFull = count >= MAX_CAPACITY_PER_SLOT;
                        const isSelected = slot === timeSlot;
                        const remaining = Math.max(0, MAX_CAPACITY_PER_SLOT - count);

                        return (
                          <div
                            key={slot}
                            onClick={() => !isFull && setTimeSlot(slot)}
                            className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500/20'
                                : isFull
                                ? 'bg-slate-100/70 border-slate-200 text-slate-400 opacity-70 cursor-not-allowed'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            <span className="font-semibold">{slot}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isFull
                                  ? 'bg-rose-100 text-rose-700'
                                  : remaining === 1
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isFull ? 'SLOT FULL' : `${remaining} slots left`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 bg-blue-800 hover:bg-blue-900 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Confirm Slot Reservation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[11px] text-center text-slate-400 mt-2">
                  Reference code will be instantly generated upon submission.
                </p>
              </div>

            </form>
          </div>
        </div>

        {/* Right Column: Office Documentary Checklist & Municipal Guidelines */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Dynamic Requirements Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-3">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>Documentary Requirements</span>
            </div>

            {selectedOffice ? (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
                  <div className="text-xs font-bold text-blue-950 mb-1">
                    {selectedOffice.name}
                  </div>
                  <div className="text-[11px] text-blue-800">
                    Department Head: {selectedOffice.head}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    What to bring on your visit:
                  </span>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {selectedOffice.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Select an office in the form to preview required documents.
              </p>
            )}
          </div>

          {/* Quick Admin Portal Card */}
          <div className="bg-linear-to-br from-slate-900 to-blue-950 text-white rounded-2xl p-6 shadow-md border border-slate-800">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-1">
              Local Demo Only
            </span>
            <h4 className="font-bold text-base text-white mb-2">
              Demo Dashboard
            </h4>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Explore sample appointment workflows. This demo has no authentication and is not connected to the PHP/MySQL system.
            </p>
            <button
              onClick={onNavigateToAdmin}
              className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Switch to Admin Dashboard</span>
            </button>
            <div className="text-[11px] text-slate-400 text-center mt-2 font-mono">
              Do not enter real resident information.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
