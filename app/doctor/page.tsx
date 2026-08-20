"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Users, 
  Stethoscope, 
  FileText, 
  FlaskConical, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  ArrowRight,
  Calendar,
  Layers,
  Info,
  ChevronRight,
  Building2,
  Plus,
  ShieldCheck,
  MapPin,
  Clock3,
  X
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { 
  getAllIdentities, 
  findIdentityById, 
  requestDoctorAffiliation, 
  StoredDoctorAffiliation 
} from "@/lib/data/identity-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DoctorWorkspacePage() {
  const { user } = useAuth();
  const [dutyStatus, setDutyStatus] = useState<"available" | "busy" | "on_call" | "emergency_occupied">("available");
  const [selectedTab, setSelectedTab] = useState<"queue" | "affiliations" | "schedule">("queue");
  const [isAffiliationModalOpen, setIsAffiliationModalOpen] = useState(false);

  // Request Affiliation Form State
  const [targetFacilityId, setTargetFacilityId] = useState("HSP-1001");
  const [roleTitle, setRoleTitle] = useState("Visiting Specialist");
  const [departmentName, setDepartmentName] = useState("Cardiology Outpatient Clinic");
  const [consultationFee, setConsultationFee] = useState(500);
  const [opdRoom, setOpdRoom] = useState("OPD Room 204");
  const [scheduleNotes, setScheduleNotes] = useState("Tue, Thu (02:00 PM - 05:00 PM)");
  const [affiliationMessage, setAffiliationMessage] = useState<string | null>(null);

  // Refresh affiliations from store
  const currentDoctor = user ? findIdentityById(user.id) || user : null;
  const affiliations: StoredDoctorAffiliation[] = currentDoctor?.doctorData?.affiliations || [];

  const handleAffiliationRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const result = requestDoctorAffiliation(user.id, {
      organizationIdOrIdentifier: targetFacilityId,
      roleTitle,
      departmentName,
      consultationFee,
      opdRoom,
      scheduleNotes,
    });

    if (result.success) {
      setAffiliationMessage("Affiliation request submitted successfully! Awaiting hospital review.");
      setTimeout(() => {
        setIsAffiliationModalOpen(false);
        setAffiliationMessage(null);
      }, 1500);
    } else {
      setAffiliationMessage(result.error || "Failed to submit affiliation request.");
    }
  };

  const queuePatients = [
    { token: "#01", name: "Ananya Mishra", id: "PAT-1002", age: 34, reason: "Chest tightness / Follow-up", status: "completed" },
    { token: "#02", name: "Rahul Verma", id: "PAT-1001", age: 29, reason: "Routine Checkup & Blood Pressure", status: "in_consultation" },
    { token: "#03", name: "Amit Das", id: "PAT-1003", age: 62, reason: "ECG Review / Chronic Care", status: "waiting" },
    { token: "#04", name: "Pooja Das", id: "PAT-1004", age: 45, reason: "Palpitations / New Consultation", status: "waiting" },
  ];

  return (
    <RoleGuard allowedRoles={["doctor", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-200">
        {/* Doctor Header & Duty Status Controller */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">
                {user?.fullName || "Dr. Ananya Sharma"}
              </h1>
              <Badge variant="outline" className="text-xs text-teal-700 border-teal-300 font-mono">
                {user?.identifier || "DOC-1001"}
              </Badge>
              <Badge variant="teal" className="text-[10px]">
                {user?.doctorData?.specialization || "Cardiology"}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
              <span>MCI: <strong className="text-slate-700 font-mono">{user?.doctorData?.medicalRegNo || "MCI-2014-99214"}</strong></span>
              <span>•</span>
              <span>
                Active Affiliations: <strong className="text-teal-800">{affiliations.filter(a => a.status === 'active').length} Facilities</strong>
              </span>
            </p>
          </div>

          {/* Live Duty Status Controller */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 self-start sm:self-auto">
            <span className="text-xs font-semibold text-slate-700 pl-1">Duty Status:</span>
            <select
              value={dutyStatus}
              onChange={(e) => setDutyStatus(e.target.value as any)}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-teal-600 cursor-pointer"
            >
              <option value="available">🟢 Available (Accepting Patients)</option>
              <option value="busy">🟡 In Consultation (Busy)</option>
              <option value="on_call">🔵 On Call</option>
              <option value="emergency_occupied">🔴 Emergency Occupied</option>
            </select>
          </div>
        </div>

        {/* Clinical Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Today's Appointments</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">12 Scheduled</span>
            <span className="text-[11px] text-teal-700 font-medium block mt-0.5">Room 102 Active</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Waiting in Queue</span>
            <span className="text-xl font-bold text-amber-600 mt-1 block">2 Patients</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Est. wait: 15 mins</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Connected Hospitals</span>
            <span className="text-xl font-bold text-emerald-600 mt-1 block">{affiliations.length} Facilities</span>
            <span className="text-[11px] text-emerald-600 block mt-0.5">Multi-Practice Active</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Pending Lab Reviews</span>
            <span className="text-xl font-bold text-blue-600 mt-1 block">3 Reports</span>
            <span className="text-[11px] text-blue-600 block mt-0.5">1 Abnormal Flag</span>
          </div>
        </div>

        {/* Operational View Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold max-w-md">
            <button
              onClick={() => setSelectedTab("queue")}
              className={`flex-1 py-1.5 px-4 rounded-lg transition-all ${
                selectedTab === "queue" ? "bg-white text-teal-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              OPD Patient Queue (4)
            </button>
            <button
              onClick={() => setSelectedTab("affiliations")}
              className={`flex-1 py-1.5 px-4 rounded-lg transition-all ${
                selectedTab === "affiliations" ? "bg-white text-teal-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              My Hospital Affiliations ({affiliations.length})
            </button>
            <button
              onClick={() => setSelectedTab("schedule")}
              className={`flex-1 py-1.5 px-4 rounded-lg transition-all ${
                selectedTab === "schedule" ? "bg-white text-teal-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Weekly Schedule
            </button>
          </div>

          {selectedTab === "affiliations" && (
            <Button 
              size="sm" 
              onClick={() => setIsAffiliationModalOpen(true)}
              className="gap-1.5 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5" /> Request New Affiliation
            </Button>
          )}
        </div>

        {/* TAB 1: OPD LIVE QUEUE */}
        {selectedTab === "queue" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-white">
                <CardHeader className="p-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900">
                        Current OPD Session Queue
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        Room 102 • City Hospital Main OPD • Live Token Dispenser
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs text-teal-800 bg-teal-50 border-teal-200">
                      Token #02 Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="text-xs bg-slate-50">
                        <TableHead className="w-16">Token</TableHead>
                        <TableHead>Patient Details</TableHead>
                        <TableHead>Chief Complaint</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {queuePatients.map((pt) => (
                        <TableRow key={pt.token} className="text-xs hover:bg-slate-50/80">
                          <TableCell className="font-mono font-bold text-slate-900">{pt.token}</TableCell>
                          <TableCell>
                            <span className="font-semibold text-slate-900 block">{pt.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{pt.id} • {pt.age}y</span>
                          </TableCell>
                          <TableCell className="text-slate-600 max-w-[180px] truncate">{pt.reason}</TableCell>
                          <TableCell>
                            <StatusBadge status={pt.status} size="sm" />
                          </TableCell>
                          <TableCell className="text-right">
                            {pt.status === "in_consultation" ? (
                              <Button size="sm" className="h-7 text-xs font-bold gap-1 bg-teal-700 hover:bg-teal-800">
                                <Play className="h-3 w-3 fill-current" /> Consult
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" className="h-7 text-xs">
                                View
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Active Patient Snapshot Side Card */}
            <div className="space-y-4">
              <Card className="bg-white border-teal-200 shadow-xs">
                <CardHeader className="p-4 pb-2 bg-teal-50/50 rounded-t-xl border-b border-teal-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                      In Consultation Now
                    </span>
                    <Badge variant="teal" className="text-[10px]">Token #02</Badge>
                  </div>
                  <CardTitle className="text-sm font-extrabold text-slate-900 mt-1">
                    Rahul Verma
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 font-mono">
                    PAT-1001 • 29 yrs • Male
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-slate-50 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Blood Group</span>
                      <span className="font-bold text-rose-700">O Positive</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">BP Record</span>
                      <span className="font-bold text-slate-900">138/88 mmHg</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Reported Allergies
                    </span>
                    <Badge variant="outline" className="text-[10px] text-red-700 bg-red-50 border-red-200">
                      Penicillin, Peanuts
                    </Badge>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <Link href="/verify/rx/RX-1001" target="_blank">
                      <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-teal-600" /> View Previous Rx (RX-1001)
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: MY PROFESSIONAL AFFILIATIONS (DOCTOR MULTI-HOSPITAL FOUNDATION) */}
        {selectedTab === "affiliations" && (
          <div className="space-y-4 animate-in fade-in-50 duration-150">
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 flex items-start gap-3 text-xs text-blue-900">
              <Building2 className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm">Doctor Multi-Hospital Affiliation Architecture</span>
                <p className="mt-0.5 text-blue-800 leading-relaxed">
                  You are registered under one primary MEDORA Doctor Identity (<strong>{user?.identifier || "DOC-1001"}</strong>). You can practice across multiple hospitals, diagnostic centers, and clinics with independent consultation rates, OPD rooms, and schedule allocations.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {affiliations.map((aff, index) => (
                <Card key={aff.id || index} className="bg-white border-slate-200 hover:border-teal-300 transition-all shadow-xs">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] font-mono font-semibold text-teal-800 bg-teal-50">
                        {aff.organizationIdentifier || `ORG-${index + 1}`}
                      </Badge>
                      <Badge 
                        variant={aff.status === "active" ? "success" : aff.status === "pending" ? "warning" : "secondary"}
                        className="text-[10px] capitalize"
                      >
                        ● {aff.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm font-bold text-slate-900 mt-2">
                      {aff.organizationName}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      {aff.departmentName || "Department of Cardiology"}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 pt-1 space-y-2.5 text-xs text-slate-600">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Designation / Role:</span>
                      <span className="font-semibold text-slate-900">{aff.roleTitle}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Consultation Fee:</span>
                      <span className="font-bold text-slate-900">₹{aff.consultationFee}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Assigned OPD Room:</span>
                      <span className="font-medium text-slate-900">{aff.opdRoom || "OPD 101"}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Verification:</span>
                      <span className="font-semibold text-emerald-700 flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" /> {aff.verificationStatus || "Verified"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: WEEKLY SCHEDULE */}
        {selectedTab === "schedule" && (
          <Card className="bg-white">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-slate-900">
                Multi-Hospital Practice Schedule
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Weekly OPD allocation across all affiliated healthcare facilities.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">City Hospital (HSP-1001)</span>
                    <span className="text-slate-500">Mon, Wed, Fri • 09:00 AM - 01:00 PM • Room 102</span>
                  </div>
                  <Badge variant="teal" className="text-xs">Consultant</Badge>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">Green Care Hospital (HSP-1002)</span>
                    <span className="text-slate-500">Tue, Thu • 02:00 PM - 05:00 PM • Visiting Suite 2</span>
                  </div>
                  <Badge variant="outline" className="text-xs">Visiting Specialist</Badge>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">Green Care Clinic (CLN-1001)</span>
                    <span className="text-slate-500">Sat • 10:00 AM - 02:00 PM • Clinic Suite 1</span>
                  </div>
                  <Badge variant="outline" className="text-xs">Consultant</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* REQUEST NEW AFFILIATION MODAL */}
        {isAffiliationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in-50 duration-150">
            <Card className="w-full max-w-md bg-white shadow-2xl border-slate-200">
              <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Request Healthcare Facility Affiliation
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Apply to practice at another verified hospital or clinic.
                  </CardDescription>
                </div>
                <button
                  onClick={() => setIsAffiliationModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </CardHeader>

              <form onSubmit={handleAffiliationRequest}>
                <CardContent className="p-5 pt-0 space-y-3.5 text-xs">
                  {affiliationMessage && (
                    <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 font-semibold text-xs">
                      {affiliationMessage}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-xs">Target Healthcare Facility</Label>
                    <select
                      value={targetFacilityId}
                      onChange={(e) => setTargetFacilityId(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                      required
                    >
                      <option value="HSP-1001">City Hospital (HSP-1001) — Bhubaneswar</option>
                      <option value="HSP-1002">Green Care Hospital (HSP-1002) — Cuttack</option>
                      <option value="CLN-1001">Green Care Clinic (CLN-1001) — Cuttack</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Requested Role Title</Label>
                      <Input
                        value={roleTitle}
                        onChange={(e) => setRoleTitle(e.target.value)}
                        placeholder="e.g. Visiting Specialist"
                        className="text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Consultation Fee (₹)</Label>
                      <Input
                        type="number"
                        value={consultationFee}
                        onChange={(e) => setConsultationFee(Number(e.target.value))}
                        className="text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Department Name</Label>
                    <Input
                      value={departmentName}
                      onChange={(e) => setDepartmentName(e.target.value)}
                      placeholder="e.g. Department of Cardiology"
                      className="text-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">OPD Room / Chamber</Label>
                      <Input
                        value={opdRoom}
                        onChange={(e) => setOpdRoom(e.target.value)}
                        placeholder="e.g. OPD Room 204"
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Proposed Timings</Label>
                      <Input
                        value={scheduleNotes}
                        onChange={(e) => setScheduleNotes(e.target.value)}
                        placeholder="e.g. Tue, Thu 2-5 PM"
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAffiliationModalOpen(false)}
                      className="flex-1 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 text-xs font-bold">
                      Submit Affiliation Request
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
