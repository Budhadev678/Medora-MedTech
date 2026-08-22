"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Users, ShieldCheck, Search, Filter, CheckCircle2, UserCheck, ShieldAlert } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { DEMO_PERSONAS, DemoPersona } from "@/lib/constants";

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  const filteredPersonas = DEMO_PERSONAS.filter((p: DemoPersona) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "ALL" || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="space-y-6 max-w-7xl mx-auto pb-24 p-4 sm:p-6">
        <PageHeader
          title="Ecosystem Identity & Account Governance Registry"
          description="Govern registered patient accounts, healthcare providers, pharmacists, lab technicians, and administrative staff roles across MEDORA."
          breadcrumbs={[{ label: "Admin Console", href: "/admin" }, { label: "User Identity Registry" }]}
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID (e.g. DOC-1001, PAT-1001) or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs h-9 rounded-xl border border-slate-200 pl-9 pr-3 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs h-9 rounded-xl border border-slate-200 px-3 bg-white font-semibold text-slate-700"
            >
              <option value="ALL">All Roles</option>
              <option value="patient">Patients</option>
              <option value="doctor">Doctors</option>
              <option value="hospital_admin">Hospital Admin</option>
              <option value="lab_staff">Lab Staff</option>
              <option value="pharmacy_staff">Pharmacy Staff</option>
              <option value="finance_staff">Finance Staff</option>
              <option value="admin">System Admin</option>
            </select>
          </div>
        </div>

        {/* Personas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPersonas.map((p: DemoPersona) => (
            <Card key={p.id} className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-teal-950 text-xs">{p.identifier}</span>
                  <Badge className="bg-teal-100 text-teal-800 text-[10px] uppercase font-bold">{p.role.replace("_", " ")}</Badge>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                  <p className="text-xs text-slate-500">{p.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 text-emerald-700 font-bold">
                    <UserCheck className="h-3.5 w-3.5" /> VERIFIED IDENTITY
                  </span>
                  {p.organization && <span className="truncate max-w-[160px] text-slate-400 font-mono text-[10px]">{p.organization}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </RoleGuard>
  );
}
