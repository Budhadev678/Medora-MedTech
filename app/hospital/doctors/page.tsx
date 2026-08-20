"use client";

import React, { useState } from "react";
import { Stethoscope, Plus, ShieldCheck, Clock, CheckCircle2, X } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function HospitalDoctorsPage() {
  const { user } = useAuth();
  const hospitalIdent = user?.identifier || "HSP-1001";
  const [affiliatedDoctors, setAffiliatedDoctors] = useState<HospitalAffiliatedDoctor[]>(() => 
    getHospitalAffiliatedDoctors(hospitalIdent)
  );
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteDocId, setInviteDocId] = useState("DOC-1003");
  const [inviteRole, setInviteRole] = useState("Visiting Specialist");
  const [inviteDept, setInviteDept] = useState("General Surgery");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const refreshDoctors = () => {
    setAffiliatedDoctors(getHospitalAffiliatedDoctors(hospitalIdent));
  };

  const handleApprove = (docIdent: string) => {
    const res = approveDoctorAffiliation(hospitalIdent, docIdent);
    if (res.success) {
      setActionMessage(`Doctor affiliation for ${docIdent} approved.`);
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
      setActionMessage(`Doctor affiliation for ${docIdent} ended (historical record preserved).`);
      refreshDoctors();
      setTimeout(() => setActionMessage(null), 2500);
    }
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = approveDoctorAffiliation(hospitalIdent, inviteDocId);
    if (res.success) {
      setActionMessage(`Doctor ${inviteDocId} invited and connected successfully.`);
      refreshDoctors();
      setIsInviteModalOpen(false);
      setTimeout(() => setActionMessage(null), 2500);
    }
  };

  const activeDoctors = affiliatedDoctors.filter(d => d.status === "active");
  const pendingDoctors = affiliatedDoctors.filter(d => d.status === "pending");

  return (
    <RoleGuard allowedRoles={["hospital_admin", "staff", "admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="Hospital Medical Staff & Doctor Roster"
          description="Verified healthcare practitioners, consulting physicians, and visiting specialists appointed at this facility."
          breadcrumbs={[{ label: "Hospital Command", href: "/hospital" }, { label: "Medical Staff" }]}
          actions={
            <Button size="sm" onClick={() => setIsInviteModalOpen(true)} className="text-xs font-semibold gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Connect / Invite Doctor
            </Button>
          }
        />

        {actionMessage && (
          <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-900 flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-teal-700 hover:text-teal-900">
              <X className="h-3.5 w-3.5" />
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
                    <TableHead>Doctor</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Requested Role</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingDoctors.map((doc) => (
                    <TableRow key={doc.doctorIdentifier} className="text-xs">
                      <TableCell className="font-bold text-slate-900">
                        {doc.doctorName}
                        <span className="font-mono text-[10px] text-teal-700 block">{doc.doctorIdentifier}</span>
                      </TableCell>
                      <TableCell>{doc.specialization}</TableCell>
                      <TableCell>{doc.roleTitle}</TableCell>
                      <TableCell className="font-bold">₹{doc.consultationFee}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" onClick={() => handleApprove(doc.doctorIdentifier)} className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700">
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleReject(doc.doctorIdentifier)} className="h-7 text-xs text-red-600 border-red-200">
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

        {/* Active Medical Staff */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-teal-600" />
              Active Verified Practitioners ({activeDoctors.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="text-xs bg-slate-50">
                  <TableHead>Doctor Name</TableHead>
                  <TableHead>Specialization & Credentials</TableHead>
                  <TableHead>Department / Role</TableHead>
                  <TableHead>OPD Room</TableHead>
                  <TableHead>Consultation Fee</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeDoctors.map((doc) => (
                  <TableRow key={doc.doctorIdentifier} className="text-xs hover:bg-slate-50/80">
                    <TableCell className="font-bold text-slate-900">
                      {doc.doctorName}
                      <span className="font-mono text-[10px] text-teal-700 block">{doc.doctorIdentifier}</span>
                    </TableCell>
                    <TableCell>
                      <span>{doc.specialization}</span>
                      <span className="text-[10px] text-slate-500 block">{doc.qualifications}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-slate-800">{doc.roleTitle}</span>
                      <span className="text-[10px] text-slate-500 block">{doc.departmentName}</span>
                    </TableCell>
                    <TableCell>{doc.opdRoom}</TableCell>
                    <TableCell className="font-bold text-slate-900">₹{doc.consultationFee}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEndAffiliation(doc.doctorIdentifier)}
                        className="h-6 text-[10px] text-slate-500 hover:text-red-700 hover:border-red-200"
                      >
                        End Affiliation
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Invite Doctor Modal */}
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in-50 duration-150">
            <Card className="w-full max-w-md bg-white shadow-2xl border-slate-200">
              <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Connect / Invite Doctor to Facility
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Establish affiliation under doctor's unified MEDORA ID.
                  </CardDescription>
                </div>
                <button onClick={() => setIsInviteModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </CardHeader>
              <form onSubmit={handleInviteSubmit}>
                <CardContent className="p-5 pt-0 space-y-3 text-xs">
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
                    <Label className="text-xs">Role Title</Label>
                    <Input value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} placeholder="e.g. Visiting Specialist" className="text-xs" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Department</Label>
                    <Input value={inviteDept} onChange={(e) => setInviteDept(e.target.value)} placeholder="e.g. General Surgery" className="text-xs" required />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsInviteModalOpen(false)} className="flex-1 text-xs">
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 text-xs font-bold">
                      Confirm & Connect
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
