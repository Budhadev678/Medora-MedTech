"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  FlaskConical,
  Award,
  ExternalLink,
  QrCode,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAllLabReports } from "@/lib/data/lab-order-store";
import { HealthcareLabReport } from "@/types/database.types";

interface EnrichedLabReportView {
  id: string;
  reportRef: string;
  testName: string;
  patientName: string;
  patientId: string;
  orderingDoctor: string;
  verifiedBy: string;
  laboratoryName: string;
  status: "RELEASED" | "VERIFIED" | "PENDING_REVIEW";
  releaseDate: string;
  parameterCount: number;
  hasAbnormalFlag: boolean;
  publicVerificationUrl: string;
}

const SEED_EXTENDED_REPORTS: EnrichedLabReportView[] = [
  {
    id: "RPT-1024",
    reportRef: "RPT-1024",
    testName: "Complete Blood Count (CBC) with Automated Differential",
    patientName: "Rahul Verma",
    patientId: "PAT-1001",
    orderingDoctor: "Dr. Ananya Sharma (Cardiology)",
    verifiedBy: "Dr. B. Mohapatra, MD (Pathology)",
    laboratoryName: "ABC Diagnostics (LAB-1001)",
    status: "RELEASED",
    releaseDate: "2026-08-24 14:30",
    parameterCount: 14,
    hasAbnormalFlag: false,
    publicVerificationUrl: "/verify/lab/LAB-1024",
  },
  {
    id: "RPT-1025",
    reportRef: "RPT-1025",
    testName: "Comprehensive Lipid Profile & Cardiovascular Biomarkers",
    patientName: "Rahul Verma",
    patientId: "PAT-1001",
    orderingDoctor: "Dr. Ananya Sharma (Cardiology)",
    verifiedBy: "Dr. B. Mohapatra, MD (Pathology)",
    laboratoryName: "ABC Diagnostics (LAB-1001)",
    status: "RELEASED",
    releaseDate: "2026-08-24 15:00",
    parameterCount: 6,
    hasAbnormalFlag: true,
    publicVerificationUrl: "/verify/lab/LAB-1024",
  },
  {
    id: "RPT-1026",
    reportRef: "RPT-1026",
    testName: "Renal Function & Serum Electrolyte Profile (KFT)",
    patientName: "Priya Sharma",
    patientId: "PAT-1002",
    orderingDoctor: "Dr. Rajesh Kumar (General Medicine)",
    verifiedBy: "Dr. B. Mohapatra, MD (Pathology)",
    laboratoryName: "ABC Diagnostics (LAB-1001)",
    status: "RELEASED",
    releaseDate: "2026-08-23 11:20",
    parameterCount: 8,
    hasAbnormalFlag: false,
    publicVerificationUrl: "/verify/lab/LAB-1024",
  },
  {
    id: "RPT-1027",
    reportRef: "RPT-1027",
    testName: "Glycated Hemoglobin (HbA1c) & Fasting Blood Glucose",
    patientName: "Amit Das",
    patientId: "PAT-1003",
    orderingDoctor: "Dr. S. K. Panda (Endocrinology)",
    verifiedBy: "Dr. B. Mohapatra, MD (Pathology)",
    laboratoryName: "ABC Diagnostics (LAB-1001)",
    status: "PENDING_REVIEW",
    releaseDate: "2026-08-24 16:45",
    parameterCount: 3,
    hasAbnormalFlag: true,
    publicVerificationUrl: "/verify/lab/LAB-1024",
  },
];

export default function LabReportsPage() {
  const [reports, setReports] = useState<EnrichedLabReportView[]>(SEED_EXTENDED_REPORTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    const loaded = getAllLabReports();
    if (loaded && loaded.length > 0) {
      const mapped: EnrichedLabReportView[] = loaded.map((r) => ({
        id: r.id,
        reportRef: r.report_reference || r.id,
        testName: r.results && r.results[0] ? r.results[0].test_name : "Diagnostic Pathology Panel",
        patientName: r.patient_name,
        patientId: r.patient_id,
        orderingDoctor: r.ordering_provider_name,
        verifiedBy: r.verified_by_name || "Dr. B. Mohapatra, MD",
        laboratoryName: r.laboratory_name || "ABC Diagnostics",
        status: (r.status as any) || "RELEASED",
        releaseDate: r.released_at ? new Date(r.released_at).toLocaleString() : "2026-08-24",
        parameterCount: r.results ? r.results.length : 4,
        hasAbnormalFlag: r.results ? r.results.some((res) => res.flag === "ABNORMAL" || res.flag === "CRITICAL") : false,
        publicVerificationUrl: `/verify/lab/${r.laboratory_id || "LAB-1024"}`,
      }));

      // Merge with seed reports ensuring uniqueness
      const ids = new Set(mapped.map((m) => m.id));
      const combined = [...mapped, ...SEED_EXTENDED_REPORTS.filter((s) => !ids.has(s.id))];
      setReports(combined);
    }
  }, []);

  const filteredReports = reports.filter((r) => {
    if (statusFilter === "RELEASED" && r.status !== "RELEASED") return false;
    if (statusFilter === "PENDING" && r.status !== "PENDING_REVIEW") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchId = r.id.toLowerCase().includes(q);
      const matchTest = r.testName.toLowerCase().includes(q);
      const matchPat = r.patientName.toLowerCase().includes(q);
      const matchPatId = r.patientId.toLowerCase().includes(q);
      const matchDoc = r.orderingDoctor.toLowerCase().includes(q);
      return matchId || matchTest || matchPat || matchPatId || matchDoc;
    }
    return true;
  });

  const releasedCount = reports.filter((r) => r.status === "RELEASED").length;
  const pendingCount = reports.filter((r) => r.status === "PENDING_REVIEW").length;

  return (
    <RoleGuard allowedRoles={["hospital_admin", "lab_staff", "staff", "admin", "doctor"]}>
      <div className="space-y-6 max-w-7xl mx-auto pb-24 font-sans p-4 sm:p-6 animate-in fade-in-50 duration-200">
        <PageHeader
          title="Certified Pathology Reports Archive & Registry"
          description="Authoritative repository of released NABL-accredited diagnostic reports with verifiable QR verification codes."
          breadcrumbs={[{ label: "Diagnostic Lab", href: "/lab" }, { label: "Certified Reports" }]}
        />

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white rounded-2xl border-slate-200 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Reports</p>
                <h3 className="text-2xl font-black text-slate-900 font-mono mt-0.5">{reports.length}</h3>
                <p className="text-[10px] text-blue-600 font-semibold mt-0.5">NABL Certified Archive</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl border-slate-200 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Released to Patients</p>
                <h3 className="text-2xl font-black text-emerald-900 font-mono mt-0.5">{releasedCount}</h3>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">● EMR & QR Live</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl border-slate-200 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Review</p>
                <h3 className="text-2xl font-black text-amber-900 font-mono mt-0.5">{pendingCount}</h3>
                <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Awaiting Pathologist Sign</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl border-slate-200 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Accreditation</p>
                <h3 className="text-base font-black text-slate-900 font-mono mt-1">NABL ISO 15189</h3>
                <p className="text-[10px] text-blue-600 font-semibold mt-0.5">Electronic Signatory Active</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
                <Award className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls & Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <Button
              variant={statusFilter === "ALL" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("ALL")}
              className={`text-xs rounded-lg h-7 font-bold ${statusFilter === "ALL" ? "bg-blue-700 text-white shadow-xs" : "text-slate-600"}`}
            >
              All Reports ({reports.length})
            </Button>
            <Button
              variant={statusFilter === "RELEASED" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("RELEASED")}
              className={`text-xs rounded-lg h-7 font-bold ${statusFilter === "RELEASED" ? "bg-emerald-700 text-white shadow-xs" : "text-slate-600"}`}
            >
              Released ({releasedCount})
            </Button>
            <Button
              variant={statusFilter === "PENDING" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("PENDING")}
              className={`text-xs rounded-lg h-7 font-bold ${statusFilter === "PENDING" ? "bg-amber-700 text-white shadow-xs" : "text-slate-600"}`}
            >
              Pending Sign ({pendingCount})
            </Button>
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search Report ID, Test, or Patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs rounded-xl bg-slate-50 border-slate-200 h-9"
            />
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReports.map((report) => (
            <Card key={report.id} className="bg-white rounded-2xl border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                        {report.reportRef}
                      </span>
                      {report.status === "RELEASED" ? (
                        <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-800 border-emerald-300 font-bold">
                          ● Released to Patient & Doctor
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-800 border-amber-300 font-bold">
                          ● Verification Pending
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-sm font-extrabold text-slate-900 leading-snug pt-1">
                      {report.testName}
                    </CardTitle>
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>Patient: {report.patientName}</span>
                    <span className="font-mono text-[11px] text-slate-500">({report.patientId})</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Ordered by: <strong className="text-slate-700">{report.orderingDoctor}</strong>
                  </p>
                </div>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Verified By:</span>
                    <strong className="text-slate-900 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-blue-600" /> {report.verifiedBy}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Laboratory:</span>
                    <span className="text-slate-700">{report.laboratoryName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Parameters Evaluated:</span>
                    <strong className="font-mono text-slate-900">{report.parameterCount} Biomarkers</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Issued: {report.releaseDate}
                  </span>
                  <Link href={report.publicVerificationUrl} target="_blank">
                    <Button variant="outline" size="sm" className="h-7 text-xs font-bold gap-1 text-blue-700 border-blue-200 hover:bg-blue-50 rounded-xl">
                      <QrCode className="h-3.5 w-3.5" /> Public QR Slip <ExternalLink className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </RoleGuard>
  );
}

