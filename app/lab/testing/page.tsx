"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FlaskConical,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileText,
  User,
  Filter,
  Search,
  ChevronRight,
  ArrowLeft,
  Activity,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getAllTestWorkItems, getFacilityWorklist } from "@/lib/data/lab-testing-store";
import { LabTestWorkItem } from "@/types/database.types";

export default function LabTestingWorklistPage() {
  const { user } = useAuth();
  const [workItems, setWorkItems] = useState<LabTestWorkItem[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const refresh = () => {
    setWorkItems(getAllTestWorkItems());
  };

  useEffect(() => {
    refresh();
  }, []);

  const filteredItems = workItems.filter((item) => {
    if (filter === "IN_PROGRESS" && item.status !== "IN_PROGRESS") return false;
    if (filter === "RESULT_ENTERED" && item.status !== "RESULT_ENTERED" && item.status !== "UNDER_REVIEW") return false;
    if (filter === "RETURNED" && item.status !== "RETURNED_FOR_CORRECTION") return false;
    if (filter === "VERIFIED" && item.status !== "VERIFIED") return false;

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const match =
        item.id.toLowerCase().includes(q) ||
        item.test_name.toLowerCase().includes(q) ||
        item.patient_name.toLowerCase().includes(q) ||
        item.sample_id.toLowerCase().includes(q) ||
        item.lab_order_id.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <RoleGuard allowedRoles={["admin", "doctor", "lab_staff"]}>
      <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/lab">
              <Button variant="ghost" size="sm" className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-1" /> Lab Workspace
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-purple-600" /> Laboratory Testing Worklist
              </h1>
              <p className="text-xs text-slate-500">Technician testing processing queue & result entry workbench</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/lab/verification">
              <Button size="sm" variant="outline" className="text-purple-700 border-purple-300 font-bold rounded-xl text-xs">
                <ShieldCheck className="h-4 w-4 mr-1 text-purple-600" /> Verifier Review Desk
              </Button>
            </Link>
            <Button size="sm" variant="ghost" onClick={refresh} className="rounded-xl">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {["ALL", "IN_PROGRESS", "RESULT_ENTERED", "RETURNED", "VERIFIED"].map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "ghost"}
                onClick={() => setFilter(f)}
                className={`text-xs rounded-lg px-3 h-8 font-semibold ${filter === f ? "bg-purple-700 hover:bg-purple-800 text-white" : "text-slate-600"}`}
              >
                {f.replace(/_/g, " ")}
              </Button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search test work ID, sample..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs h-9 pl-9 pr-3 rounded-xl border border-input bg-slate-50"
            />
          </div>
        </div>

        {/* Worklist Items */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 text-xs">
              No laboratory test work items matching filter criteria.
            </div>
          ) : (
            filteredItems.map((item) => (
              <Card key={item.id} className="bg-white rounded-2xl shadow-xs border-slate-200 hover:border-purple-200 transition-colors">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-purple-950 text-xs">{item.id}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">{item.test_name}</Badge>
                      <StatusBadge status={item.status} />
                      {item.priority === "URGENT" && <Badge className="bg-amber-600 text-white text-[9px]">URGENT</Badge>}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-0.5">
                      <span>Patient: <strong className="text-slate-900">{item.patient_name}</strong></span>
                      <span>•</span>
                      <span>Sample: <strong className="font-mono text-purple-900">{item.sample_id}</strong></span>
                      <span>•</span>
                      <span>Order: <strong className="font-mono text-slate-700">{item.lab_order_id}</strong></span>
                    </div>
                  </div>

                  <Link href={`/lab/testing/${item.id}`}>
                    <Button size="sm" className="bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs">
                      Process Test <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
