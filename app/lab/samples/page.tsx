"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  QrCode,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  FlaskConical,
  Barcode,
  ThermometerSnowflake,
  User,
  ShieldCheck,
  Printer,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAllSamples } from "@/lib/data/lab-order-store";

interface SpecimenIntakeView {
  id: string;
  barcode: string;
  patientName: string;
  patientId: string;
  sampleType: string;
  containerColor: string;
  containerType: string;
  testNames: string[];
  collectedAt: string;
  phlebotomist: string;
  storageCondition: string;
  status: "COLLECTED" | "ACCESSIONED" | "IN_ANALYSIS" | "VERIFIED";
}

const SEED_SPECIMENS: SpecimenIntakeView[] = [
  {
    id: "SMP-1024",
    barcode: "SMP-1024-EDTA-K2",
    patientName: "Rahul Verma",
    patientId: "PAT-1001",
    sampleType: "EDTA Whole Blood",
    containerColor: "bg-purple-100 text-purple-900 border-purple-300",
    containerType: "Purple Top Vacutainer (3ml)",
    testNames: ["Complete Blood Count (CBC) with Diff", "ESR Automated"],
    collectedAt: "2026-08-24 10:15",
    phlebotomist: "Anjali Behera (CMLT)",
    storageCondition: "Room Temp (20-25°C)",
    status: "ACCESSIONED",
  },
  {
    id: "SMP-1025",
    barcode: "SMP-1025-SST-GEL",
    patientName: "Rahul Verma",
    patientId: "PAT-1001",
    sampleType: "Blood Serum",
    containerColor: "bg-amber-100 text-amber-900 border-amber-300",
    containerType: "Gold SST Gel Separator (5ml)",
    testNames: ["Lipid Profile Panel", "Renal Function Test (KFT)"],
    collectedAt: "2026-08-24 10:18",
    phlebotomist: "Anjali Behera (CMLT)",
    storageCondition: "Cold-Chain Refrigerator (2-8°C)",
    status: "IN_ANALYSIS",
  },
  {
    id: "SMP-1026",
    barcode: "SMP-1026-FL-OXA",
    patientName: "Amit Das",
    patientId: "PAT-1003",
    sampleType: "Fluoride Oxalate Plasma",
    containerColor: "bg-slate-200 text-slate-900 border-slate-400",
    containerType: "Grey Top Sodium Fluoride (2ml)",
    testNames: ["Fasting Blood Glucose (FBG)", "Post-Prandial Glucose"],
    collectedAt: "2026-08-24 11:00",
    phlebotomist: "Anjali Behera (CMLT)",
    storageCondition: "Cold-Chain Refrigerator (2-8°C)",
    status: "COLLECTED",
  },
  {
    id: "SMP-1027",
    barcode: "SMP-1027-URN-STR",
    patientName: "Priya Sharma",
    patientId: "PAT-1002",
    sampleType: "Sterile Midstream Urine",
    containerColor: "bg-yellow-100 text-yellow-900 border-yellow-300",
    containerType: "Sterile Universal Container (30ml)",
    testNames: ["Urine Routine & Microscopic Examination"],
    collectedAt: "2026-08-24 11:30",
    phlebotomist: "Prakash Jena (BMLT)",
    storageCondition: "Immediate Analysis (< 2 hrs)",
    status: "VERIFIED",
  },
];

export default function LabSamplesPage() {
  const [specimens, setSpecimens] = useState<SpecimenIntakeView[]>(SEED_SPECIMENS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    const loaded = getAllSamples();
    if (loaded && loaded.length > 0) {
      const mapped: SpecimenIntakeView[] = loaded.map((s) => ({
        id: s.id,
        barcode: s.sample_barcode || s.id,
        patientName: s.patient_name || "Rahul Verma",
        patientId: s.patient_id || "PAT-1001",
        sampleType: s.sample_type ? `${s.sample_type} Specimen` : "EDTA Whole Blood",
        containerColor: "bg-teal-100 text-teal-900 border-teal-300",
        containerType: "Standard NABL Barcode Vacutainer",
        testNames: s.test_names && s.test_names.length > 0 ? s.test_names : ["Diagnostic Laboratory Panel"],
        collectedAt: s.collected_at ? new Date(s.collected_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "10:15",
        phlebotomist: s.collected_by_name || "Lead Phlebotomist",
        storageCondition: "Cold-Chain (2-8°C)",
        status: s.status === "CONSUMED" ? "VERIFIED" : s.status === "PROCESSING" || s.status === "READY_FOR_TESTING" ? "IN_ANALYSIS" : s.status === "COLLECTED" ? "COLLECTED" : "ACCESSIONED",
      }));

      const ids = new Set(mapped.map((m) => m.id));
      const combined = [...mapped, ...SEED_SPECIMENS.filter((seed) => !ids.has(seed.id))];
      setSpecimens(combined);
    }
  }, []);

  const handleAccession = (sampleId: string) => {
    setSpecimens((prev) =>
      prev.map((s) => (s.id === sampleId ? { ...s, status: "IN_ANALYSIS" } : s))
    );
    setActionNotice(`Specimen ${sampleId} accessioned and queued for automated analyzer.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const filteredSpecimens = specimens.filter((s) => {
    if (statusFilter === "COLLECTED" && s.status !== "COLLECTED") return false;
    if (statusFilter === "ACCESSIONED" && s.status !== "ACCESSIONED" && s.status !== "IN_ANALYSIS") return false;
    if (statusFilter === "VERIFIED" && s.status !== "VERIFIED") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchId = s.id.toLowerCase().includes(q);
      const matchBar = s.barcode.toLowerCase().includes(q);
      const matchPat = s.patientName.toLowerCase().includes(q);
      const matchPatId = s.patientId.toLowerCase().includes(q);
      const matchType = s.sampleType.toLowerCase().includes(q);
      return matchId || matchBar || matchPat || matchPatId || matchType;
    }
    return true;
  });

  return (
    <RoleGuard allowedRoles={["hospital_admin", "lab_staff", "staff", "admin", "doctor"]}>
      <div className="space-y-6 max-w-7xl mx-auto pb-24 font-sans p-4 sm:p-6 animate-in fade-in-50 duration-200">
        <PageHeader
          title="Specimen Intake & Barcode Accessioning Desk"
          description="Specimen collection intake, barcode accessioning, temperature chain-of-custody, and analyzer routing."
          breadcrumbs={[{ label: "Diagnostic Lab", href: "/lab" }, { label: "Sample Intake" }]}
        />

        {actionNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in-50">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white rounded-2xl border-slate-200 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Accessions</p>
                <h3 className="text-2xl font-black text-slate-900 font-mono mt-0.5">{specimens.length}</h3>
                <p className="text-[10px] text-teal-600 font-semibold mt-0.5">Barcoded Specimens</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                <Layers className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl border-slate-200 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">In Analysis</p>
                <h3 className="text-2xl font-black text-amber-900 font-mono mt-0.5">
                  {specimens.filter((s) => s.status === "IN_ANALYSIS" || s.status === "ACCESSIONED").length}
                </h3>
                <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Automated Chemistry & CBC</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                <FlaskConical className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl border-slate-200 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Chain of Custody</p>
                <h3 className="text-base font-black text-slate-900 font-mono mt-1">100% Monitored</h3>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Cold-Chain Secure</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                <ThermometerSnowflake className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl border-slate-200 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Verified Results</p>
                <h3 className="text-2xl font-black text-indigo-900 font-mono mt-0.5">
                  {specimens.filter((s) => s.status === "VERIFIED").length}
                </h3>
                <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">Ready for Report Release</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <Button
              variant={statusFilter === "ALL" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("ALL")}
              className={`text-xs rounded-lg h-7 font-bold ${statusFilter === "ALL" ? "bg-teal-700 text-white shadow-xs" : "text-slate-600"}`}
            >
              All Specimens ({specimens.length})
            </Button>
            <Button
              variant={statusFilter === "COLLECTED" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("COLLECTED")}
              className={`text-xs rounded-lg h-7 font-bold ${statusFilter === "COLLECTED" ? "bg-amber-700 text-white shadow-xs" : "text-slate-600"}`}
            >
              Fresh Intake ({specimens.filter((s) => s.status === "COLLECTED").length})
            </Button>
            <Button
              variant={statusFilter === "ACCESSIONED" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("ACCESSIONED")}
              className={`text-xs rounded-lg h-7 font-bold ${statusFilter === "ACCESSIONED" ? "bg-indigo-700 text-white shadow-xs" : "text-slate-600"}`}
            >
              In Testing ({specimens.filter((s) => s.status === "ACCESSIONED" || s.status === "IN_ANALYSIS").length})
            </Button>
            <Button
              variant={statusFilter === "VERIFIED" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("VERIFIED")}
              className={`text-xs rounded-lg h-7 font-bold ${statusFilter === "VERIFIED" ? "bg-emerald-700 text-white shadow-xs" : "text-slate-600"}`}
            >
              Verified ({specimens.filter((s) => s.status === "VERIFIED").length})
            </Button>
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search Barcode, Specimen, or Patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs rounded-xl bg-slate-50 border-slate-200 h-9"
            />
          </div>
        </div>

        {/* Specimen Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSpecimens.map((specimen) => (
            <Card key={specimen.id} className="bg-white rounded-2xl border-slate-200 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between">
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-teal-900 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
                        {specimen.id}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${specimen.containerColor}`}>
                        {specimen.sampleType}
                      </span>
                    </div>
                    <CardTitle className="text-sm font-extrabold text-slate-900 leading-snug pt-1 flex items-center gap-1.5 font-mono">
                      <Barcode className="h-4 w-4 text-slate-500" /> {specimen.barcode}
                    </CardTitle>
                  </div>

                  {specimen.status === "VERIFIED" ? (
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-300 font-bold">
                      ● Verified
                    </Badge>
                  ) : specimen.status === "IN_ANALYSIS" ? (
                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-300 font-bold">
                      ● In Analysis
                    </Badge>
                  ) : specimen.status === "ACCESSIONED" ? (
                    <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-800 border-indigo-300 font-bold">
                      ● Accessioned
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-700 border-slate-200 font-medium">
                      ● Collected
                    </Badge>
                  )}
                </div>

                <div className="pt-2 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>Patient: {specimen.patientName}</span>
                    <span className="font-mono text-[11px] text-slate-500">({specimen.patientId})</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Container: <strong className="text-slate-700">{specimen.containerType}</strong>
                  </p>
                </div>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-[11px]">
                  <div>
                    <span className="text-slate-500">Requested Panels:</span>
                    <ul className="list-disc list-inside font-semibold text-slate-800 mt-0.5">
                      {specimen.testNames.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200/50">
                    <span className="text-slate-500">Storage / Cold-Chain:</span>
                    <strong className="text-slate-900 flex items-center gap-1">
                      <ThermometerSnowflake className="h-3 w-3 text-teal-600" /> {specimen.storageCondition}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phlebotomy Intake:</span>
                    <span className="text-slate-700">{specimen.phlebotomist} ({specimen.collectedAt})</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActionNotice(`Printed barcode sticker for ${specimen.barcode}`);
                      setTimeout(() => setActionNotice(null), 3000);
                    }}
                    className="h-8 text-xs font-semibold gap-1 text-slate-700 border-slate-200 hover:bg-slate-50 rounded-xl"
                  >
                    <Printer className="h-3.5 w-3.5" /> Barcode Label
                  </Button>

                  {specimen.status === "COLLECTED" || specimen.status === "ACCESSIONED" ? (
                    <Button
                      size="sm"
                      onClick={() => handleAccession(specimen.id)}
                      className="h-8 text-xs font-bold gap-1 bg-teal-700 hover:bg-teal-800 text-white rounded-xl"
                    >
                      <FlaskConical className="h-3.5 w-3.5" /> Send to Analyzer
                    </Button>
                  ) : (
                    <Link href="/lab/reports">
                      <Button variant="ghost" size="sm" className="h-8 text-xs font-bold gap-1 text-teal-800 hover:bg-teal-50 rounded-xl">
                        View Report <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </RoleGuard>
  );
}