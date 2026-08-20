"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Landmark, 
  Users, 
  FileCheck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Receipt,
  Search,
  Filter,
  Eye
} from "lucide-react";
import { WorkspaceHeader } from "@/components/professional/workspace-header";
import { MetricCard } from "@/components/professional/metric-card";
import { FilterBar } from "@/components/professional/filter-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default function GovernmentAssistancePage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const assistanceCases = [
    {
      id: "GOV-CASE-1001",
      beneficiary: "Rahul Verma (PAT-1001)",
      scheme: "Biju Swasthya Kalyan Yojana (BSKY)",
      hospital: "City Hospital (Bhubaneswar)",
      encounter: "Cardiology OPD Consult & CBC Panel",
      requestedSubsidy: "₹300.00",
      status: "APPROVED",
      date: "Today, 20 Aug 2026",
    },
    {
      id: "GOV-CASE-1002",
      beneficiary: "Trauma Victim #4 (PAT-1004)",
      scheme: "Ayushman Bharat PM-JAY Critical Trauma",
      hospital: "City Hospital Emergency Trauma Unit",
      encounter: "Emergency Surgery & ICU Stabilization",
      requestedSubsidy: "₹35,000.00",
      status: "APPROVED",
      date: "Today, 20 Aug 2026",
    },
    {
      id: "GOV-CASE-1003",
      beneficiary: "Ramesh Jena (PAT-1008)",
      scheme: "National Dialysis Assistance Scheme",
      hospital: "Green Care Hospital (Cuttack)",
      encounter: "Renal Replacement Session",
      requestedSubsidy: "₹1,800.00",
      status: "PENDING_REVIEW",
      date: "Today, 20 Aug 2026",
    },
  ];

  const filteredCases = assistanceCases.filter(c => {
    const matchesSearch = c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.beneficiary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.hospital.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <RoleGuard allowedRoles={["government_staff", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150">
        <WorkspaceHeader
          title="Government Health Assistance Desk"
          description="State & National healthcare scheme subsidy administration, BSKY/PM-JAY beneficiary approvals, and direct hospital reimbursement coordination."
          facilityContext={user?.organizationName || "Swasthya Assistance Directorate"}
          badgeText="Scheme Authority"
          actions={
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-500">
                {user?.identifier || "GOV-1001"}
              </span>
            </div>
          }
        />

        {/* Operational Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Active Healthcare Schemes"
            value="3 Active"
            subtext="BSKY • PM-JAY • NHM"
            badge="Live"
            icon={<Landmark className="h-4 w-4 text-blue-600" />}
          />
          <MetricCard
            label="Assistance Cases (Today)"
            value="3 Cases"
            subtext="2 Approved • 1 Pending"
            icon={<FileCheck className="h-4 w-4 text-teal-600" />}
          />
          <MetricCard
            label="Subsidies Approved (Today)"
            value="₹35,300"
            subtext="Direct Hospital Settlement"
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          />
          <MetricCard
            label="Beneficiaries Verified"
            value="100%"
            subtext="Biometric / Health ID Matched"
            icon={<ShieldCheck className="h-4 w-4 text-purple-600" />}
          />
        </div>

        {/* Active Cases Table */}
        <Card className="bg-white">
          <CardHeader className="p-4 pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Beneficiary Assistance & Subsidy Queue
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Hospital pre-authorization vouchers and government scheme coverage claims.
                </CardDescription>
              </div>

              <FilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search case ID, patient or hospital..."
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                statusOptions={[
                  { label: "All Cases", value: "all" },
                  { label: "Approved", value: "approved" },
                  { label: "Pending Review", value: "pending_review" },
                ]}
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Case ID</TableHead>
                  <TableHead className="text-xs">Beneficiary</TableHead>
                  <TableHead className="text-xs">Scheme</TableHead>
                  <TableHead className="text-xs">Hospital / Encounter</TableHead>
                  <TableHead className="text-xs">Subsidy Amount</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((item) => (
                  <TableRow key={item.id} className="text-xs">
                    <TableCell className="font-mono font-bold text-blue-900">{item.id}</TableCell>
                    <TableCell className="font-semibold text-slate-900">{item.beneficiary}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] text-blue-800 border-blue-200 bg-blue-50/50">
                        {item.scheme}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      <span className="font-medium text-slate-900 block">{item.hospital}</span>
                      <span className="text-[11px] text-slate-400">{item.encounter}</span>
                    </TableCell>
                    <TableCell className="font-bold text-slate-900">{item.requestedSubsidy}</TableCell>
                    <TableCell>
                      {item.status === "APPROVED" ? (
                        <Badge variant="success" className="text-[10px]">● Approved</Badge>
                      ) : (
                        <Badge variant="warning" className="text-[10px]">● Pending Review</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Phase 12 Placeholder */}
        <EmptyState
          icon={<Landmark className="h-6 w-6 text-blue-600" />}
          title="Government Healthcare Assistance Subsystem"
          description="Automated PM-JAY / State scheme eligibility checks, hospital pre-authorization approval vouchers, and direct treasury payment disbursements will activate in Phase 12."
          phase="Phase 12 — Insurance, Assistance & Financing Engine"
          actionHref="/admin"
          actionLabel="View Platform Governance"
        />
      </div>
    </RoleGuard>
  );
}
