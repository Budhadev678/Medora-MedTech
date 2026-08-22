"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  MapPin,
  Phone,
  Mail,
  Globe,
  X,
  Eye,
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
  getAllOrganizations,
  getFacilitiesForOrganization,
  createOrganization,
  deactivateOrganization,
} from "@/lib/data/facility-store";
import { HealthcareOrganization } from "@/types/database.types";
import { useAuth } from "@/lib/auth/auth-context";

export default function AdminOrganizationsPage() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<HealthcareOrganization[]>(() => getAllOrganizations());
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    legal_name: "",
    identifier: "",
    type: "HOSPITAL_GROUP",
    license_no: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    city: "Bhubaneswar",
    district: "Khordha",
    state: "Odisha",
    postal_code: "751001",
    country: "India",
  });

  const refreshData = () => {
    setOrganizations(getAllOrganizations());
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.name.trim() || !formData.license_no.trim()) {
      setErrorMessage("Organization name and registration license number are required.");
      return;
    }

    const res = createOrganization({
      name: formData.name.trim(),
      legal_name: formData.legal_name.trim() || formData.name.trim(),
      identifier: formData.identifier.trim().toUpperCase() || undefined,
      type: formData.type,
      license_no: formData.license_no.trim(),
      phone: formData.phone.trim() || "+91 674 0000000",
      email: formData.email.trim() || undefined,
      website: formData.website.trim() || undefined,
      address: formData.address.trim() || "Main Road",
      city: formData.city.trim(),
      district: formData.district.trim(),
      state: formData.state.trim(),
      postal_code: formData.postal_code.trim(),
      country: formData.country.trim() || "India",
      status: "ACTIVE",
      verification_status: "verified",
    });

    if (res.success && res.organization) {
      setActionMessage(`Organization ${res.organization.name} (${res.organization.identifier}) created successfully.`);
      refreshData();
      setIsCreateModalOpen(false);
      setFormData({
        name: "",
        legal_name: "",
        identifier: "",
        type: "HOSPITAL_GROUP",
        license_no: "",
        phone: "",
        email: "",
        website: "",
        address: "",
        city: "Bhubaneswar",
        district: "Khordha",
        state: "Odisha",
        postal_code: "751001",
        country: "India",
      });
      setTimeout(() => setActionMessage(null), 3000);
    } else {
      setErrorMessage(res.error || "Failed to create organization.");
    }
  };

  const handleDeactivate = (orgId: string, orgName: string) => {
    if (confirm(`Are you sure you want to deactivate ${orgName}? Existing records will be preserved.`)) {
      const res = deactivateOrganization(orgId, "Administrative deactivation");
      if (res.success) {
        setActionMessage(`Organization ${orgName} has been deactivated.`);
        refreshData();
        setTimeout(() => setActionMessage(null), 3000);
      }
    }
  };

  // Filtered list
  const filteredOrgs = organizations.filter((org) => {
    if (typeFilter !== "all" && org.type.toLowerCase() !== typeFilter.toLowerCase()) return false;
    if (statusFilter !== "all" && org.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        org.name.toLowerCase().includes(q) ||
        org.identifier.toLowerCase().includes(q) ||
        org.city.toLowerCase().includes(q) ||
        org.license_no.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <RoleGuard allowedRoles={["admin", "hospital_admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="Healthcare Organizations Registry"
          description="Parent healthcare groups, multi-hospital networks, diagnostic chains, and pharmacy systems."
          breadcrumbs={[{ label: "Admin Console", href: "/admin" }, { label: "Organizations" }]}
          actions={
            <Button
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold gap-1.5"
            >
              <Plus className="h-4 w-4" /> Add Organization
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

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, ID, city, or license..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by Organization Type"
              className="text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Organization Types</option>
              <option value="HOSPITAL_GROUP">Hospital Group</option>
              <option value="CLINIC_GROUP">Clinic Group</option>
              <option value="DIAGNOSTIC_GROUP">Diagnostic Group</option>
              <option value="PHARMACY_GROUP">Pharmacy Group</option>
              <option value="BLOOD_BANK_GROUP">Blood Bank Group</option>
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

        {/* Organizations Table */}
        <Card className="bg-white border-slate-200 overflow-hidden shadow-sm">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Registered Healthcare Organizations ({filteredOrgs.length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Authoritative legal entities operating physical healthcare facilities in MEDORA.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredOrgs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No healthcare organizations found matching your criteria.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-slate-600">Organization & ID</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Type & License</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Headquarters</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Connected Facilities</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrgs.map((org) => {
                    const facilities = getFacilitiesForOrganization(org.id);
                    return (
                      <TableRow key={org.id} className="hover:bg-slate-50/50">
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 flex-shrink-0">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                                {org.name}
                                {org.verification_status === "verified" && (
                                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                                )}
                              </div>
                              <span className="font-mono text-[10px] text-slate-500">{org.identifier}</span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-3">
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-[10px] font-semibold text-teal-800 bg-teal-50/60 border-teal-200">
                              {org.type.replace("_", " ")}
                            </Badge>
                            <div className="text-[10px] text-slate-500 font-mono">{org.license_no}</div>
                          </div>
                        </TableCell>

                        <TableCell className="py-3">
                          <div className="text-xs text-slate-700 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {org.city}, {org.state}
                          </div>
                          <div className="text-[10px] text-slate-500">{org.phone}</div>
                        </TableCell>

                        <TableCell className="py-3">
                          <Link
                            href={`/admin/facilities?orgId=${org.identifier}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline"
                          >
                            <Layers className="h-3.5 w-3.5 text-teal-600" />
                            {facilities.length} {facilities.length === 1 ? "Facility Branch" : "Facility Branches"}
                          </Link>
                        </TableCell>

                        <TableCell className="py-3">
                          <Badge
                            className={`text-[10px] font-semibold ${
                              org.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {org.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/admin/facilities?orgId=${org.identifier}`}>
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-600 gap-1">
                                <Eye className="h-3.5 w-3.5" /> View
                              </Button>
                            </Link>
                            {org.status === "ACTIVE" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeactivate(org.id, org.name)}
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

        {/* Create Organization Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in-50">
            <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Add Healthcare Organization</h3>
                    <p className="text-xs text-slate-500">Register a new legal healthcare entity in MEDORA</p>
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
                    <Label className="text-xs font-semibold text-slate-700">Organization Name *</Label>
                    <Input
                      required
                      placeholder="e.g. Lifeline Health Group"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Legal Corporate Name</Label>
                    <Input
                      placeholder="e.g. Lifeline Hospitals Pvt Ltd"
                      value={formData.legal_name}
                      onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Organization Identifier (Optional)</Label>
                    <Input
                      placeholder="e.g. HSP-1003 or ORG-1005"
                      value={formData.identifier}
                      onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                      className="text-xs h-9 uppercase font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Organization Type *</Label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      aria-label="Organization Type"
                      className="w-full text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 font-medium"
                    >
                      <option value="HOSPITAL_GROUP">Hospital Group / Multi-Specialty</option>
                      <option value="CLINIC_GROUP">Outpatient Clinic Network</option>
                      <option value="DIAGNOSTIC_GROUP">Diagnostic / Pathology Chain</option>
                      <option value="PHARMACY_GROUP">Retail Pharmacy Network</option>
                      <option value="BLOOD_BANK_GROUP">Blood Centre / Bank</option>
                      <option value="HEALTHCARE_NETWORK">Integrated Health Network</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Registration / License No *</Label>
                    <Input
                      required
                      placeholder="e.g. HSP-OD-2026-901"
                      value={formData.license_no}
                      onChange={(e) => setFormData({ ...formData, license_no: e.target.value })}
                      className="text-xs h-9 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Contact Phone</Label>
                    <Input
                      placeholder="+91 674 2500000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Email Address</Label>
                    <Input
                      type="email"
                      placeholder="contact@lifeline.org"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Website</Label>
                    <Input
                      placeholder="https://lifeline.org"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="text-xs h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Headquarters Address</Label>
                  <Input
                    placeholder="Street, Medical District, Sector"
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
                    Register Organization
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
