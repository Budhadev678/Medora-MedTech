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
        'ambulance_staff', 'staff', 'admin'
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

-- 10. Staff Memberships (Many-to-Many Staff ↔ Hospital / Clinic / Lab / Pharmacy)
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
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policy
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Patient Isolation Policy
CREATE POLICY "Patients can view own medical identity" ON public.patients
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Patients can update own medical identity" ON public.patients
    FOR UPDATE USING (user_id = auth.uid());

-- Doctor Affiliation Scoped Policies
CREATE POLICY "Doctors can view own affiliations" ON public.doctor_affiliations
    FOR SELECT USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

CREATE POLICY "Hospital staff can view and manage facility affiliations" ON public.doctor_affiliations
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM public.staff_memberships WHERE user_id = auth.uid()
        )
    );

-- Audit Log Policy (Append-only by users, read-only by admin)
CREATE POLICY "Anyone can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
