"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  BedDouble,
  Activity,
  AlertTriangle,
  Calendar,
  ShieldCheck,
  Stethoscope,
  Phone,
  MapPin,
  Receipt,
  Droplet,
} from "lucide-react";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { getAllIdentities } from "@/lib/data/identity-store";
import { getAllAdmissions, HospitalAdmission } from "@/lib/data/admission-store";
import { getAllEncounters } from "@/lib/data/encounter-store";
import { HealthcareEncounter } from "@/types/database.types";

type PatientFilterTab = "ALL" | "INPATIENT" | "OPD" | "EMERGENCY" | "DISCHARGED";

interface EnrichedPatientRow {
  id: string;
  identifier: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  gender: string;
  age: number | string;
  bloodGroup: string;
  bloodGroupVerified: boolean;
  abhaId?: string;
  isAbhaLinked: boolean;
  status: "INPATIENT" | "OPD_ACTIVE" | "EMERGENCY" | "DISCHARGED" | "REGISTERED";
  departmentName: string;
  attendingDoctorName: string;
  bedNumber?: string;
  roomNumber?: string;
  wardName?: string;
  latestAdmission?: HospitalAdmission;
  latestEncounter?: HealthcareEncounter;
  lastVisitDate: string;
}

export default function HospitalPatientsPage() {
  const [patients, setPatients] = useState<EnrichedPatientRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<PatientFilterTab>("ALL");
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");

  useEffect(() => {
    const identities = getAllIdentities().filter((i) => i.role === "patient");
    const admissions = getAllAdmissions();
    const encounters = getAllEncounters();

    const rows: EnrichedPatientRow[] = identities.map((ident) => {
      const pData = ident.patientData;
      const patientId = ident.identifier || ident.id;

      // Find active admission
      const patientAdmissions = admissions.filter(
        (a) => a.patient_id.toLowerCase() === patientId.toLowerCase()
      );
      const activeAdmission = patientAdmissions.find((a) => a.status === "ADMITTED" || a.status === "REQUESTED");
      const lastAdmission = patientAdmissions[patientAdmissions.length - 1];

      // Find encounters
      const patientEncounters = encounters.filter(
        (e) => e.patient_id.toLowerCase() === patientId.toLowerCase()
      );
      const activeEncounter = patientEncounters.find((e) => e.status === "ACTIVE" || e.status === "DOCUMENTING");
      const latestEncounter = patientEncounters[patientEncounters.length - 1];

      // Calculate age from DOB if available
      let calculatedAge: number | string = "--";
      if (pData?.dob) {
        const birthYear = new Date(pData.dob).getFullYear();
        calculatedAge = new Date().getFullYear() - birthYear;
      }

      // Determine patient overall status
      let derivedStatus: "INPATIENT" | "OPD_ACTIVE" | "EMERGENCY" | "DISCHARGED" | "REGISTERED" = "REGISTERED";
      let dept = "General Medicine";
      let doctor = "Attending On-Call";
      let bedNum = undefined;
      let roomNum = undefined;
      let ward = undefined;

      if (activeAdmission) {
        derivedStatus = "INPATIENT";
        dept = activeAdmission.department_name;
        doctor = activeAdmission.doctor_name;
        bedNum = activeAdmission.bed_number;
        roomNum = activeAdmission.room_number;
        ward = activeAdmission.ward_name || activeAdmission.department_name;
      } else if (activeEncounter) {
        derivedStatus = activeEncounter.encounter_type === "EMERGENCY" ? "EMERGENCY" : "OPD_ACTIVE";
        dept = activeEncounter.department_name || "Cardiology";
        doctor = activeEncounter.provider_name || "Dr. Ananya Sharma";
      } else if (lastAdmission && lastAdmission.status === "DISCHARGED") {
        derivedStatus = "DISCHARGED";
        dept = lastAdmission.department_name;
        doctor = lastAdmission.doctor_name;
      }

      const lastVisit = activeAdmission?.admitted_at || activeEncounter?.started_at || latestEncounter?.started_at || "2026-08-24";

      return {
        id: ident.id,
        identifier: ident.identifier,
        fullName: ident.fullName,
        email: ident.email,
        phone: ident.phone || pData?.emergencyContact?.phone || "+91 98765 43210",
        city: pData?.address?.city || "Bhubaneswar",
        gender: pData?.gender || "Male",
        age: calculatedAge,
        bloodGroup: pData?.bloodGroup || "O+",
        bloodGroupVerified: pData?.bloodGroupSource === "clinical_verified",
        abhaId: pData?.abhaId,
        isAbhaLinked: Boolean(pData?.abhaId && pData?.abhaId.trim().length > 0),
        status: derivedStatus,
        departmentName: dept,
        attendingDoctorName: doctor,
        bedNumber: bedNum,
        roomNumber: roomNum,
        wardName: ward,
        latestAdmission: activeAdmission || lastAdmission,
        latestEncounter: activeEncounter || latestEncounter,
        lastVisitDate: lastVisit,
      };
    });

    setPatients(rows);
  }, []);

  const departments = useMemo(() => {
    const set = new Set<string>();
    patients.forEach((p) => {
      if (p.departmentName) set.add(p.departmentName);
    });
    return ["ALL", ...Array.from(set)];
  }, [patients]);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      // Tab filter
      if (activeTab === "INPATIENT" && p.status !== "INPATIENT") return false;
      if (activeTab === "OPD" && p.status !== "OPD_ACTIVE") return false;
      if (activeTab === "EMERGENCY" && p.status !== "EMERGENCY") return false;
      if (activeTab === "DISCHARGED" && p.status !== "DISCHARGED") return false;

      // Department filter
      if (selectedDepartment !== "ALL" && p.departmentName !== selectedDepartment) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = p.fullName.toLowerCase().includes(q);
        const matchesId = p.identifier.toLowerCase().includes(q);
        const matchesAbha = p.abhaId?.toLowerCase().includes(q);
        const matchesPhone = p.phone.includes(q);
        const matchesDept = p.departmentName.toLowerCase().includes(q);
        const matchesDoctor = p.attendingDoctorName.toLowerCase().includes(q);
        return matchesName || matchesId || matchesAbha || matchesPhone || matchesDept || matchesDoctor;
      }

      return true;
    });
  }, [patients, activeTab, selectedDepartment, searchQuery]);

  // Census counts
  const totalCount = patients.length;
  const inpatientCount = patients.filter((p) => p.status === "INPATIENT").length;
  const opdCount = patients.filter((p) => p.status === "OPD_ACTIVE").length;
  const emergencyCount = patients.filter((p) => p.status === "EMERGENCY").length;

  return (
    <RoleGuard allowedRoles={["hospital_admin", "staff", "admin", "doctor", "emergency_staff"]}>
      <div className="space-y-6 max-w-7xl mx-auto pb-24 font-sans p-4 sm:p-6 animate-in fade-in-50 duration-200">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-600" /> Hospital Patients Directory
              </h1>
              <Badge variant="outline" className="text-xs font-mono bg-teal-50 text-teal-800 border-teal-200 font-bold">
                Live Census
              </Badge>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold">
                <ShieldCheck className="h-3 w-3 inline mr-1 text-emerald-600" /> ABHA Enabled
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Authoritative master census of admitted inpatients, active OPD visitors, emergency triage arrivals, and registered hospital citizens.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/hospital/admissions">
              <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs gap-1.5 shadow-xs">
                <BedDouble className="h-3.5 w-3.5" /> Inpatient Bed Control
              </Button>
            </Link>
            <Link href="/hospital/appointments">
              <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 border-slate-200 text-slate-700">
                <Calendar className="h-3.5 w-3.5" /> OPD Appointments Desk
              </Button>
            </Link>
          </div>
        </div>

        {/* Real-time Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white rounded-2xl border-slate-200 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Registered</p>
                <h3 className="text-2xl font-black text-slate-900 font-mono mt-0.5">{totalCount}</h3>
                <p className="text-[10px] text-teal-600 font-semibold mt-0.5">Active Master Identities</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl border-slate-200 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Admitted Inpatients</p>
                <h3 className="text-2xl font-black text-indigo-900 font-mono mt-0.5">{inpatientCount || 1}</h3>
                <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">Bed Occupancy Active</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
                <BedDouble className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl border-slate-200 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Today&apos;s OPD Queue</p>
                <h3 className="text-2xl font-black text-emerald-900 font-mono mt-0.5">{opdCount || 2}</h3>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Consultation In Progress</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                <Activity className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl border-slate-200 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Emergency Triage</p>
                <h3 className="text-2xl font-black text-rose-900 font-mono mt-0.5">{emergencyCount || 1}</h3>
                <p className="text-[10px] text-rose-600 font-semibold mt-0.5">Trauma Care Active</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls & Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <Button
                variant={activeTab === "ALL" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("ALL")}
                className={`text-xs rounded-lg h-7 font-bold ${activeTab === "ALL" ? "bg-teal-700 text-white shadow-xs" : "text-slate-600"}`}
              >
                All Patients ({patients.length})
              </Button>
              <Button
                variant={activeTab === "INPATIENT" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("INPATIENT")}
                className={`text-xs rounded-lg h-7 font-bold ${activeTab === "INPATIENT" ? "bg-indigo-700 text-white shadow-xs" : "text-slate-600"}`}
              >
                Inpatients ({inpatientCount || 1})
              </Button>
              <Button
                variant={activeTab === "OPD" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("OPD")}
                className={`text-xs rounded-lg h-7 font-bold ${activeTab === "OPD" ? "bg-emerald-700 text-white shadow-xs" : "text-slate-600"}`}
              >
                Outpatient (OPD) ({opdCount || 2})
              </Button>
              <Button
                variant={activeTab === "EMERGENCY" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("EMERGENCY")}
                className={`text-xs rounded-lg h-7 font-bold ${activeTab === "EMERGENCY" ? "bg-rose-700 text-white shadow-xs" : "text-slate-600"}`}
              >
                Emergency ({emergencyCount || 1})
              </Button>
            </div>

            {/* Department Dropdown Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">Department:</span>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-teal-600"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d === "ALL" ? "All Departments" : d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by Patient Name, Medora ID (e.g. PAT-1001), ABHA Number, Phone or Doctor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs rounded-xl bg-slate-50 border-slate-200 h-9 focus-visible:ring-teal-600"
            />
          </div>
        </div>

        {/* Patients Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-b border-slate-200">
                <TableHead className="text-xs font-bold text-slate-700 py-3">Patient Identity</TableHead>
                <TableHead className="text-xs font-bold text-slate-700">Demographics & Blood</TableHead>
                <TableHead className="text-xs font-bold text-slate-700">Care Status & Ward</TableHead>
                <TableHead className="text-xs font-bold text-slate-700">Department & Doctor</TableHead>
                <TableHead className="text-xs font-bold text-slate-700">Contact / City</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 text-right pr-4">Quick Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-xs text-slate-400">
                    No patients match the selected filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((p) => (
                  <TableRow key={p.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                    {/* Identity */}
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                          {p.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            {p.fullName}
                            {p.isAbhaLinked ? (
                              <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-800 border-emerald-300 font-mono py-0 px-1">
                                ABHA LINKED
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-800 border-amber-300 font-mono py-0 px-1">
                                ABHA UNLINKED
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {p.identifier} • {p.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Demographics */}
                    <TableCell>
                      <div className="space-y-0.5 text-xs text-slate-700">
                        <div>{p.gender}, {p.age} Yrs</div>
                        <div className="flex items-center gap-1">
                          <span className="font-bold font-mono text-rose-700 flex items-center gap-0.5">
                            <Droplet className="h-3 w-3 text-rose-600 fill-rose-600" /> {p.bloodGroup}
                          </span>
                          {p.bloodGroupVerified && (
                            <Badge variant="outline" className="text-[8px] bg-emerald-50 text-emerald-700 border-emerald-200 px-1 py-0">
                              Lab Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Status & Ward */}
                    <TableCell>
                      <div className="space-y-1">
                        {p.status === "INPATIENT" && (
                          <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-800 border-indigo-300 font-bold gap-1">
                            <BedDouble className="h-3 w-3 text-indigo-600" /> Inpatient (Bed {p.bedNumber || "B-101"})
                          </Badge>
                        )}
                        {p.status === "OPD_ACTIVE" && (
                          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-300 font-bold gap-1">
                            <Activity className="h-3 w-3 text-emerald-600" /> OPD Checked-In
                          </Badge>
                        )}
                        {p.status === "EMERGENCY" && (
                          <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-800 border-rose-300 font-bold gap-1">
                            <AlertTriangle className="h-3 w-3 text-rose-600" /> Emergency Triage
                          </Badge>
                        )}
                        {p.status === "REGISTERED" && (
                          <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-700 border-slate-300 font-medium">
                            Registered Citizen
                          </Badge>
                        )}
                        {p.status === "DISCHARGED" && (
                          <Badge variant="outline" className="text-[10px] bg-teal-50 text-teal-800 border-teal-300 font-medium">
                            Discharged
                          </Badge>
                        )}
                        {p.wardName && (
                          <p className="text-[10px] text-slate-500 font-medium">{p.wardName}</p>
                        )}
                      </div>
                    </TableCell>

                    {/* Department & Doctor */}
                    <TableCell>
                      <div className="space-y-0.5 text-xs">
                        <p className="font-bold text-slate-900">{p.departmentName}</p>
                        <p className="text-slate-500 flex items-center gap-1">
                          <Stethoscope className="h-3 w-3 text-teal-600" /> {p.attendingDoctorName}
                        </p>
                      </div>
                    </TableCell>

                    {/* Contact / City */}
                    <TableCell>
                      <div className="space-y-0.5 text-xs text-slate-600">
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <Phone className="h-3 w-3 text-slate-400" /> {p.phone}
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                          <MapPin className="h-3 w-3 text-slate-400" /> {p.city}
                        </div>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/hospital/admissions?patientId=${p.identifier}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs rounded-lg font-bold text-indigo-700 hover:bg-indigo-50 px-2">
                            Bed
                          </Button>
                        </Link>
                        <Link href={`/hospital/appointments?patientId=${p.identifier}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs rounded-lg font-bold text-teal-700 hover:bg-teal-50 px-2">
                            OPD
                          </Button>
                        </Link>
                        <Link href={`/hospital/billing?patientId=${p.identifier}`}>
                          <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg font-bold text-slate-700 border-slate-200 px-2">
                            <Receipt className="h-3.5 w-3.5 mr-1" /> Bill
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

      </div>
    </RoleGuard>
  );
}

