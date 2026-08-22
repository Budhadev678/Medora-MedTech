"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ClipboardList, FlaskConical, Calendar, Building2, User, ShieldCheck, Search, Filter } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/auth-context";
import type { HealthcareLabOrder, LabOrderItem } from "@/types/database.types";
import { getAssignedLabOrders } from "@/lib/data/lab-order-store";

export default function LabOrdersPage() {
  const { user } = useAuth();
  const labId = user?.staffData?.[0]?.organizationIdentifier || user?.staffData?.[0]?.organizationId || "LAB-1001";
  const [orders, setOrders] = useState<HealthcareLabOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const refreshOrders = () => {
    const data = getAssignedLabOrders(labId);
    setOrders(data);
  };

  useEffect(() => {
    refreshOrders();
    window.addEventListener("medora-lab-orders-updated", refreshOrders);
    return () => window.removeEventListener("medora-lab-orders-updated", refreshOrders);
  }, [labId]);

  const filteredOrders = orders.filter(o => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPatient = o.patient_name.toLowerCase().includes(q) || o.patient_id.toLowerCase().includes(q);
      const matchRef = o.order_reference.toLowerCase().includes(q);
      const matchTest = o.items.some((i: LabOrderItem) => i.test_name.toLowerCase().includes(q));
      if (!matchPatient && !matchRef && !matchTest) return false;
    }
    return true;
  });

  return (
    <RoleGuard allowedRoles={["lab_staff", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150">
        <PageHeader
          title="Diagnostic Test Orders Queue"
          description="Assigned investigation orders from hospital OPDs and authorized clinical consultations."
          breadcrumbs={[{ label: "Diagnostic Lab", href: "/lab" }, { label: "Test Orders" }]}
        />

        {/* Facility Banner */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Diagnostic Center Scope
              </span>
              <span className="text-sm font-extrabold text-slate-900">
                ABC Diagnostics Laboratory ({labId})
              </span>
            </div>
          </div>
          <Badge variant="outline" className="text-xs font-bold text-blue-800 bg-blue-50">
            {orders.length} Assigned Orders
          </Badge>
        </div>

        {/* Search */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search assigned test, patient, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-9"
            />
          </div>
        </div>

        {/* Orders Queue */}
        {filteredOrders.length > 0 ? (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-all"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                      {order.order_reference}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-bold bg-emerald-50 text-emerald-800">
                      {order.status}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-bold bg-slate-50 text-slate-700">
                      {order.priority}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(order.ordered_at || order.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="text-xs">
                  <span className="font-bold text-slate-900 text-sm block">
                    {order.patient_name} ({order.patient_id})
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Ordered by {order.ordering_provider_name} ({order.organization_name})
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Requested Tests ({order.items.length})
                  </span>
                  <div className="space-y-1">
                    {order.items.map((item: LabOrderItem, idx: number) => (
                      <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{item.test_name}</span>
                        {item.specimen_type && (
                          <Badge variant="outline" className="text-[10px] bg-white">
                            {item.specimen_type}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg">
                  <strong>Indication:</strong> {order.reason}
                </p>

                {order.instructions && (
                  <p className="text-[11px] text-blue-800 bg-blue-50/70 p-2 rounded-lg font-medium">
                    <strong>Special Instructions:</strong> {order.instructions}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<ClipboardList className="h-6 w-6 text-amber-600" />}
            title="No Assigned Lab Orders"
            description="Diagnostic investigation orders assigned to this lab center will populate here."
            phase="Phase 4.3 — Prescription & Lab Order Foundation"
            actionHref="/lab"
            actionLabel="Return to Lab Dashboard"
          />
        )}
      </div>
    </RoleGuard>
  );
}
