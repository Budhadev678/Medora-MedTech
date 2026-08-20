"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Lock, 
  Share2, 
  Clock, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Building2, 
  UserCheck, 
  FileText, 
  ShieldAlert, 
  ChevronRight, 
  History, 
  Activity, 
  QrCode,
  Info,
  Check,
  Ban,
  Unlink,
  EyeOff,
  UserX
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-context";
import { findIdentityById } from "@/lib/data/identity-store";
import { 
  getPatientConsentRequests, 
  getPatientConsents, 
  grantConsentRequest, 
  denyConsentRequest, 
  revokeConsent 
} from "@/lib/data/consent-store";
import { 
  getPatientOrganizationRelationships, 
  endPatientRelationship 
} from "@/lib/data/relationship-store";
import { 
  getPatientCorrectionRequests, 
  cancelCorrectionRequest 
} from "@/lib/data/correction-store";
import { getPatientAuditTimeline } from "@/lib/data/audit-store";
import { 
  ConsentRequest, 
  ConsentRecord, 
  PatientOrganizationRelationship, 
  IdentityCorrectionRequest, 
  StoredAuditEvent 
} from "@/types/database.types";

export default function PatientPrivacyPage() {
  const { user } = useAuth();
  const [patientId, setPatientId] = useState(() => user?.identifier || "PAT-1001");
  const [patient, setPatient] = useState(() => findIdentityById(patientId) || user);

  // Reactive Stores State
  const [requests, setRequests] = useState<ConsentRequest[]>([]);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [orgs, setOrgs] = useState<PatientOrganizationRelationship[]>([]);
  const [corrections, setCorrections] = useState<IdentityCorrectionRequest[]>([]);
  const [auditLog, setAuditLog] = useState<StoredAuditEvent[]>([]);

  // Modals & Feedback
  const [activeTab, setActiveTab] = useState<"consents" | "orgs" | "corrections" | "history">("consents");
  const [revokeTarget, setRevokeTarget] = useState<ConsentRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = () => {
    if (user) {
      const pid = user.identifier || "PAT-1001";
      setPatientId(pid);
      setPatient(findIdentityById(pid) || user);
      setRequests(getPatientConsentRequests(pid));
      setConsents(getPatientConsents(pid));
      setOrgs(getPatientOrganizationRelationships(pid));
      setCorrections(getPatientCorrectionRequests(pid));
      setAuditLog(getPatientAuditTimeline(pid));
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener("medora-consent-updated", handleUpdate);
    window.addEventListener("medora-relationships-updated", handleUpdate);
    window.addEventListener("medora-corrections-updated", handleUpdate);
    window.addEventListener("medora-audit-updated", handleUpdate);

    return () => {
      window.removeEventListener("medora-consent-updated", handleUpdate);
      window.removeEventListener("medora-relationships-updated", handleUpdate);
      window.removeEventListener("medora-corrections-updated", handleUpdate);
      window.removeEventListener("medora-audit-updated", handleUpdate);
    };
  }, [user]);

  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const activeConsents = consents.filter((c) => c.status === "GRANTED");
  const pastConsents = consents.filter((c) => c.status !== "GRANTED");

  // Handle Grant
  const handleGrant = (requestId: string) => {
    setLoading(true);
    setFeedback(null);
    const res = grantConsentRequest(requestId, patientId, patient?.fullName);
    setLoading(false);

    if (res.success) {
      loadData();
      setFeedback({ type: "success", text: "Consent granted. Time-bound access link created." });
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to grant consent." });
    }
  };

  // Handle Deny
  const handleDeny = (requestId: string) => {
    setLoading(true);
    setFeedback(null);
    const res = denyConsentRequest(requestId, patientId, patient?.fullName);
    setLoading(false);

    if (res.success) {
      loadData();
      setFeedback({ type: "success", text: "Consent request declined. No access granted." });
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to decline consent." });
    }
  };

  // Handle Revoke
  const handleRevoke = () => {
    if (!revokeTarget) return;
    setLoading(true);
    setFeedback(null);
    const res = revokeConsent(revokeTarget.id, patientId, patient?.fullName);
    setLoading(false);
    setRevokeTarget(null);

    if (res.success) {
      loadData();
      setFeedback({ type: "success", text: "Permission revoked successfully. Healthcare records are no longer accessible." });
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to revoke permission." });
    }
  };

  // Handle Cancel Correction
  const handleCancelCorrection = (requestId: string) => {
    setLoading(true);
    const res = cancelCorrectionRequest(requestId, patientId, patient?.fullName);
    setLoading(false);
    if (res.success) {
      loadData();
      setFeedback({ type: "success", text: "Correction request cancelled." });
    }
  };

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in-50 duration-150 pb-16">
        
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/patient/profile"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Profile
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">{patient?.fullName}</span>
            <Badge variant="outline" className="text-[10px] font-mono text-teal-800 bg-teal-50 border-teal-200">
              {patientId}
            </Badge>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-teal-600" /> Privacy & Access Control Center
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            You maintain sovereign control over your medical records. Grant, review, or revoke data access for doctors and healthcare organizations.
          </p>
        </div>

        {/* Feedback Alert Toast */}
        {feedback && (
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-in slide-in-from-top duration-200 ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-red-50 border-red-200 text-red-900"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab("consents")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "consents"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Share2 className="h-3.5 w-3.5" />
            Permissions & Consents
            {pendingRequests.length > 0 && (
              <span className="h-4 w-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-mono">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("orgs")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "orgs"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            Connected Organizations ({orgs.filter((o) => o.status === "ACTIVE").length})
          </button>

          <button
            onClick={() => setActiveTab("corrections")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "corrections"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Correction Requests ({corrections.length})
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "history"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            Security Audit Trail
          </button>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: PERMISSIONS & CONSENT REQUESTS                        */}
        {/* ============================================================ */}
        {activeTab === "consents" && (
          <div className="space-y-4">
            
            {/* 1. Pending Consent Requests */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-600" /> Pending Consent Requests ({pendingRequests.length})
                </h2>
              </div>

              {pendingRequests.length > 0 ? (
                pendingRequests.map((req) => (
                  <Card key={req.id} className="bg-amber-50/40 border-amber-200 shadow-xs">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded">
                            {req.id}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 capitalize">
                            Purpose: {req.purpose.replace("_", " ")}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-800 bg-white">
                          ● Pending Review
                        </Badge>
                      </div>

                      <CardTitle className="text-sm font-bold text-slate-900 mt-2">
                        {req.requester_name}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-600">
                        {req.requester_role} • {req.organization_name}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-4 pt-1 space-y-2.5 text-xs text-slate-700">
                      <p className="text-[11px] text-slate-600 italic bg-white p-2.5 rounded-lg border border-amber-200/60">
                        "{req.purpose_description}"
                      </p>

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                          Requested Data Categories:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {req.requested_scopes.map((scope, idx) => (
                            <Badge key={idx} variant="outline" className="text-[10px] bg-white border-slate-200 capitalize">
                              ✓ {scope.replace("_", " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>Validity if granted: <strong>{req.duration_days} Days</strong></span>
                        <span className="font-mono text-[10px]">Expires on: {new Date(req.expires_at).toLocaleDateString()}</span>
                      </div>
                    </CardContent>

                    <CardFooter className="p-4 pt-0 flex justify-end gap-2 border-t border-amber-200/50 mt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        onClick={() => handleDeny(req.id)}
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Ban className="h-3.5 w-3.5 mr-1" /> Decline
                      </Button>
                      <Button
                        size="sm"
                        disabled={loading}
                        onClick={() => handleGrant(req.id)}
                        className="text-xs bg-teal-700 hover:bg-teal-800 gap-1"
                      >
                        <Check className="h-3.5 w-3.5" /> Allow Access
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <Card className="bg-white border-dashed border-slate-200 p-5 text-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1.5" />
                  <span className="text-xs font-bold text-slate-700 block">No Pending Consent Requests</span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    No healthcare organization is currently waiting for your access authorization.
                  </span>
                </Card>
              )}
            </div>

            {/* 2. Active Permissions */}
            <div className="space-y-2.5 pt-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" /> Active Medical Access Permissions ({activeConsents.length})
              </h2>

              {activeConsents.length > 0 ? (
                activeConsents.map((consent) => (
                  <Card key={consent.id} className="bg-white border-teal-200 shadow-xs">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                          {consent.id}
                        </span>
                        <Badge variant="success" className="text-[10px]">
                          ● Active Access
                        </Badge>
                      </div>

                      <CardTitle className="text-sm font-bold text-slate-900 mt-2">
                        {consent.organization_name}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        Granted to {consent.requester_name} ({consent.requester_role})
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-4 pt-1 space-y-2 text-xs text-slate-600">
                      <div className="flex flex-wrap gap-1">
                        {consent.granted_scopes.map((s, idx) => (
                          <Badge key={idx} variant="outline" className="text-[9px] bg-slate-50 text-slate-700 capitalize">
                            {s.replace("_", " ")}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                        <span>Purpose: <strong className="capitalize">{consent.purpose.replace("_", " ")}</strong></span>
                        <span className="text-teal-700 font-semibold font-mono">
                          Expires: {new Date(consent.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>

                    <CardFooter className="p-4 pt-0 flex justify-end border-t border-slate-100 mt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRevokeTarget(consent)}
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-8"
                      >
                        <EyeOff className="h-3.5 w-3.5 mr-1" /> Revoke Access
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <Card className="bg-white border-slate-200 p-5 text-center">
                  <Lock className="h-5 w-5 text-slate-400 mx-auto mb-1.5" />
                  <span className="text-xs font-bold text-slate-700 block">No Active Access Permissions</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Your medical records are currently locked from external organization access.
                  </span>
                </Card>
              )}
            </div>

            {/* 3. Past Permissions History */}
            {pastConsents.length > 0 && (
              <div className="space-y-2 pt-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Consent History ({pastConsents.length})
                </h2>
                <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden text-xs">
                  {pastConsents.map((pc) => (
                    <div key={pc.id} className="p-3.5 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{pc.organization_name}</span>
                          <Badge
                            variant={pc.status === "REVOKED" ? "destructive" : "outline"}
                            className="text-[9px] py-0 capitalize"
                          >
                            {pc.status.toLowerCase()}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {pc.purpose.replace("_", " ")} • {pc.granted_scopes.join(", ")}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">
                        {new Date(pc.granted_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: CONNECTED HEALTHCARE ORGANIZATIONS                    */}
        {/* ============================================================ */}
        {activeTab === "orgs" && (
          <div className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Connected Healthcare Facilities ({orgs.length})
              </h2>
              <p className="text-[11px] text-slate-500">
                Organizations where you have a recorded patient care relationship or previous consultation history.
              </p>
            </div>

            {orgs.length > 0 ? (
              orgs.map((rel) => (
                <Card key={rel.id} className="bg-white border-slate-200 shadow-xs">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {rel.organization_id}
                      </span>
                      <Badge
                        variant={rel.status === "ACTIVE" ? "success" : "outline"}
                        className="text-[10px] capitalize"
                      >
                        ● {rel.status.toLowerCase()}
                      </Badge>
                    </div>

                    <CardTitle className="text-sm font-bold text-slate-900 mt-2">
                      {rel.organization_name}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 capitalize">
                      Relationship: {rel.relationship_type.replace("_", " ")}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 pt-1 text-xs text-slate-600 space-y-1">
                    {rel.notes && <p className="text-[11px] text-slate-500 italic">{rel.notes}</p>}
                    <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-slate-100">
                      <span>Connected since: {new Date(rel.connected_since).toLocaleDateString()}</span>
                      {rel.ended_at && <span>Ended on: {new Date(rel.ended_at).toLocaleDateString()}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-white border-slate-200 p-6 text-center">
                <Building2 className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
                <span className="text-xs font-bold text-slate-700 block">No Connected Organizations</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  You do not currently have any registered healthcare facility relationships.
                </span>
              </Card>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: IDENTITY CORRECTION REQUESTS                          */}
        {/* ============================================================ */}
        {activeTab === "corrections" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Identity Correction Tracker
                </h2>
                <p className="text-[11px] text-slate-500">
                  Track rectification requests submitted for verified identity fields.
                </p>
              </div>
              <Link href="/patient/profile">
                <Button size="sm" variant="outline" className="text-xs h-7">
                  Submit from Profile
                </Button>
              </Link>
            </div>

            {corrections.length > 0 ? (
              corrections.map((corr) => (
                <Card key={corr.id} className="bg-white border-slate-200 shadow-xs">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                        {corr.id}
                      </span>
                      <Badge
                        variant={
                          corr.status === "APPROVED"
                            ? "success"
                            : corr.status === "UNDER_REVIEW"
                            ? "outline"
                            : corr.status === "PENDING"
                            ? "outline"
                            : "destructive"
                        }
                        className="text-[10px] capitalize"
                      >
                        {corr.status.replace("_", " ").toLowerCase()}
                      </Badge>
                    </div>

                    <CardTitle className="text-sm font-bold text-slate-900 mt-2">
                      {corr.field_label}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-4 pt-1 space-y-2 text-xs">
                    <div className="rounded-lg bg-slate-50 p-2.5 space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Current Verified:</span>
                        <span className="text-slate-700 font-bold">{corr.current_value}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Requested Value:</span>
                        <span className="text-teal-800 font-bold">{corr.requested_value}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600">
                      <strong>Reason:</strong> {corr.reason}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>Submitted: {new Date(corr.submitted_at).toLocaleDateString()}</span>
                      {corr.admin_notes && <span>Reviewer Note: {corr.admin_notes}</span>}
                    </div>
                  </CardContent>

                  {(corr.status === "PENDING" || corr.status === "UNDER_REVIEW") && (
                    <CardFooter className="p-4 pt-0 flex justify-end border-t border-slate-100 mt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelCorrection(corr.id)}
                        className="text-xs text-slate-600 hover:text-red-600 h-7"
                      >
                        Cancel Request
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))
            ) : (
              <Card className="bg-white border-slate-200 p-6 text-center">
                <FileText className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
                <span className="text-xs font-bold text-slate-700 block">No Identity Correction Requests</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Your verified identity fields are up to date. To request changes to verified legal details, visit your Profile.
                </span>
              </Card>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: SECURITY & PRIVACY AUDIT TRAIL                        */}
        {/* ============================================================ */}
        {activeTab === "history" && (
          <div className="space-y-3">
            <div className="space-y-0.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Patient Privacy & Security Ledger
              </h2>
              <p className="text-[11px] text-slate-500">
                Authoritative append-only log of all consent, identity, and authorization events.
              </p>
            </div>

            {auditLog.length > 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden text-xs">
                {auditLog.map((event) => (
                  <div key={event.id} className="p-3.5 space-y-1 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-slate-400">
                        {event.id}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-teal-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-slate-900">{event.summary}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                          <span>Actor: {event.actor_name} ({event.actor_role})</span>
                          {event.organization_name && <span>• {event.organization_name}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="bg-white border-slate-200 p-6 text-center">
                <History className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
                <span className="text-xs font-bold text-slate-700 block">No Audit Events Logged</span>
              </Card>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* REVOKE CONFIRMATION MODAL                                    */}
        {/* ============================================================ */}
        {revokeTarget && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl animate-in zoom-in-95">
              <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Revoke Medical Record Access?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to revoke access permissions for <strong>{revokeTarget.organization_name}</strong> ({revokeTarget.requester_name})?
                </p>
                <p className="text-[11px] text-red-700 font-semibold pt-1">
                  Their clinical access will immediately terminate.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRevokeTarget(null)}
                  className="flex-1 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={loading}
                  onClick={handleRevoke}
                  className="flex-1 text-xs"
                >
                  {loading ? "Revoking..." : "Confirm Revoke"}
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </RoleGuard>
  );
}
