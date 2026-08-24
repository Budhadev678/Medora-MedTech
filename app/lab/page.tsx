"use client";

import React, { useState, useEffect } from "react";
import {
  FlaskConical,
  Layers,
  FileCheck2,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Plus,
  Info,
  QrCode,
  Search,
  Check,
  X,
  RefreshCw,
  FileText,
  ShieldCheck,
  Building2,
  UserCheck,
  AlertTriangle,
  FileSignature,
  Printer,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import {
  HealthcareLabOrder,
  HealthcareLabSample,
  HealthcareTestResult,
  HealthcareLabReport,
  SampleType,
  SampleRejectionReason,
  ResultAbnormalFlag,
} from "@/types/database.types";
import {
  getAllLabOrders,
  getAllSamples,
  getAllTestResults,
  getAllLabReports,
} from "@/lib/data/lab-order-store";
import { getAllLabTests, getLabTestById } from "@/lib/data/lab-test-catalog-store";
import { LaboratoryService } from "@/lib/services/laboratory-service";

export default function LabWorkspacePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"orders" | "samples" | "testing" | "verification" | "reports">("orders");

  // State Stores
  const [orders, setOrders] = useState<HealthcareLabOrder[]>([]);
  const [samples, setSamples] = useState<HealthcareLabSample[]>([]);
  const [testResults, setTestResults] = useState<HealthcareTestResult[]>([]);
  const [reports, setReports] = useState<HealthcareLabReport[]>([]);

  // Modals & UI Selection States
  const [selectedOrder, setSelectedOrder] = useState<HealthcareLabOrder | null>(null);
  const [selectedSample, setSelectedSample] = useState<HealthcareLabSample | null>(null);
  const [selectedReport, setSelectedReport] = useState<HealthcareLabReport | null>(null);

  // Sample Collection Modal State
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [collectionSampleType, setCollectionSampleType] = useState<SampleType>("WHOLE_BLOOD");
  const [verifiedPatientId, setVerifiedPatientId] = useState("");
  const [collectionError, setCollectionError] = useState<string | null>(null);

  // Sample Rejection Modal State
  const [showRejectSampleModal, setShowRejectSampleModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<SampleRejectionReason>("INSUFFICIENT_VOLUME");
  const [rejectionNotes, setRejectionNotes] = useState("");

  // Testing & Result Entry State
  const [testEntryValues, setTestEntryValues] = useState<Record<string, string>>({});
  const [entrySuccessMessage, setEntrySuccessMessage] = useState<string | null>(null);

  // Report Amendment State
  const [showAmendReportModal, setShowAmendReportModal] = useState(false);
  const [amendmentReason, setAmendmentReason] = useState("");

  // Refresh data from authoritative stores
  const refreshData = () => {
    setOrders(getAllLabOrders());
    setSamples(getAllSamples());
    setTestResults(getAllTestResults());
    setReports(getAllLabReports());
  };

  useEffect(() => {
    refreshData();
    const handleUpdate = () => refreshData();
    window.addEventListener("medora-lab-orders-updated", handleUpdate);
    window.addEventListener("medora-lab-samples-updated", handleUpdate);
    window.addEventListener("medora-lab-results-updated", handleUpdate);
    window.addEventListener("medora-lab-reports-updated", handleUpdate);
    return () => {
      window.removeEventListener("medora-lab-orders-updated", handleUpdate);
      window.removeEventListener("medora-lab-samples-updated", handleUpdate);
      window.removeEventListener("medora-lab-results-updated", handleUpdate);
      window.removeEventListener("medora-lab-reports-updated", handleUpdate);
    };
  }, []);

  // Filtered lists
  const pendingOrders = orders.filter((o) => o.status === "ORDERED" || o.status === "ACCEPTED");
  const activeSamples = samples.filter((s) => s.status === "COLLECTED" || s.status === "RECEIVED" || s.status === "PROCESSING");
  const pendingVerificationOrders = orders.filter((o) => o.status === "VERIFICATION_PENDING" || o.status === "REPORT_READY");

  // Handlers
  const handleAcceptOrder = (orderId: string) => {
    const res = LaboratoryService.acceptLabOrder(orderId, user as any);
    if (res.success) {
      refreshData();
    } else {
      alert(res.error || "Failed to accept order");
    }
  };

  const handleOpenCollectModal = (order: HealthcareLabOrder) => {
    setSelectedOrder(order);
    setVerifiedPatientId(order.patient_id);
    setCollectionSampleType((order.items[0]?.specimen_type as SampleType) || "WHOLE_BLOOD");
    setCollectionError(null);
    setShowCollectModal(true);
  };

  const handleConfirmCollection = () => {
    if (!selectedOrder) return;
    if (verifiedPatientId.trim().toUpperCase() !== selectedOrder.patient_id.toUpperCase()) {
      setCollectionError(`Patient verification failed: Entered ${verifiedPatientId}, expected ${selectedOrder.patient_id}`);
      return;
    }

    const res = LaboratoryService.collectSample({
      orderId: selectedOrder.id,
      sampleType: collectionSampleType,
      testItemIds: selectedOrder.items.map((i) => i.id),
      patientVerification: {
        patientId: verifiedPatientId.trim(),
        patientName: selectedOrder.patient_name,
      },
      collectorActor: user as any,
    });

    if (res.success) {
      setShowCollectModal(false);
      refreshData();
    } else {
      setCollectionError(res.error || "Collection failed");
    }
  };

  const handleReceiveSample = (sampleId: string) => {
    const res = LaboratoryService.receiveSample(sampleId, user as any);
    if (res.success) {
      refreshData();
    } else {
      alert(res.error || "Failed to receive sample");
    }
  };

  const handleOpenRejectSampleModal = (sample: HealthcareLabSample) => {
    setSelectedSample(sample);
    setRejectionReason("INSUFFICIENT_VOLUME");
    setRejectionNotes("");
    setShowRejectSampleModal(true);
  };

  const handleConfirmRejectSample = () => {
    if (!selectedSample) return;
    const res = LaboratoryService.rejectSample(
      selectedSample.id,
      rejectionReason,
      rejectionNotes,
      user as any
    );
    if (res.success) {
      setShowRejectSampleModal(false);
      refreshData();
    } else {
      alert(res.error || "Failed to reject sample");
    }
  };

  const handleRecollect = (rejectedSampleId: string) => {
    const res = LaboratoryService.recollectSample(rejectedSampleId, user as any);
    if (res.success) {
      refreshData();
    } else {
      alert(res.error || "Failed to recollect");
    }
  };

  const handleSelectSampleForTesting = (sample: HealthcareLabSample) => {
    setSelectedSample(sample);
    const order = orders.find((o) => o.id === sample.lab_order_id);
    setSelectedOrder(order || null);
    setTestEntryValues({});
    setEntrySuccessMessage(null);
  };

  const handleSubmitTestResults = () => {
    if (!selectedOrder || !selectedSample) return;

    // Resolve catalog parameters
    const resultsToSubmit: {
      testId: string;
      testName: string;
      parameterId: string;
      parameterName: string;
      resultType: "NUMERIC" | "TEXT" | "QUALITATIVE" | "BOOLEAN";
      value: string;
      numericValue?: number;
      unit?: string;
      referenceRange?: string;
      flag: ResultAbnormalFlag;
    }[] = [];

    for (const item of selectedOrder.items) {
      const catalogTest = getLabTestById(item.test_id || item.test_name);
      if (catalogTest) {
        for (const param of catalogTest.parameters) {
          const val = testEntryValues[param.id] || (param.data_type === "NUMERIC" ? "14.0" : "Normal");
          const numVal = param.data_type === "NUMERIC" ? parseFloat(val) : undefined;
          
          let flag: ResultAbnormalFlag = "NORMAL";
          if (param.data_type === "NUMERIC" && param.reference_range && numVal !== undefined) {
            if (param.reference_range.high !== undefined && numVal > param.reference_range.high) {
              flag = "HIGH";
            } else if (param.reference_range.low !== undefined && numVal < param.reference_range.low) {
              flag = "LOW";
            }
          }

          resultsToSubmit.push({
            testId: catalogTest.id,
            testName: catalogTest.test_name,
            parameterId: param.id,
            parameterName: param.name,
            resultType: param.data_type,
            value: val,
            numericValue: numVal,
            unit: param.default_unit,
            referenceRange: param.reference_range?.text,
            flag,
          });
        }
      } else {
        // Fallback for ad-hoc test
        resultsToSubmit.push({
          testId: "TEST-ADHOC",
          testName: item.test_name,
          parameterId: "param-adhoc-1",
          parameterName: item.test_name,
          resultType: "TEXT",
          value: testEntryValues["param-adhoc-1"] || "Normal / Negative",
          flag: "NORMAL",
        });
      }
    }

    const res = LaboratoryService.enterTestResults({
      orderId: selectedOrder.id,
      sampleId: selectedSample.id,
      results: resultsToSubmit,
      techActor: user as any,
    });

    if (res.success) {
      setEntrySuccessMessage(`Successfully recorded ${resultsToSubmit.length} test parameters.`);
      refreshData();
    } else {
      alert(res.error || "Failed to enter results");
    }
  };

  const handleVerifyResults = (orderId: string) => {
    const res = LaboratoryService.verifyTestResults(orderId, user as any);
    if (res.success) {
      refreshData();
    } else {
      alert(res.error || "Failed to verify results");
    }
  };

  const handleGenerateAndRelease = (orderId: string) => {
    const res = LaboratoryService.generateAndReleaseReport({
      orderId,
      notes: "Certified laboratory report released following pathologist verification.",
      verifierActor: user as any,
    });
    if (res.success) {
      refreshData();
    } else {
      alert(res.error || "Failed to release report");
    }
  };

  const handleConfirmAmendReport = () => {
    if (!selectedReport) return;
    const res = LaboratoryService.amendReport({
      reportId: selectedReport.id,
      updatedResults: selectedReport.results,
      amendmentReason,
      verifierActor: user as any,
    });
    if (res.success) {
      setShowAmendReportModal(false);
      refreshData();
    } else {
      alert(res.error || "Failed to amend report");
    }
  };

  return (
    <RoleGuard allowedRoles={["hospital_admin", "lab_staff", "staff", "admin", "doctor"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-200">
        {/* Lab Operations Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                <FlaskConical className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900">
                    {user?.organizationName || "ABC Diagnostics"}
                  </h1>
                  <Badge variant="teal" className="text-xs font-mono">
                    {(user as any)?.organizationId || "LAB-1001"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Connected Laboratory Console • Specimen Intake, Testing, Pathologist Verification & Certified Reporting
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={refreshData} className="gap-1.5 text-xs h-9">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh Hub
            </Button>
          </div>
        </div>

        {/* Diagnostic Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Pending Orders</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{pendingOrders.length}</span>
            <span className="text-[11px] text-teal-700 font-medium block mt-0.5">Awaiting Acceptance / Collection</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Active Samples</span>
            <span className="text-2xl font-bold text-blue-600 mt-1 block">{activeSamples.length}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">In Transit / Testing</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Verification Queue</span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block">{pendingVerificationOrders.length}</span>
            <span className="text-[11px] text-amber-700 block mt-0.5">Pathologist Review Pending</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Released Reports</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">{reports.length}</span>
            <span className="text-[11px] text-emerald-700 block mt-0.5">Certified & Patient-Accessible</span>
          </div>
        </div>

        {/* 5-Tab Navigation Matrix */}
        <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 gap-2 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
              activeTab === "orders" ? "border-teal-700 text-teal-800 font-bold" : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Orders Queue ({orders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("samples")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
              activeTab === "samples" ? "border-teal-700 text-teal-800 font-bold" : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <FlaskConical className="h-4 w-4" />
            <span>Specimen Intake & Samples ({samples.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("testing")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
              activeTab === "testing" ? "border-teal-700 text-teal-800 font-bold" : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Technician Workbench</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("verification")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
              activeTab === "verification" ? "border-teal-700 text-teal-800 font-bold" : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Pathologist Verification ({pendingVerificationOrders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reports")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
              activeTab === "reports" ? "border-teal-700 text-teal-800 font-bold" : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileCheck2 className="h-4 w-4" />
            <span>Reports Archive ({reports.length})</span>
          </button>
        </div>

        {/* TAB 1: ORDERS QUEUE */}
        {activeTab === "orders" && (
          <Card className="bg-white">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold text-slate-900">Diagnostic Orders Queue</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Doctor-authored diagnostic orders requiring laboratory acceptance and specimen collection.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Reference</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Requested Tests</TableHead>
                    <TableHead>Ordering Clinician</TableHead>
                    <TableHead>Facility</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-slate-500 text-xs">
                        No laboratory orders found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono font-bold text-slate-900 text-xs">
                          {order.order_reference || order.id}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-slate-900 block text-xs">{order.patient_name}</span>
                          <span className="font-mono text-[10px] text-slate-500">{order.patient_id}</span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {order.items.map((it) => (
                              <div key={it.id} className="text-xs text-slate-800 font-medium">
                                • {it.test_name}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-slate-800 font-medium block">{order.ordering_provider_name}</span>
                          <span className="text-[10px] text-slate-500">{order.ordering_provider_role}</span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">{order.organization_name}</TableCell>
                        <TableCell>
                          <Badge variant={order.priority === "URGENT" || order.priority === "STAT" ? "destructive" : "outline"} className="text-[10px]">
                            {order.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              order.status === "RELEASED" ? "success" :
                              order.status === "REJECTED" || order.status === "CANCELLED" ? "destructive" :
                              order.status === "VERIFICATION_PENDING" ? "warning" : "teal"
                            }
                            className="text-[10px]"
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {order.status === "ORDERED" && (
                            <Button size="sm" onClick={() => handleAcceptOrder(order.id)} className="text-xs h-8 bg-teal-700 hover:bg-teal-800 text-white">
                              Accept Order
                            </Button>
                          )}
                          {order.status === "ACCEPTED" && (
                            <Button size="sm" onClick={() => handleOpenCollectModal(order)} className="text-xs h-8 bg-blue-700 hover:bg-blue-800 text-white gap-1">
                              <Plus className="h-3.5 w-3.5" /> Collect Specimen
                            </Button>
                          )}
                          {order.status === "RELEASED" && (
                            <Badge variant="success" className="text-xs">Report Released</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* TAB 2: SPECIMEN INTAKE & SAMPLES */}
        {activeTab === "samples" && (
          <Card className="bg-white">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold text-slate-900">Specimen Intake & Physical Samples</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Track biological specimens from collection, barcode labeling, intake verification, and laboratory receiving.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sample Barcode</TableHead>
                    <TableHead>Linked Order</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Specimen Type</TableHead>
                    <TableHead>Tests Covered</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {samples.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                        No collected samples found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    samples.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono font-bold text-teal-800 text-xs">
                          {s.sample_barcode || s.id}
                          {s.is_recollection && (
                            <Badge variant="warning" className="ml-2 text-[9px]">Recollection</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">{s.lab_order_id}</TableCell>
                        <TableCell>
                          <span className="font-semibold text-slate-900 block text-xs">{s.patient_name}</span>
                          <span className="font-mono text-[10px] text-slate-500">{s.patient_id}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] uppercase font-mono">
                            {s.sample_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-700">
                          {s.test_names.join(", ")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              s.status === "RECEIVED" || s.status === "PROCESSING" ? "teal" :
                              s.status === "REJECTED" ? "destructive" : "outline"
                            }
                            className="text-[10px]"
                          >
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1.5">
                          {s.status === "COLLECTED" && (
                            <>
                              <Button size="sm" onClick={() => handleReceiveSample(s.id)} className="text-xs h-7 bg-teal-700 hover:bg-teal-800 text-white">
                                Receive at Lab
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleOpenRejectSampleModal(s)} className="text-xs h-7 text-rose-700 border-rose-200 hover:bg-rose-50">
                                Reject
                              </Button>
                            </>
                          )}
                          {s.status === "REJECTED" && (
                            <Button size="sm" onClick={() => handleRecollect(s.id)} className="text-xs h-7 bg-amber-600 hover:bg-amber-700 text-white">
                              Recollect Specimen
                            </Button>
                          )}
                          {s.status === "RECEIVED" && (
                            <Button size="sm" variant="outline" onClick={() => { setActiveTab("testing"); handleSelectSampleForTesting(s); }} className="text-xs h-7">
                              Enter Results →
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* TAB 3: TECHNICIAN TESTING WORKBENCH */}
        {activeTab === "testing" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sample Selector */}
              <Card className="bg-white md:col-span-1">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold text-slate-900">Received Samples Awaiting Entry</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  {samples.filter((s) => s.status === "RECEIVED" || s.status === "PROCESSING").length === 0 ? (
                    <p className="text-xs text-slate-500 py-4">No samples awaiting result entry.</p>
                  ) : (
                    samples.filter((s) => s.status === "RECEIVED" || s.status === "PROCESSING").map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectSampleForTesting(s)}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                          selectedSample?.id === s.id
                            ? "border-teal-700 bg-teal-50/70 font-semibold"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-teal-900">{s.id}</span>
                          <Badge variant="teal" className="text-[10px]">{s.sample_type}</Badge>
                        </div>
                        <span className="text-slate-900 block mt-1">{s.patient_name} ({s.patient_id})</span>
                        <span className="text-slate-500 text-[10px] block mt-0.5">{s.test_names.join(", ")}</span>
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Analyte Result Entry Matrix */}
              <Card className="bg-white md:col-span-2">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold text-slate-900">
                    {selectedSample ? `Result Entry: ${selectedSample.id} (${selectedSample.patient_name})` : "Select a Sample to Enter Results"}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Enter structured analyte values. Reference ranges are automatically evaluated.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {selectedSample && selectedOrder ? (
                    <div className="space-y-4">
                      {selectedOrder.items.map((item) => {
                        const catalog = getLabTestById(item.test_id || item.test_name);
                        return (
                          <div key={item.id} className="rounded-xl border border-slate-200 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-900">{item.test_name}</span>
                              <Badge variant="outline" className="text-[10px]">{catalog?.category || "DIAGNOSTIC"}</Badge>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {catalog?.parameters.map((param) => (
                                <div key={param.id} className="space-y-1">
                                  <label className="text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                                    <span>{param.name}</span>
                                    <span className="text-[10px] text-slate-400 font-normal">{param.reference_range?.text || param.default_unit}</span>
                                  </label>
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      placeholder={param.data_type === "NUMERIC" ? "e.g. 14.2" : "Result"}
                                      value={testEntryValues[param.id] || ""}
                                      onChange={(e) =>
                                        setTestEntryValues((prev) => ({
                                          ...prev,
                                          [param.id]: e.target.value,
                                        }))
                                      }
                                      className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700"
                                    />
                                    {param.default_unit && (
                                      <span className="text-[11px] text-slate-500 font-mono w-12 text-right">
                                        {param.default_unit}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      {entrySuccessMessage && (
                        <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          {entrySuccessMessage}
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-2">
                        <Button size="sm" onClick={handleSubmitTestResults} className="text-xs h-9 bg-teal-700 hover:bg-teal-800 text-white font-semibold">
                          Submit Results for Verification
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      Please click on a received sample from the left queue to begin entering laboratory test parameters.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 4: PATHOLOGIST VERIFICATION DESK */}
        {activeTab === "verification" && (
          <Card className="bg-white">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold text-slate-900">Pathologist Verification & Report Release Desk</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Review technician result submissions, verify clinical accuracy, and release certified laboratory reports.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Tests & Results</TableHead>
                    <TableHead>Ordering Clinician</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.filter((o) => o.status === "VERIFICATION_PENDING" || o.status === "REPORT_READY").length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500 text-xs">
                        No orders currently awaiting pathologist verification.
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders
                      .filter((o) => o.status === "VERIFICATION_PENDING" || o.status === "REPORT_READY")
                      .map((order) => {
                        const orderResults = testResults.filter((r) => r.lab_order_id === order.id);
                        return (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono font-bold text-slate-900 text-xs">{order.id}</TableCell>
                            <TableCell>
                              <span className="font-semibold text-slate-900 block text-xs">{order.patient_name}</span>
                              <span className="font-mono text-[10px] text-slate-500">{order.patient_id}</span>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {orderResults.map((r) => (
                                  <div key={r.id} className="text-xs flex items-center gap-2">
                                    <span className="text-slate-700 font-medium">{r.parameter_name}:</span>
                                    <span className="font-mono font-bold text-slate-900">{r.value} {r.unit}</span>
                                    {r.flag !== "NORMAL" && (
                                      <Badge variant={r.flag === "HIGH" ? "warning" : "destructive"} className="text-[9px]">
                                        {r.flag}
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-slate-700">{order.ordering_provider_name}</TableCell>
                            <TableCell>
                              <Badge variant="warning" className="text-[10px]">{order.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-1.5">
                              {order.status === "VERIFICATION_PENDING" && (
                                <Button size="sm" onClick={() => handleVerifyResults(order.id)} className="text-xs h-8 bg-teal-700 hover:bg-teal-800 text-white">
                                  Verify Results
                                </Button>
                              )}
                              {order.status === "REPORT_READY" && (
                                <Button size="sm" onClick={() => handleGenerateAndRelease(order.id)} className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                                  Release Final Report
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* TAB 5: REPORTS ARCHIVE */}
        {activeTab === "reports" && (
          <Card className="bg-white">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold text-slate-900">Released Diagnostic Reports Archive</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Authoritative certified laboratory reports released to patients and clinicians.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Reference</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Ordering Clinician</TableHead>
                    <TableHead>Release Timestamp</TableHead>
                    <TableHead>Certified By</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-slate-500 text-xs">
                        No released reports found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-mono font-bold text-teal-800 text-xs">
                          {report.report_reference || report.id}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-slate-900 block text-xs">{report.patient_name}</span>
                          <span className="font-mono text-[10px] text-slate-500">{report.patient_id}</span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-700">{report.ordering_provider_name}</TableCell>
                        <TableCell className="text-xs text-slate-600">{report.released_at ? new Date(report.released_at).toLocaleString() : "N/A"}</TableCell>
                        <TableCell className="text-xs text-slate-800 font-medium">{report.verified_by_name || "Pathologist"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">v{report.version}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={report.status === "AMENDED" ? "warning" : "success"} className="text-[10px]">
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1.5">
                          <Button size="sm" variant="outline" onClick={() => setSelectedReport(report)} className="text-xs h-7">
                            View Report
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setSelectedReport(report); setShowAmendReportModal(true); }} className="text-xs h-7 text-amber-700 border-amber-200">
                            Amend
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* MODAL 1: SPECIMEN COLLECTION & PATIENT VERIFICATION */}
        {showCollectModal && selectedOrder && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                  <FlaskConical className="h-5 w-5" />
                  <span>Specimen Collection & Patient Verification</span>
                </div>
                <button type="button" onClick={() => setShowCollectModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Expected Patient:</span>
                    <span className="font-bold text-slate-900">{selectedOrder.patient_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Medora ID:</span>
                    <span className="font-mono font-bold text-teal-800">{selectedOrder.patient_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Order ID:</span>
                    <span className="font-mono text-slate-700">{selectedOrder.id}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Verify Patient ID Check (Scan or Type):</label>
                  <input
                    type="text"
                    value={verifiedPatientId}
                    onChange={(e) => setVerifiedPatientId(e.target.value)}
                    placeholder="e.g. PAT-1001"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900 focus:ring-1 focus:ring-teal-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Specimen / Sample Type:</label>
                  <select
                    value={collectionSampleType}
                    onChange={(e) => setCollectionSampleType(e.target.value as SampleType)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 bg-white"
                  >
                    <option value="WHOLE_BLOOD">Whole Blood (EDTA)</option>
                    <option value="SERUM">Serum (Clot Activator)</option>
                    <option value="PLASMA">Plasma (Sodium Citrate)</option>
                    <option value="URINE">Urine (Clean Catch)</option>
                    <option value="SWAB">Nasopharyngeal Swab</option>
                  </select>
                </div>

                {collectionError && (
                  <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    {collectionError}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button size="sm" variant="outline" onClick={() => setShowCollectModal(false)} className="text-xs">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleConfirmCollection} className="text-xs bg-teal-700 hover:bg-teal-800 text-white font-semibold">
                  Confirm & Generate Barcode
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: SAMPLE REJECTION */}
        {showRejectSampleModal && selectedSample && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-rose-800 font-bold text-sm">
                <span>Reject Biological Specimen</span>
                <button type="button" onClick={() => setShowRejectSampleModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Rejection Reason:</label>
                  <select
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value as SampleRejectionReason)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 bg-white"
                  >
                    <option value="INSUFFICIENT_VOLUME">Insufficient Specimen Quantity</option>
                    <option value="HEMOLYZED">Sample Hemolyzed</option>
                    <option value="CLOTTED">Specimen Clotted</option>
                    <option value="WRONG_CONTAINER">Incorrect Specimen Container</option>
                    <option value="CONTAINER_DAMAGED">Damaged / Leaking Container</option>
                    <option value="EXPIRED_WINDOW">Stability Window Expired</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Additional Laboratory Notes:</label>
                  <textarea
                    rows={3}
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    placeholder="Document specific visual observation..."
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button size="sm" variant="outline" onClick={() => setShowRejectSampleModal(false)} className="text-xs">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleConfirmRejectSample} className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold">
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: VIEW CERTIFIED REPORT */}
        {selectedReport && !showAmendReportModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="h-5 w-5 text-teal-700" />
                  <span className="font-bold text-slate-900 text-sm">Certified Diagnostic Laboratory Report</span>
                  <Badge variant="success" className="text-[10px] font-mono">v{selectedReport.version}</Badge>
                </div>
                <button type="button" onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Header Meta */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Patient Name</span>
                    <span className="font-bold text-slate-900">{selectedReport.patient_name}</span>
                    <span className="font-mono text-[10px] text-teal-800 block">{selectedReport.patient_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Ordering Clinician</span>
                    <span className="font-semibold text-slate-900">{selectedReport.ordering_provider_name}</span>
                    <span className="text-[10px] text-slate-500 block">{selectedReport.ordering_provider_role}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Diagnostic Center</span>
                    <span className="font-semibold text-slate-900">{selectedReport.laboratory_name}</span>
                    <span className="font-mono text-[10px] text-slate-500 block">{selectedReport.laboratory_id}</span>
                  </div>
                </div>

                {/* Parameters Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Test Parameter</TableHead>
                        <TableHead>Result Value</TableHead>
                        <TableHead>Units</TableHead>
                        <TableHead>Reference Range</TableHead>
                        <TableHead className="text-right">Flag</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedReport.results.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium text-slate-900 text-xs">{r.parameter_name}</TableCell>
                          <TableCell className="font-mono font-bold text-slate-900 text-xs">{r.value}</TableCell>
                          <TableCell className="font-mono text-xs text-slate-600">{r.unit || "-"}</TableCell>
                          <TableCell className="text-xs text-slate-500">{r.reference_range || "-"}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={r.flag === "HIGH" ? "warning" : r.flag === "LOW" ? "destructive" : "success"} className="text-[10px]">
                              {r.flag}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Footer Notes & Signatures */}
                <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 text-[11px] text-teal-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-teal-700" />
                    <span>Pathologist Certification</span>
                  </div>
                  <p>Certified by: {selectedReport.verified_by_name || "Dr. B. Mohapatra, MD (Pathology)"}</p>
                  <p className="text-slate-500">Released: {new Date(selectedReport.released_at || selectedReport.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button size="sm" variant="outline" onClick={() => setSelectedReport(null)} className="text-xs">
                  Close
                </Button>
                <Button size="sm" onClick={() => window.print()} className="text-xs bg-slate-900 hover:bg-slate-800 text-white gap-1.5">
                  <Printer className="h-3.5 w-3.5" /> Print / Save PDF
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 4: AMEND REPORT */}
        {showAmendReportModal && selectedReport && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-amber-900 font-bold text-sm">
                <span>Amend Released Report (v{selectedReport.version} → v{(selectedReport.version || 1) + 1})</span>
                <button type="button" onClick={() => setShowAmendReportModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Formal amendment requires documenting a clinical reason. An immutable snapshot of Version {selectedReport.version} will be preserved.
                </p>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Clinical Amendment Reason:</label>
                  <textarea
                    rows={3}
                    value={amendmentReason}
                    onChange={(e) => setAmendmentReason(e.target.value)}
                    placeholder="e.g. Corrected transcription error in parameter measurement."
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-amber-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button size="sm" variant="outline" onClick={() => setShowAmendReportModal(false)} className="text-xs">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleConfirmAmendReport} className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold">
                  Confirm Amendment
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
