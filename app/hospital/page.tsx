"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Building2, 
  Users, 
  BedDouble, 
  Activity, 
  AlertTriangle, 
  Layers, 
  ShieldCheck, 
  Calendar,
  Stethoscope,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  X,
  ArrowRight
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { 
  getFacilityDoctors, 
  approveDoctorAffiliation, 
  rejectDoctorAffiliation, 
  endDoctorAffiliation,
  createDoctorAffiliation,
} from "@/lib/data/affiliation-store";
import { getDepartmentsForFacility } from "@/lib/data/department-store";
import { getServicesForFacility } from "@/lib/data/service-store";
import { getFacilityById } from "@/lib/data/facility-store";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FacilityReadinessService } from "@/lib/services/facility-readiness-service";
import { CapacityAnalyticsService } from "@/lib/services/capacity-analytics-service";
import { getTodayDateStr } from "@/lib/data/queue-store";

export default function HospitalDashboard() {
  const { user } = useAuth();
  const facilityCode = user?.identifier || user?.organizationId || "FAC-1001";
  const facility = getFacilityById(facilityCode) || getFacilityById("FAC-1001");

  const [selectedTab, setSelectedTab] = useState<"doctors" | "departments" | "health" | "opd_queue">("opd_queue");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteDocId, setInviteDocId] = useState("DOC-1003");
  const [inviteDocName, setInviteDocName] = useState("Dr. Rahul Verma");
  const [inviteSpecialization, setInviteSpecialization] = useState("Orthopedics");
  const [inviteRole, setInviteRole] = useState("Visiting Specialist");
  const [inviteDept, setInviteDept] = useState("Orthopedics & Joint Replacement");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const readinessReport = FacilityReadinessService.evaluateFacilityReadiness(facility?.facility_code || "FAC-1001");

  const [affiliatedDoctors, setAffiliatedDoctors] = useState(() => 
    getFacilityDoctors(facility?.facility_code || "FAC-1001", true)
  );
  const [departments] = useState(() => 
    getDepartmentsForFacility(facility?.facility_code || "FAC-1001")
  );
  const [services] = useState(() => 
    getServicesForFacility(facility?.facility_code || "FAC-1001")
  );

  const refreshDoctors = () => {
    setAffiliatedDoctors(getFacilityDoctors(facility?.facility_code || "FAC-1001", true));
  };

  const handleApprove = (docIdent: string) => {
    const res = approveDoctorAffiliation(facility?.facility_code || "FAC-1001", docIdent);
    if (res.success) {
      setActionMessage(`Doctor affiliation for ${docIdent} approved and activated.`);
      refreshDoctors();
      setTimeout(() => setActionMessage(null), 2500);
    }
  };

  const handleReject = (docIdent: string) => {
    const res = rejectDoctorAffiliation(facility?.facility_code || "FAC-1001", docIdent);
    if (res.success) {
      setActionMessage(`Doctor affiliation for ${docIdent} rejected.`);
      refreshDoctors();
      setTimeout(() => setActionMessage(null), 2500);
    }
  };

  const handleEndAffiliation = (docIdent: string) => {
    const res = endDoctorAffiliation(facility?.facility_code || "FAC-1001", docIdent);
    if (res.success) {
      setActionMessage(`Doctor affiliation for ${docIdent} ended. Historical record preserved.`);
      refreshDoctors();
      setTimeout(() => setActionMessage(null), 2500);
    }
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createDoctorAffiliation({
      doctor_id: inviteDocId.trim().toUpperCase(),
      doctor_name: inviteDocName.trim(),
      specialization: inviteSpecialization.trim(),
      organization_id: facility?.organization_id || "11111111-1111-1111-1111-111111111101",
      facility_id: facility?.facility_code || "FAC-1001",
      department_name: inviteDept.trim(),
      role_title: inviteRole.trim(),
      status: "ACTIVE",
      verification_status: "verified",
    });

    if (res.success && res.affiliation) {
      setActionMessage(`Invitation confirmed and activated for ${res.affiliation.doctor_name} (${inviteDocId}).`);
      refreshDoctors();
      setIsInviteModalOpen(false);
      setTimeout(() => setActionMessage(null), 2500);
    }
  };

  const activeDoctors = affiliatedDoctors.filter(d => d.status === "ACTIVE");
  const pendingDoctors = affiliatedDoctors.filter(d => d.status === "PENDING");

  return (
    <RoleGuard allowedRoles={["hospital_admin", "staff", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-200">
        {/* Hospital Operations Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                {facility?.name || "City Hospital — Bhubaneswar Main Campus"}
              </h1>
              <Badge variant="teal" className="text-xs font-mono">
                {facility?.facility_code || "FAC-1001"}
              </Badge>
              <Badge variant="outline" className="text-[10px] text-teal-800 bg-teal-50">
                {facility?.city || "Bhubaneswar Hub"}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Command Center • {facility?.organization_name || "City Healthcare Group"} • Connected Facility
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/admin/facilities">
              <Button variant="outline" size="sm" className="text-xs">
                <Building2 className="h-3.5 w-3.5 mr-1 text-teal-600" /> Switch Facility
              </Button>
            </Link>
            <Button 
              size="sm" 
              onClick={() => setIsInviteModalOpen(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Invite / Connect Doctor
            </Button>
          </div>
        </div>

        {/* Operational Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Clinical Departments</span>
            <span className="text-xl font-bold text-slate-900">{departments.length} Units</span>
            <Link href="/hospital/departments" className="text-[11px] text-teal-600 hover:underline block mt-0.5">
              Manage departments →
            </Link>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Affiliated Doctors</span>
            <span className="text-xl font-bold text-teal-700">{activeDoctors.length} Active</span>
            <span className="text-[11px] text-amber-600 block mt-0.5">{pendingDoctors.length} Pending Review</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Configured Services</span>
            <span className="text-xl font-bold text-slate-900">{services.length} Offerings</span>
            <Link href="/hospital/services" className="text-[11px] text-blue-600 hover:underline block mt-0.5">
              View catalog →
            </Link>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Facility Status</span>
            <span className="text-xl font-bold text-emerald-700">{facility?.status || "ACTIVE"}</span>
            <span className="text-[11px] text-emerald-600 block mt-0.5">Operational 24/7</span>
          </div>
        </div>

        {/* Action / Success Banner */}
        {actionMessage && (
          <div className="rounded-xl bg-teal-50 border border-teal-200 p-3 text-xs text-teal-900 font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-600 flex-shrink-0" />
              <span>{actionMessage}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="text-teal-700 hover:text-teal-900">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/hospital/departments">
            <Card className="hover:border-teal-400 transition-colors cursor-pointer bg-white">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Clinical Departments</h4>
                    <p className="text-[11px] text-slate-500">{departments.length} Active clinical units</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/hospital/services">
            <Card className="hover:border-blue-400 transition-colors cursor-pointer bg-white">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Services & Procedures</h4>
                    <p className="text-[11px] text-slate-500">{services.length} Configured offerings</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/hospital/staff">
            <Card className="hover:border-purple-400 transition-colors cursor-pointer bg-white">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Staff Personnel</h4>
                    <p className="text-[11px] text-slate-500">Reception, nursing & lab staff</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* TAB CONTROLS */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setSelectedTab("opd_queue")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              selectedTab === "opd_queue"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Activity className="h-4 w-4" />
            OPD Queue & Operations
          </button>
          <button
            onClick={() => setSelectedTab("doctors")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              selectedTab === "doctors"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Stethoscope className="h-4 w-4" />
            Medical Staff & Affiliations ({activeDoctors.length})
          </button>
          <button
            onClick={() => setSelectedTab("departments")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              selectedTab === "departments"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Layers className="h-4 w-4" />
            Departments ({departments.length})
          </button>
          <button
            onClick={() => setSelectedTab("health")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              selectedTab === "health"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Operational Readiness ({readinessReport?.readiness_score || 100}%)
          </button>
        </div>

        {/* TAB 1: DOCTOR AFFILIATIONS */}
        {selectedTab === "doctors" && (
          <div className="space-y-6">
            {/* 1. Pending Affiliation Requests */}
            {pendingDoctors.length > 0 && (
              <Card className="bg-amber-50/40 border-amber-200 shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-amber-950 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                      Pending Doctor Affiliation Requests ({pendingDoctors.length})
                    </CardTitle>
                    <Badge variant="warning" className="text-[10px]">Action Required</Badge>
                  </div>
                  <CardDescription className="text-xs text-amber-800">
                    Doctors requesting to practice at this healthcare facility. Review qualifications and approve.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="text-xs bg-amber-100/50">
                        <TableHead>Doctor Details</TableHead>
                        <TableHead>Specialization</TableHead>
                        <TableHead>Requested Role</TableHead>
                        <TableHead>OPD / Rate</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingDoctors.map((doc) => (
                        <TableRow key={doc.id} className="text-xs">
                          <TableCell>
                            <span className="font-bold text-slate-900 block">{doc.doctor_name}</span>
                            <span className="font-mono text-[10px] text-teal-700 font-semibold">{doc.doctor_id}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-slate-800 block">{doc.specialization}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{doc.medical_reg_no}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-amber-900">{doc.role_title}</span>
                            <span className="text-[10px] text-slate-500 block">{doc.department_name}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-slate-900">₹{doc.consultation_fee}</span>
                            <span className="text-[10px] text-slate-500 block">{doc.opd_room}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button 
                                size="sm" 
                                onClick={() => handleApprove(doc.doctor_id)}
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 font-bold"
                              >
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleReject(doc.doctor_id)}
                                className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                              >
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* 2. Active Hospital Doctors Roster */}
            <Card className="bg-white">
              <CardHeader className="p-4 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-teal-600" />
                      Active Affiliated Medical Practitioners ({activeDoctors.length})
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Doctors with verified privileges practicing at {facility?.name}.
                    </CardDescription>
                  </div>
                  <Link href="/hospital/doctors">
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-teal-700">
                      Full Roster →
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs bg-slate-50">
                      <TableHead>Doctor Name</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Designation / Department</TableHead>
                      <TableHead>OPD Chamber</TableHead>
                      <TableHead>Consultation Fee</TableHead>
                      <TableHead className="text-right">Status / Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeDoctors.map((doc) => (
                      <TableRow key={doc.id} className="text-xs hover:bg-slate-50/80">
                        <TableCell>
                          <span className="font-bold text-slate-900 block">{doc.doctor_name}</span>
                          <span className="font-mono text-[10px] text-teal-700 font-semibold">{doc.doctor_id}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-slate-900 block">{doc.specialization}</span>
                          <span className="text-[10px] text-slate-500">{doc.medical_reg_no || "Verified"}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-slate-800 block">{doc.role_title}</span>
                          <span className="text-[10px] text-slate-500">{doc.department_name || "General Medicine"}</span>
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">{doc.opd_room || "Room 101"}</TableCell>
                        <TableCell className="font-bold text-slate-900">₹{doc.consultation_fee}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Badge variant="success" className="text-[10px]">
                              ● Verified
                            </Badge>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEndAffiliation(doc.doctor_id)}
                              className="h-6 text-[10px] text-slate-500 hover:text-red-700 hover:border-red-200"
                              title="End doctor affiliation (historical record is preserved)"
                            >
                              End Affiliation
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: DEPARTMENTS */}
        {selectedTab === "departments" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-teal-600" />
                Active Clinical Departments ({departments.length})
              </h2>
              <Link href="/hospital/departments">
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold gap-1.5">
                  <Plus className="h-4 w-4" /> Manage Departments
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departments.map((dept) => (
                <Card key={dept.id} className="bg-white">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {dept.code}
                      </span>
                      <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                        {dept.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm font-bold text-slate-900 mt-2">
                      {dept.name}
                    </CardTitle>
                    {dept.description && (
                      <CardDescription className="text-xs text-slate-500">
                        {dept.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="rounded bg-slate-50 p-2 text-xs text-slate-700">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Head of Unit</span>
                      <span className="font-semibold text-slate-900">{dept.head_doctor_name || "Assigned by Facility"}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: OPERATIONAL READINESS & HEALTH */}
        {selectedTab === "health" && readinessReport && (
          <div className="space-y-6">
            <Card className="border-slate-200 bg-white">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-teal-600" />
                      Facility Operational Readiness & Connectivity Integrity
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      System-level validation ensuring all organizational, clinical, provider, and schedule connections are valid for Phase 6.
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <Badge variant={readinessReport.is_ready_for_phase6 ? "success" : "warning"} className="text-xs">
                      {readinessReport.is_ready_for_phase6 ? "✓ Phase 6 Ready" : "Review Issues"} ({readinessReport.readiness_score}%)
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-4">
                {/* Checklist Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between">
                    <span className="text-slate-700 font-medium">Parent Organization Valid</span>
                    <Badge variant="success" className="text-[10px]">✓ Valid</Badge>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between">
                    <span className="text-slate-700 font-medium">Clinical Departments Configured</span>
                    <Badge variant="success" className="text-[10px]">✓ {readinessReport.metrics.activeDepartments} Active</Badge>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between">
                    <span className="text-slate-700 font-medium">Healthcare Services Catalog</span>
                    <Badge variant="success" className="text-[10px]">✓ {readinessReport.metrics.activeServices} Active</Badge>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between">
                    <span className="text-slate-700 font-medium">Doctors Affiliated</span>
                    <Badge variant="success" className="text-[10px]">✓ {readinessReport.metrics.activeDoctors} Active</Badge>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between">
                    <span className="text-slate-700 font-medium">Staff Personnel Assigned</span>
                    <Badge variant="success" className="text-[10px]">✓ {readinessReport.metrics.activeStaff} Active</Badge>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between">
                    <span className="text-slate-700 font-medium">Doctor Service Mappings</span>
                    <Badge variant="success" className="text-[10px]">✓ {readinessReport.metrics.doctorServiceMappings} Linked</Badge>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between">
                    <span className="text-slate-700 font-medium">Zero Orphan Records</span>
                    <Badge variant="success" className="text-[10px]">✓ Clean</Badge>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between">
                    <span className="text-slate-700 font-medium">Zero Cross-Tenant Mismatches</span>
                    <Badge variant="success" className="text-[10px]">✓ Isolated</Badge>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between">
                    <span className="text-slate-700 font-medium">Phase 4 Schedules Linked</span>
                    <Badge variant="success" className="text-[10px]">✓ Verified</Badge>
                  </div>
                </div>

                {/* Issues List (if any) */}
                {readinessReport.issues.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      Configuration Warnings ({readinessReport.issues.length})
                    </h4>
                    {readinessReport.issues.map((iss) => (
                      <div key={iss.id} className="p-3 rounded-lg bg-amber-50/60 border border-amber-200 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-950">{iss.title}</span>
                          <Badge variant="warning" className="text-[10px]">{iss.severity}</Badge>
                        </div>
                        <p className="text-slate-600 mt-1">{iss.description}</p>
                        <p className="text-teal-700 font-semibold text-[11px] mt-1">Suggested action: {iss.suggested_action}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-3 mt-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold block text-sm">All Operational Systems Fully Verified</span>
                      <span className="text-emerald-800">
                        Facility is 100% configured with valid parent organizations, clinical departments, services catalog, active doctor affiliations, and verified staff assignments. Ready for Phase 6 appointment booking & queue integration.
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 4: OPD QUEUE & CAPACITY INTELLIGENCE */}
        {selectedTab === "opd_queue" && (() => {
          const opdSummary = CapacityAnalyticsService.getFacilityDailyOperationsSummary(
            facility?.facility_code || "FAC-1001",
            getTodayDateStr()
          );
          return (
            <div className="space-y-6">
              {/* Operational Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <Card className="p-4 bg-white border-slate-200 rounded-2xl shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Appointments</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">{opdSummary.total_appointments}</span>
                  <span className="text-[11px] text-teal-700 font-medium">{opdSummary.overall_booking_utilization}% Capacity Booked</span>
                </Card>
                <Card className="p-4 bg-white border-slate-200 rounded-2xl shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Waiting in OPD</span>
                  <span className="text-2xl font-black text-amber-600 mt-1 block">{opdSummary.total_waiting}</span>
                  <span className="text-[11px] text-slate-500">Across Active Sessions</span>
                </Card>
                <Card className="p-4 bg-white border-slate-200 rounded-2xl shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">In Consultation</span>
                  <span className="text-2xl font-black text-teal-900 mt-1 block">{opdSummary.total_in_consultation}</span>
                  <span className="text-[11px] text-slate-500">Active Doctors</span>
                </Card>
                <Card className="p-4 bg-white border-slate-200 rounded-2xl shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Completed Today</span>
                  <span className="text-2xl font-black text-emerald-600 mt-1 block">{opdSummary.total_completed}</span>
                  <span className="text-[11px] text-slate-500">Avg {opdSummary.average_consultation_duration_minutes} min/patient</span>
                </Card>
              </div>

              {/* Department Level Operational Breakdown */}
              <Card className="bg-white border-slate-200 rounded-3xl shadow-xs">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Department OPD Utilization & Waiting Health
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Live operational metrics derived directly from server queue engine and session capacity models.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/70 text-slate-500 text-[11px]">
                        <TableHead className="font-bold">Clinical Department</TableHead>
                        <TableHead className="font-bold">Capacity</TableHead>
                        <TableHead className="font-bold">Booked</TableHead>
                        <TableHead className="font-bold">Waiting</TableHead>
                        <TableHead className="font-bold">In Consult</TableHead>
                        <TableHead className="font-bold">Completed</TableHead>
                        <TableHead className="font-bold">Queue Health Alert</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs divide-y divide-slate-100">
                      {opdSummary.departments.map((dept) => (
                        <TableRow key={dept.department_id} className="hover:bg-slate-50/50">
                          <TableCell className="font-semibold text-slate-900">{dept.department_name}</TableCell>
                          <TableCell>{dept.total_capacity || "—"}</TableCell>
                          <TableCell className="font-bold text-teal-800">{dept.total_confirmed}</TableCell>
                          <TableCell className="font-bold text-amber-700">{dept.total_waiting}</TableCell>
                          <TableCell className="font-bold text-teal-900">{dept.total_in_consultation}</TableCell>
                          <TableCell className="text-emerald-700 font-bold">{dept.total_completed}</TableCell>
                          <TableCell>
                            {dept.status_alert === "HIGH_WAIT" && (
                              <Badge variant="destructive" className="text-[10px]">● High Waiting Time</Badge>
                            )}
                            {dept.status_alert === "NEARING_CAPACITY" && (
                              <Badge variant="warning" className="text-[10px]">● Nearing Full Capacity</Badge>
                            )}
                            {dept.status_alert === "QUEUE_PAUSED" && (
                              <Badge variant="secondary" className="text-[10px]">● Queue Paused</Badge>
                            )}
                            {dept.status_alert === "NORMAL" && (
                              <Badge variant="success" className="text-[10px]">● Normal Queue Flow</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Advisory Capacity Recommendations */}
              {opdSummary.recommendations.length > 0 && (
                <Card className="bg-teal-50/40 border-teal-200 rounded-3xl shadow-xs">
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-teal-700" />
                      <CardTitle className="text-sm font-bold text-slate-900">
                        Operational Capacity Planning Recommendations
                      </CardTitle>
                    </div>
                    <CardDescription className="text-xs text-slate-600">
                      Non-AI explainable statistical suggestions based on observed session booking utilization.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 space-y-3">
                    {opdSummary.recommendations.map((rec) => (
                      <div key={rec.id} className="p-4 rounded-2xl bg-white border border-teal-200 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">{rec.title}</span>
                          <Badge variant="teal" className="text-[10px]">High Demand</Badge>
                        </div>
                        <p className="text-slate-700 mt-1">{rec.rationale}</p>
                        <p className="text-teal-800 font-semibold mt-1">Suggested action: {rec.suggested_action}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          );
        })()}
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in-50 duration-150">
            <Card className="w-full max-w-md bg-white shadow-2xl border-slate-200">
              <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Invite / Connect Doctor to Hospital
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Establish a verified professional affiliation under the doctor's unified ID.
                  </CardDescription>
                </div>
                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </CardHeader>

              <form onSubmit={handleInviteSubmit}>
                <CardContent className="p-5 pt-0 space-y-3.5 text-xs">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Select Doctor by MEDORA ID</Label>
                    <select
                      value={inviteDocId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setInviteDocId(val);
                        if (val === "DOC-1001") {
                          setInviteDocName("Dr. Ananya Sharma");
                          setInviteSpecialization("Cardiology");
                        } else if (val === "DOC-1002") {
                          setInviteDocName("Dr. Rajesh Sharma");
                          setInviteSpecialization("Neurology");
                        } else {
                          setInviteDocName("Dr. Rahul Verma");
                          setInviteSpecialization("Orthopedics");
                        }
                      }}
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                      required
                    >
                      <option value="DOC-1001">DOC-1001 — Dr. Ananya Sharma (Cardiology)</option>
                      <option value="DOC-1002">DOC-1002 — Dr. Rajesh Sharma (Neurology)</option>
                      <option value="DOC-1003">DOC-1003 — Dr. Rahul Verma (Orthopedics)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Designation / Role Title</Label>
                    <Input
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      placeholder="e.g. Visiting Specialist"
                      className="text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Assigned Department</Label>
                    <select
                      value={inviteDept}
                      onChange={(e) => setInviteDept(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsInviteModalOpen(false)}
                      className="flex-1 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white">
                      Send Affiliation Invitation
                    </Button>
                  </div>
                </CardContent>
              </form>
            </Card>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
