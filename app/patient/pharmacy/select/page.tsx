"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Pill,
  Building2,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Search,
  ShoppingCart,
  Lock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { PharmacyInventoryService } from "@/lib/services/pharmacy-inventory-service";
import { PharmacyIntakeService } from "@/lib/services/pharmacy-intake-service";
import { getPatientPrescriptions } from "@/lib/data/prescription-store";
import { PharmacyAvailabilityResult, HealthcarePrescription } from "@/types/database.types";

export default function PatientPharmacySelectPage() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<HealthcarePrescription[]>([]);
  const [selectedRx, setSelectedRx] = useState<HealthcarePrescription | null>(null);
  const [pharmacies, setPharmacies] = useState<PharmacyAvailabilityResult[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyAvailabilityResult | null>(null);
  const [reservationSuccess, setReservationSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const patientId = user?.identifier || user?.id || "PAT-1001";
    const rxs = getPatientPrescriptions(patientId);
    const activeRxs = rxs.filter((r) => r.status === "ISSUED" || r.status === "FINALIZED");
    setPrescriptions(activeRxs);
    if (activeRxs.length > 0) {
      setSelectedRx(activeRxs[0]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (selectedRx) {
      const discovered = PharmacyInventoryService.discoverEligiblePharmaciesForPrescription(selectedRx.id);
      setPharmacies(discovered);
    }
  }, [selectedRx]);

  const handleSelectPharmacy = async (pharm: PharmacyAvailabilityResult) => {
    if (!selectedRx) return;
    setActionError(null);
    setReservationSuccess(null);
    setIsSubmitting(true);
    try {
      // Step 1: Submit operational intake to pharmacy
      const intakeRes = await PharmacyIntakeService.submitPrescriptionToIntake(selectedRx.id, pharm.facility_id, user);
      if (!intakeRes.success) {
        setActionError(intakeRes.error || "Failed to submit prescription intake.");
        return;
      }

      // Step 2: Reserve stock if items available
      if (pharm.overall_status !== "UNAVAILABLE") {
        const reserveRes = await PharmacyInventoryService.reserveStock(selectedRx.id, pharm.facility_id, user);
        if (reserveRes.success) {
          setReservationSuccess(
            `Prescription submitted to ${pharm.facility_name}. Reserved available medicines successfully!`
          );
        } else {
          setActionError(reserveRes.error || "Failed to reserve stock.");
        }
      } else {
        setReservationSuccess(`Prescription submitted to ${pharm.facility_name} for manual intake review.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 space-y-6 max-w-4xl mx-auto pb-24">
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/patient">
              <Button variant="ghost" size="sm" className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-1" /> Portal
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" /> Multi-Pharmacy Availability & Selection
              </h1>
              <p className="text-xs text-slate-500">Transparent price breakdown & real-time medicine availability across connected pharmacies</p>
            </div>
          </div>
        </div>

        {/* Prescription Selector */}
        {prescriptions.length > 0 && (
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-700">Select Prescription:</span>
            <select
              value={selectedRx?.id || ""}
              onChange={(e) => {
                const rx = prescriptions.find((r) => r.id === e.target.value);
                setSelectedRx(rx || null);
              }}
              className="text-xs h-9 rounded-xl border border-input px-3 bg-slate-50 font-mono font-bold text-purple-900"
            >
              {prescriptions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id} ({r.items.length} items) — Dr. {r.prescriber_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Feedback alerts */}
        {actionError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
            <XCircle className="h-4 w-4 shrink-0 text-red-600" />
            {actionError}
          </div>
        )}
        {reservationSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            {reservationSuccess}
          </div>
        )}

        {/* Pharmacies List */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Eligible Connected Pharmacies</h2>
          {pharmacies.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-400 text-xs">
              No active connected pharmacies found for availability evaluation.
            </div>
          ) : (
            pharmacies.map((pharm) => (
              <Card
                key={pharm.facility_id}
                className={`bg-white rounded-2xl shadow-xs border transition-all ${
                  pharm.overall_status === "FULLY_AVAILABLE" ? "border-emerald-300 hover:border-emerald-400" : "border-slate-200 hover:border-amber-200"
                }`}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">{pharm.facility_name}</h3>
                        <Badge
                          className={
                            pharm.overall_status === "FULLY_AVAILABLE"
                              ? "bg-emerald-600 text-white text-[9px]"
                              : pharm.overall_status === "PARTIALLY_AVAILABLE"
                              ? "bg-amber-600 text-white text-[9px]"
                              : "bg-slate-500 text-white text-[9px]"
                          }
                        >
                          {pharm.overall_status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Distance: {pharm.distance_km} km • Pickup: {pharm.pickup_available ? "Yes" : "No"} • Delivery: {pharm.delivery_available ? "Yes" : "No"}
                      </p>
                    </div>

                    <Button
                      onClick={() => handleSelectPharmacy(pharm)}
                      disabled={isSubmitting}
                      size="sm"
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs"
                    >
                      Select Pharmacy & Reserve <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>

                  {/* Transparent Medicine Breakdown */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Transparent Availability Breakdown</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {pharm.items.map((item, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900 block">{item.medicine_name}</span>
                            <span className="text-[10px] text-slate-500">
                              Req: {item.required_quantity} • Avail: {item.available_quantity}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-purple-950 block">₹{item.subtotal.toFixed(2)}</span>
                            <Badge
                              variant="outline"
                              className={`text-[9px] ${
                                item.status === "AVAILABLE" ? "text-emerald-700 border-emerald-300" : "text-amber-700 border-amber-300"
                              }`}
                            >
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Estimated Subtotal */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="font-bold text-slate-700">Itemized Medicine Subtotal:</span>
                    <span className="font-mono font-extrabold text-slate-900 text-sm">₹{pharm.estimated_subtotal.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
