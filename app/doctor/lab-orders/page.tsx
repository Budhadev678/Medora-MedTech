"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FlaskConical, 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Building2, 
  User, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Ban, 
  X, 
  ShieldCheck, 
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Activity
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth-context";
import type { 
  HealthcareLabOrder,
  LabOrderItem,
} from "@/types/database.types";
import { 
  getDoctorLabOrders, 
  cancelLabOrder 
} from "@/lib/data/lab-order-store";

export default function DoctorLabOrdersPage() {
  const { user } = useAuth();
  const doctorAffiliations = user?.doctorData?.affiliations?.filter(a => a.status === "active") || [];
  
  const [selectedOrgId, setSelectedOrgId] = useState<string>(() => {
    return doctorAffiliations[0]?.organizationIdentifier || doctorAffiliations[0]?.organizationId || "HSP-1001";
  });

  const [orders, setOrders] = useState<HealthcareLabOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ORDERED" | "DRAFT" | "CANCELLED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<HealthcareLabOrder | null>(null);

  // Cancellation Modal
  const [showCancelModal, setShowCancelModal] = useState<HealthcareLabOrder | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refreshOrders = () => {
    if (!user) return;
    const data = getDoctorLabOrders(user.identifier || user.id, selectedOrgId || undefined);
    setOrders(data);
  };

  useEffect(() => {
    refreshOrders();
    const handleUpdate = () => refreshOrders();
    window.addEventListener("medora-lab-orders-updated", handleUpdate);
    return () => window.removeEventListener("medora-lab-orders-updated", handleUpdate);
  }, [user, selectedOrgId]);

  const filteredOrders = orders.filter(o => {
    if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPatient = o.patient_name.toLowerCase().includes(q) || o.patient_id.toLowerCase().includes(q);
      const matchRef = o.order_reference.toLowerCase().includes(q);
      const matchTest = o.items.some((i: LabOrderItem) => i.test_name.toLowerCase().includes(q));
      if (!matchPatient && !matchRef && !matchTest) return false;
    }
    return true;
  });

  const handleCancelOrder = () => {
    if (!user || !showCancelModal || !cancelReason.trim()) return;
    setIsSubmitting(true);
    const res = cancelLabOrder(
      showCancelModal.id,
      cancelReason.trim(),
      user.identifier || user.id,
      user.fullName,
      user.role
    );
    setIsSubmitting(false);
    setShowCancelModal(null);
    setCancelReason("");
    if (res.success) {
      refreshOrders();
      if (selectedOrder?.id === showCancelModal.id) {
        setSelectedOrder(res.order || null);
      }
    } else {
      alert(res.error || "Failed to cancel lab order.");
    }
  };

  return (
    <RoleGuard allowedRoles={["doctor", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <PageHeader
            title="Diagnostic Lab Orders Desk"
            description="Review clinician-requested pathology and diagnostic investigation orders attached to outpatient encounters."
            breadcrumbs={[{ label: "Doctor Workspace", href: "/doctor" }, { label: "Lab Orders" }]}
          />
          <Link href="/doctor/consultations">
            <Button className="bg-teal-700 hover:bg-teal-800 text-white font-bold gap-2 text-xs shadow-xs">
              <Plus className="h-4 w-4" />
              <span>Order via Encounter</span>
            </Button>
          </Link>
        </div>

        {/* Facility Context Banner */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 flex-shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Ordering Facility Scope
              </span>
              <span className="text-sm font-extrabold text-slate-900">
                {doctorAffiliations.find(a => (a.organizationIdentifier === selectedOrgId || a.organizationId === selectedOrgId))?.organizationName || "City Hospital"}
              </span>
              <span className="text-[11px] font-mono text-blue-700 ml-2">({selectedOrgId})</span>
            </div>
          </div>

          {doctorAffiliations.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Switch Facility:</span>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                aria-label="Switch Facility"
                className="text-xs font-bold rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {doctorAffiliations.map(aff => (
                  <option key={aff.organizationIdentifier || aff.organizationId} value={aff.organizationIdentifier || aff.organizationId}>
                    {aff.organizationName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === "ALL" ? "bg-slate-900 text-white font-bold" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              All Orders ({orders.length})
            </button>
            <button
              onClick={() => setStatusFilter("ORDERED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === "ORDERED" ? "bg-blue-700 text-white font-bold" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Ordered ({orders.filter(o => o.status === "ORDERED").length})
            </button>
            <button
              onClick={() => setStatusFilter("DRAFT")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === "DRAFT" ? "bg-slate-800 text-white font-bold" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Drafts ({orders.filter(o => o.status === "DRAFT").length})
            </button>
            <button
              onClick={() => setStatusFilter("CANCELLED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === "CANCELLED" ? "bg-red-700 text-white font-bold" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Cancelled ({orders.filter(o => o.status === "CANCELLED").length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search test, patient, order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-9"
            />
          </div>
        </div>

        {/* Orders Stream */}
        {filteredOrders.length > 0 ? (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition-all shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded">
                      {order.order_reference}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        order.status === "ORDERED" 
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : order.status === "DRAFT"
                          ? "bg-blue-50 text-blue-800 border-blue-300"
                          : "bg-red-50 text-red-800 border-red-300"
                      }`}
                    >
                      {order.status}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        order.priority === "URGENT" ? "bg-red-50 text-red-800 border-red-300" : "bg-slate-50 text-slate-700"
                      }`}
                    >
                      {order.priority}
                    </Badge>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Encounter: {order.encounter_id}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">{order.patient_name}</h3>
                    <Badge variant="outline" className="text-[10px] font-mono text-slate-600">
                      {order.patient_id}
                    </Badge>
                  </div>

                  {/* Tests Preview */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {order.items.map((item: LabOrderItem, idx: number) => (
                      <span key={idx} className="text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {item.test_name} {item.specimen_type && `(${item.specimen_type})`}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-slate-600">
                    <strong>Indication:</strong> {order.reason}
                  </p>

                  {order.cancellation_reason && (
                    <p className="text-[11px] font-semibold text-red-700 bg-red-50 p-1.5 rounded border border-red-200">
                      <strong>Cancellation Reason:</strong> {order.cancellation_reason}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedOrder(order)}
                    className="text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 h-8"
                  >
                    View Details
                  </Button>
                  {order.status === "ORDERED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowCancelModal(order);
                        setCancelReason("");
                      }}
                      className="text-xs font-semibold text-red-600 border-red-200 hover:bg-red-50 h-8"
                    >
                      Cancel Order
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FlaskConical className="h-8 w-8 text-blue-600" />}
            title="No Lab Orders Found"
            description="Diagnostic investigation orders requested during encounters will aggregate here."
            actionLabel="Go to Encounter Workbench"
            actionHref="/doctor/consultations"
          />
        )}

        {/* ============================================================ */}
        {/* LAB ORDER DETAILS DRAWER / MODAL */}
        {/* ============================================================ */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-50">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                    <FlaskConical className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-900">
                        Diagnostic Order {selectedOrder.order_reference}
                      </h3>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          selectedOrder.status === "ORDERED" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
                        }`}
                      >
                        {selectedOrder.status}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Encounter: {selectedOrder.encounter_id} • Ordered by {selectedOrder.ordering_provider_name}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <span className="font-bold text-slate-900 block">{selectedOrder.patient_name} ({selectedOrder.patient_id})</span>
                  <span className="text-slate-500 text-[11px]">
                    Ordered at {selectedOrder.organization_name} on {new Date(selectedOrder.ordered_at || selectedOrder.created_at).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-slate-900 block uppercase tracking-wider text-[10px]">
                    Requested Diagnostic Tests ({selectedOrder.items.length})
                  </span>
                  {selectedOrder.items.map((item: LabOrderItem, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{item.test_name}</span>
                        {item.specimen_type && (
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {item.specimen_type}
                          </Badge>
                        )}
                      </div>
                      {item.instructions && (
                        <p className="text-[11px] text-slate-600">
                          <strong>Specimen Notes:</strong> {item.instructions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Clinical Indication / Reason</span>
                  <p className="text-slate-800 font-medium">{selectedOrder.reason}</p>
                </div>

                {selectedOrder.instructions && (
                  <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/70 space-y-1 text-blue-900">
                    <span className="text-[10px] font-bold uppercase block">Special Instructions</span>
                    <p className="font-medium text-xs">{selectedOrder.instructions}</p>
                  </div>
                )}

                <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/70 text-blue-900 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <ShieldCheck className="h-4 w-4 text-blue-700" />
                    Clinical Provenance
                  </span>
                  <span className="font-mono text-[10px] text-blue-800">
                    Authorized by {selectedOrder.ordering_provider_name}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  size="sm"
                  onClick={() => setSelectedOrder(null)}
                  className="bg-slate-900 text-white font-bold text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* CANCEL LAB ORDER MODAL */}
        {/* ============================================================ */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-50">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold">
                  <Ban className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Cancel Diagnostic Lab Order</h3>
                  <span className="text-xs text-slate-500">
                    {showCancelModal.order_reference} • {showCancelModal.patient_name}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Cancelling this diagnostic request will notify connected lab systems and record a cancellation entry in the audit ledger.
              </p>

              <div className="space-y-1.5">
                <Label className="font-bold text-slate-900 text-xs">
                  Documented Cancellation Reason <span className="text-red-500">*</span>
                </Label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={2}
                  placeholder="e.g. Test no longer clinically indicated after differential resolution."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelModal(null)}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  onClick={handleCancelOrder}
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                >
                  {isSubmitting ? "Cancelling..." : "Confirm Cancellation"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
