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
  | "insurance_staff"
  | "government_staff"
  | "ambulance_staff"
  | "staff"
  | "admin";

export type AccountStatus = "active" | "pending" | "suspended" | "disabled";

export type VerificationStatus = "pending" | "verified" | "rejected" | "suspended";

export type AffiliationStatus = "active" | "pending" | "rejected" | "suspended" | "ended";

export type OrganizationType =
  | "hospital"
  | "clinic"
  | "diagnostic_lab"
  | "pharmacy"
  | "blood_bank"
  | "insurance"
  | "financing_partner"
  | "government_assistance"
  | "ambulance_provider";

// ============================================================
// CATEGORY A — IDENTITIES (PEOPLE & ORGANIZATIONS)
// ============================================================

export interface Profile {
  id: string; // References auth.users(id)
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  account_status: AccountStatus;
  profile_complete: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Organization {
  id: string;
  medora_id: string; // e.g. HSP-1001, CLN-1001, LAB-1001, PHA-1001, BLC-1001, INS-1001, FIN-1001, GOV-1001, AMB-1001
  name: string;
  type: OrganizationType;
  license_no: string;
  address: string;
  city: string;
  phone: string;
  emergency_phone?: string;
  status: AccountStatus;
  verification_status: VerificationStatus;
  created_at: string;
}

export interface Facility {
  id: string;
  organization_id: string; // FK -> organizations.id
  facility_code: string; // e.g. HSP-1001-BBSR, HSP-1001-ROU, HSP-1001-CTC
  name: string;
  city: string;
  address: string;
  phone: string;
  emergency_phone?: string;
  status: AccountStatus;
  verification_status: VerificationStatus;
  created_at: string;
}

export interface Department {
  id: string;
  organization_id: string;
  facility_id?: string;
  name: string;
  code?: string;
  description?: string;
  created_at: string;
}

export interface PatientAddress {
  line1: string;
  line2?: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  country: string;
}

export interface PatientEmergencyContact {
  name: string;
  relation: string;
  phone: string;
  altPhone?: string;
  isPrimary: boolean;
}

export type AbhaLinkStatus =
  | "NOT_LINKED"
  | "VERIFICATION_PENDING"
  | "VERIFIED"
  | "LINKED"
  | "LINK_FAILED"
  | "IDENTITY_MISMATCH"
  | "ALREADY_LINKED"
  | "UNLINK_PENDING"
  | "UNLINKED"
  | "INTEGRATION_UNAVAILABLE";

export type VerificationSource = "ABDM" | "SANDBOX" | "SELF_DECLARED" | "HOSPITAL_VERIFIED";

export interface PatientAbhaLink {
  id: string;
  patient_id: string; // e.g. PAT-1001
  abha_number: string; // e.g. "XX-XXXX-XXXX-4821"
  abha_address: string; // e.g. "rahulverma@abdm"
  link_status: AbhaLinkStatus;
  verification_status: VerificationStatus;
  verification_source: VerificationSource;
  aadhaar_masked?: string; // e.g. "XXXX XXXX 5892"
  linked_at: string;
  unlinked_at?: string;
  last_verified_at?: string;
}

export interface Patient {
  id: string;
  user_id: string; // FK -> profiles.id
  medora_id: string; // e.g. PAT-1001, PAT-1002, PAT-1003
  abha_id?: string;
  aadhaar_last4?: string;
  dob: string;
  gender: "male" | "female" | "other";
  blood_group: string;
  blood_group_source?: "patient_reported" | "clinical_verified";
  blood_group_verified_by?: string;
  allergies: string[];
  chronic_conditions: string[];
  address?: PatientAddress;
  emergency_contacts: PatientEmergencyContact[];
  preferred_language: "en" | "hi" | "or";
  abha_link?: PatientAbhaLink;
  status: AccountStatus;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at?: string;
}

export interface Doctor {
  id: string;
  user_id: string; // FK -> profiles.id
  medora_id: string; // e.g. DOC-1001
  medical_reg_no: string; // e.g. MCI-2014-99214
  medical_council: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  status: "available" | "busy" | "on_call" | "emergency_occupied" | "off_duty";
  account_status: AccountStatus;
  verification_status: VerificationStatus;
  created_at: string;
}

// ============================================================
// CATEGORY B — RELATIONSHIPS
// ============================================================

export interface DoctorAffiliation {
  id: string;
  doctor_id: string; // FK -> doctors.id
  organization_id: string; // FK -> organizations.id
  facility_id?: string; // FK -> facilities.id
  department_id?: string;
  role_title: string; // e.g. "Senior Consultant", "Visiting Specialist"
  employment_type?: "full_time" | "part_time" | "consultant" | "visiting" | "contract";
  status: AffiliationStatus;
  verification_status: VerificationStatus;
  consultation_fee: number;
  opd_room?: string;
  schedule_notes?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  organization?: Organization;
  facility?: Facility;
  department?: Department;
}

export interface StaffMembership {
  id: string;
  user_id: string; // FK -> profiles.id
  organization_id: string; // FK -> organizations.id
  facility_id?: string; // FK -> facilities.id
  department_id?: string;
  role_title: string; // e.g. "Head Nurse", "Chief Pharmacist", "Billing Executive"
  status: AccountStatus;
  verification_status: VerificationStatus;
  start_date?: string;
  end_date?: string;
  created_at: string;
  organization?: Organization;
  facility?: Facility;
}

export interface FacilityPartnership {
  id: string;
  hospital_facility_id: string;
  partner_organization_id: string;
  partnership_type: "internal_lab" | "external_lab" | "internal_pharmacy" | "external_pharmacy" | "blood_bank" | "ambulance";
  status: "active" | "inactive";
  created_at: string;
}

export interface InsurancePolicy {
  id: string;
  patient_id: string; // FK -> patients.id
  insurance_organization_id: string; // FK -> organizations.id
  policy_number: string;
  policy_name: string;
  coverage_amount: number;
  valid_until: string;
  status: "active" | "expired" | "suspended";
  created_at: string;
}

export interface ConsentRecord {
  id: string;
  patient_id: string;
  grantee_id: string; // Doctor or Hospital Profile/Org ID
  purpose: string;
  granted_scopes: string[]; // ['prescriptions', 'lab_reports', 'allergies', 'discharge_summary']
  duration_hours: number;
  status: "active" | "expired" | "revoked";
  expires_at: string;
  created_at: string;
}

// ============================================================
// CATEGORY C — HEALTHCARE EVENTS & TRANSACTIONS
// ============================================================

export type AppointmentStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "WAITING"
  | "IN_CONSULTATION"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "RESCHEDULED";

export interface Appointment {
  id: string;
  appointment_no: string; // e.g. APT-1001
  patient_id: string; // FK -> patients.id
  doctor_id: string; // FK -> doctors.id
  facility_id: string; // FK -> facilities.id
  department_id?: string;
  scheduled_time: string;
  token_number?: string;
  status: AppointmentStatus;
  reason_for_visit?: string;
  created_at: string;
}

export interface Encounter {
  id: string;
  encounter_no: string; // e.g. ENC-1001
  patient_id: string;
  doctor_id: string;
  facility_id: string;
  department_id?: string;
  appointment_id?: string;
  encounter_type: "scheduled" | "walk_in" | "emergency" | "referral" | "follow_up";
  status: "in_progress" | "completed" | "transferred" | "cancelled";
  started_at: string;
  ended_at?: string;
  created_at: string;
}

export interface Consultation {
  id: string;
  encounter_id: string; // FK -> encounters.id
  patient_id: string;
  doctor_id: string;
  facility_id: string;
  chief_complaints: string;
  clinical_notes: string;
  diagnosis_primary: string;
  diagnosis_secondary?: string;
  treatment_plan: string;
  vitals?: {
    bp?: string;
    pulse?: number;
    temp?: string;
    spo2?: number;
  };
  follow_up_days?: number;
  created_at: string;
}

export interface Prescription {
  id: string;
  prescription_no: string; // e.g. RX-1001
  patient_id: string; // FK -> patients.id
  doctor_id: string; // FK -> doctors.id
  encounter_id?: string; // FK -> encounters.id
  encounter_organization_id: string; // FK -> organizations.id
  fulfillment_pharmacy_id?: string; // Optional / selected by patient
  status: "active" | "dispensed" | "cancelled";
  digital_signature_hash?: string;
  created_at: string;
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medicine_name: string;
  dosage: string;
  frequency: string; // e.g. "1-0-1"
  duration_days: number;
  instructions: string; // e.g. "After food"
}

export interface PrescriptionDispensing {
  id: string;
  prescription_id: string;
  pharmacy_organization_id: string;
  dispensed_by_staff_id: string;
  status: "RECEIVED" | "VERIFIED" | "PREPARING" | "READY_FOR_PICKUP" | "DISPENSED" | "UNABLE_TO_DISPENSE";
  dispensed_at?: string;
  created_at: string;
}

export interface LabOrder {
  id: string;
  order_no: string; // e.g. LAB-ORD-1024
  patient_id: string;
  doctor_id: string;
  encounter_id?: string;
  target_laboratory_id: string; // FK -> organizations.id
  clinical_notes?: string;
  status: "PLACED" | "SAMPLE_COLLECTED" | "IN_ANALYSIS" | "VERIFIED" | "REPORT_GENERATED" | "CANCELLED";
  created_at: string;
}

export interface LabSample {
  id: string;
  sample_code: string; // e.g. SMP-1024
  lab_order_id: string;
  sample_type: "Blood" | "Urine" | "Serum" | "Tissue" | "Swab";
  collected_at: string;
  collected_by_staff_id?: string;
  status: "COLLECTED" | "RECEIVED" | "PROCESSING" | "TESTING" | "COMPLETED" | "REJECTED";
}

export interface LabTest {
  id: string;
  lab_order_id: string;
  test_name: string; // e.g. "Complete Blood Count (CBC)"
  test_category: string;
  test_parameter: string;
  observed_value: string;
  unit: string;
  reference_range: string;
  flag: "normal" | "abnormal" | "critical";
}

export interface LabReport {
  id: string;
  report_no: string; // e.g. RPT-1024
  lab_order_id: string;
  patient_id: string;
  laboratory_id: string;
  verified_by_pathologist_name: string;
  digital_signature_hash?: string;
  status: "draft" | "verified" | "released";
  released_at?: string;
  created_at: string;
}

export interface EmergencyCase {
  id: string;
  case_number: string; // e.g. ER-1024
  patient_id?: string; // Optional if unconscious/unregistered
  temp_patient_name?: string;
  facility_id: string;
  triage_level: "red_critical" | "yellow_urgent" | "green_stable";
  assigned_doctor_id?: string;
  chief_complaint: string;
  blood_request_id?: string;
  ambulance_id?: string;
  status: "TRIAGE" | "RESUSCITATION" | "STABILIZED" | "ADMITTED" | "TRANSFERRED" | "DISCHARGED";
  admitted_at: string;
  created_at: string;
}

export interface BloodRequest {
  id: string;
  request_no: string; // e.g. BLD-REQ-1001
  emergency_case_id?: string;
  hospital_id: string;
  target_blood_centre_id?: string;
  blood_group: string; // e.g. "O+", "AB-"
  units_requested: number;
  urgency: "CRITICAL" | "URGENT" | "ROUTINE";
  status: "CREATED" | "SEARCHING" | "SOURCE_IDENTIFIED" | "ACCEPTED" | "FULFILLED" | "CANCELLED";
  created_at: string;
}

export interface AmbulanceRequest {
  id: string;
  request_no: string; // e.g. AMB-REQ-1001
  emergency_case_id?: string;
  pickup_location: string;
  destination_facility_id: string;
  ambulance_organization_id: string;
  eta_minutes?: number;
  status: "DISPATCHED" | "EN_ROUTE" | "PICKED_UP" | "ARRIVED" | "COMPLETED";
  created_at: string;
}

export interface HospitalTransfer {
  id: string;
  patient_id: string;
  origin_facility_id: string;
  destination_facility_id: string;
  reason_for_transfer: string;
  ambulance_request_id?: string;
  clinical_handover_summary: string;
  status: "REQUESTED" | "APPROVED" | "IN_TRANSIT" | "ARRIVED" | "COMPLETED";
  created_at: string;
}

export interface Referral {
  id: string;
  patient_id: string;
  referring_doctor_id: string;
  source_encounter_id?: string;
  target_doctor_id?: string;
  target_specialty: string;
  target_facility_id?: string;
  clinical_reason: string;
  status: "ACTIVE" | "COMPLETED" | "EXPIRED";
  created_at: string;
}

// ============================================================
// CATEGORY D — FINANCIAL & GOVERNANCE EVENTS
// ============================================================

export interface Bill {
  id: string;
  bill_no: string; // e.g. BIL-1001
  patient_id: string;
  facility_id: string;
  encounter_id?: string;
  total_gross_amount: number;
  insurance_approved_amount: number;
  government_assistance_amount: number;
  charity_discount_amount: number;
  financing_covered_amount: number;
  patient_net_payable: number;
  status: "DRAFT" | "GENERATED" | "PARTIALLY_PAID" | "SETTLED" | "DISPUTED";
  created_at: string;
  updated_at?: string;
}

export interface BillItem {
  id: string;
  bill_id: string;
  service_category: "consultation" | "laboratory" | "radiology" | "pharmacy" | "procedure" | "room" | "emergency";
  service_name: string;
  service_code?: string;
  unit_price: number;
  quantity: number;
  total_amount: number;
  // Traceability link back to authoritative clinical event ("WHY WAS I CHARGED?")
  linked_event_type?: "consultation" | "lab_order" | "prescription" | "emergency_case";
  linked_event_id?: string;
}

export interface BillVersion {
  id: string;
  bill_id: string;
  version_number: number;
  gross_amount: number;
  modified_by_staff_id: string;
  change_reason: string; // e.g. "MRI performed", "Medicine added", "Charity discount applied"
  created_at: string;
}

export interface Payment {
  id: string;
  receipt_no: string; // e.g. RCP-1001
  bill_id: string;
  patient_id: string;
  amount_paid: number;
  payment_method: "UPI" | "CREDIT_CARD" | "DEBIT_CARD" | "NET_BANKING" | "CASH" | "INSURANCE_SETTLEMENT";
  status: "INITIATED" | "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  transaction_ref?: string;
  paid_at: string;
}

export interface InsuranceClaim {
  id: string;
  claim_no: string; // e.g. CLM-1001
  policy_id: string;
  bill_id: string;
  patient_id: string;
  facility_id: string;
  claimed_amount: number;
  approved_amount: number;
  status: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "PARTIALLY_APPROVED" | "REJECTED" | "SETTLED";
  reviewer_remarks?: string;
  created_at: string;
}

export interface AssistanceApplication {
  id: string;
  application_no: string; // e.g. GOV-APP-1001
  patient_id: string;
  bill_id?: string;
  scheme_name: string; // e.g. "Biju Swasthya Kalyan Yojana (BSKY)", "PM-JAY"
  requested_amount: number;
  approved_amount: number;
  status: "APPLIED" | "VERIFIED" | "APPROVED" | "REJECTED" | "DISBURSED";
  created_at: string;
}

export interface FinancingApplication {
  id: string;
  application_no: string; // e.g. FIN-APP-1001
  patient_id: string;
  bill_id: string;
  financing_partner_org_id: string;
  loan_amount: number;
  tenure_months: number;
  monthly_emi: number;
  status: "REQUESTED" | "CREDIT_CHECK" | "APPROVED" | "DISBURSED" | "REJECTED";
  created_at: string;
}

export interface BillDispute {
  id: string;
  dispute_no: string; // e.g. DSP-1001
  bill_id: string;
  bill_item_id?: string;
  patient_id: string;
  dispute_reason: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED" | "ESCALATED";
  resolution_notes?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_role: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  reason?: string;
  result: "SUCCESS" | "DENIED" | "FAILED";
  ip_address?: string;
  created_at: string;
}
