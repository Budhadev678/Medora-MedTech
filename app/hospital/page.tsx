"use client";

import React, { useState } from "react";
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
  X
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { 
  getHospitalAffiliatedDoctors, 
  approveDoctorAffiliation, 
  rejectDoctorAffiliation, 
  endDoctorAffiliation,
  HospitalAffiliatedDoctor,
  findIdentityById
} from "@/lib/data/identity-store";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function HospitalDashboard() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<"departments" | "doctors">("doctors");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteDocId, setInviteDocId] = useState("DOC-1003");
  const [inviteRole, setInviteRole] = useState("Visiting Specialist");
  const [inviteDept, setInviteDept] = useState("General & Laparoscopic Surgery");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Dynamic hospital ID
  const hospitalIdent = user?.identifier || "HSP-1001";
  const [affiliatedDoctors, setAffiliatedDoctors] = useState<HospitalAffiliatedDoctor[]>(() => 
    getHospitalAffiliatedDoctors(hospitalIdent)
  );

  const refreshDoctors = () => {
    setAffiliatedDoctors(getHospitalAffiliatedDoctors(hospitalIdent));
  };

  const handleApprove = (docIdent: string) => {
    const res = approveDoctorAffiliation(hospitalIdent, docIdent);
    if (res.success) {
      setActionMessage(`Doctor affiliation for ${docIdent} approved and activated.`);
      refreshDoctors();
      setTimeout(() => setActionMessage(null), 2500);
    }
  };

  const handleReject = (docIdent: string) => {
    const res = rejectDoctorAffiliation(hospitalIdent, docIdent);
    if (res.success) {
      setActionMessage(`Doctor affiliation for ${docIdent} rejected.`);
      refreshDoctors();
      setTimeout(() => setActionMessage(null), 2500);
    }
  };

  const handleEndAffiliation = (docIdent: string) => {
    const res = endDoctorAffiliation(hospitalIdent, docIdent);
    if (res.success) {
      setActionMessage(`Doctor affiliation for ${docIdent} ended. Historical record preserved.`);
      refreshDoctors();
      setTimeout(() => setActionMessage(null), 2500);
    }
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const doc = findIdentityById(inviteDocId);
    if (!doc || doc.role !== "doctor") {
      setActionMessage("Doctor with this MEDORA ID was not found.");
      return;
    }

    const res = approveDoctorAffiliation(hospitalIdent, inviteDocId);
    if (res.success) {
      setActionMessage(`Invitation sent and confirmed for ${doc.fullName} (${inviteDocId}).`);
      refreshDoctors();
      setIsInviteModalOpen(false);
      setTimeout(() => setActionMessage(null), 2500);
    }
  };

  const activeDoctors = affiliatedDoctors.filter(d => d.status === "active");
  const pendingDoctors = affiliatedDoctors.filter(d => d.status === "pending");

  const departments = [
    { name: "Emergency & Trauma Care", code: "EMERG", activeDoctors: 4, occupiedBeds: "18 / 20", status: "high" },
    { name: "Cardiology & Cath Lab", code: "CARD", activeDoctors: activeDoctors.length, occupiedBeds: "12 / 15", status: "available" },
    { name: "Diagnostic Pathology & Imaging", code: "PATH", activeDoctors: 5, occupiedBeds: "N/A (OPD)", status: "available" },
    { name: "General Medicine & Ward", code: "MED", activeDoctors: 6, occupiedBeds: "42 / 50", status: "available" },
  ];

  return (
    <RoleGuard allowedRoles={["hospital_admin", "staff", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-200">
        {/* Hospital Operations Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                {user?.organizationName || user?.fullName || "City Hospital"}
              </h1>
              <Badge variant="teal" className="text-xs font-mono">
                {user?.identifier || "HSP-1001"}
              </Badge>
              <Badge variant="outline" className="text-[10px] text-teal-800 bg-teal-50">
                Multi-Branch: Bhubaneswar Hub
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Command Center • 250 Bed Capacity • Connected Healthcare Facility
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              <ShieldCheck className="h-3.5 w-3.5 mr-1 text-teal-600" /> View Hospital Audit Log
            </Button>
            <Button 
              size="sm" 
              onClick={() => setIsInviteModalOpen(true)}
              className="text-xs font-semibold gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Invite / Connect Doctor
            </Button>
          </div>
        </div>

        {/* Operational Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Total Inpatient Beds</span>
            <span className="text-xl font-bold text-slate-900">72 / 85 Occupied</span>
            <span className="text-[11px] text-emerald-600 block mt-0.5">84.7% Occupancy</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Affiliated Doctors</span>
            <span className="text-xl font-bold text-teal-700">{activeDoctors.length} Active</span>
            <span className="text-[11px] text-amber-600 block mt-0.5">{pendingDoctors.length} Pending Review</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Today's Outpatients</span>
            <span className="text-xl font-bold text-slate-900">142 Registered</span>
            <span className="text-[11px] text-blue-600 block mt-0.5">38 in Queue</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Emergency Admissions</span>
            <span className="text-xl font-bold text-red-600">6 Trauma Cases</span>
            <span className="text-[11px] text-red-500 block mt-0.5">1 Critical</span>
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

        {/* View Switcher Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold max-w-md">
          <button
            onClick={() => setSelectedTab("doctors")}
            className={`flex-1 py-1.5 px-3 rounded-lg transition-all ${
              selectedTab === "doctors" ? "bg-white text-teal-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Affiliated Doctors ({affiliatedDoctors.length})
          </button>
          <button
            onClick={() => setSelectedTab("departments")}
            className={`flex-1 py-1.5 px-3 rounded-lg transition-all ${
              selectedTab === "departments" ? "bg-white text-teal-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Departments & Beds
          </button>
        </div>

        {/* TAB 1: DOCTOR AFFILIATIONS (HOSPITAL MEDICAL STAFF) */}
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
                        <TableHead>MCI Reg & Specialization</TableHead>
                        <TableHead>Requested Role</TableHead>
                        <TableHead>OPD / Rate</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingDoctors.map((doc) => (
                        <TableRow key={doc.doctorIdentifier} className="text-xs">
                          <TableCell>
                            <span className="font-bold text-slate-900 block">{doc.doctorName}</span>
                            <span className="font-mono text-[10px] text-teal-700 font-semibold">{doc.doctorIdentifier}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-slate-800 block">{doc.specialization}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{doc.medicalRegNo}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-amber-900">{doc.roleTitle}</span>
                            <span className="text-[10px] text-slate-500 block">{doc.departmentName}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-slate-900">₹{doc.consultationFee}</span>
                            <span className="text-[10px] text-slate-500 block">{doc.opdRoom}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button 
                                size="sm" 
                                onClick={() => handleApprove(doc.doctorIdentifier)}
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 font-bold"
                              >
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleReject(doc.doctorIdentifier)}
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
                      Doctors with verified appointments practicing at this hospital.
                    </CardDescription>
                  </div>
                  <Badge variant="teal" className="text-[10px]">
                    Verified Affiliations
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs bg-slate-50">
                      <TableHead>Doctor Name</TableHead>
                      <TableHead>Specialization & Credentials</TableHead>
                      <TableHead>Designation / Department</TableHead>
                      <TableHead>OPD Chamber</TableHead>
                      <TableHead>Consultation Fee</TableHead>
                      <TableHead className="text-right">Status / Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeDoctors.map((doc) => (
                      <TableRow key={doc.doctorIdentifier} className="text-xs hover:bg-slate-50/80">
                        <TableCell>
                          <span className="font-bold text-slate-900 block">{doc.doctorName}</span>
                          <span className="font-mono text-[10px] text-teal-700 font-semibold">{doc.doctorIdentifier}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-slate-900 block">{doc.specialization}</span>
                          <span className="text-[10px] text-slate-500">{doc.qualifications}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-slate-800 block">{doc.roleTitle}</span>
                          <span className="text-[10px] text-slate-500">{doc.departmentName}</span>
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">{doc.opdRoom}</TableCell>
                        <TableCell className="font-bold text-slate-900">₹{doc.consultationFee}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Badge variant="success" className="text-[10px]">
                              ● Verified
                            </Badge>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEndAffiliation(doc.doctorIdentifier)}
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

        {/* TAB 2: DEPARTMENTS & BEDS */}
        {selectedTab === "departments" && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-teal-600" />
              Active Hospital Departments
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departments.map((dept) => (
                <Card key={dept.code} className="bg-white">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {dept.code}
                      </span>
                      <StatusBadge status={dept.status} size="sm" />
                    </div>
                    <CardTitle className="text-sm font-bold text-slate-900 mt-2">
                      {dept.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 my-2">
                      <div className="rounded bg-slate-50 p-2">
                        <span className="text-slate-400 block text-[11px]">Doctors on Duty</span>
                        <span className="font-semibold text-slate-900">{dept.activeDoctors} Specialists</span>
                      </div>
                      <div className="rounded bg-slate-50 p-2">
                        <span className="text-slate-400 block text-[11px]">Inpatient Beds</span>
                        <span className="font-semibold text-slate-900">{dept.occupiedBeds}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* INVITE DOCTOR MODAL */}
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
                      onChange={(e) => setInviteDocId(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                      required
                    >
                      <option value="DOC-1001">DOC-1001 — Dr. Ananya Sharma (Cardiology)</option>
                      <option value="DOC-1002">DOC-1002 — Dr. Rajesh Sharma (General Medicine)</option>
                      <option value="DOC-1003">DOC-1003 — Dr. Priya Das (Surgery)</option>
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
                    <Input
                      value={inviteDept}
                      onChange={(e) => setInviteDept(e.target.value)}
                      placeholder="e.g. General & Laparoscopic Surgery"
                      className="text-xs"
                      required
                    />
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
                    <Button type="submit" className="flex-1 text-xs font-bold">
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
