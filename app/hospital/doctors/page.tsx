"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Stethoscope,
  Plus,
  ShieldCheck,
  Clock,
  CheckCircle2,
  X,
  Layers,
  Search,
  Activity,
  AlertTriangle,
  Building2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import {
  getFacilityDoctors,
  getAllDoctorAffiliations,
  createDoctorAffiliation,
  approveDoctorAffiliation,
  rejectDoctorAffiliation,
  endDoctorAffiliation,
  suspendDoctorAffiliation,
  reactivateDoctorAffiliation,
  getDepartmentHead,
} from "@/lib/data/affiliation-store";
import { getDepartmentsForFacility } from "@/lib/data/department-store";
import { getDoctorAssignedServices } from "@/lib/data/service-store";
import { getFacilityById } from "@/lib/data/facility-store";
import { HealthcareDoctorAffiliation } from "@/types/database.types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function HospitalDoctorsPage() {
  const { user } = useAuth();
  const facilityCode = user?.identifier || user?.organizationId || "FAC-1001";
  const facility = getFacilityById(facilityCode);

  const [affiliations, setAffiliations] = useState<HealthcareDoctorAffiliation[]>(() =>
    getFacilityDoctors(facilityCode, true)
  );
  const [departments] = useState(() => getDepartmentsForFacility(facilityCode));

  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Invite Form State
  const [inviteDocId, setInviteDocId] = useState("DOC-1003");
  const [inviteDocName, setInviteDocName] = useState("Dr. Rahul Verma");
  const [inviteSpecialization, setInviteSpecialization] = useState("Orthopedics");
  const [inviteRole, setInviteRole] = useState("Visiting Specialist");
  const [inviteDeptId, setInviteDeptId] = useState(departments[0]?.id || "");
  const [inviteFee, setInviteFee] = useState(500);
  const [inviteRoom, setInviteRoom] = useState("OPD Room 108");

  const refreshDoctors = () => {
    setAffiliations(getFacilityDoctors(facilityCode, true));
  };

  const handleApprove = (docIdent: string) => {
    const res = approveDoctorAffiliation(facilityCode, docIdent);
    if (res.success) {
      setActionMessage(`Doctor affiliation for ${docIdent} approved and activated.`);
      refreshDoctors();
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleReject = (docIdent: string) => {
    const res = rejectDoctorAffiliation(facilityCode, docIdent);
    if (res.success) {
      setActionMessage(`Doctor affiliation for ${docIdent} rejected.`);
      refreshDoctors();
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleEndAffiliation = (docIdent: string) => {
    if (confirm(`End active affiliation for doctor ${docIdent}? Historical clinical records will be preserved.`)) {
      const res = endDoctorAffiliation(facilityCode, docIdent, "Administrative conclusion");
      if (res.success) {
        setActionMessage(`Doctor affiliation for ${docIdent} ended. Historical records preserved.`);
        refreshDoctors();
        setTimeout(() => setActionMessage(null), 3000);
      }
    }
  };

  const handleSuspend = (docIdent: string) => {
    const res = suspendDoctorAffiliation(facilityCode, docIdent, "Temporary administrative hold");
    if (res.success) {
      setActionMessage(`Doctor affiliation for ${docIdent} suspended. Operational access blocked.`);
      refreshDoctors();
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleReactivate = (docIdent: string) => {
    const res = reactivateDoctorAffiliation(facilityCode, docIdent);
    if (res.success) {
      setActionMessage(`Doctor affiliation for ${docIdent} reactivated.`);
      refreshDoctors();
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const dept = departments.find((d) => d.id === inviteDeptId);

    const res = createDoctorAffiliation({
      doctor_id: inviteDocId.trim().toUpperCase(),
      doctor_name: inviteDocName.trim(),
      specialization: inviteSpecialization.trim(),
      organization_id: facility?.organization_id || "11111111-1111-1111-1111-111111111101",
      facility_id: facilityCode,
      department_id: inviteDeptId || undefined,
      department_name: dept?.name || undefined,
      role_title: inviteRole.trim(),
      consultation_fee: Number(inviteFee) || 500,
      opd_room: inviteRoom.trim(),
      status: "ACTIVE",
      verification_status: "verified",
    });

    if (res.success && res.affiliation) {
      setActionMessage(`Doctor ${res.affiliation.doctor_name} (${res.affiliation.doctor_id}) connected.`);
      refreshDoctors();
      setIsInviteModalOpen(false);
      setTimeout(() => setActionMessage(null), 3000);
    } else {
      setErrorMessage(res.error || "Failed to establish doctor affiliation.");
    }
  };

  // Filtered lists
  const activeDoctors = affiliations.filter((d) => d.status === "ACTIVE");
  const pendingDoctors = affiliations.filter((d) => d.status === "PENDING");
  const endedDoctors = affiliations.filter((d) => d.status === "ENDED" || d.status === "REJECTED");

  const filteredActiveDoctors = activeDoctors.filter((doc) => {
    if (deptFilter !== "all" && doc.department_id?.toLowerCase() !== deptFilter.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        doc.doctor_name.toLowerCase().includes(q) ||
        doc.doctor_id.toLowerCase().includes(q) ||
        (doc.specialization && doc.specialization.toLowerCase().includes(q)) ||
        doc.role_title.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <RoleGuard allowedRoles={["hospital_admin", "staff", "admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="Hospital Medical Staff & Doctor Roster"
          description={`Verified healthcare practitioners, consulting physicians, and visiting specialists appointed at ${facility?.name || "this hospital"}.`}
          breadcrumbs={[{ label: "Hospital Command", href: "/hospital" }, { label: "Medical Staff" }]}
          actions={
            <Button
              size="sm"
              onClick={() => setIsInviteModalOpen(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold gap-1.5"
            >
              <Plus className="h-4 w-4" /> Connect / Invite Doctor
            </Button>
          }
        />

        {actionMessage && (
          <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-900 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-600" />
              {actionMessage}
            </span>
            <button onClick={() => setActionMessage(null)} className="text-teal-700 hover:text-teal-900">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Pending Affiliation Requests */}
        {pendingDoctors.length > 0 && (
          <Card className="bg-amber-50/40 border-amber-200 shadow-xs">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-amber-950 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  Pending Affiliation Requests ({pendingDoctors.length})
                </CardTitle>
                <Badge variant="warning" className="text-[10px]">Action Required</Badge>
              </div>
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
                      <TableCell className="font-bold text-slate-900">
                        {doc.doctor_name}
                        <span className="font-mono text-[10px] text-teal-700 block">{doc.doctor_id}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-slate-800">{doc.specialization}</span>
                        <span className="text-[10px] text-slate-500 block font-mono">{doc.medical_reg_no}</span>
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
                            className="h-7 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search practitioner by name, ID, specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              aria-label="Filter by Department"
              className="text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Medical Staff Table */}
        <Card className="bg-white border-slate-200 overflow-hidden shadow-sm">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-teal-600" />
                Active Verified Practitioners ({filteredActiveDoctors.length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Medical doctors with active facility privileges providing outpatient consultations and specialized care.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredActiveDoctors.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No active medical practitioners found.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-slate-600">Doctor & ID</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Specialization & Credentials</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Department & Designation</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">OPD Chamber & Fee</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Assigned Services</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActiveDoctors.map((doc) => {
                    const assignedServices = getDoctorAssignedServices(doc.doctor_id, facilityCode);
                    return (
                      <TableRow key={doc.id} className="hover:bg-slate-50/50">
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 flex-shrink-0">
                              <Stethoscope className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                                {doc.doctor_name}
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                              </div>
                              <span className="font-mono text-[10px] text-teal-700 font-semibold">{doc.doctor_id}</span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-3">
                          <span className="font-medium text-slate-800 text-xs block">{doc.specialization}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{doc.medical_reg_no || "Registered"}</span>
                        </TableCell>

                        <TableCell className="py-3">
                          <span className="font-semibold text-slate-800 text-xs block flex items-center gap-1.5">
                            {doc.role_title}
                            {doc.role_title.toLowerCase().includes("head") && (
                              <Badge variant="warning" className="text-[9px] px-1 py-0">HEAD</Badge>
                            )}
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Layers className="h-3 w-3 text-slate-400" />
                            {doc.department_name || "General Medicine"}
                          </span>
                        </TableCell>

                        <TableCell className="py-3">
                          <span className="font-bold text-slate-900 text-xs block">₹{doc.consultation_fee}</span>
                          <span className="text-[10px] text-slate-500">{doc.opd_room}</span>
                        </TableCell>

                        <TableCell className="py-3">
                          <div className="space-y-0.5">
                            {assignedServices.length === 0 ? (
                              <span className="text-[10px] text-slate-400 italic">No direct service links</span>
                            ) : (
                              assignedServices.map((as) => (
                                <Badge
                                  key={as.id}
                                  variant="outline"
                                  className="text-[10px] bg-slate-50 text-slate-700 block w-fit font-normal"
                                >
                                  {as.service_name}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSuspend(doc.doctor_id)}
                              className="h-7 text-[10px] text-amber-700 border-amber-200 hover:bg-amber-50"
                              title="Temporarily suspend doctor affiliation (blocks operational access)"
                            >
                              Suspend
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEndAffiliation(doc.doctor_id)}
                              className="h-7 text-[10px] text-slate-600 hover:text-rose-700 hover:border-rose-200"
                              title="End doctor affiliation (historical clinical record remains intact)"
                            >
                              End
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Invite Doctor Modal */}
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in-50">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Connect / Invite Doctor</h3>
                    <p className="text-xs text-slate-500">
                      Establish medical privileges under doctor's unified identity at {facility?.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Doctor ID (MEDORA) *</Label>
                      <Input
                        required
                        placeholder="e.g. DOC-1001"
                        value={inviteDocId}
                        onChange={(e) => setInviteDocId(e.target.value)}
                        className="text-xs h-9 font-mono uppercase"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Doctor Full Name *</Label>
                      <Input
                        required
                        placeholder="e.g. Dr. Rahul Verma"
                        value={inviteDocName}
                        onChange={(e) => setInviteDocName(e.target.value)}
                        className="text-xs h-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Specialization</Label>
                      <Input
                        placeholder="e.g. Orthopedics"
                        value={inviteSpecialization}
                        onChange={(e) => setInviteSpecialization(e.target.value)}
                        className="text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Role Designation *</Label>
                      <Input
                        required
                        placeholder="e.g. Consultant Surgeon"
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="text-xs h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Assigned Department *</Label>
                    <select
                      value={inviteDeptId}
                      onChange={(e) => setInviteDeptId(e.target.value)}
                      aria-label="Assigned Department"
                      className="w-full text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 font-medium"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Consultation Fee (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={inviteFee}
                        onChange={(e) => setInviteFee(Number(e.target.value))}
                        className="text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">OPD Chamber / Room</Label>
                      <Input
                        placeholder="e.g. Room 102"
                        value={inviteRoom}
                        onChange={(e) => setInviteRoom(e.target.value)}
                        className="text-xs h-9"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
                  >
                    Connect & Activate
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
