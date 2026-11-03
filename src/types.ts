export type AppointmentStatus = 'Pending' | 'Approved' | 'Completed' | 'Cancelled';

export interface Appointment {
  id: number;
  reference_code: string;
  full_name: string;
  contact_no: string;
  office_name: string;
  appointment_date: string; // YYYY-MM-DD
  time_slot: string;
  status: AppointmentStatus;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'resident';
  created_at: string;
}

export interface MunicipalOffice {
  name: string;
  description: string;
  requirements: string[];
  head: string;
}
