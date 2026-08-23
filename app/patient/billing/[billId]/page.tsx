"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Receipt,
  ArrowLeft,
  Building2,
  Calendar,
  CreditCard,
  HelpCircle,
  ShieldCheck,
  Download,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  Info,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getBillById, getBillVersions } from "@/lib/data/billing-store";
import { getPaymentsForPatient } from "@/lib/data/payment-store";
import { DisputeInvestigationService } from "@/lib/services/dispute-investigation-service";
import { HealthcareBill, BillableItem, PaymentRecord, DisputeCategory } from "@/types/database.types";

export default function PatientBillDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const billId = (params?.billId as string) || "";

  const [bill, setBill] = useState<HealthcareBill | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedItemForDispute, setSelectedItemForDispute] = useState<BillableItem | null>(null);
  const [disputeCategory, setDisputeCategory] = useState<DisputeCategory>("INCORRECT_AMOUNT");
  const [disputeDesc, setDisputeDesc] = useState("");
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeSuccess, setDisputeSuccess] = useState<string | null>(null);

  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState<"UPI" | "CARD" | "NET_BANKING">("UPI");
  const [payProcessing, setPayProcessing] = useState(false);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);

  const reloadData = () => {
    if (!billId) return;
    const b = getBillById(billId);
    setBill(b);

    if (user?.identifier || user?.id) {
      const pId = user.identifier || user.id;
      const allPayments = getPaymentsForPatient(pId);
      const billPayments = allPayments.filter((p) => p.bill_id.toLowerCase() === billId.toLowerCase());
      setPayments(billPayments);
    }
  };

  useEffect(() => {
    reloadData();
  }, [billId, user]);

  const toggleItemProvenance = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleOpenDispute = (item?: BillableItem) => {
    setSelectedItemForDispute(item || null);
    setDisputeDesc(
      item
        ? `I am questioning the charge for "${item.service_name}" (₹${item.base_amount.toFixed(2)}).`
        : "I would like to clarify the charges on this bill."
    );
    setShowDisputeModal(true);
  };

  const handleSubmitDispute = async () => {
    if (!bill || !user) return;
    setDisputeSubmitting(true);
    try {
      const pId = user.identifier || user.id || "PAT-1001";
      const pName = user.fullName || "Patient";
      const res = DisputeInvestigationService.submitDispute({
        patientId: pId,
        patientName: pName,
        billId: bill.id,
        category: disputeCategory,
        description: disputeDesc,
        billItemId: selectedItemForDispute?.id,
        actor: user,
      });

      if (res.success && res.dispute) {
        setDisputeSuccess(`Dispute ${res.dispute.dispute_number} submitted. Under review by hospital billing department.`);
        setShowDisputeModal(false);
        reloadData();
      }
    } finally {
      setDisputeSubmitting(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!bill || !user) return;
    setPayProcessing(true);
    setTimeout(() => {
      setPayProcessing(false);
      setPaySuccess("Payment processed successfully! Receipt generated.");
      setShowPayModal(false);
      reloadData();
    }, 1000);
  };

  // Anti-IDOR Authorization Check
  if (bill && user && user.role === "patient") {
    const currentPatientId = (user.identifier || user.id || "").toLowerCase();
    if (bill.patient_id.toLowerCase() !== currentPatientId) {
      return (
        <RoleGuard allowedRoles={["patient", "admin"]}>
          <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
            <Card className="max-w-md w-full p-6 text-center space-y-4">
              <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
              <h2 className="text-base font-bold text-slate-900">Access Restricted</h2>
              <p className="text-xs text-slate-600">You are not authorized to view this billing record.</p>
              <Link href="/patient/billing">
                <Button size="sm" className="rounded-xl">Return to My Bills</Button>
              </Link>
            </Card>
          </div>
        </RoleGuard>
      );
    }
  }

  if (!bill) {
    return (
      <RoleGuard allowedRoles={["patient", "admin"]}>
        <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
          <Card className="max-w-md w-full p-6 text-center space-y-4">
            <Receipt className="h-10 w-10 text-slate-400 mx-auto" />
            <h2 className="text-base font-bold text-slate-900">Bill Not Found</h2>
            <p className="text-xs text-slate-500">The requested billing record could not be found or has been archived.</p>
            <Link href="/patient/billing">
              <Button size="sm" className="rounded-xl">Return to My Bills</Button>
            </Link>
          </Card>
        </div>
      </RoleGuard>
    );
  }

  const totalPaid = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + p.amount, 0);

  const balanceDue = Math.max(0, bill.patient_responsibility - totalPaid);

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 space-y-6 max-w-4xl mx-auto pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/patient/billing">
              <Button variant="ghost" size="sm" className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-1" /> All Bills
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 font-mono">
                  {bill.bill_number}
                </h1>
                <Badge variant="outline" className="text-[10px] font-mono">V{bill.current_version}</Badge>
                <StatusBadge status={bill.status} />
              </div>
              <p className="text-xs text-slate-500">
                {bill.facility_name} • Issued {new Date(bill.issued_at || bill.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenDispute()}
              className="text-xs rounded-xl h-8 border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <HelpCircle className="h-4 w-4 mr-1 text-slate-500" /> Dispute / Question
            </Button>
            {balanceDue > 0 && (
              <Button
                size="sm"
                onClick={() => setShowPayModal(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs h-8"
              >
                <CreditCard className="h-4 w-4 mr-1" /> Pay Due (₹{balanceDue.toFixed(2)})
              </Button>
            )}
          </div>
        </div>

        {disputeSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            {disputeSuccess}
          </div>
        )}

        {paySuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            {paySuccess}
          </div>
        )}

        {/* Financial Waterfall Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3 bg-white border-slate-200 rounded-xl shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 block">Gross Charges</span>
            <span className="text-base font-extrabold text-slate-900 font-mono block mt-0.5">
              ₹{bill.gross_total.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400">Sum of itemized services</span>
          </Card>

          <Card className="p-3 bg-white border-slate-200 rounded-xl shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 block">Coverage / Discounts</span>
            <span className="text-base font-extrabold text-emerald-700 font-mono block mt-0.5">
              -₹{(bill.gross_total - bill.patient_responsibility).toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400">Insurance & concessions</span>
          </Card>

          <Card className="p-3 bg-white border-slate-200 rounded-xl shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 block">Amount Paid</span>
            <span className="text-base font-extrabold text-blue-700 font-mono block mt-0.5">
              ₹{totalPaid.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400">{payments.length} payment(s)</span>
          </Card>

          <Card className={`p-3 rounded-xl shadow-xs border ${balanceDue > 0 ? "bg-amber-50/50 border-amber-200" : "bg-emerald-50/50 border-emerald-200"}`}>
            <span className="text-[11px] font-medium text-slate-600 block">Balance Due</span>
            <span className={`text-base font-extrabold font-mono block mt-0.5 ${balanceDue > 0 ? "text-amber-900" : "text-emerald-900"}`}>
              ₹{balanceDue.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500">
              {balanceDue === 0 ? "Fully settled" : "Immediate payment due"}
            </span>
          </Card>
        </div>

        {/* Itemized Charges Section with "Why Was I Charged?" Clinical Provenance */}
        <Card className="bg-white border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Itemized Healthcare Charges ({bill.items.length})</span>
              <span className="text-[10px] font-normal text-slate-400 normal-case">
                Click any line item for clinical ordering provenance
              </span>
            </CardTitle>
          </CardHeader>
          <div className="divide-y divide-slate-100">
            {bill.items.map((item) => {
              const isExpanded = Boolean(expandedItems[item.id]);
              return (
                <div key={item.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer"
                    onClick={() => toggleItemProvenance(item.id)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-xs">{item.service_name}</span>
                        <Badge variant="outline" className="text-[9px] font-mono">{item.category}</Badge>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px]">
                          {item.verification_status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Qty: {item.quantity} • Unit Price: ₹{item.unit_price.toFixed(2)} • Date: {new Date(item.service_date).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        ₹{item.base_amount.toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600 rounded-md"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItemProvenance(item.id);
                        }}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Expandable Clinical Provenance ("Why Was I Charged?") */}
                  {isExpanded && item.provenance && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Info className="h-3.5 w-3.5 text-emerald-600" /> Clinical Provenance & Reason
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDispute(item)}
                          className="h-6 text-[10px] text-rose-700 hover:text-rose-800 hover:bg-rose-50 rounded-md"
                        >
                          Dispute this item
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                        <div>
                          <span className="text-slate-400 block">Ordered By:</span>
                          <span className="font-medium text-slate-800">{item.provenance.ordered_by_name || "Clinician"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Facility:</span>
                          <span className="font-medium text-slate-800">{item.provenance.facility_name || bill.facility_name}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Clinical Reason:</span>
                          <span className="font-medium text-slate-800">{item.provenance.clinical_reason || "Medical necessity"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Performed At:</span>
                          <span className="font-medium text-slate-800">{item.provenance.performed_at ? new Date(item.provenance.performed_at).toLocaleString() : "Documented in visit"}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Payment History for this Bill */}
        <Card className="bg-white border-slate-200 rounded-2xl shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" /> Payments for this Bill ({payments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {payments.length === 0 ? (
              <div className="text-center py-4 text-slate-400 text-xs">
                No payments have been applied to this bill yet.
              </div>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{p.receipt_number}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">{p.payment_method}</Badge>
                        <StatusBadge status={p.status} />
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Txn: {p.transaction_reference} • {new Date(p.initiated_at).toLocaleString()}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">₹{p.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal: Dispute / Question */}
        {showDisputeModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 text-emerald-700">
                <HelpCircle className="h-5 w-5 text-emerald-600" /> Ask Question / Dispute Charge
              </h3>
              <div className="space-y-3 text-xs">
                {selectedItemForDispute && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-slate-500 block text-[10px]">Challenging Item:</span>
                    <span className="font-bold text-slate-800">{selectedItemForDispute.service_name} (₹{selectedItemForDispute.base_amount.toFixed(2)})</span>
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Inquiry Category *</label>
                  <select
                    value={disputeCategory}
                    onChange={(e) => setDisputeCategory(e.target.value as DisputeCategory)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-xs font-medium"
                  >
                    <option value="INCORRECT_AMOUNT">Incorrect Amount Charged</option>
                    <option value="DUPLICATE_CHARGE">Duplicate Line Item</option>
                    <option value="SERVICE_NOT_RECEIVED">Service Not Received</option>
                    <option value="UNRECOGNIZED_CHARGE">Unrecognized Charge</option>
                    <option value="INSURANCE_NOT_APPLIED">Insurance / Scheme Not Applied</option>
                    <option value="OTHER">Other Clarification</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Explanation / Question *</label>
                  <textarea
                    rows={3}
                    value={disputeDesc}
                    onChange={(e) => setDisputeDesc(e.target.value)}
                    placeholder="Describe your question or what seems incorrect..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowDisputeModal(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitDispute}
                  disabled={disputeSubmitting || !disputeDesc.trim()}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs"
                >
                  {disputeSubmitting ? "Submitting..." : "Submit Inquiry"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Pay Due */}
        {showPayModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 text-emerald-700">
                <CreditCard className="h-5 w-5 text-emerald-600" /> Settle Outstanding Balance
              </h3>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                <span className="text-slate-500 block">Total Due for {bill.bill_number}:</span>
                <span className="text-lg font-extrabold text-emerald-900 font-mono">₹{balanceDue.toFixed(2)}</span>
              </div>

              <div className="space-y-2 text-xs">
                <label className="font-bold text-slate-700 block">Select Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod("UPI")}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs ${payMethod === "UPI" ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-600"}`}
                  >
                    UPI (GPay / PhonePe)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod("CARD")}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs ${payMethod === "CARD" ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-600"}`}
                  >
                    Debit / Credit Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod("NET_BANKING")}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs ${payMethod === "NET_BANKING" ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-600"}`}
                  >
                    Net Banking
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowPayModal(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSimulatePayment}
                  disabled={payProcessing}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs"
                >
                  {payProcessing ? "Processing..." : `Pay ₹${balanceDue.toFixed(2)}`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
