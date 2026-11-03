import { Appointment, MunicipalOffice } from '../types';

export const MUNICIPAL_OFFICES: MunicipalOffice[] = [
  {
    name: "Local Civil Registrar",
    description: "Civil registry documents, birth/marriage/death certificates, legitimation, and legal corrections.",
    requirements: [
      "PSA/NSO Document copy (if requesting correction)",
      "Barangay Certification of Residency / Indigency",
      "Valid Government ID of registered person / parent"
    ],
    head: "Atty. Renato M. Santos (Municipal Civil Registrar)"
  },
  {
    name: "Mayor's Office",
    description: "Mayoral endorsements, social welfare assistance, financial/medical aid, and official appointments.",
    requirements: [
      "Barangay Endorsement Letter",
      "Medical Certificate / Hospital Bill (if applying for medical aid)",
      "Formal Letter addressed to the Municipal Mayor",
      "Valid Government ID"
    ],
    head: "Hon. Roberto V. Mendoza (Municipal Mayor)"
  },
  {
    name: "Municipal Assessor",
    description: "Real property assessment, issuance of tax declarations, property transfer, and certified true copies.",
    requirements: [
      "Previous Certified Tax Declaration",
      "Original Title / Deed of Absolute Sale / Transfer Document",
      "Real Property Tax (RPT) Clearance from Municipal Treasury"
    ],
    head: "Engr. Corazon L. Ramos (Municipal Assessor)"
  },
  {
    name: "Municipal Treasury",
    description: "Payment of real property taxes, community tax certificate (Cedula), business permits, and licenses.",
    requirements: [
      "DTI / SEC Registration (for Business Permits)",
      "Barangay Business Clearance",
      "Community Tax Certificate (Cedula) fee assessment",
      "Fire Safety Inspection Certificate"
    ],
    head: "Mr. Domingo P. Reyes (Municipal Treasurer)"
  },
  {
    name: "Municipal Health Office",
    description: "Sanitary permits, food handlers health certificates, medical consultation, and immunizations.",
    requirements: [
      "2 copies of 1x1 ID Picture",
      "Stool, Urine, and Chest X-ray laboratory test results",
      "Valid Identification Card"
    ],
    head: "Dr. Elena G. Bautista, MD (Municipal Health Officer)"
  },
  {
    name: "Municipal Engineering / MPDC",
    description: "Building permits, electrical permits, occupancy certificates, and zoning clearances.",
    requirements: [
      "5 sets of Architectural/Structural Plans signed & sealed by licensed Engr./Architect",
      "Land Title / Deed of Absolute Sale or Contract of Lease",
      "Zoning Clearance & Barangay Construction Clearance"
    ],
    head: "Engr. Manuel C. Fernandez (Municipal Engineer)"
  }
];

export const TIME_SLOTS = [
  "08:00 AM - 09:30 AM",
  "10:00 AM - 11:30 AM",
  "01:00 PM - 02:30 PM",
  "03:00 PM - 04:30 PM"
];

export const MAX_CAPACITY_PER_SLOT = 5;

export const generateDemoReferenceCode = (): string => {
  const suffix = Array.from(crypto.getRandomValues(new Uint8Array(6)), byte =>
    byte.toString(16).padStart(2, '0')
  ).join('').toUpperCase();
  return `MUN-${new Date().getFullYear()}-${suffix}`;
};

// Helper to format date offset
const getOffsetDate = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 1,
    reference_code: "MUN-2026-1001",
    full_name: "Juan Dela Cruz",
    contact_no: "09171234567",
    office_name: "Local Civil Registrar",
    appointment_date: getOffsetDate(1),
    time_slot: "08:00 AM - 09:30 AM",
    status: "Approved",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 2,
    reference_code: "MUN-2026-1002",
    full_name: "Maria Clara Santos",
    contact_no: "09187654321",
    office_name: "Local Civil Registrar",
    appointment_date: getOffsetDate(1),
    time_slot: "08:00 AM - 09:30 AM",
    status: "Pending",
    created_at: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    id: 3,
    reference_code: "MUN-2026-1003",
    full_name: "Crisostomo Ibarra",
    contact_no: "09223334455",
    office_name: "Mayor's Office",
    appointment_date: getOffsetDate(1),
    time_slot: "10:00 AM - 11:30 AM",
    status: "Approved",
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 4,
    reference_code: "MUN-2026-1004",
    full_name: "Leonor Rivera",
    contact_no: "09355556677",
    office_name: "Mayor's Office",
    appointment_date: getOffsetDate(2),
    time_slot: "01:00 PM - 02:30 PM",
    status: "Pending",
    created_at: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: 5,
    reference_code: "MUN-2026-1005",
    full_name: "Andres Bonifacio",
    contact_no: "09498887766",
    office_name: "Municipal Assessor",
    appointment_date: getOffsetDate(2),
    time_slot: "03:00 PM - 04:30 PM",
    status: "Completed",
    created_at: new Date(Date.now() - 3600000 * 48).toISOString()
  }
];
