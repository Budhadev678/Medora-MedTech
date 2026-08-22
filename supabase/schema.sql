-- ============================================================
-- MEDORA HEALTHCARE PLATFORM — POSTGRESQL MASTER SCHEMA
-- COMPLETE ECOSYSTEM CONNECTIVITY & RELATIONSHIP ARCHITECTURE
-- ============================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Custom Role & Status Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'patient', 'doctor', 'hospital_admin', 'lab_staff', 
        'pharmacy_staff', 'emergency_staff', 'blood_staff', 
        'finance_staff', 'insurance_staff', 'government_staff',
        'ambulance_staff', 'staff', 'receptionist', 'admin'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE account_status AS ENUM (
        'active', 'pending', 'suspended', 'disabled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM (
        'pending', 'verified', 'rejected', 'suspended'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE affiliation_status AS ENUM (
        'active', 'pending', 'rejected', 'suspended', 'ended'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE doctor_status AS ENUM (
        'available', 'busy', 'on_call', 'emergency_occupied', 'off_duty'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE organization_type AS ENUM (
        'hospital', 'clinic', 'diagnostic_lab', 'pharmacy', 
        'blood_bank', 'insurance', 'financing_partner', 
        'government_assistance', 'ambulance_provider'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE organization_membership_status AS ENUM (
        'INVITED', 'PENDING', 'ACTIVE', 'SUSPENDED', 'REVOKED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- CATEGORY A — IDENTITIES (PEOPLE & ORGANIZATIONS)
-- ============================================================

-- 3. Profiles Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'patient',
    account_status account_status NOT NULL DEFAULT 'active',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Organizations Table (Legal Entities)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medora_id TEXT UNIQUE NOT NULL, -- e.g. HSP-1001, CLN-1001, LAB-1001, PHA-1001, BLC-1001, INS-1001, FIN-1001, GOV-1001, AMB-1001
    name TEXT NOT NULL,
    type organization_type NOT NULL DEFAULT 'hospital',
    license_no TEXT UNIQUE NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    phone TEXT NOT NULL,
    emergency_phone TEXT,
    status account_status NOT NULL DEFAULT 'active',
    verification_status verification_status NOT NULL DEFAULT 'verified',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Facilities Table (Multi-Branch / Multi-Location Foundation)
CREATE TABLE IF NOT EXISTS public.facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    facility_code TEXT UNIQUE NOT NULL, -- e.g. HSP-1001-BBSR, HSP-1001-ROU, HSP-1001-CTC
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    emergency_phone TEXT,
    status account_status NOT NULL DEFAULT 'active',
    verification_status verification_status NOT NULL DEFAULT 'verified',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Departments Table (Scoped to Organizations / Facilities)
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Patients Table (Strictly 1:1 with Patient Profile)
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    medora_id TEXT UNIQUE NOT NULL, -- e.g. PAT-1001, PAT-1002, PAT-1003
    abha_id TEXT,
    aadhaar_last4 TEXT,
    dob DATE,
    gender TEXT,
    blood_group TEXT,
    allergies TEXT[] DEFAULT '{}',
    chronic_conditions TEXT[] DEFAULT '{}',
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    status account_status NOT NULL DEFAULT 'active',
    verification_status verification_status NOT NULL DEFAULT 'verified',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Doctors Table (Decoupled Person Registry)
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    medora_id TEXT UNIQUE NOT NULL, -- e.g. DOC-1001, DOC-1002
    medical_reg_no TEXT UNIQUE NOT NULL, -- e.g. MCI-2014-99214
    medical_council TEXT NOT NULL,
    specialization TEXT NOT NULL,
    qualification TEXT NOT NULL,
    experience_years INT NOT NULL DEFAULT 5,
    status doctor_status NOT NULL DEFAULT 'available',
    account_status account_status NOT NULL DEFAULT 'active',
    verification_status verification_status NOT NULL DEFAULT 'verified',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CATEGORY B — RELATIONSHIPS
-- ============================================================

-- 9. Doctor Affiliations (Many-to-Many Doctor ↔ Hospital / Clinic)
CREATE TABLE IF NOT EXISTS public.doctor_affiliations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    role_title TEXT NOT NULL, -- e.g. 'Consultant Cardiologist', 'Visiting Specialist'
    employment_type TEXT NOT NULL DEFAULT 'consultant',
    status affiliation_status NOT NULL DEFAULT 'active',
    verification_status verification_status NOT NULL DEFAULT 'verified',
    consultation_fee NUMERIC(10,2) NOT NULL DEFAULT 500.00,
    opd_room TEXT,
    schedule_notes TEXT,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(doctor_id, organization_id, facility_id)
);

-- 10. Staff Memberships (Legacy Many-to-Many Staff ↔ Hospital / Clinic / Lab / Pharmacy)
CREATE TABLE IF NOT EXISTS public.staff_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    role_title TEXT NOT NULL, -- e.g. 'Head Nurse', 'Chief Pharmacist', 'Billing Lead'
    status account_status NOT NULL DEFAULT 'active',
    verification_status verification_status NOT NULL DEFAULT 'verified',
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10b. Organization Memberships (Phase A.2 Normalized Many-to-Many Entity)
CREATE TABLE IF NOT EXISTS public.organization_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medora_membership_id TEXT UNIQUE NOT NULL, -- e.g. MEM-1001, MEM-1002
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    role_title TEXT NOT NULL, -- e.g. 'Consultant Cardiologist', 'Head Nurse', 'Clinic Administrator'
    member_role TEXT NOT NULL DEFAULT 'staff',
    employment_type TEXT NOT NULL DEFAULT 'full_time',
    status organization_membership_status NOT NULL DEFAULT 'ACTIVE',
    verification_status verification_status NOT NULL DEFAULT 'verified',
    consultation_fee NUMERIC(10,2),
    opd_room TEXT,
    schedule_notes TEXT,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    revocation_reason TEXT,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Facility Partnerships (Hospital ↔ Lab / Pharmacy / Blood / Ambulance)
CREATE TABLE IF NOT EXISTS public.facility_partnerships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    partner_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    partnership_type TEXT NOT NULL, -- 'internal_lab', 'external_lab', 'internal_pharmacy', 'external_pharmacy', 'blood_bank', 'ambulance'
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Insurance Policies (Patient ↔ Insurance Provider)
CREATE TABLE IF NOT EXISTS public.insurance_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    insurance_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    policy_number TEXT NOT NULL,
    policy_name TEXT NOT NULL,
    coverage_amount NUMERIC(12,2) NOT NULL,
    valid_until DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Consent Records (Patient-Controlled Medical Access Grants)
CREATE TABLE IF NOT EXISTS public.consent_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    grantee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL,
    granted_scopes TEXT[] NOT NULL, -- 'prescriptions', 'lab_reports', 'allergies', 'discharge_summary'
    duration_hours INT NOT NULL DEFAULT 24,
    status TEXT NOT NULL DEFAULT 'active',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CATEGORY C — HEALTHCARE EVENTS & TRANSACTIONS
-- ============================================================

-- 14. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_no TEXT UNIQUE NOT NULL, -- e.g. APT-1001
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    scheduled_time TIMESTAMPTZ NOT NULL,
    token_number TEXT,
    status TEXT NOT NULL DEFAULT 'CONFIRMED', -- 'REQUESTED', 'CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED'
    reason_for_visit TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Encounters Table
CREATE TABLE IF NOT EXISTS public.encounters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_no TEXT UNIQUE NOT NULL, -- e.g. ENC-1001
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    encounter_type TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'walk_in', 'emergency', 'referral', 'follow_up'
    status TEXT NOT NULL DEFAULT 'completed',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Consultations Table
CREATE TABLE IF NOT EXISTS public.consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID UNIQUE NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    chief_complaints TEXT NOT NULL,
    clinical_notes TEXT NOT NULL,
    diagnosis_primary TEXT NOT NULL,
    diagnosis_secondary TEXT,
    treatment_plan TEXT NOT NULL,
    vitals JSONB,
    follow_up_days INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Prescriptions Table (Decoupled Encounter Prescriptions)
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_no TEXT UNIQUE NOT NULL, -- e.g. RX-1001
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    encounter_id UUID REFERENCES public.encounters(id) ON DELETE SET NULL,
    encounter_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    fulfillment_pharmacy_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'dispensed', 'cancelled'
    digital_signature_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Prescription Items Table
CREATE TABLE IF NOT EXISTS public.prescription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    medicine_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL, -- e.g. '1-0-1'
    duration_days INT NOT NULL,
    instructions TEXT
);

-- 19. Prescription Dispensings Table (Dispensing Event)
CREATE TABLE IF NOT EXISTS public.prescription_dispensings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    pharmacy_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    dispensed_by_staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'DISPENSED',
    dispensed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Lab Orders Table
CREATE TABLE IF NOT EXISTS public.lab_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_no TEXT UNIQUE NOT NULL, -- e.g. LAB-ORD-1024
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    encounter_id UUID REFERENCES public.encounters(id) ON DELETE SET NULL,
    target_laboratory_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    clinical_notes TEXT,
    status TEXT NOT NULL DEFAULT 'PLACED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Lab Samples Table
CREATE TABLE IF NOT EXISTS public.lab_samples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sample_code TEXT UNIQUE NOT NULL, -- e.g. SMP-1024
    lab_order_id UUID NOT NULL REFERENCES public.lab_orders(id) ON DELETE CASCADE,
    sample_type TEXT NOT NULL, -- 'Blood', 'Urine', 'Serum', 'Tissue'
    collected_at TIMESTAMPTZ DEFAULT NOW(),
    collected_by_staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'COLLECTED'
);

-- 22. Lab Tests Table
CREATE TABLE IF NOT EXISTS public.lab_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lab_order_id UUID NOT NULL REFERENCES public.lab_orders(id) ON DELETE CASCADE,
    test_name TEXT NOT NULL,
    test_category TEXT NOT NULL,
    test_parameter TEXT NOT NULL,
    observed_value TEXT NOT NULL,
    unit TEXT NOT NULL,
    reference_range TEXT NOT NULL,
    flag TEXT NOT NULL DEFAULT 'normal' -- 'normal', 'abnormal', 'critical'
);

-- 23. Lab Reports Table
CREATE TABLE IF NOT EXISTS public.lab_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_no TEXT UNIQUE NOT NULL, -- e.g. RPT-1024
    lab_order_id UUID NOT NULL REFERENCES public.lab_orders(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    laboratory_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    verified_by_pathologist_name TEXT NOT NULL,
    digital_signature_hash TEXT,
    status TEXT NOT NULL DEFAULT 'released',
    released_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. Emergency Cases Table
CREATE TABLE IF NOT EXISTS public.emergency_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number TEXT UNIQUE NOT NULL, -- e.g. ER-1024
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    temp_patient_name TEXT,
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    triage_level TEXT NOT NULL, -- 'red_critical', 'yellow_urgent', 'green_stable'
    assigned_doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    chief_complaint TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'TRIAGE',
    admitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 25. Blood Requests Table
CREATE TABLE IF NOT EXISTS public.blood_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_no TEXT UNIQUE NOT NULL, -- e.g. BLD-REQ-1001
    emergency_case_id UUID REFERENCES public.emergency_cases(id) ON DELETE SET NULL,
    hospital_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    target_blood_centre_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    blood_group TEXT NOT NULL,
    units_requested INT NOT NULL DEFAULT 1,
    urgency TEXT NOT NULL DEFAULT 'CRITICAL',
    status TEXT NOT NULL DEFAULT 'CREATED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 26. Ambulance Requests Table
CREATE TABLE IF NOT EXISTS public.ambulance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_no TEXT UNIQUE NOT NULL, -- e.g. AMB-REQ-1001
    emergency_case_id UUID REFERENCES public.emergency_cases(id) ON DELETE SET NULL,
    pickup_location TEXT NOT NULL,
    destination_facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    ambulance_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    eta_minutes INT,
    status TEXT NOT NULL DEFAULT 'DISPATCHED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 27. Hospital Transfers Table
CREATE TABLE IF NOT EXISTS public.hospital_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    origin_facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    destination_facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    reason_for_transfer TEXT NOT NULL,
    clinical_handover_summary TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'REQUESTED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 28. Referrals Table
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    referring_doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    source_encounter_id UUID REFERENCES public.encounters(id) ON DELETE SET NULL,
    target_doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    target_specialty TEXT NOT NULL,
    target_facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL,
    clinical_reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CATEGORY D — FINANCIAL & GOVERNANCE EVENTS
-- ============================================================

-- 29. Bills Table
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_no TEXT UNIQUE NOT NULL, -- e.g. BIL-1001
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    encounter_id UUID REFERENCES public.encounters(id) ON DELETE SET NULL,
    total_gross_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    insurance_approved_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    government_assistance_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    charity_discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    financing_covered_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    patient_net_payable NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'GENERATED',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 30. Bill Items Table (Traceability Back to Clinical Events)
CREATE TABLE IF NOT EXISTS public.bill_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    service_category TEXT NOT NULL, -- 'consultation', 'laboratory', 'radiology', 'pharmacy', 'procedure', 'room'
    service_name TEXT NOT NULL,
    service_code TEXT,
    unit_price NUMERIC(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_amount NUMERIC(10,2) NOT NULL,
    linked_event_type TEXT, -- 'consultation', 'lab_order', 'prescription', 'emergency_case'
    linked_event_id TEXT
);

-- 31. Bill Versions Table (Immutable Financial History)
CREATE TABLE IF NOT EXISTS public.bill_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    version_number INT NOT NULL DEFAULT 1,
    gross_amount NUMERIC(12,2) NOT NULL,
    modified_by_staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    change_reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 32. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_no TEXT UNIQUE NOT NULL, -- e.g. RCP-1001
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    amount_paid NUMERIC(12,2) NOT NULL,
    payment_method TEXT NOT NULL, -- 'UPI', 'CREDIT_CARD', 'CASH', 'INSURANCE_SETTLEMENT'
    status TEXT NOT NULL DEFAULT 'SUCCESS',
    transaction_ref TEXT,
    paid_at TIMESTAMPTZ DEFAULT NOW()
);

-- 33. Insurance Claims Table
CREATE TABLE IF NOT EXISTS public.insurance_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_no TEXT UNIQUE NOT NULL, -- e.g. CLM-1001
    policy_id UUID NOT NULL REFERENCES public.insurance_policies(id) ON DELETE CASCADE,
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    claimed_amount NUMERIC(12,2) NOT NULL,
    approved_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'SUBMITTED',
    reviewer_remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 34. Assistance Applications Table (Government / Scheme Subsidies)
CREATE TABLE IF NOT EXISTS public.assistance_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_no TEXT UNIQUE NOT NULL, -- e.g. GOV-APP-1001
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL,
    scheme_name TEXT NOT NULL,
    requested_amount NUMERIC(12,2) NOT NULL,
    approved_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'APPROVED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 35. Financing Applications Table (CarePay Micro-Financing)
CREATE TABLE IF NOT EXISTS public.financing_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_no TEXT UNIQUE NOT NULL, -- e.g. FIN-APP-1001
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    financing_partner_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    loan_amount NUMERIC(12,2) NOT NULL,
    tenure_months INT NOT NULL DEFAULT 6,
    monthly_emi NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'APPROVED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 36. Bill Disputes Table
CREATE TABLE IF NOT EXISTS public.bill_disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_no TEXT UNIQUE NOT NULL, -- e.g. DSP-1001
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    bill_item_id UUID REFERENCES public.bill_items(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    dispute_reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN',
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 37. Audit Logs Table (Immutable Cross-Cutting Ledger)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    reason TEXT,
    result TEXT NOT NULL DEFAULT 'SUCCESS',
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 38. Emergency Access Logs (Break-Glass Audit Table)
CREATE TABLE IF NOT EXISTS public.emergency_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medora_access_id TEXT UNIQUE NOT NULL, -- e.g. EMG-ACC-1001
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_role TEXT NOT NULL,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    resource_accessed TEXT NOT NULL DEFAULT 'EMERGENCY_MEDICAL_SNAPSHOT',
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE'
);

-- ============================================================
-- PHASE 0–10 EXTENSIONS — CAPACITY, LAB, PHARMACY & BILLING
-- ============================================================

-- 39. Doctor Working Sessions & Capacity Table (Phase 4 & 6)
CREATE TABLE IF NOT EXISTS public.doctor_working_sessions (
    id TEXT PRIMARY KEY, -- e.g. SES-1001
    doctor_id TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    organization_identifier TEXT NOT NULL,
    organization_name TEXT NOT NULL,
    facility_id TEXT NOT NULL,
    department_id TEXT NOT NULL,
    department_name TEXT NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    slot_display_time TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 12,
    room_number TEXT NOT NULL,
    session_name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 40. Capacity Waitlists Table (Phase 6.4)
CREATE TABLE IF NOT EXISTS public.capacity_waitlists (
    id TEXT PRIMARY KEY, -- e.g. WTL-1001
    session_id TEXT NOT NULL REFERENCES public.doctor_working_sessions(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    doctor_id TEXT NOT NULL,
    facility_id TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    offered_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 41. Queue Entries Table (Phase 6.2 Check-in & Queue Tokens)
CREATE TABLE IF NOT EXISTS public.queue_entries (
    id TEXT PRIMARY KEY, -- e.g. QUE-1001
    queue_no TEXT UNIQUE NOT NULL,
    appointment_id TEXT,
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT,
    doctor_id TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    organization_identifier TEXT NOT NULL,
    facility_id TEXT NOT NULL,
    department_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    date TEXT NOT NULL,
    token_number TEXT NOT NULL,
    token_sequence INTEGER NOT NULL,
    source TEXT NOT NULL DEFAULT 'APPOINTMENT',
    checkin_source TEXT NOT NULL DEFAULT 'PATIENT_SELF',
    status TEXT NOT NULL DEFAULT 'WAITING',
    room_number TEXT,
    checked_in_at TIMESTAMPTZ DEFAULT NOW(),
    called_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 42. Sample Custody Events Table (Phase 8.2 Chain of Custody)
CREATE TABLE IF NOT EXISTS public.sample_custody_events (
    id TEXT PRIMARY KEY, -- e.g. EVT-1001
    sample_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    from_location TEXT NOT NULL,
    to_location TEXT NOT NULL,
    handler_id TEXT NOT NULL,
    handler_name TEXT NOT NULL,
    temperature_celsius NUMERIC(4, 2),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    signature_hash TEXT
);

-- 43. Pharmacy Intakes Table (Phase 9.1 Intake Desk)
CREATE TABLE IF NOT EXISTS public.pharmacy_intakes (
    id TEXT PRIMARY KEY, -- e.g. INT-1001
    prescription_id TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    facility_id TEXT NOT NULL,
    intake_channel TEXT NOT NULL DEFAULT 'ELECTRONIC',
    status TEXT NOT NULL DEFAULT 'VALID',
    received_at TIMESTAMPTZ DEFAULT NOW(),
    processed_by_id TEXT,
    processed_by_name TEXT
);

-- 44. Pharmacy Inventory Items & Batches Table (Phase 9.2 FEFO Stock)
CREATE TABLE IF NOT EXISTS public.pharmacy_inventory_items (
    id TEXT PRIMARY KEY, -- e.g. INV-1001
    facility_id TEXT NOT NULL,
    medicine_code TEXT NOT NULL,
    medicine_name TEXT NOT NULL,
    generic_name TEXT NOT NULL,
    dosage_form TEXT NOT NULL,
    strength TEXT NOT NULL,
    total_stock INTEGER NOT NULL DEFAULT 0,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pharmacy_inventory_batches (
    id TEXT PRIMARY KEY, -- e.g. BAT-1001
    inventory_item_id TEXT NOT NULL REFERENCES public.pharmacy_inventory_items(id) ON DELETE CASCADE,
    batch_number TEXT NOT NULL,
    expiry_date TEXT NOT NULL, -- YYYY-MM-DD
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'AVAILABLE'
);

-- 45. Pharmacy Stock Reservations Table (Phase 9.2)
CREATE TABLE IF NOT EXISTS public.stock_reservations (
    id TEXT PRIMARY KEY, -- e.g. RESV-1001
    prescription_id TEXT NOT NULL,
    batch_id TEXT NOT NULL REFERENCES public.pharmacy_inventory_batches(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 46. Dispensing Records Table (Phase 9.3 Handover)
CREATE TABLE IF NOT EXISTS public.dispensing_records (
    id TEXT PRIMARY KEY, -- e.g. DSP-1001
    order_id TEXT NOT NULL,
    prescription_id TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    dispensed_by_id TEXT NOT NULL,
    dispensed_by_name TEXT NOT NULL,
    facility_id TEXT NOT NULL,
    verification_method TEXT NOT NULL DEFAULT 'OTP',
    status TEXT NOT NULL DEFAULT 'COMPLETED',
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    dispensed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 47. Clinical Follow-ups Table (Phase 7.3)
CREATE TABLE IF NOT EXISTS public.clinical_followups (
    id TEXT PRIMARY KEY, -- e.g. FLW-1001
    encounter_id TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    doctor_id TEXT NOT NULL,
    recommended_timeframe TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'RECOMMENDED',
    linked_appointment_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 48. Financial Coverages & Waterfall Table (Phase 10.2)
CREATE TABLE IF NOT EXISTS public.financial_coverages (
    id TEXT PRIMARY KEY, -- e.g. COV-1001
    bill_id TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    gross_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    insurance_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    government_assistance_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    hospital_discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    patient_payable_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 49. Reconciliation Runs & Financial Exceptions Table (Phase 10.3)
CREATE TABLE IF NOT EXISTS public.reconciliation_runs (
    id TEXT PRIMARY KEY, -- e.g. RECON-1001
    run_number TEXT UNIQUE NOT NULL,
    organization_id TEXT NOT NULL,
    facility_id TEXT NOT NULL,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'RUNNING',
    matched_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    exception_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    performed_by_id TEXT NOT NULL,
    performed_by_name TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.financial_exceptions (
    id TEXT PRIMARY KEY, -- e.g. EXC-1001
    reconciliation_run_id TEXT NOT NULL REFERENCES public.reconciliation_runs(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'MEDIUM',
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING'
);

-- 50. Refund & Reversal Records Table (Phase 10.3)
CREATE TABLE IF NOT EXISTS public.refund_records (
    id TEXT PRIMARY KEY, -- e.g. REF-1001
    refund_number TEXT UNIQUE NOT NULL,
    payment_id TEXT NOT NULL,
    bill_id TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    maker_id TEXT NOT NULL,
    maker_name TEXT NOT NULL,
    checker_id TEXT,
    checker_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- 51. Care Relationships Table (Phase 5.3 Active Care Teams)
CREATE TABLE IF NOT EXISTS public.care_relationships (
    id TEXT PRIMARY KEY, -- e.g. CR-1001
    patient_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    facility_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL DEFAULT 'ATTENDING',
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    effective_from TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- 52. Notifications Table (Phase 9.4 Event Dispatch)
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY, -- e.g. NOTIF-1001
    recipient_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'CLINICAL',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_affiliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_dispensings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambulance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistance_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financing_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_working_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capacity_waitlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sample_custody_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_inventory_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispensing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_coverages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policy
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. Patient Isolation Policy
CREATE POLICY "Patients can view own medical identity" ON public.patients
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Patients can update own medical identity" ON public.patients
    FOR UPDATE USING (user_id = auth.uid());

-- 3. Organization Memberships Policy
CREATE POLICY "Users can view own memberships" ON public.organization_memberships
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Org admins can manage organization memberships" ON public.organization_memberships
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_memberships 
            WHERE user_id = auth.uid() AND member_role IN ('hospital_admin', 'clinic_admin', 'lab_admin', 'pharmacy_admin') AND status = 'ACTIVE'
        )
    );

-- 4. Clinical Encounters Policy
CREATE POLICY "Patients can view own encounters" ON public.encounters
    FOR SELECT USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "Practitioners can view and manage encounters in their active organization" ON public.encounters
    FOR ALL USING (
        facility_id IN (
            SELECT facility_id FROM public.organization_memberships 
            WHERE user_id = auth.uid() AND status = 'ACTIVE'
        ) OR
        doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
    );

-- 5. Prescriptions Policy
CREATE POLICY "Patients can view own prescriptions" ON public.prescriptions
    FOR SELECT USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can create and manage prescriptions in their active hospital" ON public.prescriptions
    FOR ALL USING (
        doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
    );

CREATE POLICY "Licensed pharmacies can view and fulfill uncancelled prescriptions" ON public.prescriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_memberships 
            WHERE user_id = auth.uid() AND member_role IN ('pharmacist', 'pharmacy_staff', 'pharmacy_admin') AND status = 'ACTIVE'
        ) AND status = 'issued'
    );

-- 6. Lab Orders & Results Policy
CREATE POLICY "Patients can view own lab reports" ON public.lab_reports
    FOR SELECT USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "Laboratories can process assigned lab orders" ON public.lab_orders
    FOR ALL USING (
        target_laboratory_id IN (
            SELECT organization_id FROM public.organization_memberships 
            WHERE user_id = auth.uid() AND member_role IN ('lab_technician', 'lab_staff', 'pathologist', 'lab_admin') AND status = 'ACTIVE'
        )
    );

-- 7. Audit Log Policy (Strict Append-Only, No Hard Delete)
CREATE POLICY "Anyone can insert sanitized audit events" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view audit events pertaining to themselves" ON public.audit_logs
    FOR SELECT USING (
        actor_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Block audit log deletion" ON public.audit_logs
    FOR DELETE USING (false);

-- 8. Emergency Break-Glass Access Policy
CREATE POLICY "Emergency practitioners can insert break-glass logs" ON public.emergency_access_logs
    FOR INSERT WITH CHECK (auth.uid() = actor_id);

CREATE POLICY "Admins and involved patients can inspect emergency access logs" ON public.emergency_access_logs
    FOR SELECT USING (
        actor_id = auth.uid() OR
        patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 9. General Organization Isolation Policy
CREATE POLICY "Staff can view organization data" ON public.facilities
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_memberships 
            WHERE user_id = auth.uid() AND status = 'ACTIVE'
        )
    );

-- 10. Billing and Payments Privacy Policy
CREATE POLICY "Patients can view own bills" ON public.bills
    FOR SELECT USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "Patients can view own payments" ON public.payments
    FOR SELECT USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "Finance staff can manage bills and payments" ON public.bills
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_memberships 
            WHERE user_id = auth.uid() AND member_role IN ('finance_staff', 'hospital_admin', 'admin') AND status = 'ACTIVE'
        )
    );
