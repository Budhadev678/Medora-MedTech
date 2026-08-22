"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Layers,
  Plus,
  Search,
  Building2,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Stethoscope,
  Users,
  Eye,
  ShieldCheck,
  Activity,
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
  getAllOrganizations,
  getAllFacilities,
  getFacilitiesForOrganization,
  createFacility,
  deactivateFacility,
} from "@/lib/data/facility-store";
import { getDepartmentsForFacility } from "@/lib/data/department-store";
import { getFacilityDoctors, getFacilityStaff } from "@/lib/data/affiliation-store";
import { getServicesForFacility } from "@/lib/data/service-store";
import { HealthcareFacility, HealthcareOrganization } from "@/types/database.types";
import { useAuth } from "@/lib/auth/auth-context";

export default function AdminFacilitiesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const orgQuery = searchParams.get("orgId");

  const [organizations, setOrganizations] = useState<HealthcareOrganization[]>(() => getAllOrganizations());
  const [facilities, setFacilities] = useState<HealthcareFacility[]>(() => getAllFacilities());
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>(orgQuery || "all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    facility_code: "",
    organization_id: organizations[0]?.identifier || "HSP-1001",
    type: "HOSPITAL",
    license_no: "",
    phone: "",
    emergency_phone: "112",
    email: "",
    address: "",
    city: "Bhubaneswar",
    district: "Khordha",
    state: "Odisha",
    postal_code: "751001",
    country: "India",
    operating_hours: "24/7 Operational",
  });

  useEffect(() => {
    if (orgQuery) {
      setSelectedOrgFilter(orgQuery);
    }
  }, [orgQuery]);

  const refreshData = () => {
    setOrganizations(getAllOrganizations());
    setFacilities(getAllFacilities());
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.name.trim() || !formData.organization_id.trim() || !formData.city.trim()) {
      setErrorMessage("Facility name, parent organization, and city are required.");
      return;
    }

    const res = createFacility({
      name: formData.name.trim(),
      facility_code: formData.facility_code.trim().toUpperCase() || undefined,
      organization_id: formData.organization_id.trim(),
      type: formData.type,
      license_no: formData.license_no.trim() || undefined,
      phone: formData.phone.trim() || "+91 674 0000000",
      emergency_phone: formData.emergency_phone.trim() || "112",
      email: formData.email.trim() || undefined,
      address: formData.address.trim() || "Main Road",
      city: formData.city.trim(),
      district: formData.district.trim(),
      state: formData.state.trim(),
      postal_code: formData.postal_code.trim(),
      country: formData.country.trim() || "India",
      operating_hours: formData.operating_hours.trim(),
      status: "ACTIVE",
      verification_status: "verified",
    });

    if (res.success && res.facility) {
      setActionMessage(`Facility branch ${res.facility.name} (${res.facility.facility_code}) created successfully.`);
      refreshData();
      setIsCreateModalOpen(false);
      setFormData({
        name: "",
        facility_code: "",
        organization_id: organizations[0]?.identifier || "HSP-1001",
        type: "HOSPITAL",
        license_no: "",
        phone: "",
        emergency_phone: "112",
        email: "",
        address: "",
        city: "Bhubaneswar",
        district: "Khordha",
        state: "Odisha",
        postal_code: "751001",
        country: "India",
        operating_hours: "24/7 Operational",
      });
      setTimeout(() => setActionMessage(null), 3000);
    } else {
      setErrorMessage(res.error || "Failed to create facility branch.");
    }
  };

  const handleDeactivate = (facId: string, facName: string) => {
    if (confirm(`Are you sure you want to deactivate ${facName}? Historical clinical records will remain intact.`)) {
      const res = deactivateFacility(facId, "Administrative branch deactivation");
      if (res.success) {
        setActionMessage(`Facility ${facName} has been deactivated.`);
        refreshData();
        setTimeout(() => setActionMessage(null), 3000);
      }
    }
  };

  // Filtered facilities
  const filteredFacilities = facilities.filter((fac) => {
    if (selectedOrgFilter !== "all") {
      const matchOrg =
        fac.organization_id.toLowerCase() === selectedOrgFilter.toLowerCase() ||
        fac.organization_identifier?.toLowerCase() === selectedOrgFilter.toLowerCase();
      if (!matchOrg) return false;
    }
    if (typeFilter !== "all" && fac.type.toLowerCase() !== typeFilter.toLowerCase()) return false;
    if (statusFilter !== "all" && fac.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        fac.name.toLowerCase().includes(q) ||
        fac.facility_code.toLowerCase().includes(q) ||
        fac.city.toLowerCase().includes(q) ||
        (fac.organization_name && fac.organization_name.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <RoleGuard allowedRoles={["admin", "hospital_admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="Multi-Branch Facilities & Campuses"
          description="Manage physical hospital branches, specialized surgical centers, outpatient clinics, and laboratory hubs."
          breadcrumbs={[
            { label: "Admin Console", href: "/admin" },
            { label: "Organizations", href: "/admin/organizations" },
            { label: "Facilities" },
          ]}
          actions={
            <Button
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold gap-1.5"
            >
              <Plus className="h-4 w-4" /> Add Facility Branch
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
              placeholder="Search facility name, code, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedOrgFilter}
              onChange={(e) => setSelectedOrgFilter(e.target.value)}
              aria-label="Filter by Parent Organization"
              className="text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Organizations</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.identifier}>
                  {org.name} ({org.identifier})
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by Facility Type"
              className="text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Facility Types</option>
              <option value="HOSPITAL">Hospital</option>
              <option value="CLINIC">Clinic</option>
              <option value="LABORATORY">Diagnostic Lab</option>
              <option value="PHARMACY">Pharmacy</option>
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
              <option value="PENDING_VERIFICATION">Pending</option>
            </select>
          </div>
        </div>

        {/* Facilities Table */}
        <Card className="bg-white border-slate-200 overflow-hidden shadow-sm">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Healthcare Facilities & Campuses ({filteredFacilities.length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Physical care facilities providing clinical services, diagnostic testing, and medication dispensing.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredFacilities.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No facility campuses found matching your filter selections.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-slate-600">Facility & Code</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Parent Organization</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Type & Location</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Departments & Doctors</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFacilities.map((fac) => {
                    const depts = getDepartmentsForFacility(fac.facility_code);
                    const doctors = getFacilityDoctors(fac.facility_code);
                    const services = getServicesForFacility(fac.facility_code);
                    return (
                      <TableRow key={fac.id} className="hover:bg-slate-50/50">
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 flex-shrink-0">
                              <Layers className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                                {fac.name}
                                {fac.verification_status === "verified" && (
                                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                                )}
                              </div>
                              <span className="font-mono text-[10px] text-slate-500">{fac.facility_code}</span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-3">
                          <div className="text-xs font-medium text-slate-800 flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-slate-400" />
                            {fac.organization_name || fac.organization_identifier}
                          </div>
                          <span className="font-mono text-[10px] text-slate-500">{fac.organization_identifier}</span>
                        </TableCell>

                        <TableCell className="py-3">
                          <Badge variant="outline" className="text-[10px] font-semibold text-slate-700 bg-slate-50">
                            {fac.type}
                          </Badge>
                          <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {fac.city}, {fac.state}
                          </div>
                        </TableCell>

                        <TableCell className="py-3">
                          <div className="space-y-0.5 text-xs text-slate-700">
                            <div className="font-medium">{depts.length} Clinical Depts</div>
                            <div className="text-[11px] text-slate-500">
                              {doctors.length} Doctors • {services.length} Services
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-3">
                          <Badge
                            className={`text-[10px] font-semibold ${
                              fac.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {fac.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href="/hospital/departments">
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-teal-700 gap-1 hover:bg-teal-50">
                                <Activity className="h-3.5 w-3.5" /> Workspace
                              </Button>
                            </Link>
                            {fac.status === "ACTIVE" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeactivate(fac.id, fac.name)}
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

        {/* Create Facility Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in-50">
            <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Add Facility Campus / Branch</h3>
                    <p className="text-xs text-slate-500">Configure a physical healthcare facility under a parent group</p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Parent Healthcare Group *</Label>
                    <select
                      value={formData.organization_id}
                      onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                      aria-label="Parent Healthcare Group"
                      className="w-full text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 font-medium"
                    >
                      {organizations.map((org) => (
                        <option key={org.id} value={org.identifier}>
                          {org.name} ({org.identifier})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Facility Type *</Label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      aria-label="Facility Type"
                      className="w-full text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 font-medium"
                    >
                      <option value="HOSPITAL">Hospital / Multi-Specialty Campus</option>
                      <option value="CLINIC">Day Outpatient Clinic Branch</option>
                      <option value="LABORATORY">Diagnostic Laboratory Hub</option>
                      <option value="PHARMACY">Pharmacy Store</option>
                      <option value="BLOOD_CENTER">Blood Collection Centre</option>
                    </select>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs font-semibold text-slate-700">Facility Name *</Label>
                    <Input
                      required
                      placeholder="e.g. City Hospital — Sambalpur Specialty Wing"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Facility Code (Optional)</Label>
                    <Input
                      placeholder="e.g. FAC-1005 or HSP-1001-SBP"
                      value={formData.facility_code}
                      onChange={(e) => setFormData({ ...formData, facility_code: e.target.value })}
                      className="text-xs h-9 uppercase font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Branch License No</Label>
                    <Input
                      placeholder="e.g. HSP-OD-2026-092-D"
                      value={formData.license_no}
                      onChange={(e) => setFormData({ ...formData, license_no: e.target.value })}
                      className="text-xs h-9 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Primary Phone</Label>
                    <Input
                      placeholder="+91 663 2400100"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Emergency Phone</Label>
                    <Input
                      placeholder="112"
                      value={formData.emergency_phone}
                      onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                      className="text-xs h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Street Address</Label>
                  <Input
                    placeholder="Civil Township, Sector 4"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">City *</Label>
                    <Input
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">District</Label>
                    <Input
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">State *</Label>
                    <Input
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">PIN Code *</Label>
                    <Input
                      required
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      className="text-xs h-8 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Operating Hours</Label>
                  <Input
                    placeholder="e.g. 24/7 Emergency; OPD: 08:00 AM - 08:00 PM"
                    value={formData.operating_hours}
                    onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
                    className="text-xs h-9"
                  />
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
                    Register Facility Branch
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
