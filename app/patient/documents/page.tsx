"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FolderOpen, 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  Building2, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Plus, 
  Filter, 
  Search,
  Sparkles
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/auth-context";
import { 
  HealthcareMedicalDocument, 
  MedicalDocumentType,
  getPatientMedicalDocuments, 
  createMedicalDocument, 
  generateSecureDocumentAccessToken 
} from "@/lib/data/medical-document-store";

export default function PatientDocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<HealthcareMedicalDocument[]>([]);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Document Viewer Modal State
  const [viewingDoc, setViewingDoc] = useState<HealthcareMedicalDocument | null>(null);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  // Document Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState<MedicalDocumentType>("DIAGNOSTIC_REPORT");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadFileSize, setUploadFileSize] = useState(420000); // 420 KB mock file
  const [uploadMimeType, setUploadMimeType] = useState("application/pdf");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const refreshDocuments = () => {
    if (!user) return;
    const pId = user.identifier || user.id;
    const data = getPatientMedicalDocuments(pId, true);
    setDocuments(data);
  };

  useEffect(() => {
    refreshDocuments();
    const handleUpdate = () => refreshDocuments();
    window.addEventListener("medora-documents-updated", handleUpdate);
    return () => window.removeEventListener("medora-documents-updated", handleUpdate);
  }, [user]);

  const handleOpenDoc = (doc: HealthcareMedicalDocument) => {
    if (user) {
      generateSecureDocumentAccessToken(doc.id, "VIEW", user.identifier || user.id, user.fullName || user.email || "Patient", "patient");
    }
    setViewingDoc(doc);
  };

  const handleDownloadDoc = (doc: HealthcareMedicalDocument) => {
    if (!user) return;
    const res = generateSecureDocumentAccessToken(doc.id, "DOWNLOAD", user.identifier || user.id, user.fullName || user.email || "Patient", "patient");
    if (res.success) {
      setDownloadSuccessMessage(`Secure download initiated (Signed Token: ${res.token?.substring(0, 24)}...)`);
      setTimeout(() => setDownloadSuccessMessage(null), 4000);
    }
  };

  const handlePatientUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUploadError(null);

    if (!uploadTitle.trim()) {
      setUploadError("Document title is required.");
      return;
    }

    const res = createMedicalDocument({
      patientId: user.identifier || user.id,
      patientName: user.fullName || user.email || "Patient",
      documentType: uploadType,
      title: uploadTitle.trim(),
      description: uploadDesc.trim(),
      sourceType: "PATIENT_UPLOADED",
      mimeType: uploadMimeType,
      fileSizeBytes: uploadFileSize,
      actorId: user.identifier || user.id,
      actorName: user.fullName || user.email || "Patient",
      actorRole: "patient",
    });

    if (!res.success) {
      setUploadError(res.error || "Failed to upload document.");
      return;
    }

    setUploadSuccess("Medical document uploaded successfully to your private vault.");
    setTimeout(() => {
      setUploadSuccess(null);
      setIsUploadOpen(false);
      setUploadTitle("");
      setUploadDesc("");
    }, 1500);
  };

  const filteredDocuments = documents.filter((doc) => {
    if (selectedType !== "all") {
      if (selectedType === "patient_uploaded") {
        if (doc.source_type !== "PATIENT_UPLOADED") return false;
      } else if (doc.document_type !== selectedType) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = doc.title.toLowerCase().includes(q);
      const matchRef = doc.document_reference.toLowerCase().includes(q);
      const matchOrg = doc.source_organization_name?.toLowerCase().includes(q);
      const matchDoc = doc.source_professional_name?.toLowerCase().includes(q);
      if (!matchTitle && !matchRef && !matchOrg && !matchDoc) return false;
    }
    return true;
  });

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150">
        <PageHeader
          title="Medical Documents Vault"
          description="Digitally certified clinical records, diagnostic reports, and patient-uploaded health documents."
          breadcrumbs={[{ label: "Patient Portal", href: "/patient" }, { label: "Medical Documents" }]}
          actions={
            <Button
              onClick={() => setIsUploadOpen(true)}
              className="bg-indigo-700 hover:bg-indigo-800 text-white text-xs gap-1.5 h-9 font-bold"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Document</span>
            </Button>
          }
        />

        {/* Provenance & Authenticity Notice */}
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs">
            <ShieldCheck className="h-4 w-4 text-indigo-700" />
            <span>Document Provenance & Source Transparency</span>
          </div>
          <p className="text-[11px] text-indigo-900 leading-relaxed">
            In MEDORA, documents are cryptographically tracked with their explicit source. Documents generated by accredited hospitals and laboratories are marked as <strong>Provider Verified</strong>, while personal historical files are transparently labeled as <strong>Patient Uploaded</strong>.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search documents by title, ID, doctor, or organization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9 bg-white"
            />
          </div>
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
          {[
            { key: "all", label: `All Documents (${documents.length})` },
            { key: "LAB_REPORT", label: "Lab Reports" },
            { key: "CONSULTATION_NOTE", label: "Consultation Notes" },
            { key: "DIAGNOSTIC_REPORT", label: "Diagnostic Reports" },
            { key: "patient_uploaded", label: "Patient Uploads" },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedType(cat.key)}
              className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
                selectedType === cat.key
                  ? "bg-indigo-700 text-white font-bold shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {downloadSuccessMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{downloadSuccessMessage}</span>
          </div>
        )}

        {/* Documents Stream */}
        {filteredDocuments.length > 0 ? (
          <div className="space-y-3">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-all"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded">
                      {doc.document_reference}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        doc.source_type === "PROVIDER_GENERATED"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {doc.source_type === "PROVIDER_GENERATED" ? "Provider Verified" : "Patient Uploaded"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-bold bg-slate-50">
                      {doc.document_type.replace(/_/g, " ")}
                    </Badge>
                    {doc.status === "REVOKED" && (
                      <Badge variant="outline" className="text-[10px] font-bold bg-rose-50 text-rose-800 border-rose-200">
                        REVOKED
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                    <Calendar className="h-3 w-3" />
                    {new Date(doc.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Title & Description */}
                <div className="text-xs space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm">{doc.title}</h3>
                  {doc.description && (
                    <p className="text-slate-600 text-[11px] leading-relaxed">{doc.description}</p>
                  )}
                </div>

                {/* Provenance Details */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center justify-between">
                    <span><strong>Source:</strong> {doc.source_type === "PROVIDER_GENERATED" ? (doc.source_organization_name || "Authorized Provider") : "Self Uploaded by Patient"}</span>
                    <span><strong>Size:</strong> {(doc.file_size_bytes / 1024).toFixed(0)} KB</span>
                  </div>
                  {doc.source_professional_name && (
                    <div className="flex items-center justify-between">
                      <span><strong>Author:</strong> {doc.source_professional_name} ({doc.source_professional_role || "Doctor"})</span>
                      <span><strong>Version:</strong> v{doc.version}</span>
                    </div>
                  )}
                  {doc.status === "REVOKED" && doc.revocation_reason && (
                    <div className="pt-1 text-rose-700 font-medium">
                      <strong>Revocation Reason:</strong> {doc.revocation_reason}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    SHA-256: {doc.file_hash_sha256?.substring(0, 16)}...
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDoc(doc)}
                      className="text-xs h-7 text-indigo-700 border-indigo-200 hover:bg-indigo-50 gap-1 font-semibold"
                    >
                      <Eye className="h-3 w-3" />
                      <span>View</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadDoc(doc)}
                      disabled={doc.status === "REVOKED"}
                      className="text-xs h-7 text-slate-700 border-slate-200 hover:bg-slate-50 gap-1 font-semibold"
                    >
                      <Download className="h-3 w-3" />
                      <span>Download</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FolderOpen className="h-6 w-6 text-indigo-600" />}
            title="No Documents Found in Vault"
            description="Upload historical medical records or consult connected doctors and labs to receive certified digital reports."
            phase="Phase 4.4 — Medical Documents"
            actionHref="/patient"
            actionLabel="Return to Patient Home"
          />
        )}

        {/* Upload Document Modal */}
        {isUploadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in-50">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Upload Health Document</h3>
                    <p className="text-[11px] text-slate-500">Add personal medical reports to your private vault</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              <form onSubmit={handlePatientUpload} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Document Title *</label>
                  <Input
                    type="text"
                    placeholder="e.g. Previous Chest X-Ray or Blood Panel Report"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    required
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Document Category *</label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value as any)}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="DIAGNOSTIC_REPORT">Diagnostic Report (ECG, X-Ray, Scan)</option>
                    <option value="LAB_REPORT">Laboratory Blood / Urine Test Report</option>
                    <option value="CONSULTATION_NOTE">External Doctor Consultation Slip</option>
                    <option value="DISCHARGE_SUMMARY">Hospital Discharge Summary</option>
                    <option value="OTHER">Other Health Document</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Document Description / Notes</label>
                  <textarea
                    placeholder="Optional details, previous clinic name, or notes..."
                    value={uploadDesc}
                    onChange={(e) => setUploadDesc(e.target.value)}
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">File Type (Simulated Upload)</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={uploadMimeType}
                      onChange={(e) => setUploadMimeType(e.target.value)}
                      className="flex-1 h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 font-medium"
                    >
                      <option value="application/pdf">PDF Document (.pdf)</option>
                      <option value="image/png">PNG Image (.png)</option>
                      <option value="image/jpeg">JPEG Image (.jpg/.jpeg)</option>
                    </select>
                    <span className="text-[11px] text-slate-500 font-semibold">Max 15MB</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                  <strong>Patient Upload Notice:</strong> This document will be labeled as <em>Uploaded by Patient</em> and will remain in your private vault until explicitly shared with consulting doctors.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsUploadOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold"
                  >
                    Save to Vault
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Secure Document Viewer Modal */}
        {viewingDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in-50">
            <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                    <FolderOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded">
                      {viewingDoc.document_reference}
                    </span>
                    <span className="text-xs font-bold text-slate-900 block mt-0.5">
                      {viewingDoc.title}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingDoc(null)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Provenance Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Document Type:</span>
                  <Badge variant="outline" className="text-[10px] font-bold bg-white">
                    {viewingDoc.document_type.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Source Provenance:</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold ${
                      viewingDoc.source_type === "PROVIDER_GENERATED"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    {viewingDoc.source_type === "PROVIDER_GENERATED" ? "Provider Verified" : "Patient Uploaded"}
                  </Badge>
                </div>
                {viewingDoc.source_organization_name && (
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Organization:</span>
                    <span className="text-slate-900">{viewingDoc.source_organization_name}</span>
                  </div>
                )}
                {viewingDoc.source_professional_name && (
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Author / Clinician:</span>
                    <span className="text-slate-900">{viewingDoc.source_professional_name}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">File Size:</span>
                  <span className="text-slate-900">{(viewingDoc.file_size_bytes / 1024).toFixed(1)} KB ({viewingDoc.mime_type})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Version:</span>
                  <span className="text-slate-900">v{viewingDoc.version}</span>
                </div>
              </div>

              {/* In-app Document Preview Pane */}
              <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-6 flex flex-col items-center justify-center space-y-2 min-h-[160px]">
                <FileText className="h-10 w-10 text-indigo-400" />
                <span className="text-xs font-bold text-slate-200">Secure Document Preview</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  SHA-256: {viewingDoc.file_hash_sha256?.substring(0, 32)}...
                </span>
                <span className="text-[10px] text-slate-400">
                  Private storage reference: {viewingDoc.storage_reference}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setViewingDoc(null)}
                  className="text-xs"
                >
                  Close
                </Button>
                <Button
                  onClick={() => handleDownloadDoc(viewingDoc)}
                  className="text-xs bg-indigo-700 hover:bg-indigo-800 text-white gap-1.5 font-bold"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Secure Copy</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
