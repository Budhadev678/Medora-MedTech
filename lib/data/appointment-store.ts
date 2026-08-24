// ============================================================
// MEDORA — APPOINTMENT & CAPACITY DATA STORE
// MODIFICATION PHASE B.1
// ============================================================

import {
  Appointment,
  DoctorWorkingSession,
  ScheduleOverride,
  AppointmentStatus,
  BookingSource,
} from "@/types/database.types";

export interface AppointmentStoreData {
  sessions: DoctorWorkingSession[];
  overrides: ScheduleOverride[];
  appointments: Appointment[];
}

// ------------------------------------------------------------
// SEED DATA FOR PHASE B.1
// ------------------------------------------------------------

export const SEEDED_DOCTOR_SESSIONS: DoctorWorkingSession[] = [
  // 1. Dr. Ananya Sharma (DOC-1001) @ City Hospital (FAC-1001 / HSP-1001) — Monday Morning
  {
    id: "SES-1001",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_identifier: "HSP-1001",
    organization_name: "City Hospital — Bhubaneswar Main Campus",
    facility_id: "FAC-1001",
    department_id: "DEP-1001",
    department_name: "Cardiology & Cath Lab",
    day_of_week: 1, // Monday
    start_time: "08:00",
    end_time: "10:00",
    slot_display_time: "08:00 AM - 10:00 AM",
    capacity: 12,
    room_number: "OPD Room 102",
    session_name: "Morning Cardiology Clinic",
    is_active: true,
    created_at: "2026-01-01T08:00:00Z",
  },
  // 2. Dr. Ananya Sharma (DOC-1001) @ City Hospital (FAC-1001 / HSP-1001) — Monday Evening
  {
    id: "SES-1002",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_identifier: "HSP-1001",
    organization_name: "City Hospital — Bhubaneswar Main Campus",
    facility_id: "FAC-1001",
    department_id: "DEP-1001",
    department_name: "Cardiology & Cath Lab",
    day_of_week: 1, // Monday
    start_time: "16:00",
    end_time: "18:00",
    slot_display_time: "04:00 PM - 06:00 PM",
    capacity: 8,
    room_number: "OPD Room 102",
    session_name: "Evening Cardiology Consultations",
    is_active: true,
    created_at: "2026-01-01T08:00:00Z",
  },
  // 3. Dr. Ananya Sharma (DOC-1001) @ City Hospital (FAC-1001 / HSP-1001) — Wednesday Morning
  {
    id: "SES-1003",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_identifier: "HSP-1001",
    organization_name: "City Hospital — Bhubaneswar Main Campus",
    facility_id: "FAC-1001",
    department_id: "DEP-1001",
    department_name: "Cardiology & Cath Lab",
    day_of_week: 3, // Wednesday
    start_time: "08:00",
    end_time: "10:00",
    slot_display_time: "08:00 AM - 10:00 AM",
    capacity: 12,
    room_number: "OPD Room 102",
    session_name: "Morning Cardiology Clinic",
    is_active: true,
    created_at: "2026-01-01T08:00:00Z",
  },
  // 4. Dr. Ananya Sharma (DOC-1001) @ City Hospital (FAC-1001 / HSP-1001) — Friday Morning
  {
    id: "SES-1004",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_identifier: "HSP-1001",
    organization_name: "City Hospital — Bhubaneswar Main Campus",
    facility_id: "FAC-1001",
    department_id: "DEP-1001",
    department_name: "Cardiology & Cath Lab",
    day_of_week: 5, // Friday
    start_time: "08:00",
    end_time: "10:00",
    slot_display_time: "08:00 AM - 10:00 AM",
    capacity: 12,
    room_number: "OPD Room 102",
    session_name: "Morning Cardiology Clinic",
    is_active: true,
    created_at: "2026-01-01T08:00:00Z",
  },
  // 5. Dr. Ananya Sharma (DOC-1001) @ Green Care Clinic (CLN-1001 / FAC-1003 / FAC-2001) — Tuesday Evening
  {
    id: "SES-1005",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    organization_id: "11111111-1111-1111-1111-111111111103",
    organization_identifier: "CLN-1001",
    organization_name: "Green Care Clinic",
    facility_id: "FAC-2001",
    department_id: "DEP-2003",
    department_name: "Visiting Specialty & Cardiology Clinic",
    day_of_week: 2, // Tuesday
    start_time: "17:00",
    end_time: "19:00",
    slot_display_time: "05:00 PM - 07:00 PM",
    capacity: 10,
    room_number: "Consultation Room 1",
    session_name: "Specialist Evening Clinic",
    is_active: true,
    created_at: "2026-01-01T08:00:00Z",
  },
  // 6. Dr. Ananya Sharma (DOC-1001) @ Green Care Clinic (CLN-1001 / FAC-1003 / FAC-2001) — Thursday Evening
  {
    id: "SES-1006",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    organization_id: "11111111-1111-1111-1111-111111111103",
    organization_identifier: "CLN-1001",
    organization_name: "Green Care Clinic",
    facility_id: "FAC-2001",
    department_id: "DEP-2003",
    department_name: "Visiting Specialty & Cardiology Clinic",
    day_of_week: 4, // Thursday
    start_time: "17:00",
    end_time: "19:00",
    slot_display_time: "05:00 PM - 07:00 PM",
    capacity: 10,
    room_number: "Consultation Room 1",
    session_name: "Specialist Evening Clinic",
    is_active: true,
    created_at: "2026-01-01T08:00:00Z",
  },
  // 7. Dr. Ananya Sharma (DOC-1001) @ Green Care Hospital (HSP-1002 / FAC-1002 / FAC-1004) — Saturday Morning
  {
    id: "SES-1007",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    organization_id: "11111111-1111-1111-1111-111111111102",
    organization_identifier: "HSP-1002",
    organization_name: "Green Care Hospital — Cuttack Campus",
    facility_id: "FAC-1004",
    department_id: "DEP-1010",
    department_name: "Cardiovascular Outpatient Suite",
    day_of_week: 6, // Saturday
    start_time: "10:00",
    end_time: "13:00",
    slot_display_time: "10:00 AM - 01:00 PM",
    capacity: 15,
    room_number: "Visiting Suite 2",
    session_name: "Weekend Cardiology Consults",
    is_active: true,
    created_at: "2026-01-01T08:00:00Z",
  },
  // 8. Dr. Ananya Sharma (DOC-1001) @ Green Care Hospital (HSP-1002 / FAC-1002 / FAC-1004) — Tuesday Afternoon
  {
    id: "SES-1008",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    organization_id: "11111111-1111-1111-1111-111111111102",
    organization_identifier: "HSP-1002",
    organization_name: "Green Care Hospital — Cuttack Campus",
    facility_id: "FAC-1004",
    department_id: "DEP-1010",
    department_name: "Cardiovascular Outpatient Suite",
    day_of_week: 2, // Tuesday
    start_time: "14:00",
    end_time: "17:00",
    slot_display_time: "02:00 PM - 05:00 PM",
    capacity: 10,
    room_number: "Specialist Suite 204",
    session_name: "Visiting Specialist Cardiology",
    is_active: true,
    created_at: "2026-01-01T08:00:00Z",
  },
  // 9. Dr. Ananya Sharma (DOC-1001) @ Green Care Hospital (HSP-1002 / FAC-1002 / FAC-1004) — Thursday Afternoon
  {
    id: "SES-1009",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    organization_id: "11111111-1111-1111-1111-111111111102",
    organization_identifier: "HSP-1002",
    organization_name: "Green Care Hospital — Cuttack Campus",
    facility_id: "FAC-1004",
    department_id: "DEP-1010",
    department_name: "Cardiovascular Outpatient Suite",
    day_of_week: 4, // Thursday
    start_time: "14:00",
    end_time: "17:00",
    slot_display_time: "02:00 PM - 05:00 PM",
    capacity: 10,
    room_number: "Specialist Suite 204",
    session_name: "Visiting Specialist Cardiology",
    is_active: true,
    created_at: "2026-01-01T08:00:00Z",
  },
  // 9. Dr. Rahul Sharma (MULTI-1001) @ City Hospital (FAC-1001 / HSP-1001) — Tuesday Morning
  {
    id: "SES-2001",
    doctor_id: "MULTI-1001",
    doctor_name: "Dr. Rahul Sharma",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_identifier: "HSP-1001",
    organization_name: "City Hospital — Bhubaneswar Main Campus",
    facility_id: "FAC-1001",
    department_id: "DEP-1001",
    department_name: "Cardiology & Cath Lab",
    day_of_week: 2, // Tuesday
    start_time: "09:30",
    end_time: "11:30",
    slot_display_time: "09:30 AM - 11:30 AM",
    capacity: 10,
    room_number: "OPD Room 103",
    session_name: "Cardiology General Consult",
    is_active: true,
    created_at: "2026-01-01T08:00:00Z",
  },
  // 10. Dr. Rajesh Sharma (DOC-1002) @ City Hospital (FAC-1001 / HSP-1001) — Tuesday & Thursday Morning
  {
    id: "SES-1010",
    doctor_id: "DOC-1002",
    doctor_name: "Dr. Rajesh Sharma",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_identifier: "HSP-1001",
    organization_name: "City Hospital — Bhubaneswar Main Campus",
    facility_id: "FAC-1001",
    department_id: "DEP-1002",
    department_name: "General Medicine",
    day_of_week: 2, // Tuesday
    start_time: "09:00",
    end_time: "13:00",
    slot_display_time: "09:00 AM - 01:00 PM",
    capacity: 15,
    room_number: "OPD Room 201",
    session_name: "General Medicine Morning Clinic",
    is_active: true,
    created_at: "2026-01-01T08:00:00Z",
  },
  {
    id: "SES-1011",
    doctor_id: "DOC-1002",
    doctor_name: "Dr. Rajesh Sharma",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_identifier: "HSP-1001",
    organization_name: "City Hospital — Bhubaneswar Main Campus",
    facility_id: "FAC-1001",
    department_id: "DEP-1002",
    department_name: "General Medicine",
    day_of_week: 4, // Thursday
    start_time: "09:00",
    end_time: "13:00",
    slot_display_time: "09:00 AM - 01:00 PM",
    capacity: 15,
    room_number: "OPD Room 201",
    session_name: "General Medicine Morning Clinic",
    is_active: true,
    created_at: "2026-01-01T08:00:00Z",
  },
  // 10. Controlled Unit Test Doctor (DOC-TEST-99) @ HSP-TEST-99 — Capacity: 3
  {
    id: "SES-9901",
    doctor_id: "DOC-TEST-99",
    doctor_name: "Dr. Test One",
    organization_id: "99999999-9999-9999-9999-999999999999",
    organization_identifier: "HSP-TEST-99",
    organization_name: "Test Hospital Hub",
    facility_id: "FAC-TEST-99",
    department_id: "DEP-TEST-99",
    department_name: "Test Department",
    day_of_week: 1, // Monday
    start_time: "08:00",
    end_time: "10:00",
    slot_display_time: "08:00 AM - 10:00 AM",
    capacity: 3,
    room_number: "Test Room 1",
    session_name: "Test Capacity Session",
    is_active: true,
    created_at: "2026-01-01T08:00:00Z",
  },
  // 10. Single-Slot Race Condition Test Session (Capacity: 1)
  {
    id: "SES-9902",
    doctor_id: "DOC-TEST-99",
    doctor_name: "Dr. Test One",
    organization_id: "99999999-9999-9999-9999-999999999999",
    organization_identifier: "HSP-TEST-99",
    organization_name: "Test Hospital Hub",
    facility_id: "FAC-TEST-99",
    department_id: "DEP-TEST-99",
    department_name: "Test Department",
    day_of_week: 2, // Tuesday
    start_time: "08:00",
    end_time: "10:00",
    slot_display_time: "08:00 AM - 10:00 AM",
    capacity: 1,
    room_number: "Test Room 2",
    session_name: "Single-Slot Race Session",
    is_active: true,
    created_at: "2026-01-01T08:00:00Z",
  },
];

export const SEEDED_OVERRIDES: ScheduleOverride[] = [
  // 1. Dr. Ananya on leave on 2026-08-28 (Doctor Leave)
  {
    id: "OVR-1001",
    override_type: "DOCTOR_LEAVE",
    doctor_id: "DOC-1001",
    organization_identifier: "HSP-1001",
    facility_id: "FAC-1001",
    date: "2026-08-28",
    reason: "Attending National Cardiology Symposium (CME)",
    is_closed: true,
    created_at: "2026-08-01T08:00:00Z",
  },
  // 2. City Hospital Closed on 2026-10-02 (National Holiday)
  {
    id: "OVR-1002",
    override_type: "FACILITY_CLOSURE",
    organization_identifier: "HSP-1001",
    facility_id: "FAC-1001",
    date: "2026-10-02",
    reason: "National Holiday — Gandhi Jayanti (Emergency Ward Only)",
    is_closed: true,
    created_at: "2026-08-01T08:00:00Z",
  },
  // 3. Date-Specific Capacity Override for Dr. Ananya @ City Hospital on 2026-08-24 (Reduced to 6)
  {
    id: "OVR-1003",
    override_type: "CAPACITY_OVERRIDE",
    doctor_id: "DOC-1001",
    organization_identifier: "HSP-1001",
    facility_id: "FAC-1001",
    date: "2026-08-24",
    start_time: "08:00",
    end_time: "10:00",
    override_capacity: 6,
    reason: "Hospital Accreditation Audit Day — Half Capacity Scheduled",
    is_closed: false,
    created_at: "2026-08-01T08:00:00Z",
  },
];

export const SEEDED_APPOINTMENTS: Appointment[] = [
  // 1. Initial confirmed appointment for Patient A (Rahul Verma)
  {
    id: "APT-1001",
    appointment_no: "APT-1001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    patient_phone: "+91 98765 43210",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_identifier: "HSP-1001",
    organization_name: "City Hospital",
    facility_id: "FAC-1001",
    department_id: "DEP-CARD-1001",
    department_name: "Cardiology OPD",
    session_id: "SES-1001",
    appointment_date: "2026-08-24",
    session_start_time: "08:00",
    session_end_time: "10:00",
    slot_display_time: "08:00 AM - 10:00 AM Session",
    scheduled_time: "08:00",
    token_number: "01",
    status: "CONFIRMED",
    booking_source: "PATIENT",
    reason_for_visit: "Follow-up for essential hypertension & ECG review",
    opd_room: "Room 102",
    created_at: "2026-08-18T10:30:00Z",
  },
  // 2. Initial confirmed appointment for Patient B (Priya Sharma)
  {
    id: "APT-1002",
    appointment_no: "APT-1002",
    patient_id: "PAT-1002",
    patient_name: "Priya Sharma",
    patient_phone: "+91 98765 43211",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_identifier: "HSP-1001",
    organization_name: "City Hospital",
    facility_id: "FAC-1001",
    department_id: "DEP-CARD-1001",
    department_name: "Cardiology OPD",
    session_id: "SES-1001",
    appointment_date: "2026-08-24",
    session_start_time: "08:00",
    session_end_time: "10:00",
    slot_display_time: "08:00 AM - 10:00 AM Session",
    scheduled_time: "08:00",
    token_number: "02",
    status: "CONFIRMED",
    booking_source: "PATIENT",
    reason_for_visit: "Chest tightness and exertion palpitations checkup",
    opd_room: "Room 102",
    created_at: "2026-08-18T11:00:00Z",
  },
];

// ------------------------------------------------------------
// IN-MEMORY ACTIVE REPOSITORY
// ------------------------------------------------------------

class AppointmentRepository {
  private sessions: Map<string, DoctorWorkingSession> = new Map();
  private overrides: Map<string, ScheduleOverride> = new Map();
  private appointments: Map<string, Appointment> = new Map();

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.sessions.clear();
    this.overrides.clear();
    this.appointments.clear();

    SEEDED_DOCTOR_SESSIONS.forEach((s) => this.sessions.set(s.id, { ...s }));
    SEEDED_OVERRIDES.forEach((o) => this.overrides.set(o.id, { ...o }));
    SEEDED_APPOINTMENTS.forEach((a) => this.appointments.set(a.id, { ...a }));
  }

  // SESSIONS
  public getAllSessions(): DoctorWorkingSession[] {
    return Array.from(this.sessions.values());
  }

  public getSessionById(id: string): DoctorWorkingSession | null {
    if (!id) return null;
    const direct = this.sessions.get(id);
    if (direct) return direct;
    return this.getAllSessions().find((s) => s.id.toLowerCase() === id.toLowerCase()) || null;
  }

  public getDoctorSessions(doctorId: string, orgIdentifier?: string): DoctorWorkingSession[] {
    return this.getAllSessions().filter((s) => {
      const matchDoc = s.doctor_id.toLowerCase() === doctorId.toLowerCase();
      const matchOrg = orgIdentifier
        ? s.organization_identifier?.toLowerCase() === orgIdentifier.toLowerCase() ||
          s.facility_id?.toLowerCase() === orgIdentifier.toLowerCase() ||
          s.organization_id?.toLowerCase() === orgIdentifier.toLowerCase()
        : true;
      return matchDoc && matchOrg && s.is_active;
    });
  }

  public saveSession(session: DoctorWorkingSession): DoctorWorkingSession {
    const updated = {
      ...session,
      updated_at: new Date().toISOString(),
    };
    this.sessions.set(session.id, updated);
    return updated;
  }

  // OVERRIDES / LEAVES / CLOSURES
  public getAllOverrides(): ScheduleOverride[] {
    return Array.from(this.overrides.values());
  }

  public getOverridesForDate(date: string, doctorId?: string, orgIdentifier?: string): ScheduleOverride[] {
    return this.getAllOverrides().filter((o) => {
      if (o.date !== date) return false;
      if (o.override_type === "FACILITY_CLOSURE") {
        return orgIdentifier ? o.organization_identifier === orgIdentifier : true;
      }
      if (o.override_type === "DOCTOR_LEAVE") {
        return doctorId ? o.doctor_id === doctorId : true;
      }
      if (o.override_type === "CAPACITY_OVERRIDE") {
        const matchDoc = doctorId ? o.doctor_id === doctorId : true;
        const matchOrg = orgIdentifier ? o.organization_identifier === orgIdentifier : true;
        return matchDoc && matchOrg;
      }
      return true;
    });
  }

  public saveOverride(override: ScheduleOverride): ScheduleOverride {
    this.overrides.set(override.id, override);
    return override;
  }

  public deleteOverride(id: string): boolean {
    return this.overrides.delete(id);
  }

  // APPOINTMENTS
  public getAllAppointments(): Appointment[] {
    return Array.from(this.appointments.values());
  }

  public getAppointmentById(id: string): Appointment | null {
    if (!id) return null;
    const direct = this.appointments.get(id);
    if (direct) return direct;
    return (
      this.getAllAppointments().find(
        (a) => a.id.toLowerCase() === id.toLowerCase() || a.appointment_no.toLowerCase() === id.toLowerCase()
      ) || null
    );
  }

  public getAppointmentsForPatient(patientId: string): Appointment[] {
    return this.getAllAppointments()
      .filter((a) => a.patient_id === patientId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getAppointmentsForDoctor(doctorId: string, orgIdentifier?: string): Appointment[] {
    return this.getAllAppointments().filter((a) => {
      const matchDoc = a.doctor_id === doctorId;
      const matchOrg = orgIdentifier ? a.organization_identifier === orgIdentifier : true;
      return matchDoc && matchOrg;
    });
  }

  public getAppointmentsForSessionDate(sessionId: string, date: string): Appointment[] {
    return this.getAllAppointments().filter((a) => {
      return (
        a.session_id === sessionId &&
        a.appointment_date === date &&
        ["CONFIRMED", "REQUESTED", "CHECKED_IN", "WAITING", "IN_CONSULTATION"].includes(a.status)
      );
    });
  }

  public getAppointmentsForOrganization(orgIdentifier: string): Appointment[] {
    const clean = orgIdentifier.toLowerCase();
    return this.getAllAppointments().filter(
      (a) =>
        (a.organization_identifier && a.organization_identifier.toLowerCase() === clean) ||
        (a.organization_id && a.organization_id.toLowerCase() === clean) ||
        (a.facility_id && a.facility_id.toLowerCase() === clean)
    );
  }

  public getAppointmentsForFacility(facilityId: string): Appointment[] {
    const clean = facilityId.toLowerCase();
    return this.getAllAppointments().filter(
      (a) => a.facility_id && a.facility_id.toLowerCase() === clean
    );
  }

  public saveAppointment(appointment: Appointment): Appointment {
    const updated = {
      ...appointment,
      updated_at: new Date().toISOString(),
    };
    this.appointments.set(appointment.id, updated);
    return updated;
  }

  public deleteAppointment(id: string): boolean {
    return this.appointments.delete(id);
  }
}

// Global Singleton Instance
export const AppointmentStore = new AppointmentRepository();
