// ============================================================
// MEDORA — HISTORICAL CONSULTATION DURATION REPOSITORY
// MODIFICATION PHASE B.3
// ============================================================

import { HistoricalConsultationMetric } from "@/types/database.types";

export interface StoredConsultationDurationRecord {
  id: string;
  doctor_id: string;
  doctor_name: string;
  organization_identifier: string;
  facility_id: string;
  department_id: string;
  department_name: string;
  date: string;
  duration_minutes: number;
  started_at: string;
  completed_at: string;
  created_at: string;
}

const STORAGE_KEY = "medora_consultation_history_store";

// Realistic historical duration seeds (Phase B.3)
const createSeededDurations = (): StoredConsultationDurationRecord[] => {
  const records: StoredConsultationDurationRecord[] = [];
  const baseDate = "2026-08-19";

  // 1. Dr. Ananya Sharma @ City Hospital (Cardiology OPD) — Median ~14 mins
  const ananyaHspDurations = [12, 14, 15, 11, 16, 13, 18, 14, 15, 12, 20, 10, 14, 16, 15, 13, 12, 17, 15, 14];
  ananyaHspDurations.forEach((dur, idx) => {
    records.push({
      id: `cdur-ananya-hsp-${idx + 1}`,
      doctor_id: "DOC-1001",
      doctor_name: "Dr. Ananya Sharma",
      organization_identifier: "HSP-1001",
      facility_id: "FAC-1001",
      department_id: "DEP-CARD-1001",
      department_name: "Cardiology OPD",
      date: baseDate,
      duration_minutes: dur,
      started_at: `2026-08-19T08:${String(idx * 5).padStart(2, "0")}:00Z`,
      completed_at: `2026-08-19T08:${String(idx * 5 + dur).padStart(2, "0")}:00Z`,
      created_at: "2026-08-19T10:00:00Z",
    });
  });

  // 2. Dr. Rahul Sharma @ City Hospital (General Medicine) — Median ~8 mins
  const rahulHspDurations = [7, 8, 9, 8, 10, 7, 8, 9, 6, 8, 9, 10, 8, 7, 9];
  rahulHspDurations.forEach((dur, idx) => {
    records.push({
      id: `cdur-rahul-hsp-${idx + 1}`,
      doctor_id: "MULTI-1001",
      doctor_name: "Dr. Rahul Sharma",
      organization_identifier: "HSP-1001",
      facility_id: "FAC-1001",
      department_id: "DEP-GEN-1001",
      department_name: "General Medicine",
      date: baseDate,
      duration_minutes: dur,
      started_at: `2026-08-19T09:${String(idx * 5).padStart(2, "0")}:00Z`,
      completed_at: `2026-08-19T09:${String(idx * 5 + dur).padStart(2, "0")}:00Z`,
      created_at: "2026-08-19T11:00:00Z",
    });
  });

  // 3. Dr. Ananya Sharma @ Green Care Clinic (Cardiology Day Care) — Median ~10 mins
  const ananyaClnDurations = [10, 11, 12, 10, 9, 11, 12, 10, 11, 10];
  ananyaClnDurations.forEach((dur, idx) => {
    records.push({
      id: `cdur-ananya-cln-${idx + 1}`,
      doctor_id: "DOC-1001",
      doctor_name: "Dr. Ananya Sharma",
      organization_identifier: "CLN-1001",
      facility_id: "FAC-1003",
      department_id: "DEP-CARD-1003",
      department_name: "Cardiology Day Care",
      date: baseDate,
      duration_minutes: dur,
      started_at: `2026-08-19T14:${String(idx * 5).padStart(2, "0")}:00Z`,
      completed_at: `2026-08-19T14:${String(idx * 5 + dur).padStart(2, "0")}:00Z`,
      created_at: "2026-08-19T16:00:00Z",
    });
  });

  return records;
};

// Robust Statistical Calculator for Medians and Percentiles
export function computeDurationDistribution(durations: number[]): {
  median: number;
  p25: number;
  p75: number;
  min: number;
  max: number;
  count: number;
} {
  // 1. Data Quality Filter: Filter out invalid, negative, or extreme non-clinical records (>240m)
  const valid = durations
    .filter((d) => typeof d === "number" && !isNaN(d) && d > 0 && d <= 240)
    .sort((a, b) => a - b);

  if (valid.length === 0) {
    return { median: 12, p25: 8, p75: 16, min: 5, max: 30, count: 0 };
  }

  const count = valid.length;

  const getPercentile = (p: number) => {
    const pos = (count - 1) * p;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (valid[base + 1] !== undefined) {
      return valid[base] + rest * (valid[base + 1] - valid[base]);
    }
    return valid[base];
  };

  const p25 = Math.round(getPercentile(0.25) * 10) / 10;
  const median = Math.round(getPercentile(0.5) * 10) / 10;
  const p75 = Math.round(getPercentile(0.75) * 10) / 10;
  const min = valid[0];
  const max = valid[valid.length - 1];

  return { median, p25, p75, min, max, count };
}

class ConsultationHistoryStoreClass {
  private records: Map<string, StoredConsultationDurationRecord> = new Map();
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.isInitialized) return;

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: StoredConsultationDurationRecord[] = JSON.parse(stored);
          parsed.forEach((r) => this.records.set(r.id.toLowerCase(), r));
          this.isInitialized = true;
          return;
        }
      } catch (err) {
        console.warn("ConsultationHistoryStore: Failed to load from localStorage", err);
      }
    }

    const seeds = createSeededDurations();
    seeds.forEach((r) => this.records.set(r.id.toLowerCase(), r));
    this.persist();
    this.isInitialized = true;
  }

  private persist() {
    if (typeof window !== "undefined") {
      try {
        const list = Array.from(this.records.values());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch (err) {
        // storage quota
      }
    }
  }

  public reset() {
    this.records.clear();
    const seeds = createSeededDurations();
    seeds.forEach((r) => this.records.set(r.id.toLowerCase(), r));
    this.persist();
  }

  public getAllRecords(): StoredConsultationDurationRecord[] {
    return Array.from(this.records.values());
  }

  public recordCompletedConsultation(params: {
    doctor_id: string;
    doctor_name: string;
    organization_identifier: string;
    facility_id: string;
    department_id: string;
    department_name: string;
    date: string;
    started_at: string;
    completed_at: string;
  }): StoredConsultationDurationRecord | null {
    const start = new Date(params.started_at).getTime();
    const end = new Date(params.completed_at).getTime();

    // Data Quality Check: Completion must not precede start
    if (isNaN(start) || isNaN(end) || end < start) {
      console.warn("ConsultationHistoryStore: Invalid consultation timestamps", params);
      return null;
    }

    const durationMinutes = Math.max(1, Math.round((end - start) / 60000));

    // Sanity check: Exclude corrupted > 240 mins
    if (durationMinutes > 240) {
      return null;
    }

    const id = `cdur-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const record: StoredConsultationDurationRecord = {
      id,
      doctor_id: params.doctor_id,
      doctor_name: params.doctor_name,
      organization_identifier: params.organization_identifier,
      facility_id: params.facility_id,
      department_id: params.department_id,
      department_name: params.department_name,
      date: params.date,
      duration_minutes: durationMinutes,
      started_at: params.started_at,
      completed_at: params.completed_at,
      created_at: new Date().toISOString(),
    };

    this.records.set(id.toLowerCase(), record);
    this.persist();
    return record;
  }

  /**
   * Fallback Hierarchy Resolver for Consultation Duration Statistics:
   * Level 1: Doctor + Facility + Department (Count >= 5)
   * Level 2: Doctor + Department (Count >= 3)
   * Level 3: Department Baseline (Count >= 3)
   * Level 4: Facility/Specialty Configured Baseline
   * Level 5: System Global Fallback
   */
  public getConsultationMetrics(
    doctorId?: string,
    orgIdentifier?: string,
    departmentId?: string
  ): HistoricalConsultationMetric {
    const all = this.getAllRecords();

    // Level 1: Doctor + Facility + Department
    if (doctorId && orgIdentifier && departmentId) {
      const matchLevel1 = all.filter(
        (r) =>
          r.doctor_id === doctorId &&
          r.organization_identifier === orgIdentifier &&
          r.department_id === departmentId
      );
      if (matchLevel1.length >= 5) {
        const dist = computeDurationDistribution(matchLevel1.map((r) => r.duration_minutes));
        return {
          doctor_id: doctorId,
          doctor_name: matchLevel1[0]?.doctor_name,
          organization_identifier: orgIdentifier,
          department_id: departmentId,
          department_name: matchLevel1[0]?.department_name,
          sample_size: dist.count,
          median_minutes: dist.median,
          p25_minutes: dist.p25,
          p75_minutes: dist.p75,
          min_minutes: dist.min,
          max_minutes: dist.max,
          source_level: "DOCTOR_FACILITY",
        };
      }
    }

    // Level 2: Doctor + Department (across any facility)
    if (doctorId && departmentId) {
      const matchLevel2 = all.filter((r) => r.doctor_id === doctorId && r.department_id === departmentId);
      if (matchLevel2.length >= 3) {
        const dist = computeDurationDistribution(matchLevel2.map((r) => r.duration_minutes));
        return {
          doctor_id: doctorId,
          doctor_name: matchLevel2[0]?.doctor_name,
          organization_identifier: orgIdentifier,
          department_id: departmentId,
          department_name: matchLevel2[0]?.department_name,
          sample_size: dist.count,
          median_minutes: dist.median,
          p25_minutes: dist.p25,
          p75_minutes: dist.p75,
          min_minutes: dist.min,
          max_minutes: dist.max,
          source_level: "DOCTOR_DEPARTMENT",
        };
      }
    }

    // Level 3: Department (across all doctors in department)
    if (departmentId) {
      const matchLevel3 = all.filter((r) => r.department_id === departmentId);
      if (matchLevel3.length >= 3) {
        const dist = computeDurationDistribution(matchLevel3.map((r) => r.duration_minutes));
        return {
          organization_identifier: orgIdentifier,
          department_id: departmentId,
          department_name: matchLevel3[0]?.department_name,
          sample_size: dist.count,
          median_minutes: dist.median,
          p25_minutes: dist.p25,
          p75_minutes: dist.p75,
          min_minutes: dist.min,
          max_minutes: dist.max,
          source_level: "DEPARTMENT",
        };
      }
    }

    // Level 4 & 5: Configured Specialty Baseline Fallbacks
    if (departmentId?.includes("CARD")) {
      return {
        department_id: departmentId,
        department_name: "Cardiology",
        sample_size: 0,
        median_minutes: 15,
        p25_minutes: 10,
        p75_minutes: 20,
        min_minutes: 5,
        max_minutes: 35,
        source_level: "FACILITY_DEFAULT",
      };
    } else if (departmentId?.includes("GEN")) {
      return {
        department_id: departmentId,
        department_name: "General Medicine",
        sample_size: 0,
        median_minutes: 8,
        p25_minutes: 6,
        p75_minutes: 12,
        min_minutes: 4,
        max_minutes: 25,
        source_level: "FACILITY_DEFAULT",
      };
    } else if (departmentId?.includes("PED")) {
      return {
        department_id: departmentId,
        department_name: "Pediatrics",
        sample_size: 0,
        median_minutes: 12,
        p25_minutes: 8,
        p75_minutes: 16,
        min_minutes: 5,
        max_minutes: 30,
        source_level: "FACILITY_DEFAULT",
      };
    }

    // Default System Baseline
    return {
      sample_size: 0,
      median_minutes: 12,
      p25_minutes: 8,
      p75_minutes: 18,
      min_minutes: 5,
      max_minutes: 30,
      source_level: "SYSTEM_FALLBACK",
    };
  }
}

export const ConsultationHistoryStore = new ConsultationHistoryStoreClass();
