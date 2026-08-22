"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Layers,
  Plus,
  Search,
  Stethoscope,
  Activity,
  CheckCircle2,
  AlertTriangle,
  X,
  Edit2,
  Building2,
  Users,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getDepartmentsForFacility,
  createDepartment,
  deactivateDepartment,
  updateDepartment,
} from "@/lib/data/department-store";
import {
  getFacilityDoctors,
  getFacilityStaff,
} from "@/lib/data/affiliation-store";
import { getServicesForDepartment } from "@/lib/data/service-store";
import { getFacilityById } from "@/lib/data/facility-store";
import { HealthcareDepartment } from "@/types/database.types";
import { useAuth } from "@/lib/auth/auth-context";

export default function HospitalDepartmentsPage() {
  const { user } = useAuth();
  const facilityCode = user?.identifier || user?.organizationId || "FAC-1001";
  const facility = getFacilityById(facilityCode);

  const [departments, setDepartments] = useState<HealthcareDepartment[]>(() =>
    getDepartmentsForFacility(facilityCode, true)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<HealthcareDepartment | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    head_doctor_name: "",
    head_doctor_id: "",
  });

  const refreshData = () => {
    setDepartments(getDepartmentsForFacility(facilityCode, true));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.name.trim()) {
      setErrorMessage("Department name is required.");
      return;
    }

    if (editingDept) {
      const res = updateDepartment(editingDept.id, {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase() || formData.name.substring(0, 4).toUpperCase(),
        description: formData.description.trim(),
        head_doctor_name: formData.head_doctor_name.trim() || undefined,
        head_doctor_id: formData.head_doctor_id.trim() || undefined,
      });

      if (res.success && res.department) {
        setActionMessage(`Department ${res.department.name} updated successfully.`);
        refreshData();
        setIsCreateModalOpen(false);
        setEditingDept(null);
        setTimeout(() => setActionMessage(null), 3000);
      } else {
        setErrorMessage(res.error || "Failed to update department.");
      }
    } else {
      const res = createDepartment({
        facility_id: facilityCode,
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase() || formData.name.substring(0, 4).toUpperCase(),
        description: formData.description.trim(),
        head_doctor_name: formData.head_doctor_name.trim() || undefined,
        head_doctor_id: formData.head_doctor_id.trim() || undefined,
        status: "ACTIVE",
      });

      if (res.success && res.department) {
        setActionMessage(`Department ${res.department.name} (${res.department.code}) created.`);
        refreshData();
        setIsCreateModalOpen(false);
        setFormData({
          name: "",
          code: "",
          description: "",
          head_doctor_name: "",
          head_doctor_id: "",
        });
        setTimeout(() => setActionMessage(null), 3000);
      } else {
        setErrorMessage(res.error || "Failed to create department.");
      }
    }
  };

  const handleDeactivate = (deptId: string, deptName: string) => {
    if (confirm(`Deactivate department ${deptName}? Historical records will be preserved.`)) {
      const res = deactivateDepartment(deptId, "Administrative deactivation");
      if (res.success) {
        setActionMessage(`Department ${deptName} is now inactive.`);
        refreshData();
        setTimeout(() => setActionMessage(null), 3000);
      }
    }
  };

  const handleOpenEdit = (dept: HealthcareDepartment) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || "",
      head_doctor_name: dept.head_doctor_name || "",
      head_doctor_id: dept.head_doctor_id || "",
    });
    setIsCreateModalOpen(true);
  };

  // Filtered departments
  const filteredDepts = departments.filter((d) => {
    if (statusFilter !== "all" && d.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        (d.head_doctor_name && d.head_doctor_name.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <RoleGuard allowedRoles={["hospital_admin", "staff", "admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="Clinical & Operational Departments"
          description={`Configured medical departments, specialty suites, and diagnostic units at ${facility?.name || "this hospital"}.`}
          breadcrumbs={[{ label: "Hospital Command", href: "/hospital" }, { label: "Departments" }]}
          actions={
            <Button
              size="sm"
              onClick={() => {
                setEditingDept(null);
                setFormData({
                  name: "",
                  code: "",
                  description: "",
                  head_doctor_name: "",
                  head_doctor_id: "",
                });
                setIsCreateModalOpen(true);
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold gap-1.5"
            >
              <Plus className="h-4 w-4" /> Add Department
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

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search department by name, code, or head..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by Status"
              className="text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        {/* Departments Grid */}
        {filteredDepts.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm">
            <Layers className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-800">No departments configured yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create specialized medical departments (e.g. Cardiology, Neurology, Pediatrics) to organize clinical care.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDepts.map((dept) => {
              const allDoctors = getFacilityDoctors(facilityCode);
              const deptDoctors = allDoctors.filter(
                (d) =>
                  d.department_id?.toLowerCase() === dept.id.toLowerCase() ||
                  d.department_name?.toLowerCase() === dept.name.toLowerCase()
              );
              const allStaff = getFacilityStaff(facilityCode);
              const deptStaff = allStaff.filter(
                (s) => s.department_id?.toLowerCase() === dept.id.toLowerCase()
              );
              const deptServices = getServicesForDepartment(dept.id);

              return (
                <Card key={dept.id} className="bg-white border-slate-200 shadow-sm hover:border-teal-300 transition-colors">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                          {dept.code}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">{dept.id}</span>
                      </div>
                      <Badge
                        className={`text-[10px] font-semibold ${
                          dept.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {dept.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm font-bold text-slate-900 mt-2">
                      {dept.name}
                    </CardTitle>
                    {dept.description && (
                      <CardDescription className="text-xs text-slate-500 line-clamp-2">
                        {dept.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                      <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                        <span className="text-slate-400 block text-[9px] uppercase font-semibold">Doctors</span>
                        <span className="font-bold text-slate-900 text-xs mt-0.5 flex items-center gap-1">
                          <Stethoscope className="h-3 w-3 text-teal-600" />
                          {deptDoctors.length}
                        </span>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                        <span className="text-slate-400 block text-[9px] uppercase font-semibold">Staff</span>
                        <span className="font-bold text-slate-900 text-xs mt-0.5 flex items-center gap-1">
                          <Users className="h-3 w-3 text-purple-600" />
                          {deptStaff.length}
                        </span>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                        <span className="text-slate-400 block text-[9px] uppercase font-semibold">Services</span>
                        <span className="font-bold text-slate-900 text-xs mt-0.5 flex items-center gap-1">
                          <Activity className="h-3 w-3 text-blue-600" />
                          {deptServices.length}
                        </span>
                      </div>
                    </div>

                    {dept.head_doctor_name && (
                      <div className="text-[11px] text-slate-600 bg-teal-50/50 p-2 rounded border border-teal-100/60 flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-teal-700 flex-shrink-0" />
                        <span>
                          Head of Department: <strong className="text-teal-900">{dept.head_doctor_name}</strong>
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(dept)}
                        className="h-7 text-xs text-slate-600 hover:text-slate-900 gap-1"
                      >
                        <Edit2 className="h-3 w-3" /> Edit
                      </Button>
                      {dept.status === "ACTIVE" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeactivate(dept.id, dept.name)}
                          className="h-7 text-xs text-rose-600 hover:bg-rose-50"
                        >
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create/Edit Department Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in-50">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {editingDept ? "Edit Clinical Department" : "Add Clinical Department"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Scoped to {facility?.name || "current facility"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
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

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Department Name *</Label>
                    <Input
                      required
                      placeholder="e.g. Cardiology & Cath Lab"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Department Code (Short)</Label>
                    <Input
                      placeholder="e.g. CARD"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="text-xs h-9 uppercase font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Description</Label>
                    <Input
                      placeholder="Clinical scope, diagnostic capabilities, or ward details"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Head Doctor Name</Label>
                      <Input
                        placeholder="e.g. Dr. Ananya Sharma"
                        value={formData.head_doctor_name}
                        onChange={(e) => setFormData({ ...formData, head_doctor_name: e.target.value })}
                        className="text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Doctor ID (MEDORA)</Label>
                      <Input
                        placeholder="e.g. DOC-1001"
                        value={formData.head_doctor_id}
                        onChange={(e) => setFormData({ ...formData, head_doctor_id: e.target.value })}
                        className="text-xs h-9 font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
                  >
                    {editingDept ? "Save Changes" : "Create Department"}
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
