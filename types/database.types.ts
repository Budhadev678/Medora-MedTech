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
  | "receptionist"
  | "staff"
  | "admin";

export type AccountStatus = "active" | "pending" | "suspended" | "disabled";

export type VerificationStatus = "pending" | "verified" | "rejected" | "suspended";

export type AffiliationStatus =
  | "active"
  | "pending"
  | "rejected"
  | "suspended"
  | "ended"
  | "REQUESTED"
  | "PENDING"
  | "APPROVED"
  | "ACTIVE"
  | "SUSPENDED"
  | "ENDED"
  | "REJECTED";

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

export type OrganizationMembershipStatus =
  | "INVITED"
  | "PENDING"
  | "ACTIVE"
  | "SUSPENDED"
  | "REVOKED";

// ============================================================
// PHASE A.2 — NORMALIZED IDENTITY & MEMBERSHIP MODEL
// ============================================================

export interface UserAccount {
  id: string; // Auth User ID (UUID)
  email: string;
  phone?: string;
  account_status: AccountStatus;
  created_at: string;
  last_login_at?: string;
}

export interface PersonProfile {
  id: string; // Person ID (UUID or PER-*)
  user_id: string; // FK -> UserAccount.id
  full_name: string;
  email: string;
  phone?: string;
  gender?: "male" | "female" | "other";
  dob?: string;
  avatar_url?: string;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at?: string;
}

export interface ProfessionalProfile {
  id: string; // Professional ID (UUID or PRO-*)
  person_id: string; // FK -> PersonProfile.id
  user_id: string; // FK -> UserAccount.id
  profession_type: "doctor" | "nurse" | "pharmacist" | "lab_technician" | "administrator" | "staff";
  medical_reg_no?: string;
  medical_council?: string;
  specialization?: string;
  qualifications?: string;
  experience_years?: number;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at?: string;
}

export interface OrganizationEntity {
  id: string; // UUID
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

export interface OrganizationMembership {
  id: string; // e.g. MEM-1001
  person_id: string; // FK -> PersonProfile.id
  user_id: string; // FK -> UserAccount.id
  organization_id: string; // FK -> OrganizationEntity.id or medora_id
  organization_identifier: string; // e.g. HSP-1001, CLN-1001, LAB-1001
  organization_name: string;
  organization_type: OrganizationType;
  facility_id?: string;
  facility_name?: string;
  department_id?: string;
  department_name?: string;
  role_title: string; // e.g. "Consultant Cardiologist", "Head Nurse", "Clinic Administrator"
  member_role: UserRole | string; // e.g. "doctor", "hospital_admin", "staff"
  employment_type?: "full_time" | "part_time" | "consultant" | "visiting" | "contract";
  status: OrganizationMembershipStatus;
  verification_status: VerificationStatus;
  consultation_fee?: number;
  opd_room?: string;
  schedule_notes?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at?: string;
  revocation_reason?: string;
  revoked_at?: string;
}

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

// ============================================================
// PHASE 5.1 & 5.2 — ORGANIZATION, FACILITY, DEPARTMENT & SERVICE MODELS
// ============================================================

export type HealthcareOrganizationType =
  | "HOSPITAL_GROUP"
  | "CLINIC_GROUP"
  | "DIAGNOSTIC_GROUP"
  | "PHARMACY_GROUP"
  | "BLOOD_BANK_GROUP"
  | "HEALTHCARE_NETWORK"
  | "OTHER"
  | OrganizationType;

export type HealthcareFacilityType =
  | "HOSPITAL"
  | "CLINIC"
  | "LABORATORY"
  | "DIAGNOSTIC_CENTER"
  | "PHARMACY"
  | "BLOOD_CENTER"
  | "AMBULANCE_HUB"
  | "OTHER";

export type HealthcareFacilityStatus = "ACTIVE" | "INACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED";
export type HealthcareDepartmentStatus = "ACTIVE" | "INACTIVE";
export type HealthcareServiceStatus = "ACTIVE" | "INACTIVE";
export type HealthcareServiceCategory =
  | "CONSULTATION"
  | "DIAGNOSTIC"
  | "IMAGING"
  | "PROCEDURE"
  | "THERAPY"
  | "EMERGENCY"
  | "OTHER";

export interface HealthcareOrganization {
  id: string; // UUID primary key
  identifier: string; // e.g. ORG-1001, HSP-1001
  name: string;
  legal_name?: string;
  type: HealthcareOrganizationType | string;
  license_no: string;
  phone: string;
  email?: string;
  website?: string;
  address: string;
  city: string;
  district?: string;
  state: string;
  postal_code?: string;
  country: string;
  status: HealthcareFacilityStatus | AccountStatus | string;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at?: string;
}

export interface HealthcareFacility {
  id: string; // UUID or fac-* primary key
  facility_code: string; // e.g. FAC-1001, HSP-1001-BBSR
  organization_id: string; // FK -> HealthcareOrganization.id or identifier
  organization_identifier?: string; // e.g. ORG-1001
  organization_name?: string;
  name: string;
  type: HealthcareFacilityType | string;
  license_no?: string;
  phone: string;
  email?: string;
  emergency_phone?: string;
  website?: string;
  address: string;
  city: string;
  district?: string;
  state: string;
  postal_code: string;
  country: string;
  latitude?: number;
  longitude?: number;
  operating_hours?: string;
  status: HealthcareFacilityStatus | AccountStatus | string;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at?: string;
}

export interface HealthcareDepartment {
  id: string; // e.g. DEP-1001
  facility_id: string; // FK -> HealthcareFacility.id / facility_code
  facility_name?: string;
  organization_id?: string;
  name: string; // e.g. "Cardiology & Cath Lab"
  code: string; // e.g. "CARD"
  description?: string;
  head_doctor_id?: string; // DOC-1001
  head_doctor_name?: string;
  status: HealthcareDepartmentStatus;
  created_at: string;
  updated_at?: string;
}

export interface HealthcareService {
  id: string; // e.g. SRV-1001
  facility_id: string; // FK -> HealthcareFacility.id
  facility_name?: string;
  department_id?: string | null; // Optional: null means facility-level service
  department_name?: string;
  name: string; // e.g. "12-Lead Electrocardiogram (ECG)"
  code: string; // e.g. "ECG-01"
  category: HealthcareServiceCategory;
  description?: string;
  duration_minutes?: number;
  base_price?: number;
  status: HealthcareServiceStatus;
  created_at: string;
  updated_at?: string;
}

export interface HealthcareDoctorAffiliation {
  id: string; // e.g. AFF-DOC-1001
  doctor_id: string; // User ID / DOC-1001
  doctor_name: string;
  specialization?: string;
  medical_reg_no?: string;
  organization_id: string;
  organization_name?: string;
  facility_id: string; // FAC-1001
  facility_name?: string;
  department_id?: string;
  department_name?: string;
  role_title: string; // e.g. "Consultant Cardiologist", "Visiting Specialist", "Department Head"
  consultation_fee?: number;
  opd_room?: string;
  schedule_notes?: string;
  status: AffiliationStatus;
  verification_status: VerificationStatus;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at?: string;
}

export interface HealthcareStaffAffiliation {
  id: string; // e.g. AFF-STAFF-1001
  user_id: string; // User ID / STAFF-1001
  staff_name: string;
  email?: string;
  phone?: string;
  organization_id: string;
  organization_name?: string;
  facility_id: string; // FAC-1001
  facility_name?: string;
  department_id?: string;
  department_name?: string;
  role_title: string; // e.g. "Head Receptionist", "Senior Triage Nurse"
  staff_role:
    | "FACILITY_ADMIN"
    | "RECEPTIONIST"
    | "NURSE"
    | "TECHNICIAN"
    | "LAB_STAFF"
    | "PHARMACY_STAFF"
    | "BILLING_STAFF"
    | "STAFF"
    | string;
  status: AffiliationStatus;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at?: string;
}

export interface HealthcareDoctorServiceAssignment {
  id: string; // e.g. DSA-1001
  doctor_id: string;
  doctor_name: string;
  facility_id: string;
  department_id?: string;
  service_id: string;
  service_name: string;
  status: "ACTIVE" | "INACTIVE";
  created_at: string;
  updated_at?: string;
}

export interface AffiliationInvitation {
  id: string; // e.g. INV-1001
  organization_id: string;
  organization_name: string;
  facility_id: string;
  facility_name: string;
  department_id?: string;
  department_name?: string;
  target_user_id?: string; // e.g. DOC-1003, or email
  target_name?: string;
  target_email?: string;
  role_type: "DOCTOR" | "STAFF";
  role_title: string;
  staff_role?: string;
  specialization?: string;
  consultation_fee?: number;
  opd_room?: string;
  invited_by_id: string;
  invited_by_name: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "REVOKED" | "EXPIRED";
  expires_at: string;
  created_at: string;
  updated_at?: string;
}

export interface DepartmentHeadAssignment {
  id: string;
  facility_id: string;
  department_id: string;
  doctor_id: string;
  doctor_name: string;
  status: "ACTIVE" | "ENDED";
  start_date: string;
  end_date?: string;
  assigned_by_id: string;
  assigned_by_name: string;
  created_at: string;
  updated_at?: string;
}

export interface ConfigurationIssue {
  id: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  category: "RELATIONSHIP" | "DEPARTMENT" | "SERVICE" | "DOCTOR" | "STAFF" | "SCHEDULE";
  title: string;
  description: string;
  affected_entity_id: string;
  affected_entity_type:
    | "ORGANIZATION"
    | "FACILITY"
    | "DEPARTMENT"
    | "SERVICE"
    | "AFFILIATION"
    | "SCHEDULE";
  suggested_action: string;
  created_at: string;
}

export interface FacilityOperationalReadinessReport {
  facility_id: string;
  facility_name: string;
  organization_id: string;
  organization_name: string;
  is_ready_for_phase6: boolean;
  readiness_score: number; // 0 - 100%
  metrics: {
    totalDepartments: number;
    activeDepartments: number;
    totalServices: number;
    activeServices: number;
    totalDoctors: number;
    activeDoctors: number;
    totalStaff: number;
    activeStaff: number;
    doctorServiceMappings: number;
    scheduleContexts: number;
  };
  checks: {
    parentOrganizationValid: boolean;
    departmentsConfigured: boolean;
    servicesCataloged: boolean;
    doctorsAffiliated: boolean;
    staffAssigned: boolean;
    serviceCapabilitiesAssigned: boolean;
    schedulesLinked: boolean;
    zeroOrphanRecords: boolean;
    zeroCrossTenantMismatches: boolean;
  };
  issues: ConfigurationIssue[];
  evaluated_at: string;
}

export interface Phase6DiscoveryFacility {
  facility_id: string;
  facility_code: string;
  organization_id: string;
  organization_name: string;
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  phone: string;
  emergency_phone?: string;
  operating_hours?: string;
  departments_count: number;
  services_count: number;
  doctors_count: number;
}

export interface Phase6DiscoveryDepartment {
  department_id: string;
  facility_id: string;
  name: string;
  code: string;
  description?: string;
  head_doctor_name?: string;
  services_count: number;
  doctors_count: number;
}

export interface Phase6DiscoveryService {
  service_id: string;
  facility_id: string;
  department_id?: string | null;
  department_name?: string;
  name: string;
  code: string;
  category: HealthcareServiceCategory;
  duration_minutes: number;
  base_price: number;
  eligible_doctors_count: number;
}

export interface Phase6DiscoveryDoctor {
  doctor_id: string;
  doctor_name: string;
  specialization: string;
  medical_reg_no?: string;
  facility_id: string;
  facility_name: string;
  department_id?: string;
  department_name?: string;
  role_title: string;
  consultation_fee: number;
  opd_room?: string;
  schedule_notes?: string;
  assigned_services: Array<{ service_id: string; service_name: string }>;
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

export type MedoraPermission =
  // Patient domain
  | "PATIENT_VIEW"
  | "PATIENT_UPDATE"
  | "PATIENT_DELETE"
  // Appointments
  | "APPOINTMENT_VIEW"
  | "APPOINTMENT_CREATE"
  | "APPOINTMENT_UPDATE"
  | "APPOINTMENT_CANCEL"
  | "APPOINTMENT_RESCHEDULE"
  | "CHECKIN_VIEW"
  | "CHECKIN_PERFORM"
  | "QUEUE_VIEW"
  | "TOKEN_GENERATE"
  | "TOKEN_CALL"
  // Encounters
  | "ENCOUNTER_VIEW"
  | "ENCOUNTER_CREATE"
  | "ENCOUNTER_UPDATE"
  | "ENCOUNTER_COMPLETE"
  | "ENCOUNTER_CANCEL"
  // Clinical Records & Documents
  | "CLINICAL_RECORD_VIEW"
  | "CLINICAL_RECORD_CREATE"
  | "CLINICAL_RECORD_UPDATE"
  | "CLINICAL_RECORD_AMEND"
  | "CLINICAL_RECORD_DELETE"
  | "DOCUMENT_VIEW"
  | "DOCUMENT_CREATE"
  | "TIMELINE_VIEW"
  // Prescriptions & Pharmacy
  | "PRESCRIPTION_VIEW"
  | "PRESCRIPTION_CREATE"
  | "PRESCRIPTION_UPDATE"
  | "PRESCRIPTION_ISSUE"
  | "PRESCRIPTION_CANCEL"
  | "PHARMACY_ORDER_VIEW"
  | "PHARMACY_DISPENSE"
  // Laboratory
  | "LAB_ORDER_VIEW"
  | "LAB_ORDER_CREATE"
  | "LAB_ORDER_CANCEL"
  | "LAB_ORDER_ACCEPTED"
  | "LAB_ORDER_UNABLE_TO_PROCESS"
  | "LAB_SAMPLE_COLLECT"
  | "LAB_SAMPLE_RECEIVE"
  | "LAB_RESULT_CREATE"
  | "LAB_RESULT_ENTER"
  | "LAB_RESULT_VERIFY"
  | "LAB_RESULT_VIEW"
  | "LAB_REPORT_VIEW"
  // Billing & Finance
  | "BILL_VIEW"
  | "BILL_CREATE"
  | "BILL_UPDATE"
  | "BILL_DISPUTE_MANAGE"
  | "BILL_DELETE"
  // Organization & Membership Governance
  | "ORGANIZATION_VIEW"
  | "ORGANIZATION_CREATE"
  | "ORGANIZATION_UPDATE"
  | "FACILITY_VIEW"
  | "FACILITY_CREATE"
  | "FACILITY_UPDATE"
  | "FACILITY_MANAGE"
  | "DEPARTMENT_VIEW"
  | "DEPARTMENT_CREATE"
  | "DEPARTMENT_UPDATE"
  | "DEPARTMENT_MANAGE"
  | "SERVICE_VIEW"
  | "SERVICE_CREATE"
  | "SERVICE_UPDATE"
  | "SERVICE_MANAGE"
  | "MEMBER_VIEW"
  | "MEMBER_INVITE"
  | "MEMBER_UPDATE"
  | "MEMBER_REVOKE"
  | "STAFF_VIEW"
  | "STAFF_ASSIGN"
  | "STAFF_MANAGE"
  | "DOCTOR_AFFILIATION_MANAGE"
  | "AFFILIATION_INVITE"
  | "AFFILIATION_APPROVE"
  | "AFFILIATION_SUSPEND"
  | "AFFILIATION_END"
  | "PERMISSION_MANAGE"
  | "FACILITY_SWITCH_CONTEXT"
  | "HEALTH_CHECK_VIEW"
  // Emergency & Break-Glass
  | "EMERGENCY_ACCESS_TRIGGER"
  | "EMERGENCY_ACCESS_VIEW"
  // Audit Ledger
  | "AUDIT_VIEW"
  | "AUDIT_EXPORT"
  | "AUDIT_DELETE"
  // Platform Administration
  | "PLATFORM_MANAGE";

export interface EmergencyAccessLog {
  id: string; // EMG-ACC-1001
  actor_id: string; // DOC-1001
  actor_name: string;
  actor_role: string;
  patient_id: string; // PAT-1001
  patient_name: string;
  organization_id: string; // HSP-1001
  reason: string;
  resource_accessed: string;
  triggered_at: string;
  expires_at: string;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
}

export type AuthorizationDecision =
  | "ALLOW"
  | "DENY"
  | "NOT_AUTHENTICATED"
  | "MEMBERSHIP_INACTIVE"
  | "PERMISSION_DENIED"
  | "CONSENT_REQUIRED"
  | "ORGANIZATION_MISMATCH"
  | "RESOURCE_MISMATCH"
  | "ACTION_PROHIBITED";

export interface AuthorizationResult {
  allowed: boolean;
  decision: AuthorizationDecision;
  reason: string;
  actor_id?: string;
  organization_id?: string;
  role?: string;
  permission?: MedoraPermission;
  resource_id?: string;
  evaluated_at: string;
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
  | "ACCESS_GRANTED"
  | "ACCESS_DENIED"
  | "ROLE_CHANGED"
  | "MEMBERSHIP_CHANGED"
  | "EMERGENCY_ACCESS_TRIGGERED"
  | "EMERGENCY_ACCESS_VIEWED"
  | "ENCOUNTER_CREATED"
  | "ENCOUNTER_STARTED"
  | "ENCOUNTER_UPDATED"
  | "ENCOUNTER_COMPLETED"
  | "ENCOUNTER_FINALIZED"
  | "CONSULTATION_STARTED"
  | "CONSULTATION_COMPLETED"
  | "ENCOUNTER_CANCELLED"
  | "ENCOUNTER_CLOSED"
  | "CLINICAL_RECORD_CREATED"
  | "CLINICAL_RECORD_UPDATED"
  | "CLINICAL_RECORD_COMPLETED"
  | "CLINICAL_RECORD_AMENDED"
  | "CLINICAL_RECORD_VIEWED"
  | "CLINICAL_RECORD_CANCELLED"
  | "PRESCRIPTION_CREATED"
  | "PRESCRIPTION_DRAFT_SAVED"
  | "PRESCRIPTION_UPDATED"
  | "PRESCRIPTION_ISSUED"
  | "PRESCRIPTION_FINALIZED"
  | "PRESCRIPTION_VOIDED"
  | "PRESCRIPTION_CORRECTED"
  | "PRESCRIPTION_VERIFICATION_REQUESTED"
  | "PRESCRIPTION_AMENDED"
  | "PRESCRIPTION_CANCELLED"
  | "PRESCRIPTION_VIEWED"
  | "PRESCRIPTION_ACCESSED"
  | "ORDER_CREATED"
  | "ORDER_UPDATED"
  | "ORDER_CANCELLED"
  | "ORDER_VIEWED"
  | "LAB_ORDER_CREATED"
  | "LAB_ORDER_UPDATED"
  | "LAB_ORDER_FINALIZED"
  | "LAB_ORDER_ORDERED"
  | "LAB_ORDER_ACCEPTED"
  | "LAB_ORDER_UNABLE_TO_PROCESS"
  | "LAB_ORDER_REJECTED"
  | "LAB_ORDER_CANCELLED"
  | "LAB_ORDER_VIEWED"
  | "REFERRAL_CREATED"
  | "REFERRAL_UPDATED"
  | "REFERRAL_FINALIZED"
  | "REFERRAL_CANCELLED"
  | "REFERRAL_VIEWED"
  | "FOLLOWUP_CREATED"
  | "FOLLOWUP_UPDATED"
  | "FOLLOWUP_RECOMMENDED"
  | "FOLLOWUP_BOOKED"
  | "FOLLOWUP_CANCELLED"
  | "FOLLOWUP_VIEWED"
  | "SAMPLE_CREATED"
  | "SAMPLE_COLLECTED"
  | "LAB_SAMPLE_COLLECT"
  | "SAMPLE_RECEIVED"
  | "SAMPLE_REJECTED"
  | "SAMPLE_VIEWED"
  | "MEMBER_INVITE"
  | "SERVICE_UPDATE"
  | "TEST_ASSIGNED"
  | "TEST_STARTED"
  | "RESULT_DRAFT_SAVED"
  | "RESULT_SUBMITTED"
  | "RESULT_ENTERED"
  | "RESULT_RETURNED"
  | "RESULT_CORRECTED"
  | "RESULT_UPDATED"
  | "RESULT_VERIFIED"
  | "RESULT_AMENDED"
  | "RESULT_VIEWED"
  | "REPORT_GENERATED"
  | "REPORT_FINALIZED"
  | "REPORT_SUPERSEDED"
  | "REPORT_RELEASED"
  | "REPORT_AMENDED"
  | "REPORT_ACCESSED"
  | "REPORT_VIEWED"
  | "REPORT_DOWNLOADED"
  | "REPORT_SHARED"
  | "REPORT_SHARE_REVOKED"
  | "REPORT_VERIFICATION_CHECKED"
  | "REPORT_NOTIFICATION_SENT"
  | "PRESCRIPTION_RECEIVED_BY_PHARMACY"
  | "PRESCRIPTION_REVIEW_STARTED"
  | "PRESCRIPTION_VALIDATED"
  | "PRESCRIPTION_REJECTED"
  | "PRESCRIPTION_CLARIFICATION_REQUESTED"
  | "STOCK_RECEIVED"
  | "STOCK_ADJUSTED"
  | "STOCK_RESERVED"
  | "STOCK_RELEASED"
  | "STOCK_QUARANTINED"
  | "AVAILABILITY_CHECKED"
  | "RESERVATION_FAILED"
  | "PHARMACY_SELECTED"
  | "MEDICINE_RESERVED"
  | "RESERVATION_RELEASED"
  | "PHARMACY_ORDER_CREATED"
  | "PHARMACY_ORDER_CONFIRMED"
  | "PHARMACY_ORDER_PREPARATION_STARTED"
  | "PHARMACY_ORDER_READY"
  | "PICKUP_VERIFICATION_SUCCESS"
  | "PICKUP_VERIFICATION_FAILED"
  | "MEDICINE_HANDOVER_CONFIRMED"
  | "MEDICINE_DISPENSED"
  | "PARTIAL_DISPENSING"
  | "DISPENSING_REVERSED"
  | "RETURN_REQUESTED"
  | "RETURN_CONFIRMED"
  | "BILL_CREATED"
  | "BILL_ITEM_CREATED"
  | "BILL_REVIEWED"
  | "BILL_ISSUED"
  | "BILL_VERSION_CREATED"
  | "BILL_CANCELLED"
  | "DISCOUNT_APPLIED"
  | "INSURANCE_APPROVAL_RECORDED"
  | "INSURANCE_ALLOCATION_CREATED"
  | "ASSISTANCE_APPROVED"
  | "HOSPITAL_ASSISTANCE_APPLIED"
  | "CHARITY_ASSISTANCE_APPLIED"
  | "FINANCING_APPROVED"
  | "FINANCING_DISBURSEMENT_RECORDED"
  | "PAYMENT_INITIATED"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "PAYMENT_SETTLED"
  | "PAYMENT_REVERSED"
  | "REFUND_REQUESTED"
  | "REFUND_APPROVED"
  | "REFUND_COMPLETED"
  | "PAYMENT_REALLOCATED"
  | "RECONCILIATION_STARTED"
  | "RECONCILIATION_COMPLETED"
  | "EXCEPTION_CREATED"
  | "EXCEPTION_RESOLVED"
  | "DISPUTE_CREATED"
  | "DISPUTE_UPDATED"
  | "INVESTIGATION_STARTED"
  | "ANOMALY_DETECTED"
  | "DISPUTE_RESOLVED"
  | "FINANCIAL_CORRECTION_APPLIED"
  | "DOCUMENT_CREATED"
  | "DOCUMENT_VIEWED"
  | "DOCUMENT_DOWNLOADED"
  | "DOCUMENT_UPDATED"
  | "DOCUMENT_REVOKED"
  | "DOCUMENT_VERSION_CREATED"
  | "TIMELINE_GENERATED"
  | "TIMELINE_ACCESSED"
  | "ORGANIZATION_CREATED"
  | "ORGANIZATION_UPDATED"
  | "ORGANIZATION_STATUS_CHANGED"
  | "FACILITY_CREATED"
  | "FACILITY_UPDATED"
  | "FACILITY_STATUS_CHANGED"
  | "DEPARTMENT_CREATED"
  | "DEPARTMENT_UPDATED"
  | "DEPARTMENT_STATUS_CHANGED"
  | "SERVICE_CREATED"
  | "SERVICE_UPDATED"
  | "SERVICE_STATUS_CHANGED"
  | "AFFILIATION_CREATED"
  | "AFFILIATION_UPDATED"
  | "AFFILIATION_ENDED"
  | "AFFILIATION_INVITED"
  | "AFFILIATION_ACCEPTED"
  | "AFFILIATION_REJECTED"
  | "AFFILIATION_REVOKED"
  | "AFFILIATION_SUSPENDED"
  | "AFFILIATION_REACTIVATED"
  | "DEPARTMENT_HEAD_ASSIGNED"
  | "CONFIGURATION_ISSUE_RESOLVED"
  | "SERVICE_ASSIGNMENT_CREATED"
  | "SERVICE_ASSIGNMENT_UPDATED";

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

export type EncounterStatus =
  | "DRAFT"
  | "ACTIVE"
  | "IN_PROGRESS"
  | "DOCUMENTING"
  | "READY_FOR_FINALIZATION"
  | "FINALIZED"
  | "COMPLETED"
  | "CANCELLED"
  | "CLOSED";

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
  completed_at?: string;
  finalized_at?: string;
  finalized_by?: string;
  finalized_by_name?: string;
  appointment_id?: string;
  queue_entry_id?: string;
  token_number?: string;
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
  | "IN_PROGRESS"
  | "DOCUMENTING"
  | "READY_FOR_FINALIZATION"
  | "FINALIZED"
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
// MEDICINE CATALOG & PRESCRIPTION DOMAIN MODEL (PHASE C.2)
// Clinician-authorized medication orders bound to an Encounter.
// ============================================================

export type MedicineForm =
  | "TABLET"
  | "CAPSULE"
  | "SYRUP"
  | "INJECTION"
  | "INHALER"
  | "DROPS"
  | "OINTMENT"
  | "POWDER"
  | "OTHER";

export interface MedicineCatalogItem {
  id: string; // e.g. "MED-1001"
  generic_name: string; // e.g. "Paracetamol"
  brand_name?: string; // e.g. "Dolo 650"
  default_strength?: string; // e.g. "650 mg"
  strength_value?: number; // e.g. 650
  strength_unit?: string; // e.g. "mg"
  form?: MedicineForm;
  default_route?: PrescriptionRoute;
  category?: string; // e.g. "Analgesic / Antipyretic"
  is_restricted?: boolean; // Controlled / schedule drug flag

  // Phase 9 extensions
  display_name?: string;
  strength?: string;
  dosage_form?: string;
  unit_price?: number;
  status?: "ACTIVE" | "INACTIVE";
  created_at?: string;
  updated_at?: string;
}

export type PrescriptionStatus =
  | "DRAFT"
  | "READY_FOR_REVIEW"
  | "ISSUED"
  | "FINALIZED"
  | "COMPLETED"
  | "AMENDED"
  | "SUPERSEDED"
  | "VOIDED"
  | "CANCELLED"
  | "EXPIRED";

export type PrescriptionRoute =
  | "ORAL"
  | "TOPICAL"
  | "INHALATION"
  | "INJECTION"
  | "OPHTHALMIC"
  | "OTIC"
  | "SUBLINGUAL"
  | "OTHER";

export type MedicineTiming =
  | "BEFORE_FOOD"
  | "AFTER_FOOD"
  | "WITH_FOOD"
  | "AT_BEDTIME"
  | "EMPTY_STOMACH"
  | "ANY_TIME";

export interface PrescriptionItem {
  id: string; // e.g. "PRI-1" or "RXI-1"
  prescription_id?: string;
  medicine_id?: string; // FK -> MedicineCatalogItem.id
  medicine_name: string; // Display name e.g. "Telmisartan (Telma 40)"
  generic_name?: string; // e.g. "Telmisartan"
  brand_name?: string; // e.g. "Telma 40"
  strength?: string; // e.g. "40 mg"
  strength_value?: number;
  strength_unit?: string;
  dosage: string; // e.g. "1 tablet"
  dosage_quantity?: number;
  dosage_form?: string;
  route: PrescriptionRoute; // e.g. "ORAL"
  frequency: string; // e.g. "Once daily (morning)"
  timing?: MedicineTiming; // e.g. "AFTER_FOOD"
  duration: string; // e.g. "30 days"
  duration_days?: number;
  duration_unit?: string;
  quantity?: string; // e.g. "30 tablets"
  instructions?: string; // Doctor-entered instructions
  is_prn?: boolean; // As-needed flag
  display_order?: number; // Deterministic sequence (1, 2, 3...)
  status?: "ACTIVE" | "DISCONTINUED" | "MODIFIED";
}

export interface PrescriptionVersionSnapshot {
  version: number;
  saved_at: string;
  saved_by: string;
  saved_by_name: string;
  saved_by_role: string;
  amendment_reason?: string;
  status: PrescriptionStatus;
  items: PrescriptionItem[];
  refills_allowed: number;
  refills_used: number;
  notes?: string;
}

export interface HealthcarePrescription {
  id: string; // e.g. "PRX-1001" or "RX-1001"
  prescription_reference: string; // e.g. "PRX-1001" or "RX-1001"
  patient_id: string; // FK -> patients.medora_id (PAT-1001)
  patient_name: string;
  encounter_id: string; // FK -> HealthcareEncounter (ENC-1001)
  clinical_record_id?: string; // FK -> ClinicalRecord (CR-1001)
  prescriber_id: string; // FK -> doctors.identifier (DOC-1001)
  prescriber_name: string;
  prescriber_role: string;
  organization_id: string; // FK -> organizations.identifier (HSP-1001)
  organization_name: string;
  facility_id?: string; // FK -> facilities.id (FAC-1001)
  facility_name?: string;
  department_name?: string;
  status: PrescriptionStatus;
  version?: number;
  version_history?: PrescriptionVersionSnapshot[];
  items: PrescriptionItem[];
  refills_allowed: number;
  refills_used: number;
  notes?: string;
  verification_token?: string;
  digital_signature_hash?: string;
  supersedes_prescription_id?: string;
  superseded_by_prescription_id?: string;
  void_reason?: string;
  voided_at?: string;
  voided_by?: string;
  correction_reason?: string;
  finalized_at?: string;
  finalized_by?: string;
  finalized_by_name?: string;
  issued_at?: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  amended_at?: string;
  amendment_reason?: string;
}

// ============================================================
// MEDICAL ORDER DOMAIN MODEL (PHASE C.2)
// Structured diagnostic, radiology, referral & follow-up orders.
// ============================================================

export type MedicalOrderType = "LAB" | "IMAGING" | "REFERRAL" | "FOLLOW_UP";
export type MedicalOrderStatus = "DRAFT" | "ORDERED" | "CANCELLED" | "COMPLETED";
export type MedicalOrderPriority = "ROUTINE" | "URGENT" | "STAT";

export interface ImagingOrderDetails {
  modality: "XRAY" | "MRI" | "CT" | "ULTRASOUND" | "ECG" | "ECHO" | "OTHER";
  body_part: string; // e.g. "Chest PA", "Brain", "Abdomen"
  with_contrast: boolean;
  special_instructions?: string;
}

export interface ReferralOrderDetails {
  target_specialty: string; // e.g. "Cardiology", "Neurology", "Nephrology"
  target_organization_id?: string;
  target_organization_name?: string;
  target_doctor_id?: string;
  target_doctor_name?: string;
  urgency: "ROUTINE" | "URGENT";
  referral_reason: string;
  clinical_summary?: string;
}

export interface FollowUpOrderDetails {
  timeframe: string; // e.g. "7 days", "2 weeks", "1 month"
  recommended_date?: string;
  instructions?: string;
}

export interface HealthcareMedicalOrder {
  id: string; // e.g. "ORD-1001", "IMG-1001", "REF-1001"
  order_reference: string;
  order_type: MedicalOrderType;
  patient_id: string;
  patient_name: string;
  encounter_id: string; // Mandatory link to HealthcareEncounter
  clinical_record_id?: string;
  ordering_provider_id: string;
  ordering_provider_name: string;
  ordering_provider_role: string;
  organization_id: string;
  organization_name: string;
  facility_id?: string;
  facility_name?: string;
  department_name?: string;
  priority: MedicalOrderPriority;
  status: MedicalOrderStatus;
  clinical_indication?: string;
  instructions?: string;
  
  // Specific order details
  lab_items?: LabOrderItem[];
  imaging_details?: ImagingOrderDetails;
  referral_details?: ReferralOrderDetails;
  follow_up_details?: FollowUpOrderDetails;

  ordered_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

export type ReferralPriority = "ROUTINE" | "URGENT" | "STAT";
export type ReferralStatus = "DRAFT" | "FINALIZED" | "SENT" | "ACCEPTED" | "DECLINED" | "COMPLETED" | "CANCELLED";

export interface HealthcareReferral {
  id: string; // e.g. "REF-1001"
  referral_reference: string;
  encounter_id: string; // FK -> HealthcareEncounter (ENC-1001)
  patient_id: string; // FK -> Patient (PAT-1001)
  patient_name: string;
  referring_doctor_id: string; // FK -> Doctor (DOC-1001)
  referring_doctor_name: string;
  referring_doctor_role?: string;
  source_facility_id: string;
  source_facility_name: string;
  source_organization_id: string;
  source_organization_name: string;
  
  destination_type: "SPECIALTY" | "DOCTOR" | "FACILITY" | "DEPARTMENT";
  destination_specialty_id?: string;
  destination_specialty_name?: string;
  destination_doctor_id?: string;
  destination_doctor_name?: string;
  destination_facility_id?: string;
  destination_facility_name?: string;
  destination_department_id?: string;
  destination_department_name?: string;

  priority: ReferralPriority;
  reason: string;
  notes?: string;
  status: ReferralStatus;

  finalized_at?: string;
  finalized_by?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

export type FollowUpStatus = "RECOMMENDED" | "BOOKED" | "COMPLETED" | "MISSED" | "CANCELLED";

export interface HealthcareFollowUp {
  id: string; // e.g. "FU-1001"
  followup_reference: string;
  encounter_id: string; // FK -> HealthcareEncounter (ENC-1001)
  patient_id: string; // FK -> Patient (PAT-1001)
  patient_name: string;
  doctor_id: string; // FK -> Doctor (DOC-1001)
  doctor_name: string;
  facility_id: string;
  facility_name: string;
  organization_id: string;
  organization_name: string;

  timeframe_type: "DAYS" | "WEEKS" | "MONTHS" | "SPECIFIC_DATE";
  timeframe_value: number | string;
  timeframe_display: string; // e.g. "Follow up in 7 days"
  recommended_date?: string;

  reason: string; // e.g. "Review lab test results"
  instructions?: string;

  preferred_doctor_id?: string;
  preferred_doctor_name?: string;
  preferred_facility_id?: string;
  preferred_facility_name?: string;

  status: FollowUpStatus;
  appointment_id?: string; // Linked Phase 6 appointment ID when booked

  created_at: string;
  updated_at: string;
}

// ============================================================
// CONNECTED LABORATORY DOMAIN MODEL (PHASE C.3)
// Order -> Sample -> Result -> Report Workflow
// ============================================================

export type LabOrderPriority = "ROUTINE" | "URGENT" | "STAT";

export type LabOrderStatus =
  | "DRAFT"
  | "FINALIZED"
  | "ORDERED"
  | "ACCEPTED"
  | "SAMPLE_PENDING"
  | "SAMPLE_COLLECTED"
  | "SAMPLE_RECEIVED"
  | "PROCESSING"
  | "RESULT_PENDING"
  | "VERIFICATION_PENDING"
  | "REPORT_READY"
  | "RELEASED"
  | "CANCELLED"
  | "REJECTED";

export type SampleType =
  | "WHOLE_BLOOD"
  | "SERUM"
  | "PLASMA"
  | "URINE"
  | "SWAB"
  | "STOOL"
  | "CSF"
  | "OTHER";

export type SampleStatus =
  | "PENDING"
  | "COLLECTED"
  | "RECEIVED"
  | "SAMPLE_RECEIVED"
  | "PROCESSING"
  | "READY_FOR_TESTING"
  | "CONSUMED"
  | "REJECTED";

export type SampleRejectionReason =
  | "INSUFFICIENT_VOLUME"
  | "INSUFFICIENT_SAMPLE"
  | "HEMOLYZED"
  | "CLOTTED"
  | "WRONG_CONTAINER"
  | "CONTAINER_DAMAGED"
  | "DAMAGED_SAMPLE"
  | "EXPIRED_WINDOW"
  | "IMPROPER_COLLECTION"
  | "LABELING_ISSUE"
  | "QUALITY_ISSUE"
  | "OTHER";

export interface LabTestParameter {
  id: string; // e.g. "param-hb"
  name: string; // e.g. "Hemoglobin"
  data_type: "NUMERIC" | "TEXT" | "QUALITATIVE";
  default_unit?: string; // e.g. "g/dL"
  reference_range?: {
    low?: number;
    high?: number;
    text?: string; // e.g. "13.0 - 17.0 g/dL" or "Negative"
  };
  options?: string[]; // e.g. ["Negative", "Positive", "Reactive", "Non-reactive"]
}

export interface LabTestCatalogItem {
  id: string; // e.g. "TEST-CBC-001"
  test_code: string; // e.g. "CBC-01"
  test_name: string; // e.g. "Complete Blood Count (CBC) with Differential"
  category: "HEMATOLOGY" | "BIOCHEMISTRY" | "CLINICAL_PATHOLOGY" | "SEROLOGY" | "MICROBIOLOGY" | "ENDOCRINOLOGY";
  sample_type: SampleType;
  turnaround_hours: number;
  instructions?: string;
  parameters: LabTestParameter[];
}

export interface LabOrderItem {
  id: string; // e.g. "LOI-1"
  test_id?: string; // FK -> LabTestCatalogItem.id (TEST-CBC-001)
  test_name: string; // e.g. "Complete Blood Count (CBC) with Differential"
  test_code?: string; // e.g. "CBC-01"
  specimen_type?: SampleType | string; // e.g. "WHOLE_BLOOD"
  instructions?: string; // e.g. "Standard venipuncture"
  status?: LabOrderStatus;
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
  facility_id?: string;
  facility_name?: string;
  department_name?: string;
  laboratory_id?: string; // Optional assigned lab (preserving patient choice)
  laboratory_name?: string;
  priority: LabOrderPriority;
  reason: string; // e.g. "Baseline cardiovascular risk evaluation"
  instructions?: string; // e.g. "12-hour overnight fasting required"
  status: LabOrderStatus;
  items: LabOrderItem[];
  ordered_at?: string;
  accepted_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

export interface HealthcareLabSample {
  id: string; // e.g. "SMP-1001"
  sample_barcode: string; // e.g. "SMP-1001"
  lab_order_id: string; // FK -> HealthcareLabOrder.id (LAB-ORD-1001)
  patient_id: string; // FK -> patients.medora_id (PAT-1001)
  patient_name: string;
  laboratory_id: string; // FK -> organizations.identifier (LAB-1001)
  laboratory_name: string;
  sample_type: SampleType;
  status: SampleStatus;
  
  // Supported test item IDs for this sample (e.g. ['LOI-1', 'LOI-2'])
  test_item_ids: string[];
  test_names: string[];

  collected_at?: string;
  collected_by_id?: string;
  collected_by_name?: string;
  
  received_at?: string;
  received_by_id?: string;
  received_by_name?: string;

  rejected_at?: string;
  rejected_by_id?: string;
  rejected_by_name?: string;
  rejection_reason?: SampleRejectionReason;
  rejection_notes?: string;

  is_recollection?: boolean;
  previous_sample_id?: string;

  created_at: string;
  updated_at: string;
}

export type TestResultType = "NUMERIC" | "TEXT" | "QUALITATIVE" | "BOOLEAN";
export type ResultAbnormalFlag = "NORMAL" | "HIGH" | "LOW" | "CRITICAL" | "ABNORMAL";
export type TestResultStatus = "ENTERED" | "CORRECTION_PENDING" | "VERIFIED" | "AMENDED";

export interface TestResultVersionSnapshot {
  version: number;
  saved_at: string;
  saved_by_id: string;
  saved_by_name: string;
  value: string;
  flag: ResultAbnormalFlag;
  amendment_reason?: string;
}

export interface HealthcareTestResult {
  id: string; // e.g. "RES-1001"
  lab_order_id: string; // FK -> HealthcareLabOrder.id
  lab_order_item_id: string; // FK -> LabOrderItem.id
  sample_id: string; // FK -> HealthcareLabSample.id
  patient_id: string;
  test_id: string; // e.g. "TEST-CBC-001"
  test_name: string; // e.g. "Complete Blood Count"
  parameter_id: string; // e.g. "param-hb"
  parameter_name: string; // e.g. "Hemoglobin"
  result_type: TestResultType;
  value: string; // e.g. "14.2"
  numeric_value?: number;
  unit?: string; // e.g. "g/dL"
  reference_range?: string; // e.g. "13.0 - 17.0"
  flag: ResultAbnormalFlag;
  status: TestResultStatus;
  
  entered_by_id: string;
  entered_by_name: string;
  entered_at: string;

  verified_by_id?: string;
  verified_by_name?: string;
  verified_at?: string;

  version: number;
  version_history?: TestResultVersionSnapshot[];
  amendment_reason?: string;
}

export type LabReportStatus = "DRAFT" | "READY" | "RELEASED" | "AMENDED" | "CANCELLED";

export interface LabReportVersionSnapshot {
  version: number;
  saved_at: string;
  saved_by_id: string;
  saved_by_name: string;
  results: HealthcareTestResult[];
  amendment_reason?: string;
}

export interface HealthcareLabReport {
  id: string; // e.g. "RPT-1001"
  report_reference: string;
  lab_order_id: string; // FK -> HealthcareLabOrder.id (LAB-ORD-1001)
  patient_id: string; // FK -> patients.medora_id (PAT-1001)
  patient_name: string;
  encounter_id: string; // FK -> HealthcareEncounter.id (ENC-1001)
  ordering_provider_id: string; // FK -> doctors.identifier (DOC-1001)
  ordering_provider_name: string;
  ordering_provider_role: string;
  laboratory_id: string; // FK -> organizations.identifier (LAB-1001)
  laboratory_name: string;
  status: LabReportStatus;
  version: number;
  version_history?: LabReportVersionSnapshot[];
  
  sample_ids: string[];
  results: HealthcareTestResult[];
  notes?: string;

  generated_at?: string;
  verified_by_id?: string;
  verified_by_name?: string;
  verified_at?: string;

  released_at?: string;
  released_by_id?: string;
  released_by_name?: string;

  source_type: "MEDORA_CONNECTED_LAB" | "EXTERNAL_UPLOAD";
  amendment_reason?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// PHASE 8.1 & 8.2: CONNECTED LABORATORY ECOSYSTEM TYPES
// ============================================================

export type LaboratoryFacilityStatus = "ACTIVE" | "INACTIVE" | "TEMPORARILY_UNAVAILABLE";
export type LaboratoryStaffRole = "LAB_ADMIN" | "LAB_MANAGER" | "LAB_RECEPTION" | "LAB_TECHNICIAN" | "LAB_VERIFIER";
export type LaboratoryStaffStatus = "INVITED" | "ACTIVE" | "SUSPENDED" | "REMOVED";
export type CapabilityStatus = "AVAILABLE" | "TEMPORARILY_UNAVAILABLE" | "NOT_SUPPORTED";

export interface LaboratoryOrganization {
  id: string; // e.g. "LAB-ORG-1001"
  organization_identifier: string; // e.g. "LAB-ORG-1001"
  name: string; // e.g. "ABC Diagnostics"
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  contact_phone: string;
  contact_email: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface LaboratoryFacility {
  id: string; // e.g. "LAB-FAC-1001"
  organization_id: string; // FK -> LaboratoryOrganization.id
  organization_name: string;
  facility_identifier: string; // e.g. "LAB-FAC-1001"
  name: string; // e.g. "Rourkela Central Lab"
  address: string;
  contact_phone: string;
  operating_hours: string;
  status: LaboratoryFacilityStatus;
  verification_status: "NOT_VERIFIED" | "VERIFIED";
  created_at: string;
  updated_at: string;
}

export interface LaboratoryStaffMembership {
  id: string; // e.g. "LAB-STAFF-1001"
  user_id: string; // FK -> StoredIdentity.id / USR-xxxx
  user_name: string;
  user_email: string;
  organization_id: string; // FK -> LaboratoryOrganization.id
  organization_name: string;
  facility_ids: string[]; // FKs -> LaboratoryFacility.id
  role: LaboratoryStaffRole;
  status: LaboratoryStaffStatus;
  invited_at?: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LabTestMaster {
  id: string; // e.g. "TEST-CBC-001"
  code: string; // e.g. "CBC-01"
  name: string; // e.g. "Complete Blood Count (CBC)"
  category: string; // e.g. "Hematology"
  specimen_type: SampleType;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  created_at: string;
  updated_at: string;
}

export interface LaboratoryCapability {
  id: string; // e.g. "CAP-1001"
  facility_id: string; // FK -> LaboratoryFacility.id
  facility_name: string;
  test_id: string; // FK -> LabTestMaster.id
  test_name: string;
  status: CapabilityStatus;
  processing_mode: "IN_HOUSE" | "REFERRED";
  unavailability_reason?: string;
  updated_at: string;
}

export type CustodyEventType =
  | "SAMPLE_CREATED"
  | "SAMPLE_COLLECTED"
  | "SAMPLE_LABELED"
  | "SAMPLE_RECEIVED"
  | "SAMPLE_TRANSFERRED"
  | "SAMPLE_ACCEPTED_FOR_TESTING"
  | "SAMPLE_REJECTED"
  | "SAMPLE_RECOLLECTION_REQUIRED"
  | "SAMPLE_READY_FOR_TESTING";

export interface SampleCustodyEvent {
  id: string; // e.g. "CUST-1001"
  sample_id: string; // FK -> HealthcareLabSample.id
  lab_order_id: string; // FK -> HealthcareLabOrder.id
  event_type: CustodyEventType;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  source_location?: string;
  destination_location?: string;
  notes?: string;
  timestamp: string;
}

export interface PatientVerificationRecord {
  id: string; // e.g. "PVR-1001"
  patient_id: string;
  patient_name: string;
  order_id: string;
  verified_by_id: string;
  verified_by_name: string;
  verification_methods: string[]; // e.g. ["MEDORA_ID", "DATE_OF_BIRTH"]
  status: "VERIFIED" | "FAILED" | "UNABLE_TO_VERIFY";
  verified_at: string;
}

// ============================================================
// PHASE 8.3 & 8.4: TESTING, VERIFICATION, REPORT & AUTHENTICITY TYPES
// ============================================================

export type LabTestWorkStatus =
  | "PENDING"
  | "QUEUED"
  | "IN_PROGRESS"
  | "RESULT_ENTERED"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "RETURNED_FOR_CORRECTION"
  | "REJECTED"
  | "CANCELLED";

export interface LabTestWorkItem {
  id: string; // e.g. "TEST-WORK-1001"
  lab_order_id: string; // FK -> HealthcareLabOrder.id
  lab_order_item_id: string; // FK -> LabOrderItem.id
  sample_id: string; // FK -> HealthcareLabSample.id
  patient_id: string;
  patient_name: string;
  test_id: string; // e.g. "TEST-CBC-001"
  test_code?: string;
  test_name: string;
  specimen_type: SampleType;
  facility_id: string;
  facility_name: string;
  priority: LabOrderPriority;
  status: LabTestWorkStatus;
  
  assigned_to_id?: string;
  assigned_to_name?: string;
  assigned_at?: string;

  started_at?: string;
  started_by_id?: string;
  started_by_name?: string;

  completed_at?: string;
  instrument_name?: string;
  method?: string;

  return_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface LabReportVerificationToken {
  id: string; // e.g. "RPT-TOK-1001"
  report_id: string; // FK -> HealthcareLabReport.id
  report_version: number;
  verification_token: string; // e.g. "RPT-VERIFY-8F92X"
  status: "ACTIVE" | "SUPERSEDED" | "CANCELLED";
  created_at: string;
}

export interface LabReportShare {
  id: string; // e.g. "RPT-SHARE-1001"
  report_id: string;
  report_version: number;
  owner_id: string; // PAT-1001
  owner_name: string;
  recipient_id: string; // DOC-1001 or USR-xxxx
  recipient_name: string;
  permission: "VIEW" | "DOWNLOAD";
  expires_at: string;
  revoked_at?: string;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  created_at: string;
}

// ============================================================
// PHASE 9.1 & 9.2: CONNECTED PHARMACY, INTAKE & INVENTORY TYPES
// ============================================================

export type PharmacyType = "INDEPENDENT_PHARMACY" | "PHARMACY_CHAIN" | "HOSPITAL_PHARMACY" | "CLINIC_PHARMACY";
export type PharmacyOrganizationStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "INACTIVE";
export type PharmacyFacilityStatus = "ACTIVE" | "TEMPORARILY_CLOSED" | "SUSPENDED" | "INACTIVE";
export type PharmacyConnectivityStatus = "NOT_CONNECTED" | "PENDING" | "CONNECTED" | "SUSPENDED" | "DISCONNECTED";
export type PharmacyStaffRole = "PHARMACY_ADMIN" | "PHARMACIST" | "PHARMACY_RECEPTION" | "INVENTORY_MANAGER";

export interface PharmacyOrganization {
  id: string; // e.g. "PHARM-ORG-1001"
  name: string;
  legal_name?: string;
  pharmacy_type: PharmacyType;
  status: PharmacyOrganizationStatus;
  connectivity_status: PharmacyConnectivityStatus;
  contact_phone?: string;
  contact_email?: string;
  created_at: string;
  updated_at: string;
}

export interface PharmacyFacility {
  id: string; // e.g. "PHARM-FAC-1001"
  organization_id: string; // FK -> PharmacyOrganization.id
  organization_name: string;
  name: string; // e.g. "ABC Pharmacy — Rourkela Central"
  address: string;
  city: string;
  state: string;
  pincode?: string;
  phone?: string;
  operational_status: PharmacyFacilityStatus;
  pickup_available: boolean;
  delivery_available: boolean;
  is_demo?: boolean;
  created_at: string;
  updated_at: string;
}

export interface PharmacyStaffMembership {
  id: string; // e.g. "PHARM-MEM-1001"
  user_id: string; // FK -> user identifier
  user_name: string;
  user_email?: string;
  organization_id: string;
  facility_id: string; // FK -> PharmacyFacility.id
  role: PharmacyStaffRole;
  status: "ACTIVE" | "SUSPENDED" | "REVOKED";
  created_at: string;
  updated_at: string;
}



export type PharmacyIntakeStatus =
  | "RECEIVED"
  | "UNDER_REVIEW"
  | "VALID"
  | "INVALID"
  | "REQUIRES_CLARIFICATION"
  | "CANCELLED";

export interface PharmacyPrescriptionIntake {
  id: string; // e.g. "PHARM-INTAKE-1001"
  prescription_id: string; // FK -> HealthcarePrescription.id (RX-1001)
  prescription_version: number;
  patient_id: string;
  patient_name: string;
  prescriber_id: string;
  prescriber_name: string;
  pharmacy_organization_id: string;
  facility_id: string; // FK -> PharmacyFacility.id
  status: PharmacyIntakeStatus;
  received_at: string;
  received_by_id?: string;
  received_by_name?: string;
  validated_at?: string;
  validated_by_id?: string;
  validated_by_name?: string;
  rejection_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type ClarificationStatus = "OPEN" | "RESPONDED" | "CLOSED" | "CANCELLED";

export interface PrescriptionClarificationRequest {
  id: string; // e.g. "CLAR-1001"
  prescription_id: string;
  pharmacy_intake_id: string;
  requested_by_id: string;
  requested_by_name: string;
  pharmacy_facility_id: string;
  recipient_doctor_id: string;
  reason: string;
  response?: string;
  status: ClarificationStatus;
  created_at: string;
  resolved_at?: string;
}

export type InventoryItemStatus = "AVAILABLE" | "LOW_STOCK" | "OUT_OF_STOCK" | "BLOCKED" | "QUARANTINED";
export type StockBatchStatus = "ACTIVE" | "NEAR_EXPIRY" | "EXPIRED" | "QUARANTINED";
export type StockReservationStatus = "ACTIVE" | "RELEASED" | "EXPIRED" | "CONSUMED" | "CANCELLED";
export type StockMovementType =
  | "RECEIVED"
  | "RESERVED"
  | "RELEASED"
  | "DISPENSED"
  | "RETURNED"
  | "ADJUSTED"
  | "QUARANTINED"
  | "EXPIRED";

export interface PharmacyInventoryItem {
  id: string; // e.g. "PHARM-INV-1001"
  facility_id: string; // FK -> PharmacyFacility.id
  medicine_id: string; // FK -> MedicineCatalogItem.id
  medicine_name: string;
  generic_name: string;
  strength: string;
  dosage_form: string;
  total_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  reorder_threshold: number;
  status: InventoryItemStatus;
  is_supported: boolean;
  unit_price: number;
  created_at: string;
  updated_at: string;
}

export interface PharmacyInventoryBatch {
  id: string; // e.g. "BATCH-1001"
  inventory_id: string; // FK -> PharmacyInventoryItem.id
  facility_id: string;
  medicine_id: string;
  batch_number: string; // e.g. "B-2026-08A"
  manufacturing_date?: string;
  expiry_date: string; // e.g. "2027-06-30"
  quantity: number;
  reserved_quantity: number;
  status: StockBatchStatus;
  created_at: string;
  updated_at: string;
}

export interface PharmacyStockMovement {
  id: string; // e.g. "STOCK-MOV-1001"
  facility_id: string;
  medicine_id: string;
  batch_id?: string;
  movement_type: StockMovementType;
  quantity: number;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  reason?: string;
  reference_id?: string;
  created_at: string;
}

export interface PharmacyStockReservation {
  id: string; // e.g. "RES-1001"
  prescription_id: string;
  facility_id: string;
  medicine_id: string;
  medicine_name: string;
  batch_id?: string;
  batch_number?: string;
  quantity: number;
  patient_id: string;
  status: StockReservationStatus;
  expires_at: string;
  released_at?: string;
  consumed_at?: string;
  created_at: string;
}

export type PharmacyAvailabilityStatus = "FULLY_AVAILABLE" | "PARTIALLY_AVAILABLE" | "UNAVAILABLE";

export interface PharmacyItemAvailability {
  medicine_id: string;
  medicine_name: string;
  required_quantity: number;
  available_quantity: number;
  shortage_quantity: number;
  is_supported: boolean;
  status: "AVAILABLE" | "PARTIAL" | "OUT_OF_STOCK" | "NOT_SUPPORTED";
  unit_price: number;
  subtotal: number;
  suggested_batch_id?: string;
  suggested_batch_number?: string;
}

export interface PharmacyAvailabilityResult {
  facility_id: string;
  facility_name: string;
  organization_name: string;
  distance_km?: number;
  pickup_available: boolean;
  delivery_available: boolean;
  overall_status: PharmacyAvailabilityStatus;
  total_items_requested: number;
  total_items_fully_available: number;
  items: PharmacyItemAvailability[];
  estimated_subtotal: number;
}

// ============================================================
// PHASE 9.3 & 9.4: PHARMACY ORDER, DISPENSING & TRANSPARENCY TYPES
// ============================================================

export type PharmacyOrderStatus =
  | "CREATED"
  | "CONFIRMED"
  | "UNDER_REVIEW"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "READY_FOR_DISPATCH"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "DISPENSED"
  | "PARTIALLY_DISPENSED"
  | "UNABLE_TO_FULFILL"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURNED"
  | "REVERSED";

export type PharmacyFulfillmentType = "PICKUP" | "DELIVERY";
export type DispensingStatus = "DISPENSED" | "PARTIALLY_DISPENSED" | "REVERSED" | "RETURNED";

export interface PharmacyOrderItem {
  id: string; // e.g. "ORD-ITEM-1001"
  order_id: string; // FK -> PharmacyOrder.id
  prescription_item_id?: string;
  medicine_id: string;
  medicine_name: string;
  generic_name: string;
  strength: string;
  dosage_form: string;
  reservation_id?: string;
  batch_id?: string;
  batch_number?: string;
  quantity_requested: number;
  quantity_reserved: number;
  quantity_prepared: number;
  quantity_dispensed: number;
  unit_price: number;
  subtotal: number;
  status: "PENDING" | "PREPARED" | "DISPENSED" | "SHORTAGE" | "CANCELLED";
}

export interface PharmacyOrder {
  id: string; // e.g. "PHARM-ORD-1001"
  prescription_id: string; // FK -> HealthcarePrescription.id (RX-1001)
  pharmacy_intake_id: string; // FK -> PharmacyPrescriptionIntake.id
  patient_id: string;
  patient_name: string;
  prescriber_id: string;
  prescriber_name: string;
  pharmacy_organization_id: string;
  facility_id: string; // FK -> PharmacyFacility.id
  facility_name: string;
  fulfillment_type: PharmacyFulfillmentType;
  delivery_address?: string;
  status: PharmacyOrderStatus;
  items: PharmacyOrderItem[];
  total_items: number;
  total_amount: number;
  verification_otp?: string; // Demo verification code
  notes?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface PharmacyPreparationRecord {
  id: string; // e.g. "PREP-1001"
  order_id: string;
  prepared_by_id: string;
  prepared_by_name: string;
  started_at: string;
  completed_at: string;
  items_prepared: {
    medicine_id: string;
    batch_id: string;
    batch_number: string;
    quantity: number;
  }[];
  status: "COMPLETED" | "CANCELLED";
}

export interface PharmacyHandoverRecord {
  id: string; // e.g. "HANDOVER-1001"
  order_id: string;
  patient_id: string;
  verified_by_id: string;
  verified_by_name: string;
  verification_method: "MEDORA_ID_OTP" | "DELEGATED_REPRESENTATIVE";
  handover_at: string;
  recipient_name: string;
  recipient_relation: "SELF" | "FAMILY_MEMBER" | "AUTHORIZED_REPRESENTATIVE";
}

export interface PharmacyDeliveryRecord {
  id: string; // e.g. "DELIV-1001"
  order_id: string;
  courier_name: string; // e.g. "MEDORA Express Dispatch (Demo)"
  tracking_number: string;
  delivery_status: "READY_FOR_DISPATCH" | "OUT_FOR_DELIVERY" | "DELIVERED" | "DELIVERY_FAILED" | "RETURNED";
  address_reference: string;
  dispatched_at?: string;
  delivered_at?: string;
  failure_reason?: string;
  updated_at: string;
}

export interface DispensingItem {
  id: string; // e.g. "DISP-ITEM-1001"
  dispensing_id: string; // FK -> DispensingRecord.id
  order_item_id: string;
  medicine_id: string;
  medicine_name: string;
  batch_id?: string;
  batch_number?: string;
  quantity_prescribed: number;
  quantity_dispensed: number;
  quantity_remaining: number;
  unit_price: number;
  subtotal: number;
}

export interface DispensingRecord {
  id: string; // e.g. "DISP-1001"
  order_id: string; // FK -> PharmacyOrder.id
  prescription_id: string;
  patient_id: string;
  patient_name: string;
  facility_id: string;
  facility_name: string;
  pharmacist_id: string;
  pharmacist_name: string;
  dispensed_at: string;
  status: DispensingStatus;
  verification_method: string;
  items: DispensingItem[];
  total_dispensed_amount: number;
  is_partial: boolean;
  partial_reason?: string;
  created_at: string;
}

export interface PharmacyReturnRecord {
  id: string; // e.g. "RET-1001"
  dispensing_id: string;
  order_id: string;
  requested_by_id: string;
  requested_by_name: string;
  reason: string;
  status: "RETURN_REQUESTED" | "PENDING_INSPECTION" | "RETURN_CONFIRMED" | "REJECTED";
  created_at: string;
  resolved_at?: string;
}

export interface PharmacyReversalRecord {
  id: string; // e.g. "REV-1001"
  dispensing_id: string;
  order_id: string;
  authorized_by_id: string;
  authorized_by_name: string;
  reason: string;
  created_at: string;
}

export interface PatientNotification {
  id: string; // e.g. "NOTIF-1001"
  user_id: string; // PAT-1001
  event_type: string;
  title: string;
  message: string;
  priority: "INFO" | "IMPORTANT" | "ACTION_REQUIRED" | "CRITICAL";
  reference_type: "PHARMACY_ORDER" | "PRESCRIPTION" | "LAB_REPORT" | "APPOINTMENT";
  reference_id: string;
  read_at?: string;
  created_at: string;
}

export interface PharmacyTimelineEvent {
  id: string; // e.g. "PHARM-TL-1001"
  order_id: string;
  patient_id: string;
  event_type: string;
  display_title: string;
  description: string;
  occurred_at: string;
  actor_type: "PATIENT" | "PHARMACIST" | "SYSTEM" | "COURIER";
  actor_name?: string;
  metadata?: Record<string, any>;
}

// ============================================================
// PHASE 10.1 & 10.2: ITEMIZED BILLING & FINANCIAL COVERAGE TYPES
// ============================================================

export type ServiceCategory =
  | "CONSULTATION"
  | "LABORATORY"
  | "IMAGING"
  | "PROCEDURE"
  | "ROOM"
  | "PHARMACY"
  | "NURSING"
  | "OTHER";

export type BillType = "ESTIMATE" | "INTERIM" | "FINAL";
export type BillStatus = "DRAFT" | "PENDING_REVIEW" | "ISSUED" | "ADJUSTMENT_PENDING" | "DISPUTED" | "CANCELLED";
export type BillItemVerificationStatus = "VERIFIED" | "PENDING_VERIFICATION" | "BILLING_EXCEPTION";
export type AllocationSourceType = "INSURANCE" | "GOVERNMENT_ASSISTANCE" | "HOSPITAL_ASSISTANCE" | "CHARITY" | "FINANCING";
export type AllocationStatus = "REQUESTED" | "PENDING" | "APPROVED" | "PARTIALLY_APPROVED" | "ALLOCATED" | "SETTLEMENT_PENDING" | "SETTLED" | "REJECTED" | "CANCELLED";

export interface ServiceCatalogItem {
  id: string; // e.g. "SERV-1001"
  service_code: string; // e.g. "CONS-001"
  name: string;
  category: ServiceCategory;
  description: string;
  organization_id: string;
  facility_id?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServicePrice {
  id: string; // e.g. "PRICE-1001"
  service_id: string;
  organization_id: string;
  facility_id?: string;
  unit_price: number;
  currency: string; // default "INR"
  effective_from: string;
  effective_to?: string;
  status: "ACTIVE" | "SUPERSEDED" | "INACTIVE";
  created_at: string;
}

export interface BillableItem {
  id: string; // e.g. "BILLITEM-1001"
  bill_id: string; // FK -> HealthcareBill.id
  service_id: string; // FK -> ServiceCatalogItem.id
  service_code: string;
  service_name: string;
  category: ServiceCategory;
  source_type: "ENCOUNTER" | "LAB_TEST" | "IMAGING" | "PROCEDURE" | "DISPENSING" | "ADMISSION" | "MANUAL_ENTRY";
  source_id: string; // FK -> ENC-1001, LAB-TEST-1001, etc.
  description_snapshot: string;
  quantity: number;
  unit_price: number;
  base_amount: number;
  currency: string;
  price_id: string; // FK -> ServicePrice.id
  service_date: string;
  verification_status: BillItemVerificationStatus;
  verification_notes?: string;
  // Provenance Details for "Why Was I Charged?"
  provenance?: {
    ordered_by_id?: string;
    ordered_by_name?: string;
    order_reference_id?: string;
    performed_at?: string;
    facility_name?: string;
    report_reference_id?: string;
    clinical_reason?: string;
  };
  created_at: string;
}

export interface HealthcareBill {
  id: string; // e.g. "BILL-1001"
  bill_number: string; // e.g. "MEDORA-INV-1001"
  patient_id: string;
  patient_name: string;
  organization_id: string;
  organization_name: string;
  facility_id: string;
  facility_name: string;
  encounter_id?: string;
  admission_id?: string;
  bill_type: BillType;
  estimate_range_min?: number;
  estimate_range_max?: number;
  status: BillStatus;
  gross_total: number;
  net_billable_total: number;
  patient_responsibility: number;
  currency: string;
  current_version: number;
  items: BillableItem[];
  cancellation_reason?: string;
  issued_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BillVersionItem {
  id: string;
  source_bill_item_id: string;
  description_snapshot: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface BillVersion {
  id: string; // e.g. "BILL-VER-1001-V2"
  bill_id: string;
  version_number: number;
  previous_version_id?: string;
  gross_total: number;
  change_delta: number;
  reason: string;
  created_by_id: string;
  created_by_name: string;
  authorized_by_id: string;
  authorized_by_name: string;
  items: BillVersionItem[];
  created_at: string;
}

export interface DiscountAllocation {
  id: string; // e.g. "DISC-1001"
  bill_id: string;
  bill_item_id?: string;
  discount_type: "HOSPITAL_DISCOUNT" | "PROMOTIONAL_DISCOUNT" | "CONTRACTUAL_DISCOUNT" | "APPROVED_DISCOUNT";
  amount: number;
  reason: string;
  authorized_by_id: string;
  authorized_by_name: string;
  created_at: string;
}

export interface CoverageAllocation {
  id: string; // e.g. "COVERAGE-1001"
  bill_id: string;
  bill_item_id?: string;
  policy_id: string;
  policy_number: string;
  provider_name: string;
  requested_amount: number;
  eligible_amount: number;
  approved_amount: number;
  allocated_amount: number;
  received_amount: number;
  deductible_amount: number;
  copay_amount: number;
  status: AllocationStatus;
  exclusion_reason?: string;
  preauth_reference?: string;
  created_at: string;
  updated_at: string;
}

export interface AssistanceAllocation {
  id: string; // e.g. "GOVT-1001" or "HOSP-ASSIST-1001"
  bill_id: string;
  bill_item_id?: string;
  source_type: "GOVERNMENT_ASSISTANCE" | "HOSPITAL_ASSISTANCE" | "CHARITY";
  program_name: string; // e.g. "BSKY Scheme", "Hospital Hardship Fund", "Rotary Care Charity"
  program_id: string;
  requested_amount: number;
  approved_amount: number;
  allocated_amount: number;
  settled_amount: number;
  status: AllocationStatus;
  reason: string;
  authorized_by_id?: string;
  authorized_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancingAllocation {
  id: string; // e.g. "FIN-1001"
  bill_id: string;
  partner_name: string; // e.g. "MEDORA CarePay Micro-Financing"
  requested_amount: number;
  approved_amount: number;
  disbursed_amount: number;
  status: "APPLICATION_STARTED" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "DISBURSED" | "CANCELLED";
  repayment_reference?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialWaterfallSummary {
  bill_id: string;
  gross_charges: number;
  discounts_total: number;
  net_billable_total: number;
  insurance_approved_total: number;
  insurance_received_total: number;
  insurance_pending_total: number;
  govt_assistance_approved_total: number;
  govt_assistance_settled_total: number;
  hospital_assistance_total: number;
  charity_assistance_total: number;
  financing_approved_total: number;
  financing_disbursed_total: number;
  projected_patient_responsibility: number;
  confirmed_patient_responsibility: number;
  breakdown: {
    insurance: CoverageAllocation[];
    assistance: AssistanceAllocation[];
    financing: FinancingAllocation[];
    discounts: DiscountAllocation[];
  };
}

// ============================================================
// PHASE 10.3 & 10.4: PAYMENTS, RECONCILIATION, DISPUTES & ANOMALIES
// ============================================================

export type PaymentMethod = "UPI" | "CARD" | "NET_BANKING" | "BANK_TRANSFER" | "CASH" | "CHEQUE" | "OTHER";
export type PaymentStatus = "INITIATED" | "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "REVERSED" | "REFUNDED" | "PARTIALLY_REFUNDED";
export type SettlementStatus = "PENDING" | "SETTLED" | "FAILED" | "REVERSED" | "PARTIALLY_SETTLED";
export type RefundStatus = "REQUESTED" | "PENDING_APPROVAL" | "APPROVED" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type ReconciliationStatus = "DRAFT" | "RUNNING" | "COMPLETED" | "COMPLETED_WITH_EXCEPTIONS" | "FAILED" | "REVIEWED" | "CLOSED" | "REOPENED";
export type ExceptionCategory = "AMOUNT_MISMATCH" | "MISSING_PAYMENT" | "MISSING_SETTLEMENT" | "DUPLICATE_PAYMENT" | "UNAPPLIED_PAYMENT" | "TIMING_DIFFERENCE" | "BANK_MISMATCH";

export type DisputeCategory =
  | "UNRECOGNIZED_CHARGE"
  | "DUPLICATE_CHARGE"
  | "INCORRECT_AMOUNT"
  | "SERVICE_NOT_RECEIVED"
  | "MEDICINE_NOT_RECEIVED"
  | "PAYMENT_NOT_RECORDED"
  | "REFUND_NOT_RECEIVED"
  | "INSURANCE_COVERAGE_DISPUTE"
  | "OTHER";

export type DisputeStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "RECEIVED"
  | "UNDER_REVIEW"
  | "WAITING_FOR_INFORMATION"
  | "EVIDENCE_COLLECTED"
  | "RESOLVED"
  | "REJECTED"
  | "ESCALATED"
  | "CLOSED";

export type AnomalySeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface PaymentIntent {
  id: string; // e.g. "PAYINTENT-1001"
  bill_id: string;
  patient_id: string;
  amount: number;
  currency: string;
  status: "CREATED" | "PROCESSING" | "COMPLETED" | "FAILED" | "EXPIRED";
  idempotency_key: string;
  created_at: string;
}

export interface PaymentAttempt {
  id: string; // e.g. "PAYATTEMPT-1001-1"
  payment_intent_id: string;
  attempt_number: number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  failure_reason?: string;
  created_at: string;
}

export interface PaymentRecord {
  id: string; // e.g. "PAY-1001"
  payment_intent_id: string;
  bill_id: string;
  patient_id: string;
  patient_name: string;
  organization_id: string;
  facility_id: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  settlement_status: SettlementStatus;
  receipt_number: string; // e.g. "REC-1001"
  transaction_reference: string;
  provider_reference?: string;
  cash_collector_id?: string;
  cash_collector_name?: string;
  cheque_bank_name?: string;
  cheque_status?: "RECEIVED" | "PENDING_CLEARANCE" | "CLEARED" | "BOUNCED";
  initiated_at: string;
  completed_at?: string;
  settled_at?: string;
  actor_id: string;
  actor_name: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentAllocation {
  id: string; // e.g. "PAYALLOC-1001"
  payment_id: string;
  bill_id: string;
  bill_item_id?: string;
  allocated_amount: number;
  source_type: "PATIENT" | "INSURANCE" | "GOVERNMENT" | "HOSPITAL" | "CHARITY" | "FINANCING";
  created_at: string;
}

export interface RefundRecord {
  id: string; // e.g. "REFUND-1001"
  payment_id: string;
  bill_id: string;
  patient_id: string;
  amount: number;
  currency: string;
  reason: string;
  status: RefundStatus;
  requested_by_id: string;
  requested_by_name: string;
  approved_by_id?: string;
  approved_by_name?: string;
  receipt_number?: string; // e.g. "REF-REC-1001"
  provider_reference?: string;
  created_at: string;
  completed_at?: string;
}

export interface UnappliedPayment {
  id: string; // e.g. "UNAPPLIED-1001"
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  reference: string;
  source_name: string;
  status: "UNMATCHED" | "UNDER_REVIEW" | "MATCHED" | "REFUNDED";
  matched_bill_id?: string;
  matched_patient_id?: string;
  received_at: string;
  created_at: string;
}

export interface ReconciliationRun {
  id: string; // e.g. "RECON-2026-08-21-001"
  run_number: string;
  organization_id: string;
  facility_id: string;
  period_start: string;
  period_end: string;
  status: ReconciliationStatus;
  matched_total: number;
  exception_total: number;
  performed_by_id: string;
  performed_by_name: string;
  reviewed_by_id?: string;
  reviewed_by_name?: string;
  started_at: string;
  completed_at?: string;
}

export interface FinancialException {
  id: string; // e.g. "EXC-1001"
  reconciliation_id: string;
  category: ExceptionCategory;
  amount_mismatch: number;
  explanation: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED" | "CLOSED";
  assigned_to_name?: string;
  resolution_notes?: string;
  resolved_by_id?: string;
  resolved_by_name?: string;
  created_at: string;
  resolved_at?: string;
}

export interface EvidenceNode {
  id: string; // e.g. "EVID-1001"
  source_type: "APPOINTMENT" | "ENCOUNTER" | "LAB_ORDER" | "LAB_REPORT" | "PRESCRIPTION" | "DISPENSING" | "BILL" | "BILL_ITEM" | "PAYMENT" | "AUDIT_EVENT";
  source_id: string;
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface FinancialDispute {
  id: string; // e.g. "DISP-1001"
  dispute_number: string; // e.g. "MEDORA-DISP-1001"
  patient_id: string;
  patient_name: string;
  organization_id: string;
  facility_id: string;
  bill_id: string;
  bill_item_id?: string;
  category: DisputeCategory;
  description: string;
  status: DisputeStatus;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface FinancialAnomaly {
  id: string; // e.g. "ANOM-1001"
  rule_id: string; // e.g. "RULE-DUPLICATE-CHARGE-01"
  rule_version: string;
  category: string;
  severity: AnomalySeverity;
  explanation: string; // Explainable non-accusatory terms
  status: "OPEN" | "UNDER_REVIEW" | "FALSE_POSITIVE" | "CONFIRMED_ERROR" | "RESOLVED";
  target_resource_id: string;
  created_at: string;
}

export interface FinancialInvestigation {
  id: string; // e.g. "INV-1001"
  dispute_id?: string;
  anomaly_id?: string;
  assigned_to_id?: string;
  assigned_to_name?: string;
  status: "OPEN" | "UNDER_REVIEW" | "EVIDENCE_COLLECTED" | "DECISION_RECORDED" | "CLOSED";
  evidence_nodes: EvidenceNode[];
  decision?: string;
  resolution_type?: "NO_ERROR_FOUND" | "DUPLICATE_CORRECTED" | "OVERCHARGE_CORRECTED" | "PAYMENT_RECONCILED" | "REFUND_COMPLETED" | "ESCALATED";
  financial_impact: number;
  started_at: string;
  completed_at?: string;
}

export interface DisputeResolution {
  id: string; // e.g. "RESOL-1001"
  dispute_id: string;
  resolution_type: string;
  amount_affected: number;
  decision_explanation: string;
  approved_by_id: string;
  approved_by_name: string;
  created_at: string;
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
// HEALTH JOURNEY & UNIFIED CLINICAL CONTINUITY MODEL (PHASE 4.4 & PHASE C.4)
// Lightweight dynamic aggregation layer referencing canonical records.
// ============================================================

export type TimelineEventType =
  | "APPOINTMENT"
  | "ENCOUNTER"
  | "CLINICAL_RECORD"
  | "PRESCRIPTION"
  | "LAB_ORDER"
  | "SAMPLE"
  | "LAB_REPORT"
  | "IMAGING_ORDER"
  | "REFERRAL"
  | "FOLLOW_UP"
  | "MEDICAL_DOCUMENT"
  | "PHARMACY_EVENT"
  | "ADMISSION"
  | "DISCHARGE"
  | "EMERGENCY_CASE"
  | "BLOOD_EVENT"
  | "BILLING_EVENT";

export type TimelineSourceType =
  | "APPOINTMENT"
  | "ENCOUNTER"
  | "CLINICAL_RECORD"
  | "PRESCRIPTION"
  | "LAB_ORDER"
  | "SAMPLE"
  | "LAB_REPORT"
  | "MEDICAL_ORDER"
  | "MEDICAL_DOCUMENT"
  | "EXTERNAL";

export type TimelineSection = "UPCOMING" | "TODAY" | "PAST";

export interface TimelineEvent {
  id: string; // Dynamic composite e.g. "tle-enc-1001"
  patient_id: string;
  event_type: TimelineEventType;
  source_type?: TimelineSourceType;
  source_id?: string;
  reference_id: string; // e.g. "ENC-1001", "PRX-1001", "LAB-ORD-1001", "SMP-1001", "RPT-1001"
  encounter_id?: string;
  title: string;
  summary: string;
  status: string; // e.g. "COMPLETED", "ISSUED", "ORDERED", "ACTIVE", "CANCELLED", "RELEASED", "AMENDED"
  occurred_at: string; // Canonical clinical timestamp for chronological sorting
  section?: TimelineSection;
  organization_name?: string;
  organization_id?: string;
  facility_name?: string;
  facility_id?: string;
  department_name?: string;
  professional_name?: string;
  professional_id?: string;
  professional_role?: string;
  deep_link: string; // Route to view canonical record or open modal
  is_verified?: boolean;
  metadata?: Record<string, any>;
}

export interface EncounterClinicalBundle {
  encounter: HealthcareEncounter;
  clinical_record?: ClinicalRecord | null;
  linked_appointment?: Appointment | null;
  prescriptions: HealthcarePrescription[];
  lab_orders: HealthcareLabOrder[];
  samples: HealthcareLabSample[];
  lab_reports: HealthcareLabReport[];
  medical_orders: HealthcareMedicalOrder[];
  medical_documents: HealthcareMedicalDocument[];
  occurred_at: string;
  status: string;
  doctor_name: string;
  organization_name: string;
  facility_name?: string;
  department_name?: string;
}

export interface TimelineFilterOptions {
  category?: "all" | "visits" | "records" | "prescriptions" | "lab_orders" | "lab_reports" | "appointments" | "referrals" | "documents";
  dateRange?: "today" | "7_days" | "30_days" | "1_year" | "all";
  searchQuery?: string;
  organizationId?: string;
  facilityId?: string;
  professionalId?: string;
  includeRevokedDocs?: boolean;
  limit?: number;
  offset?: number;
}

export interface PatientStructuredHealthSummary {
  patient_id: string;
  patient_name: string;
  allergies: string[];
  chronic_conditions: string[];
  active_prescriptions: HealthcarePrescription[];
  recent_released_reports: HealthcareLabReport[];
  recent_encounters: HealthcareEncounter[];
  upcoming_appointments: Appointment[];
  upcoming_follow_ups: HealthcareMedicalOrder[];
  total_encounters_count: number;
  total_prescriptions_count: number;
  total_lab_reports_count: number;
  last_updated_at: string;
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

export type BookingSource = "PATIENT" | "RECEPTION" | "DOCTOR" | "WALK_IN";

export interface DoctorWorkingSession {
  id: string; // e.g. SES-1001
  doctor_id: string; // e.g. DOC-1001 / PER-DOC-1001
  doctor_name: string;
  organization_id: string;
  organization_identifier: string; // e.g. HSP-1001, CLN-1001
  organization_name: string;
  facility_id: string;
  department_id: string;
  department_name: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  start_time: string; // "08:00"
  end_time: string; // "10:00"
  slot_display_time?: string; // "08:00 AM - 10:00 AM"
  capacity: number; // Max patients for planning constraint (e.g. 12)
  room_number?: string;
  session_name?: string;
  is_active: boolean;
  effective_from?: string;
  effective_to?: string;
  created_at: string;
  updated_at?: string;
}

export type ScheduleOverrideType = 
  | "DOCTOR_LEAVE" 
  | "FACILITY_CLOSURE" 
  | "CAPACITY_OVERRIDE" 
  | "SPECIAL_SESSION";

export interface ScheduleOverride {
  id: string;
  override_type: ScheduleOverrideType;
  doctor_id?: string;
  organization_identifier?: string;
  facility_id?: string;
  date: string; // YYYY-MM-DD
  start_time?: string;
  end_time?: string;
  override_capacity?: number;
  reason: string;
  is_closed: boolean;
  created_at: string;
}

export type CapacityAvailabilityStatus = 
  | "AVAILABLE" 
  | "LIMITED" 
  | "FULL" 
  | "DOCTOR_LEAVE" 
  | "FACILITY_CLOSURE" 
  | "PAST_SESSION" 
  | "UNAVAILABLE";

export interface SessionAvailability {
  session_id: string;
  doctor_id: string;
  doctor_name: string;
  organization_id: string;
  organization_identifier: string;
  organization_name: string;
  facility_id: string;
  department_id: string;
  department_name: string;
  date: string; // YYYY-MM-DD
  start_time: string;
  end_time: string;
  slot_display_time: string;
  room_number?: string;
  capacity: number;
  booked_count: number;
  remaining_capacity: number;
  status: CapacityAvailabilityStatus;
  status_reason?: string;
}

export type DiscoveryMode = "DOCTOR_FIRST" | "FACILITY_FIRST" | "SERVICE_FIRST";
export type DoctorPreferenceMode = "SAME_DOCTOR_ONLY" | "PREFER_DOCTOR_ALLOW_ALTERNATIVES";

export interface Appointment {
  id: string;
  appointment_no: string; // e.g. APT-1001
  patient_id: string; // FK -> patients.id / PAT-1001
  patient_name: string;
  patient_phone?: string;
  doctor_id: string; // FK -> doctors.id / DOC-1001
  doctor_name: string;
  organization_id: string;
  organization_identifier: string; // e.g. HSP-1001
  organization_name: string;
  facility_id: string;
  department_id: string;
  department_name: string;
  service_id?: string;
  service_name?: string;
  consultation_fee?: number;
  session_id: string; // FK -> DoctorWorkingSession.id
  appointment_date: string; // YYYY-MM-DD
  session_start_time: string; // "08:00"
  session_end_time: string; // "10:00"
  slot_display_time: string; // "08:00 AM - 10:00 AM Session"
  scheduled_time?: string; // Informational session start time
  token_number?: string; // Reserved for Phase 6 / B.2
  status: AppointmentStatus;
  booking_source: BookingSource;
  discovery_mode?: DiscoveryMode;
  is_follow_up?: boolean;
  previous_encounter_id?: string;
  reason_for_visit?: string;
  opd_room?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  rescheduled_from_id?: string;
  rescheduled_to_id?: string;
  idempotency_key?: string;
  created_at: string;
  updated_at?: string;
}

export interface BookingRequest {
  patient_id: string;
  doctor_id?: string;
  organization_identifier?: string;
  facility_id?: string;
  department_id?: string;
  service_id?: string;
  session_id: string;
  appointment_date: string; // YYYY-MM-DD
  reason_for_visit?: string;
  booking_source?: BookingSource;
  discovery_mode?: DiscoveryMode;
  doctor_preference?: DoctorPreferenceMode;
  is_follow_up?: boolean;
  previous_encounter_id?: string;
  idempotency_key?: string;
}

export interface BookingResult {
  success: boolean;
  appointment?: Appointment;
  error_code?: 
    | "SESSION_FULL"
    | "DOCTOR_ON_LEAVE"
    | "FACILITY_CLOSED"
    | "PAST_SESSION"
    | "DUPLICATE_APPOINTMENT"
    | "INVALID_SESSION"
    | "ORGANIZATION_MISMATCH"
    | "UNAUTHORIZED"
    | "PATIENT_NOT_FOUND"
    | "DOCTOR_NOT_FOUND"
    | "INVALID_CAPACITY"
    | "UNKNOWN_ERROR";
  message: string;
  remaining_capacity?: number;
}

// ============================================================
// PHASE B.2 — CHECK-IN, TOKEN & QUEUE MANAGEMENT TYPES
// ============================================================

export type QueueStatus =
  | "NOT_CHECKED_IN"
  | "WAITING"
  | "CALLED"
  | "IN_CONSULTATION"
  | "COMPLETED"
  | "SKIPPED"
  | "NO_SHOW"
  | "CANCELLED"
  | "TRANSFERRED";

export type CheckInSource = "RECEPTIONIST" | "PATIENT_SELF" | "KIOSK" | "STAFF";

export interface QueueEntry {
  id: string; // e.g. "Q-1001"
  queue_no?: string; // e.g. "QUE-1001"
  appointment_id?: string; // FK -> Appointment.id (Optional for pure walk-ins)
  patient_id: string; // FK -> Patient.id / PAT-1001
  patient_name: string;
  patient_phone?: string;
  doctor_id: string; // FK -> Doctor.id / DOC-1001
  doctor_name: string;
  organization_id: string; // UUID
  organization_identifier: string; // e.g. "HSP-1001"
  organization_name: string;
  facility_id: string; // e.g. "FAC-1001"
  department_id: string; // e.g. "DEP-CARD-1001"
  department_name: string;
  session_id: string; // FK -> DoctorWorkingSession.id
  date: string; // YYYY-MM-DD
  token_number: string; // e.g. "C-01", "CARD-07"
  token_sequence: number; // Sequential integer within queue (1, 2, 3...)
  source: "APPOINTMENT" | "WALK_IN";
  checkin_source: CheckInSource;
  status: QueueStatus;
  room_number?: string;
  priority_flag?: boolean;
  priority_reason?: string;
  // Lifecycle timestamps (Critical for Phase B.3 dynamic waiting time data)
  checked_in_at: string;
  called_at?: string;
  consultation_started_at?: string;
  completed_at?: string;
  skipped_at?: string;
  recalled_at?: string;
  no_show_at?: string;
  cancelled_at?: string;
  transferred_at?: string;
  transfer_from_doctor_id?: string;
  transfer_to_doctor_id?: string;
  transfer_reason?: string;
  cancellation_reason?: string;
  encounter_id?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface CheckInRequest {
  appointment_id?: string;
  patient_id: string;
  doctor_id?: string;
  organization_identifier?: string;
  facility_id?: string;
  department_id?: string;
  session_id?: string;
  date?: string; // YYYY-MM-DD (defaults to today)
  source?: "APPOINTMENT" | "WALK_IN";
  checkin_source?: CheckInSource;
  reason_for_visit?: string;
  priority_flag?: boolean;
  priority_reason?: string;
}

export interface QueuePositionInfo {
  token_number: string;
  status: QueueStatus;
  people_ahead: number;
  currently_serving_token?: string;
  room_number?: string;
  checked_in_at: string;
  doctor_name: string;
  department_name: string;
  organization_name: string;
}

export interface DoctorQueueSummary {
  session_id: string;
  doctor_id: string;
  doctor_name: string;
  organization_identifier: string;
  facility_id: string;
  department_id: string;
  department_name: string;
  date: string;
  session_time: string;
  room_number?: string;
  total_capacity: number;
  booked_count: number;
  checked_in_count: number;
  waiting_count: number;
  current_patient?: QueueEntry;
  next_patient?: QueueEntry;
  waiting_list: QueueEntry[];
  skipped_list: QueueEntry[];
  completed_count: number;
}

export interface CheckInResult {
  success: boolean;
  queue_entry?: QueueEntry;
  error_code?:
    | "ALREADY_CHECKED_IN"
    | "INVALID_APPOINTMENT"
    | "APPOINTMENT_CANCELLED"
    | "WRONG_DATE"
    | "WRONG_FACILITY"
    | "SESSION_CLOSED"
    | "PAST_SESSION"
    | "DOCTOR_UNAVAILABLE"
    | "QUEUE_FULL"
    | "CAPACITY_EXCEEDED"
    | "UNAUTHORIZED"
    | "PATIENT_NOT_FOUND"
    | "TOKEN_GENERATION_FAILED"
    | "UNKNOWN_ERROR";
  message: string;
  position_info?: QueuePositionInfo;
}

export interface QueueActionResult {
  success: boolean;
  queue_entry?: QueueEntry;
  encounter_id?: string;
  error_code?: string;
  message: string;
}

// ============================================================
// PHASE B.3 — DYNAMIC WAITING-TIME ESTIMATION & QUEUE TYPES
// ============================================================

export type WaitingEstimateConfidence = "HIGH" | "MEDIUM" | "LOW" | "UNAVAILABLE";

export type DoctorDelayStatus =
  | "ON_TRACK"
  | "DELAYED"
  | "AHEAD"
  | "ON_BREAK"
  | "UNAVAILABLE"
  | "UNKNOWN";

export interface WaitingEstimateResult {
  queue_entry_id?: string;
  token_number: string;
  status: QueueStatus;
  people_ahead: number;
  estimated_lower_minutes: number;
  estimated_upper_minutes: number;
  display_text: string; // e.g. "20–35 min", "You are next", "Very short wait"
  confidence: WaitingEstimateConfidence;
  confidence_reason?: string;
  delay_status: DoctorDelayStatus;
  delay_minutes: number;
  delay_notice?: string; // e.g. "Doctor is running approx. 15m behind schedule"
  currently_serving_token?: string;
  current_consultation_elapsed_minutes?: number;
  doctor_name: string;
  department_name: string;
  organization_name: string;
  room_number?: string;
  generated_at: string; // ISO timestamp
  is_stale: boolean;
  algorithm_version: string; // "B3_DETERMINISTIC_V1"
}

export interface HistoricalConsultationMetric {
  doctor_id?: string;
  doctor_name?: string;
  organization_identifier?: string;
  facility_id?: string;
  department_id?: string;
  department_name?: string;
  sample_size: number;
  median_minutes: number;
  p25_minutes: number; // 25th percentile (fast consultations)
  p75_minutes: number; // 75th percentile (longer consultations)
  min_minutes: number;
  max_minutes: number;
  source_level:
    | "DOCTOR_FACILITY"
    | "DOCTOR_DEPARTMENT"
    | "DEPARTMENT"
    | "FACILITY_DEFAULT"
    | "SYSTEM_FALLBACK";
}

export interface DoctorOperationalQueueStatus {
  session_id: string;
  doctor_id: string;
  doctor_name: string;
  organization_identifier: string;
  organization_name: string;
  facility_id: string;
  department_id: string;
  department_name: string;
  date: string;
  session_time: string;
  status: "AVAILABLE" | "IN_CONSULTATION" | "ON_BREAK" | "DELAYED" | "UNAVAILABLE" | "SESSION_COMPLETED";
  delay_status: DoctorDelayStatus;
  delay_minutes: number;
  delay_notice?: string;
  active_patient?: {
    token_number: string;
    patient_name: string;
    elapsed_minutes: number;
    started_at: string;
  };
  waiting_count: number;
  completed_count: number;
  skipped_count: number;
  historical_median_minutes: number;
  estimated_queue_clearance_minutes: number;
  avg_wait_range_for_next: string;
}

// ============================================================
// PHASE B.4 — ALTERNATIVES, SAME-DOCTOR OPTIONS & WAITLIST
// ============================================================

export type AlternativeRecommendationReason =
  | "SAME_DOCTOR_SAME_FACILITY_OTHER_SESSION"
  | "SAME_DOCTOR_OTHER_FACILITY"
  | "SAME_DOCTOR_OTHER_DATE"
  | "OTHER_DOCTOR_SAME_SPECIALTY"
  | "OTHER_FACILITY"
  | "SAME_DOCTOR_LATER_SESSION"
  | "SAME_DOCTOR_DIFFERENT_FACILITY"
  | "OTHER_DOCTOR_SAME_FACILITY"
  | "OTHER_DOCTOR_DIFFERENT_FACILITY"
  | "SHORTER_WAIT_TIME"
  | "EARLIER_AVAILABILITY";

export interface AlternativeAppointmentOption {
  doctor_id: string;
  doctor_name: string;
  medical_specialty: string;
  organization_id: string;
  organization_identifier: string;
  organization_name: string;
  facility_id: string;
  department_id: string;
  department_name: string;
  session_id: string;
  date: string;
  slot_display_time: string;
  opd_room: string;
  consultation_fee: number;
  available_capacity: number;
  total_capacity: number;
  is_same_doctor: boolean;
  is_same_facility: boolean;
  estimated_waiting_minutes_range?: string; // e.g. "15–25 min" from B.3
  distance_km?: number;
  reason_badge: AlternativeRecommendationReason;
  reason_explanation: string;
  can_book_immediately: boolean;
}

export type WaitlistStatus = "ACTIVE" | "OFFERED" | "ACCEPTED" | "NOTIFIED" | "BOOKED" | "EXPIRED" | "CANCELLED";

export interface WaitlistEntry {
  id: string; // e.g. "wtl-1001"
  waitlist_no: string; // e.g. "WTL-1001"
  patient_id: string;
  patient_name: string;
  patient_phone?: string;
  doctor_id: string;
  doctor_name: string;
  organization_id: string;
  organization_identifier: string;
  organization_name: string;
  facility_id: string;
  department_id: string;
  department_name: string;
  preferred_date: string; // YYYY-MM-DD
  preferred_session_id?: string;
  preferred_time_window?: string;
  status: WaitlistStatus;
  notification_channel: "SMS" | "WHATSAPP" | "IN_APP" | "EMAIL";
  created_at: string;
  offered_at?: string;
  accepted_at?: string;
  expires_at?: string;
  notified_at?: string;
  booked_appointment_id?: string;
  cancelled_at?: string;
  notes?: string;
}

export interface WaitlistRequest {
  patient_id: string;
  doctor_id: string;
  organization_identifier: string;
  facility_id: string;
  department_id: string;
  preferred_date: string;
  preferred_session_id?: string;
  preferred_time_window?: string;
  notification_channel?: "SMS" | "WHATSAPP" | "IN_APP" | "EMAIL";
  notes?: string;
}

export interface WaitlistResult {
  success: boolean;
  waitlist_entry?: WaitlistEntry;
  error_code?:
    | "ALREADY_WAITLISTED"
    | "SLOT_AVAILABLE_NOW"
    | "DOCTOR_UNAVAILABLE"
    | "PAST_DATE"
    | "UNAUTHORIZED"
    | "INVALID_REQUEST";
  message: string;
}

export interface AlternativeSearchParams {
  patient_id: string;
  preferred_doctor_id: string;
  specialty?: string;
  preferred_organization_identifier: string;
  preferred_facility_id?: string;
  preferred_date: string; // YYYY-MM-DD
  preferred_session_id?: string;
  max_distance_km?: number;
  filter_same_doctor_only?: boolean;
  filter_same_facility_only?: boolean;
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

export interface LegacyBillVersion {
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
