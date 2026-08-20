export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole =
  | "patient"
  | "doctor"
  | "hospital_admin"
  | "lab_staff"
  | "pharmacy_staff"
  | "emergency_staff"
  | "blood_staff"
  | "finance_staff"
  | "admin";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  account_status: "active" | "suspended" | "pending";
  profile_complete: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Patient {
  id: string;
  user_id: string;
  medora_id: string;
  abha_id?: string;
  aadhaar_last4?: string;
  dob: string;
  gender: "male" | "female" | "other";
  blood_group: string;
  allergies: string[];
  chronic_conditions: string[];
  emergency_contact_name: string;
  emergency_contact_phone: string;
  created_at: string;
}

export interface Hospital {
  id: string;
  name: string;
  license_no: string;
  address: string;
  city: string;
  phone: string;
  emergency_phone: string;
  type: "hospital" | "clinic" | "diagnostic_center";
  created_at: string;
}

export interface Department {
  id: string;
  hospital_id: string;
  name: string;
  description?: string;
  head_doctor_id?: string;
  created_at: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  hospital_id: string;
  department_id: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  status: "available" | "busy" | "on_call" | "emergency_occupied" | "off_duty";
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  hospital_id: string;
  department_id: string;
  scheduled_at: string;
  token_number: number;
  status: "booked" | "waiting" | "in_consultation" | "completed" | "cancelled";
  reason_for_visit: string;
  created_at: string;
}

export interface Consultation {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  symptoms: string;
  clinical_diagnosis: string;
  clinical_notes: string;
  follow_up_date?: string;
  follow_up_instructions?: string;
  created_at: string;
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medicine_name: string;
  strength: string;
  dosage: string;
  frequency: string;
  timing: "before_food" | "after_food" | "with_food" | "anytime";
  duration_days: number;
  special_instructions?: string;
}

export interface Prescription {
  id: string;
  prescription_no: string;
  consultation_id: string;
  patient_id: string;
  doctor_id: string;
  hospital_id: string;
  status: "active" | "dispensed" | "cancelled";
  items?: PrescriptionItem[];
  created_at: string;
}

export interface LabOrder {
  id: string;
  order_no: string;
  consultation_id?: string;
  patient_id: string;
  doctor_id: string;
  hospital_id: string;
  test_name: string;
  urgency: "routine" | "urgent" | "stat";
  status: "ordered" | "sample_collected" | "testing" | "completed" | "cancelled";
  created_at: string;
}

export interface Sample {
  id: string;
  lab_order_id: string;
  sample_code: string;
  sample_type: string;
  collected_at: string;
  collected_by: string;
}

export interface LabReportParameter {
  name: string;
  value: string;
  unit: string;
  reference_range: string;
  is_abnormal: boolean;
}

export interface LabReport {
  id: string;
  lab_order_id: string;
  sample_id: string;
  parameters: LabReportParameter[];
  summary: string;
  approved_by: string;
  approved_at: string;
  report_file_url?: string;
}

export interface DispensingRecord {
  id: string;
  prescription_id: string;
  patient_id: string;
  pharmacist_id: string;
  dispensed_at: string;
  medora_id_verified: boolean;
  notes?: string;
}

export interface BillItem {
  id: string;
  bill_id: string;
  item_type: "consultation" | "lab_test" | "pharmacy" | "bed_charge" | "procedure";
  reference_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface BillVersion {
  id: string;
  bill_id: string;
  version_no: number;
  previous_total: number;
  new_total: number;
  changed_by: string;
  reason: string;
  created_at: string;
}

export interface Bill {
  id: string;
  bill_no: string;
  patient_id: string;
  hospital_id: string;
  total_amount: number;
  insurance_covered: number;
  govt_scheme_covered: number;
  discount: number;
  patient_payable: number;
  status: "draft" | "generated" | "paid" | "disputed";
  items?: BillItem[];
  versions?: BillVersion[];
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  patient_id: string;
  event_type:
    | "appointment"
    | "consultation"
    | "prescription"
    | "lab_order"
    | "lab_report"
    | "pharmacy_dispense"
    | "admission"
    | "discharge"
    | "bill_generated"
    | "payment"
    | "emergency";
  reference_id?: string;
  title: string;
  summary: string;
  hospital_name?: string;
  actor_name?: string;
  event_timestamp: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  role: string;
  action: string;
  target_entity: string;
  target_id: string;
  reason?: string;
  status: "SUCCESS" | "DENIED";
  ip_address?: string;
  created_at: string;
}

export interface EmergencyCase {
  id: string;
  case_no: string;
  patient_id?: string;
  patient_name: string;
  triage_priority: "critical" | "high" | "moderate" | "low";
  hospital_id: string;
  assigned_doctor_id?: string;
  status: "arrived" | "triaged" | "in_treatment" | "stabilized" | "admitted" | "transferred" | "discharged";
  created_at: string;
}

export interface BloodRequest {
  id: string;
  request_no: string;
  hospital_id: string;
  emergency_case_id?: string;
  blood_group: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  units_required: number;
  urgency: "routine" | "urgent" | "stat";
  status: "created" | "matching" | "accepted" | "fulfilled" | "closed";
  created_at: string;
}
