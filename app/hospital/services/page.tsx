"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Plus,
  Search,
  Stethoscope,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Edit2,
  Building2,
  UserPlus,
  Layers,
  IndianRupee,
  ShieldCheck,
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
  getServicesForFacility,
  createService,
  updateService,
  deactivateService,
  getAllDoctorServiceAssignments,
  assignDoctorToService,
  removeDoctorFromService,
} from "@/lib/data/service-store";
import { getDepartmentsForFacility } from "@/lib/data/department-store";
import { getFacilityDoctors } from "@/lib/data/affiliation-store";
import { getFacilityById } from "@/lib/data/facility-store";
import { HealthcareService, HealthcareServiceCategory } from "@/types/database.types";
import { useAuth } from "@/lib/auth/auth-context";

export default function HospitalServicesPage() {
  const { user } = useAuth();
  const facilityCode = user?.identifier || user?.organizationId || "FAC-1001";
  const facility = getFacilityById(facilityCode);

  const [services, setServices] = useState<HealthcareService[]>(() =>
    getServicesForFacility(facilityCode, true)
  );
  const [departments] = useState(() => getDepartmentsForFacility(facilityCode));
  const [affiliatedDoctors] = useState(() => getFacilityDoctors(facilityCode));
  const [assignments, setAssignments] = useState(() => getAllDoctorServiceAssignments());

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedServiceForAssign, setSelectedServiceForAssign] = useState<HealthcareService | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState(affiliatedDoctors[0]?.doctor_id || "DOC-1001");

  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    category: "CONSULTATION" as HealthcareServiceCategory,
    department_id: departments[0]?.id || "",
    description: "",
    duration_minutes: 15,
    base_price: 500,
  });

  const refreshData = () => {
    setServices(getServicesForFacility(facilityCode, true));
    setAssignments(getAllDoctorServiceAssignments());
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.name.trim()) {
      setErrorMessage("Service name is required.");
      return;
    }

    const res = createService({
      facility_id: facilityCode,
      department_id: formData.department_id || null,
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase() || formData.name.substring(0, 4).toUpperCase(),
      category: formData.category,
      description: formData.description.trim(),
      duration_minutes: Number(formData.duration_minutes) || 15,
      base_price: Number(formData.base_price) || 0,
      status: "ACTIVE",
    });

    if (res.success && res.service) {
      setActionMessage(`Service '${res.service.name}' (${res.service.code}) configured.`);
      refreshData();
      setIsCreateModalOpen(false);
      setFormData({
        name: "",
        code: "",
        category: "CONSULTATION",
        department_id: departments[0]?.id || "",
        description: "",
        duration_minutes: 15,
        base_price: 500,
      });
      setTimeout(() => setActionMessage(null), 3000);
    } else {
      setErrorMessage(res.error || "Failed to create service.");
    }
  };

  const handleAssignDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceForAssign) return;

    const doc = affiliatedDoctors.find((d) => d.doctor_id === selectedDoctorId);
    const docName = doc?.doctor_name || selectedDoctorId;

    const res = assignDoctorToService(
      selectedDoctorId,
      docName,
      facilityCode,
      selectedServiceForAssign.id
    );

    if (res.success) {
      setActionMessage(`Doctor ${docName} assigned to provide '${selectedServiceForAssign.name}'.`);
      refreshData();
      setIsAssignModalOpen(false);
      setSelectedServiceForAssign(null);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleRemoveDoctorAssignment = (docId: string, srvId: string) => {
    const res = removeDoctorFromService(docId, facilityCode, srvId);
    if (res.success) {
      setActionMessage("Doctor removed from service offering.");
      refreshData();
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleDeactivateService = (srvId: string, srvName: string) => {
    if (confirm(`Deactivate service '${srvName}'? Historical bookings/orders remain intact.`)) {
      const res = deactivateService(srvId, "Administrative service deactivation");
      if (res.success) {
        setActionMessage(`Service '${srvName}' is now inactive.`);
        refreshData();
        setTimeout(() => setActionMessage(null), 3000);
      }
    }
  };

  // Filtered Services
  const filteredServices = services.filter((srv) => {
    if (categoryFilter !== "all" && srv.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
    if (deptFilter !== "all") {
      if (deptFilter === "facility_level" && srv.department_id !== null) return false;
      if (deptFilter !== "facility_level" && srv.department_id?.toLowerCase() !== deptFilter.toLowerCase()) return false;
    }
    if (statusFilter !== "all" && srv.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        srv.name.toLowerCase().includes(q) ||
        srv.code.toLowerCase().includes(q) ||
        (srv.department_name && srv.department_name.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <RoleGuard allowedRoles={["hospital_admin", "staff", "admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="Clinical Services & Procedure Catalog"
          description={`Comprehensive healthcare offerings, diagnostic procedures, consultations, and doctor assignments at ${facility?.name || "this facility"}.`}
          breadcrumbs={[{ label: "Hospital Command", href: "/hospital" }, { label: "Services" }]}
          actions={
            <Button
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold gap-1.5"
            >
              <Plus className="h-4 w-4" /> Add Healthcare Service
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
              placeholder="Search services by name, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              aria-label="Filter by Department"
              className="text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Departments</option>
              <option value="facility_level">Facility-Level (General)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by Category"
              className="text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Categories</option>
              <option value="CONSULTATION">Consultations</option>
              <option value="DIAGNOSTIC">Diagnostics & Tests</option>
              <option value="IMAGING">Radiology & Imaging</option>
              <option value="EMERGENCY">Emergency Care</option>
              <option value="PROCEDURE">Procedures</option>
            </select>

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

        {/* Services Table */}
        <Card className="bg-white border-slate-200 overflow-hidden shadow-sm">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Healthcare Services & Procedures ({filteredServices.length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Medical service offerings connected to clinical appointments, OPD queues, and diagnostic workflows.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredServices.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No healthcare services found matching your filters.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-slate-600">Service Name & Code</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Department / Scope</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Category & Duration</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Base Fee</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Assigned Doctors</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((srv) => {
                    const assignedDoctors = assignments.filter(
                      (a) => a.service_id.toLowerCase() === srv.id.toLowerCase() && a.status === "ACTIVE"
                    );

                    return (
                      <TableRow key={srv.id} className="hover:bg-slate-50/50">
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 flex-shrink-0">
                              <Activity className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 text-xs">{srv.name}</div>
                              <span className="font-mono text-[10px] text-slate-400">
                                {srv.code} • {srv.id}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-3">
                          {srv.department_name ? (
                            <span className="text-xs font-medium text-slate-800 flex items-center gap-1">
                              <Layers className="h-3 w-3 text-slate-400" />
                              {srv.department_name}
                            </span>
                          ) : (
                            <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600">
                              Facility-Wide
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="py-3">
                          <Badge variant="outline" className="text-[10px] font-semibold text-slate-700 bg-slate-50">
                            {srv.category}
                          </Badge>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {srv.duration_minutes || 15} mins
                          </div>
                        </TableCell>

                        <TableCell className="py-3">
                          <span className="font-semibold text-xs text-slate-900 flex items-center">
                            ₹{srv.base_price || 0}
                          </span>
                        </TableCell>

                        <TableCell className="py-3">
                          {assignedDoctors.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic">None assigned</span>
                          ) : (
                            <div className="space-y-1">
                              {assignedDoctors.map((doc) => (
                                <div
                                  key={doc.id}
                                  className="text-[11px] font-medium text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 flex items-center justify-between gap-1 w-fit"
                                >
                                  <span>{doc.doctor_name}</span>
                                  <button
                                    onClick={() => handleRemoveDoctorAssignment(doc.doctor_id, srv.id)}
                                    className="text-teal-600 hover:text-rose-600 text-[10px]"
                                    title="Unassign doctor"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="py-3">
                          <Badge
                            className={`text-[10px] font-semibold ${
                              srv.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {srv.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedServiceForAssign(srv);
                                setIsAssignModalOpen(true);
                              }}
                              className="h-7 text-xs text-teal-700 hover:bg-teal-50 gap-1"
                              title="Assign doctor to this service"
                            >
                              <UserPlus className="h-3.5 w-3.5" /> Assign Dr.
                            </Button>
                            {srv.status === "ACTIVE" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeactivateService(srv.id, srv.name)}
                                className="h-7 text-xs text-rose-600 hover:bg-rose-50"
                              >
                                Deactivate
                              </Button>
                            )}
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

        {/* Create Service Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in-50">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Add Healthcare Service</h3>
                    <p className="text-xs text-slate-500">Configure a clinical service or procedure at this facility</p>
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
                    <Label className="text-xs font-semibold text-slate-700">Service Name *</Label>
                    <Input
                      required
                      placeholder="e.g. 12-Lead Electrocardiogram (ECG)"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Department</Label>
                      <select
                        value={formData.department_id}
                        onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                        aria-label="Department"
                        className="w-full text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 font-medium"
                      >
                        <option value="">Facility-Level (No Department)</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Category *</Label>
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value as HealthcareServiceCategory })
                        }
                        aria-label="Category"
                        className="w-full text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 font-medium"
                      >
                        <option value="CONSULTATION">Consultation</option>
                        <option value="DIAGNOSTIC">Diagnostic Test</option>
                        <option value="IMAGING">Radiology / Imaging</option>
                        <option value="EMERGENCY">Emergency Care</option>
                        <option value="PROCEDURE">Procedure / Treatment</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Code</Label>
                      <Input
                        placeholder="e.g. ECG-01"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="text-xs h-9 uppercase font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Duration (mins)</Label>
                      <Input
                        type="number"
                        min="5"
                        max="240"
                        value={formData.duration_minutes}
                        onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                        className="text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Base Fee (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.base_price}
                        onChange={(e) => setFormData({ ...formData, base_price: Number(e.target.value) })}
                        className="text-xs h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Description</Label>
                    <Input
                      placeholder="Clinical purpose, prep instructions, or report turnaround time"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="text-xs h-9"
                    />
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
                    Configure Service
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Doctor Modal */}
        {isAssignModalOpen && selectedServiceForAssign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in-50">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-teal-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Assign Doctor to Service</h3>
                    <p className="text-xs text-slate-500 font-medium">{selectedServiceForAssign.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAssignDoctor} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700">Select Affiliated Practitioner</Label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    aria-label="Select Affiliated Practitioner"
                    className="w-full text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 font-medium"
                  >
                    {affiliatedDoctors.map((doc) => (
                      <option key={doc.id} value={doc.doctor_id}>
                        {doc.doctor_name} ({doc.doctor_id}) — {doc.specialization}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500">
                    Only practitioners actively affiliated with {facility?.name} can be assigned.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAssignModalOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
                  >
                    Confirm Assignment
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
