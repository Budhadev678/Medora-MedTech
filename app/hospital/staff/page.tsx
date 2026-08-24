"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  Building2,
  ShieldCheck,
  Phone,
  Mail,
  UserCheck,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  getFacilityStaff,
  createStaffAffiliation,
  endStaffAffiliation,
  suspendStaffAffiliation,
  reactivateStaffAffiliation,
} from "@/lib/data/affiliation-store";
import { getDepartmentsForFacility } from "@/lib/data/department-store";
import { getFacilityById } from "@/lib/data/facility-store";
import { HealthcareStaffAffiliation } from "@/types/database.types";
import { useAuth } from "@/lib/auth/auth-context";
import { PermissionEngine } from "@/lib/services/permission-engine";

export default function HospitalStaffPage() {
  const { user } = useAuth();
  const facilityCode = user?.identifier || user?.organizationId || "FAC-1001";
  const facility = getFacilityById(facilityCode);

  const [staffList, setStaffList] = useState<HealthcareStaffAffiliation[]>(() =>
    getFacilityStaff(facilityCode, true)
  );
  const [departments] = useState(() => getDepartmentsForFacility(facilityCode));

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    user_id: "",
    staff_name: "",
    email: "",
    phone: "",
    department_id: departments[0]?.id || "",
    role_title: "Staff Nurse",
    staff_role: "NURSE",
  });

  const refreshData = () => {
    setStaffList(getFacilityStaff(facilityCode, true));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.user_id.trim() || !formData.staff_name.trim()) {
      setErrorMessage("User ID and staff name are required.");
      return;
    }

    const dept = departments.find((d) => d.id === formData.department_id);

    const res = createStaffAffiliation({
      user_id: formData.user_id.trim().toUpperCase(),
      staff_name: formData.staff_name.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      organization_id: facility?.organization_id || "11111111-1111-1111-1111-111111111101",
      facility_id: facilityCode,
      department_id: formData.department_id || undefined,
      department_name: dept?.name || undefined,
      role_title: formData.role_title.trim(),
      staff_role: formData.staff_role,
      status: "ACTIVE",
    });

    if (res.success && res.affiliation) {
      setActionMessage(`Staff member ${res.affiliation.staff_name} (${res.affiliation.user_id}) registered.`);
      refreshData();
      setIsAddModalOpen(false);
      setFormData({
        user_id: "",
        staff_name: "",
        email: "",
        phone: "",
        department_id: departments[0]?.id || "",
        role_title: "Staff Nurse",
        staff_role: "NURSE",
      });
      setTimeout(() => setActionMessage(null), 3000);
    } else {
      setErrorMessage(res.error || "Failed to add staff member.");
    }
  };

  const handleEndAffiliation = (userId: string) => {
    if (confirm(`End active affiliation for staff member ${userId}? Historical actions and audits will remain intact.`)) {
      const res = endStaffAffiliation(facilityCode, userId, "Administrative conclusion");
      if (res.success) {
        setActionMessage(`Staff affiliation for ${userId} ended. Historical actions preserved.`);
        refreshData();
        setTimeout(() => setActionMessage(null), 3000);
      }
    }
  };

  const handleSuspend = (userId: string) => {
    const res = suspendStaffAffiliation(facilityCode, userId, "Administrative temporary hold");
    if (res.success) {
      setActionMessage(`Staff affiliation for ${userId} suspended.`);
      refreshData();
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleReactivate = (userId: string) => {
    const res = reactivateStaffAffiliation(facilityCode, userId);
    if (res.success) {
      setActionMessage(`Staff affiliation for ${userId} reactivated.`);
      refreshData();
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  // Filtered Staff
  const filteredStaff = staffList.filter((st) => {
    if (roleFilter !== "all" && st.staff_role.toLowerCase() !== roleFilter.toLowerCase()) return false;
    if (statusFilter !== "all" && st.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        st.staff_name.toLowerCase().includes(q) ||
        st.user_id.toLowerCase().includes(q) ||
        st.role_title.toLowerCase().includes(q) ||
        (st.department_name && st.department_name.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <RoleGuard allowedRoles={["hospital_admin", "staff", "admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="Hospital Clinical & Operational Staff"
          description={`Triage nurses, blood centre coordinators, lab technicians, pharmacists, and administrators appointed at ${facility?.name || "this hospital"}.`}
          breadcrumbs={[{ label: "Hospital Command", href: "/hospital" }, { label: "Staff Roster" }]}
          actions={
            <Button
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold gap-1.5"
            >
              <Plus className="h-4 w-4" /> Add Staff Member
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search staff by name, ID, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filter by Role"
              className="text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Staff Roles</option>
              <option value="FACILITY_ADMIN">Facility Admin</option>
              <option value="BLOOD_STAFF">Blood Centre Staff</option>
              <option value="NURSE">Nurse</option>
              <option value="TECHNICIAN">Technician</option>
              <option value="LAB_STAFF">Lab Staff</option>
              <option value="PHARMACY_STAFF">Pharmacy Staff</option>
              <option value="BILLING_STAFF">Billing Staff</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by Status"
              className="text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ENDED">Ended</option>
            </select>
          </div>
        </div>

        {/* Staff Table */}
        <Card className="bg-white border-slate-200 overflow-hidden shadow-sm">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-teal-600" />
                Active Operational Personnel ({filteredStaff.length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Staff members authorized to handle admissions, lab workflows, dispensing, and billing operations.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredStaff.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No staff members found matching your search.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-slate-600">Staff Member & ID</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Role & Category</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Department</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Contact</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((st) => (
                    <TableRow key={st.id} className="hover:bg-slate-50/50">
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 flex-shrink-0">
                            <UserCheck className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{st.staff_name}</div>
                            <span className="font-mono text-[10px] text-teal-700 font-semibold">{st.user_id}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <span className="font-semibold text-slate-800 text-xs block">{st.role_title}</span>
                        <Badge variant="outline" className="text-[10px] font-semibold text-slate-600 bg-slate-50">
                          {st.staff_role}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-3">
                        {st.department_name ? (
                          <span className="text-xs font-medium text-slate-800 flex items-center gap-1">
                            <Layers className="h-3 w-3 text-slate-400" />
                            {st.department_name}
                          </span>
                        ) : (
                          <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600">
                            Facility Operations
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="py-3">
                        <div className="text-xs text-slate-600 space-y-0.5">
                          {st.phone && <div className="text-[11px]">{st.phone}</div>}
                          {st.email && <div className="text-[10px] text-slate-500">{st.email}</div>}
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <Badge
                          className={`text-[10px] font-semibold ${
                            st.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {st.status}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {st.status === "ACTIVE" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSuspend(st.user_id)}
                                className="h-7 text-[10px] text-amber-700 border-amber-200 hover:bg-amber-50"
                                title="Temporarily suspend staff access"
                              >
                                Suspend
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEndAffiliation(st.user_id)}
                                className="h-7 text-[10px] text-slate-600 hover:text-rose-700 hover:border-rose-200"
                                title="End staff affiliation (historical activity logs preserved)"
                              >
                                End
                              </Button>
                            </>
                          )}
                          {st.status === "SUSPENDED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReactivate(st.user_id)}
                              className="h-7 text-[10px] text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                              title="Reactivate staff affiliation"
                            >
                              Reactivate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add Staff Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in-50">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Add Operational Staff</h3>
                    <p className="text-xs text-slate-500">
                      Appoint administrative, nursing, or tech personnel to {facility?.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
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

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Staff User ID (MEDORA) *</Label>
                      <Input
                        required
                        placeholder="e.g. STAFF-1005"
                        value={formData.user_id}
                        onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                        className="text-xs h-9 font-mono uppercase"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Full Name *</Label>
                      <Input
                        required
                        placeholder="e.g. Subhashree Senapati"
                        value={formData.staff_name}
                        onChange={(e) => setFormData({ ...formData, staff_name: e.target.value })}
                        className="text-xs h-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Staff Role Category *</Label>
                      <select
                        value={formData.staff_role}
                        onChange={(e) => setFormData({ ...formData, staff_role: e.target.value })}
                        aria-label="Staff Role Category"
                        className="w-full text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 font-medium"
                      >
                        <option value="NURSE">Nurse / Clinical Care</option>
                        <option value="BLOOD_STAFF">Blood Centre Coordinator</option>
                        <option value="TECHNICIAN">Diagnostic / Radiology Technician</option>
                        <option value="LAB_STAFF">Laboratory Specialist</option>
                        <option value="PHARMACY_STAFF">Dispensing Pharmacist</option>
                        <option value="BILLING_STAFF">Billing & Finance Officer</option>
                        <option value="FACILITY_ADMIN">Facility Administrator</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Job Title / Designation *</Label>
                      <Input
                        required
                        placeholder="e.g. Senior Triage Nurse"
                        value={formData.role_title}
                        onChange={(e) => setFormData({ ...formData, role_title: e.target.value })}
                        className="text-xs h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Assigned Department</Label>
                    <select
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                      aria-label="Assigned Department"
                      className="w-full text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 font-medium"
                    >
                      <option value="">General Facility Operations (No Department)</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Phone</Label>
                      <Input
                        placeholder="+91 674 2500000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Email</Label>
                      <Input
                        type="email"
                        placeholder="staff@cityhospital.org"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                    onClick={() => setIsAddModalOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
                  >
                    Register Staff Member
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
