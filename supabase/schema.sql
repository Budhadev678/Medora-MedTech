-- ============================================================
-- MEDORA HEALTHCARE PLATFORM — POSTGRESQL MASTER SCHEMA & SEED
-- ============================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Custom Role & Status Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'patient', 'doctor', 'hospital_admin', 'lab_staff', 
        'pharmacy_staff', 'emergency_staff', 'blood_staff', 
        'finance_staff', 'admin'
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
    CREATE TYPE triage_priority AS ENUM (
        'critical', 'high', 'moderate', 'low'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Profiles Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'patient',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Patients Table
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    medora_id TEXT UNIQUE NOT NULL,
    abha_id TEXT,
    aadhaar_last4 TEXT,
    dob DATE,
    gender TEXT,
    blood_group TEXT,
    allergies TEXT[] DEFAULT '{}',
    chronic_conditions TEXT[] DEFAULT '{}',
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Hospitals Table
CREATE TABLE IF NOT EXISTS public.hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    license_no TEXT UNIQUE NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    phone TEXT NOT NULL,
    emergency_phone TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'hospital',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Doctors Table
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    specialization TEXT NOT NULL,
    qualification TEXT NOT NULL,
    experience_years INT DEFAULT 0,
    consultation_fee NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
    status doctor_status NOT NULL DEFAULT 'available',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Appointments & Consultations
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    token_number INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'booked',
    reason_for_visit TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    symptoms TEXT NOT NULL,
    clinical_diagnosis TEXT NOT NULL,
    clinical_notes TEXT,
    follow_up_date DATE,
    follow_up_instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Prescriptions & Medication Items
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_no TEXT UNIQUE NOT NULL,
    consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.prescription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    medicine_name TEXT NOT NULL,
    strength TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    timing TEXT NOT NULL,
    duration_days INT NOT NULL,
    special_instructions TEXT
);

-- 10. Lab Orders, Samples & Reports
CREATE TABLE IF NOT EXISTS public.lab_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_no TEXT UNIQUE NOT NULL,
    consultation_id UUID REFERENCES public.consultations(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    test_name TEXT NOT NULL,
    urgency TEXT NOT NULL DEFAULT 'routine',
    status TEXT NOT NULL DEFAULT 'ordered',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.samples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lab_order_id UUID REFERENCES public.lab_orders(id) ON DELETE CASCADE,
    sample_code TEXT UNIQUE NOT NULL,
    sample_type TEXT NOT NULL,
    collected_at TIMESTAMPTZ DEFAULT NOW(),
    collected_by UUID REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.lab_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lab_order_id UUID REFERENCES public.lab_orders(id) ON DELETE CASCADE,
    sample_id UUID REFERENCES public.samples(id) ON DELETE CASCADE,
    parameters JSONB NOT NULL DEFAULT '[]',
    summary TEXT,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    report_file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Pharmacy Dispensing Records
CREATE TABLE IF NOT EXISTS public.dispensing_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    pharmacist_id UUID REFERENCES public.profiles(id),
    dispensed_at TIMESTAMPTZ DEFAULT NOW(),
    medora_id_verified BOOLEAN DEFAULT TRUE,
    notes TEXT
);

-- 12. Transparent Billing & Version History
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_no TEXT UNIQUE NOT NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    insurance_covered NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    govt_scheme_covered NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    patient_payable NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'generated',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bill_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID REFERENCES public.bills(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL,
    reference_id UUID,
    description TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.bill_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID REFERENCES public.bills(id) ON DELETE CASCADE,
    version_no INT NOT NULL,
    previous_total NUMERIC(10, 2) NOT NULL,
    new_total NUMERIC(10, 2) NOT NULL,
    changed_by UUID REFERENCES public.profiles(id),
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Append-Only Audit Trail
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    role TEXT NOT NULL,
    action TEXT NOT NULL,
    target_entity TEXT NOT NULL,
    target_id TEXT NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'SUCCESS',
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Emergency Cases & Blood Requests
CREATE TABLE IF NOT EXISTS public.emergency_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_no TEXT UNIQUE NOT NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    triage_priority triage_priority NOT NULL DEFAULT 'moderate',
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    assigned_doctor_id UUID REFERENCES public.doctors(id),
    status TEXT NOT NULL DEFAULT 'arrived',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.blood_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_no TEXT UNIQUE NOT NULL,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    emergency_case_id UUID REFERENCES public.emergency_cases(id) ON DELETE SET NULL,
    blood_group TEXT NOT NULL,
    units_required INT NOT NULL DEFAULT 1,
    urgency TEXT NOT NULL DEFAULT 'routine',
    status TEXT NOT NULL DEFAULT 'created',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Unified Healthcare Timeline Events
CREATE TABLE IF NOT EXISTS public.timeline_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    reference_id UUID,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    hospital_name TEXT,
    actor_name TEXT,
    event_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to read and update their own profile
CREATE POLICY "Users can view self profile" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Patients can view self records" ON public.patients FOR SELECT USING (true);
CREATE POLICY "Append-only audit insert" ON public.audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Audit logs are read-only" ON public.audit_logs FOR SELECT USING (true);
