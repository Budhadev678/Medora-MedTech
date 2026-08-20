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

export type RelationshipStatus = "ACTIVE" | "PENDING" | "ENDED" | "REVOKED" | "EXPIRED" | "SUSPENDED";

export interface PatientOrganizationRelationship {
  id: string;
  patient_id: string; // e.g. PAT-1001
  organization_id: string; // e.g. HSP-1001
  organization_name: string;
  organization_type: OrganizationType;
  relationship_type: "care_provider" | "visiting_facility" | "diagnostic_lab" | "pharmacy_dispenser" | "emergency_responder" | "insurer";
  status: RelationshipStatus;
  connected_since: string;
  ended_at?: string;
  last_interaction_at?: string;
  notes?: string;
}

export interface PatientDoctorRelationship {
  id: string;
  patient_id: string;
  doctor_id: string; // e.g. DOC-1001
  doctor_name: string;
  organization_id: string;
  organization_name: string;
  role_title: string;
  relationship_type: "consulting_doctor" | "primary_physician" | "specialist" | "temporary_care";
  status: RelationshipStatus;
  connected_since: string;
  ended_at?: string;
}

export type ConsentStatus = "PENDING" | "GRANTED" | "DENIED" | "REVOKED" | "EXPIRED" | "CANCELLED";

export type ConsentPurpose =
  | "treatment"
  | "diagnostic_review"
  | "care_coordination"
  | "insurance_processing"
  | "emergency_access"
  | "government_assistance"
  | "record_transfer";

export type ConsentDataScope =
  | "profile"
  | "medical_history"
  | "prescriptions"
  | "lab_reports"
  | "hospital_records"
  | "diagnostic_reports"
  | "billing_info"
  | "insurance_info";

export interface ConsentRequest {
  id: string; // e.g. REQ-1001
  patient_id: string; // e.g. PAT-1001
  requester_id: string; // e.g. DOC-1001 or staff ID
  requester_name: string; // e.g. Dr. Ananya Sharma
  requester_role: string; // e.g. Consultant Cardiologist
  organization_id: string; // e.g. HSP-1001
  organization_name: string; // e.g. City Hospital
  purpose: ConsentPurpose;
  purpose_description: string;
  requested_scopes: ConsentDataScope[];
  duration_days: number;
  status: ConsentStatus;
  requested_at: string;
  expires_at: string;
  responded_at?: string;
  is_demo?: boolean;
}

export interface ConsentRecord {
  id: string; // e.g. CNS-1001
  request_id?: string;
  patient_id: string;
  requester_id: string;
  requester_name: string;
  requester_role: string;
  organization_id: string;
  organization_name: string;
  purpose: ConsentPurpose;
  purpose_description: string;
  granted_scopes: ConsentDataScope[];
  status: ConsentStatus;
  granted_at: string;
  expires_at: string;
  revoked_at?: string;
  denied_at?: string;
  created_at: string;
  updated_at?: string;
  is_demo?: boolean;
}

export type CorrectionStatus = "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface IdentityCorrectionRequest {
  id: string; // e.g. CORR-1001
  patient_id: string; // e.g. PAT-1001
  field_name: "fullName" | "dob" | "gender" | "bloodGroup" | "aadhaarMasked" | "address";
  field_label: string;
  current_value: string;
  requested_value: string;
  reason: string;
  status: CorrectionStatus;
  submitted_at: string;
  reviewed_at?: string;
  reviewer_role?: string;
  admin_notes?: string;
}

export type AccessDecisionType =
  | "ALLOW"
  | "DENY"
  | "CONSENT_REQUIRED"
  | "RELATIONSHIP_REQUIRED"
  | "CONSENT_EXPIRED"
  | "CONSENT_REVOKED"
  | "SCOPE_NOT_ALLOWED"
  | "NOT_AUTHORIZED";

export interface AccessCheckResult {
  decision: AccessDecisionType;
  allowed: boolean;
  reason: string;
  evaluated_at: string;
  consent_id?: string;
  relationship_id?: string;
  authorized_scopes?: ConsentDataScope[];
}

export type AuditEventType =
  | "CONSENT_REQUESTED"
  | "CONSENT_GRANTED"
  | "CONSENT_DENIED"
  | "CONSENT_REVOKED"
  | "CONSENT_EXPIRED"
  | "IDENTITY_CORRECTION_REQUESTED"
  | "IDENTITY_CORRECTION_CANCELLED"
  | "IDENTITY_CORRECTION_APPROVED"
  | "IDENTITY_CORRECTION_REJECTED"
  | "RELATIONSHIP_CREATED"
  | "RELATIONSHIP_ENDED"
  | "ABHA_LINKED"
  | "ABHA_UNLINKED"
  | "ACCESS_EVALUATED"
  | "ENCOUNTER_CREATED"
  | "ENCOUNTER_STARTED"
  | "ENCOUNTER_UPDATED"
  | "ENCOUNTER_COMPLETED"
  | "ENCOUNTER_CANCELLED"
  | "ENCOUNTER_CLOSED"
  | "CLINICAL_RECORD_CREATED"
  | "CLINICAL_RECORD_UPDATED"
  | "CLINICAL_RECORD_COMPLETED"
  | "CLINICAL_RECORD_AMENDED"
  | "CLINICAL_RECORD_VIEWED"
  | "CLINICAL_RECORD_CANCELLED"
  | "PRESCRIPTION_CREATED"
  | "PRESCRIPTION_UPDATED"
  | "PRESCRIPTION_ISSUED"
  | "PRESCRIPTION_CANCELLED"
  | "PRESCRIPTION_VIEWED"
  | "LAB_ORDER_CREATED"
  | "LAB_ORDER_UPDATED"
  | "LAB_ORDER_ORDERED"
  | "LAB_ORDER_CANCELLED"
  | "LAB_ORDER_VIEWED"
  | "DOCUMENT_CREATED"
  | "DOCUMENT_VIEWED"
  | "DOCUMENT_DOWNLOADED"
  | "DOCUMENT_UPDATED"
  | "DOCUMENT_REVOKED"
  | "DOCUMENT_VERSION_CREATED"
  | "TIMELINE_GENERATED";

export interface StoredAuditEvent {
  id: string;
  timestamp: string;
  event_type: AuditEventType;
  actor_id: string; // User/Patient/Staff ID
  actor_name: string;
  actor_role: string;
  patient_id?: string;
  organization_id?: string;
  organization_name?: string;
  summary: string;
  reference_id?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

// ============================================================
// CATEGORY C — HEALTHCARE EVENTS & TRANSACTIONS
// ============================================================

export type EncounterType =
  | "CONSULTATION"
  | "FOLLOW_UP"
  | "DIAGNOSTIC_VISIT"
  | "OUTPATIENT"
  | "EMERGENCY"
  | "INPATIENT"
  | "TELECONSULTATION"
  | "OTHER";

export type EncounterStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED" | "CLOSED";

export type EncounterSourceType =
  | "DIRECT_CONSULTATION"
  | "APPOINTMENT"
  | "REFERRAL"
  | "EMERGENCY"
  | "LAB"
  | "OTHER";

export interface HealthcareEncounter {
  id: string; // e.g. ENC-1001
  encounter_reference?: string; // Human-friendly ref (e.g. ENC-1001)
  patient_id: string; // FK -> patients.medora_id (PAT-1001)
  patient_name: string;
  patient_gender?: string;
  patient_dob?: string;
  patient_blood_group?: string;
  provider_id: string; // FK -> doctors.identifier (DOC-1001)
  provider_name: string;
  provider_role: string; // e.g. "Consultant Cardiologist"
  organization_id: string; // FK -> organizations.identifier (HSP-1001)
  organization_name: string;
  facility_id?: string;
  facility_name?: string;
  department_id?: string;
  department_name?: string; // e.g. "Cardiology OPD"
  encounter_type: EncounterType;
  status: EncounterStatus;
  source_type: EncounterSourceType;
  reason_for_visit: string; // Clinical chief reason (not diagnosis)
  location?: string; // e.g. "Room 204, OPD Block A"
  started_at: string;
  ended_at?: string;
  created_by: string;
  created_by_role: string;
  created_at: string;
  updated_at?: string;
  consent_id?: string;
  notes_placeholder?: string;
}

// ============================================================
// CLINICAL RECORD DOMAIN MODEL (PHASE 4.2)
// Structured, traceable clinical documentation attached to an Encounter.
// ============================================================

export type ClinicalRecordStatus =
  | "DRAFT"
  | "ACTIVE"
  | "COMPLETED"
  | "AMENDED"
  | "CANCELLED";

export type SymptomSeverity = "MILD" | "MODERATE" | "SEVERE";

export interface ClinicalSymptom {
  id: string; // e.g. "SYM-1"
  name: string; // e.g. "Exertional chest tightness"
  onset?: string; // e.g. "3 days ago" or "2026-08-17"
  duration?: string; // e.g. "3 days"
  severity: SymptomSeverity;
  notes?: string;
}

export interface ClinicalVitals {
  temperature_celsius?: number;
  heart_rate_bpm?: number;
  systolic_bp_mmhg?: number;
  diastolic_bp_mmhg?: number;
  respiratory_rate_bpm?: number;
  spo2_percent?: number;
  weight_kg?: number;
  height_cm?: number;
  bmi?: number;
  recorded_at: string;
  recorded_by: string; // DOC-1001 or Staff
  recorded_by_name?: string;
}

export type DiagnosisStatus = "SUSPECTED" | "CONFIRMED" | "RESOLVED" | "HISTORICAL";

export interface ClinicalDiagnosis {
  id: string; // e.g. "DX-1"
  name: string; // e.g. "Stage 1 Essential Hypertension"
  icd10_code?: string; // e.g. "I10"
  status: DiagnosisStatus;
  category?: "PRIMARY" | "SECONDARY" | "PROVISIONAL";
  recorded_by: string; // DOC-1001 (Clinician entered, NEVER AI)
  recorded_by_name: string;
  recorded_at: string;
  notes?: string;
}

export interface ClinicalFollowUpPlan {
  required: boolean;
  follow_up_date?: string; // e.g. "2026-08-27"
  follow_up_timeframe?: string; // e.g. "7 days"
  instructions?: string;
}

export interface ClinicalRecordVersionSnapshot {
  version: number;
  saved_at: string;
  saved_by: string;
  saved_by_name: string;
  saved_by_role: string;
  amendment_reason?: string;
  status: ClinicalRecordStatus;
  chief_complaint: string;
  symptoms: ClinicalSymptom[];
  vitals?: ClinicalVitals;
  observations?: string;
  clinical_notes?: string;
  assessment?: string;
  diagnoses: ClinicalDiagnosis[];
  treatment_plan?: string;
  follow_up_plan?: ClinicalFollowUpPlan;
}

export interface ClinicalRecord {
  id: string; // e.g. "CR-1001"
  record_reference: string; // e.g. "CR-1001"
  encounter_id: string; // FK -> HealthcareEncounter (ENC-1001)
  patient_id: string; // FK -> patients.medora_id (PAT-1001)
  patient_name: string;
  author_id: string; // FK -> doctors.identifier (DOC-1001)
  author_name: string;
  author_role: string; // e.g. "Consultant Cardiologist"
  created_by: string;
  created_by_role: string;
  organization_id: string; // FK -> organizations.identifier (HSP-1001)
  organization_name: string;
  department_id?: string;
  department_name?: string;
  status: ClinicalRecordStatus;
  
  // Structured Clinical Sections
  chief_complaint: string;
  symptoms: ClinicalSymptom[];
  vitals?: ClinicalVitals;
  observations?: string;
  clinical_notes?: string;
  assessment?: string;
  diagnoses: ClinicalDiagnosis[];
  treatment_plan?: string;
  follow_up_plan?: ClinicalFollowUpPlan;

  // Versioning & Lifecycle
  version: number;
  version_history: ClinicalRecordVersionSnapshot[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
  amended_at?: string;
  amendment_reason?: string;
}

// ============================================================
// PRESCRIPTION DOMAIN MODEL (PHASE 4.3)
// Clinician-authorized medication orders bound to an Encounter.
// ============================================================

export type PrescriptionStatus = "DRAFT" | "ISSUED" | "CANCELLED" | "COMPLETED" | "EXPIRED";

export type PrescriptionRoute = "ORAL" | "TOPICAL" | "INHALATION" | "INJECTION" | "OTHER";

export interface PrescriptionItem {
  id: string; // e.g. "RXI-1"
  prescription_id?: string;
  medicine_name: string; // e.g. "Telmisartan"
  strength?: string; // e.g. "40 mg"
  dosage: string; // e.g. "1 tablet"
  route: PrescriptionRoute; // e.g. "ORAL"
  frequency: string; // e.g. "Once daily (morning)"
  duration: string; // e.g. "30 days"
  duration_days?: number;
  quantity?: string; // e.g. "30 tablets"
  instructions?: string; // e.g. "Take after breakfast with water"
}

export interface HealthcarePrescription {
  id: string; // e.g. "RX-1001"
  prescription_reference: string; // e.g. "RX-1001"
  patient_id: string; // FK -> patients.medora_id (PAT-1001)
  patient_name: string;
  encounter_id: string; // FK -> HealthcareEncounter (ENC-1001)
  clinical_record_id?: string; // FK -> ClinicalRecord (CR-1001)
  prescriber_id: string; // FK -> doctors.identifier (DOC-1001)
  prescriber_name: string;
  prescriber_role: string;
  organization_id: string; // FK -> organizations.identifier (HSP-1001)
  organization_name: string;
  department_name?: string;
  status: PrescriptionStatus;
  items: PrescriptionItem[];
  refills_allowed: number;
  refills_used: number;
  notes?: string;
  issued_at?: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

// ============================================================
// LABORATORY ORDER DOMAIN MODEL (PHASE 4.3)
// Clinician-requested diagnostic test orders bound to an Encounter.
// ============================================================

export type LabOrderPriority = "ROUTINE" | "URGENT";

export type LabOrderStatus =
  | "DRAFT"
  | "ORDERED"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface LabOrderItem {
  id: string; // e.g. "LOI-1"
  test_name: string; // e.g. "Complete Blood Count (CBC) with Differential"
  test_code?: string; // e.g. "CBC-01"
  specimen_type?: string; // e.g. "Whole Blood (EDTA)"
  instructions?: string; // e.g. "Standard venipuncture"
}

export interface HealthcareLabOrder {
  id: string; // e.g. "LAB-ORD-1001"
  order_reference: string; // e.g. "LAB-ORD-1001"
  patient_id: string; // FK -> patients.medora_id (PAT-1001)
  patient_name: string;
  encounter_id: string; // FK -> HealthcareEncounter (ENC-1001)
  clinical_record_id?: string; // FK -> ClinicalRecord (CR-1001)
  ordering_provider_id: string; // FK -> doctors.identifier (DOC-1001)
  ordering_provider_name: string;
  ordering_provider_role: string;
  organization_id: string; // FK -> organizations.identifier (HSP-1001)
  organization_name: string;
  department_name?: string;
  laboratory_id?: string; // Optional assigned lab (preserving patient choice)
  laboratory_name?: string;
  priority: LabOrderPriority;
  reason: string; // e.g. "Baseline cardiovascular risk evaluation"
  instructions?: string; // e.g. "12-hour overnight fasting required"
  status: LabOrderStatus;
  items: LabOrderItem[];
  ordered_at?: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

// ============================================================
// MEDICAL DOCUMENT DOMAIN MODEL (PHASE 4.4)
// Provenance-backed medical documents and diagnostic reports.
// ============================================================

export type MedicalDocumentType =
  | "CONSULTATION_NOTE"
  | "LAB_REPORT"
  | "PRESCRIPTION_DOCUMENT"
  | "DISCHARGE_SUMMARY"
  | "DIAGNOSTIC_REPORT"
  | "REFERRAL"
  | "OTHER";

export type DocumentSourceType = "PROVIDER_GENERATED" | "PATIENT_UPLOADED";

export type MedicalDocumentStatus = "ACTIVE" | "ARCHIVED" | "REVOKED";

export interface DocumentVersionSnapshot {
  version: number;
  title: string;
  storage_reference: string;
  mime_type: string;
  file_size_bytes: number;
  file_hash_sha256?: string;
  updated_at: string;
  updated_by_id: string;
  updated_by_name: string;
  update_reason: string;
}

export interface HealthcareMedicalDocument {
  id: string; // e.g. "DOC-1001"
  document_reference: string; // e.g. "DOC-1001"
  patient_id: string; // FK -> patients.medora_id (PAT-1001)
  patient_name: string;
  encounter_id?: string; // FK -> HealthcareEncounter (ENC-1001)
  clinical_record_id?: string; // FK -> ClinicalRecord (CR-1001)
  prescription_id?: string; // FK -> HealthcarePrescription (RX-1001)
  lab_order_id?: string; // FK -> HealthcareLabOrder (LAB-ORD-1001)
  document_type: MedicalDocumentType;
  title: string;
  description?: string;
  source_type: DocumentSourceType;
  source_organization_id?: string; // FK -> organizations.identifier (HSP-1001, LAB-1001)
  source_organization_name?: string;
  source_professional_id?: string; // FK -> doctors.identifier (DOC-1001)
  source_professional_name?: string;
  source_professional_role?: string;
  storage_reference: string; // Virtual private storage reference (e.g. "sec-storage://patients/PAT-1001/docs/DOC-1001.pdf")
  mime_type: string; // e.g. "application/pdf", "image/jpeg", "image/png"
  file_size_bytes: number;
  file_hash_sha256?: string;
  status: MedicalDocumentStatus;
  version: number;
  version_history?: DocumentVersionSnapshot[];
  revocation_reason?: string;
  revoked_at?: string;
  created_at: string;
  updated_at: string;
  created_by_id: string;
  created_by_name: string;
}

// ============================================================
// HEALTH JOURNEY TIMELINE MODEL (PHASE 4.4)
// Lightweight dynamic aggregation layer referencing canonical records.
// ============================================================

export type TimelineEventType =
  | "ENCOUNTER"
  | "CLINICAL_RECORD"
  | "PRESCRIPTION"
  | "LAB_ORDER"
  | "MEDICAL_DOCUMENT";

export interface TimelineEvent {
  id: string; // Dynamic composite e.g. "tle-enc-1001"
  patient_id: string;
  event_type: TimelineEventType;
  reference_id: string; // e.g. "ENC-1001", "RX-1001", "DOC-1001"
  title: string;
  summary: string;
  status: string; // e.g. "COMPLETED", "ISSUED", "ORDERED", "ACTIVE", "CANCELLED", "REVOKED"
  occurred_at: string; // Canonical clinical timestamp for chronological sorting
  organization_name?: string;
  organization_id?: string;
  professional_name?: string;
  professional_id?: string;
  deep_link: string; // Route to view canonical record or open modal
  metadata?: Record<string, any>;
}

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
