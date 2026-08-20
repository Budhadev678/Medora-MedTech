"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  User, 
  ShieldCheck, 
  Mail, 
  Phone, 
  QrCode, 
  Lock, 
  Globe, 
  LogOut,
  ChevronRight,
  Info,
  Heart,
  FileCheck,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Save,
  X,
  Smartphone,
  PhoneCall,
  Activity,
  Droplet,
  Shield,
  HelpCircle,
  Share2,
  FileText,
  Building2,
  Clock
} from "lucide-react";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth-context";
import { 
  findIdentityById, 
  updatePatientProfile, 
  updatePatientAddress, 
  updatePatientEmergencyContact, 
  updatePatientBloodGroup,
  calculateProfileCompleteness,
  StoredIdentity 
} from "@/lib/data/identity-store";
import { getPatientConsentRequests, getPatientConsents } from "@/lib/data/consent-store";
import { getPatientOrganizationRelationships } from "@/lib/data/relationship-store";
import { getPatientCorrectionRequests, submitCorrectionRequest } from "@/lib/data/correction-store";

export default function PatientProfilePage() {
  const { user, logout } = useAuth();

  // Local reactive state for the currently authenticated patient
  const [patient, setPatient] = useState<StoredIdentity | null>(() => {
    return user ? findIdentityById(user.identifier) || user : null;
  });

  const [completeness, setCompleteness] = useState(() => calculateProfileCompleteness(patient));

  // Edit Modals State
  const [activeModal, setActiveModal] = useState<"personal" | "address" | "emergency" | "health" | "correction" | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Privacy & Relationship metrics
  const [pendingConsentCount, setPendingConsentCount] = useState(0);
  const [activeConsentCount, setActiveConsentCount] = useState(0);
  const [activeOrgCount, setActiveOrgCount] = useState(0);
  const [activeCorrectionsCount, setActiveCorrectionsCount] = useState(0);

  // Form states
  const [personalForm, setPersonalForm] = useState({
    fullName: "",
    dob: "",
    gender: "male" as "male" | "female" | "other",
    email: "",
    preferredLanguage: "en" as "en" | "hi" | "or",
  });

  const [addressForm, setAddressForm] = useState({
    line1: "",
    line2: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
    country: "India",
  });

  const [emergencyForm, setEmergencyForm] = useState({
    name: "",
    relation: "",
    phone: "",
    altPhone: "",
  });

  const [healthForm, setHealthForm] = useState({
    bloodGroup: "O+",
    allergies: "",
    chronicConditions: "",
  });

  // Correction Request state
  const [correctionField, setCorrectionField] = useState<"fullName" | "dob" | "gender" | "bloodGroup">("fullName");
  const [correctionFieldLabel, setCorrectionFieldLabel] = useState("Full Legal Name");
  const [correctionCurrentValue, setCorrectionCurrentValue] = useState("");
  const [correctionRequestedValue, setCorrectionRequestedValue] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");

  // Sync state whenever authenticated user changes or updates
  const refreshData = () => {
    if (user) {
      const pid = user.identifier || "PAT-1001";
      const liveData = findIdentityById(pid) || user;
      setPatient(liveData);
      setCompleteness(calculateProfileCompleteness(liveData));

      // Privacy metrics
      const requests = getPatientConsentRequests(pid);
      const consents = getPatientConsents(pid);
      const orgs = getPatientOrganizationRelationships(pid);
      const corrs = getPatientCorrectionRequests(pid);

      setPendingConsentCount(requests.filter((r) => r.status === "PENDING").length);
      setActiveConsentCount(consents.filter((c) => c.status === "GRANTED").length);
      setActiveOrgCount(orgs.filter((o) => o.status === "ACTIVE").length);
      setActiveCorrectionsCount(corrs.filter((c) => c.status === "PENDING" || c.status === "UNDER_REVIEW").length);

      if (liveData.patientData) {
        setPersonalForm({
          fullName: liveData.fullName || "",
          dob: liveData.patientData.dob || "",
          gender: liveData.patientData.gender || "male",
          email: liveData.email || "",
          preferredLanguage: liveData.patientData.preferredLanguage || "en",
        });

        if (liveData.patientData.address) {
          setAddressForm({
            line1: liveData.patientData.address.line1 || "",
            line2: liveData.patientData.address.line2 || "",
            city: liveData.patientData.address.city || "",
            district: liveData.patientData.address.district || "",
            state: liveData.patientData.address.state || "",
            pincode: liveData.patientData.address.pincode || "",
            country: liveData.patientData.address.country || "India",
          });
        }

        if (liveData.patientData.emergencyContact) {
          setEmergencyForm({
            name: liveData.patientData.emergencyContact.name || "",
            relation: liveData.patientData.emergencyContact.relation || "",
            phone: liveData.patientData.emergencyContact.phone || "",
            altPhone: liveData.patientData.emergencyContact.altPhone || "",
          });
        }

        setHealthForm({
          bloodGroup: liveData.patientData.bloodGroup || "O+",
          allergies: (liveData.patientData.allergies || []).join(", "),
          chronicConditions: (liveData.patientData.chronicConditions || []).join(", "),
        });
      }
    }
  };

  useEffect(() => {
    refreshData();
    window.addEventListener("medora-identity-updated", refreshData);
    window.addEventListener("medora-consent-updated", refreshData);
    window.addEventListener("medora-corrections-updated", refreshData);
    window.addEventListener("medora-relationships-updated", refreshData);
    window.addEventListener("medora-audit-updated", refreshData);

    return () => {
      window.removeEventListener("medora-identity-updated", refreshData);
      window.removeEventListener("medora-consent-updated", refreshData);
      window.removeEventListener("medora-corrections-updated", refreshData);
      window.removeEventListener("medora-relationships-updated", refreshData);
      window.removeEventListener("medora-audit-updated", refreshData);
    };
  }, [user]);

  // Open Identity Correction Sheet
  const handleOpenCorrection = (
    field: "fullName" | "dob" | "gender" | "bloodGroup",
    label: string,
    currentVal: string
  ) => {
    setCorrectionField(field);
    setCorrectionFieldLabel(label);
    setCorrectionCurrentValue(currentVal);
    setCorrectionRequestedValue("");
    setCorrectionReason("");
    setActiveModal("correction");
  };

  // Submit Identity Correction Request
  const handleSubmitCorrection = () => {
    if (!patient) return;
    setLoading(true);
    setFeedbackMessage(null);

    const res = submitCorrectionRequest(
      patient.identifier,
      correctionField,
      correctionFieldLabel,
      correctionCurrentValue,
      correctionRequestedValue,
      correctionReason,
      patient.fullName
    );

    setLoading(false);

    if (res.success) {
      setActiveModal(null);
      refreshData();
      setFeedbackMessage({
        type: "success",
        text: `Correction request submitted for ${correctionFieldLabel}. It will be reviewed by the verification authority.`,
      });
    } else {
      setFeedbackMessage({ type: "error", text: res.error || "Failed to submit correction request." });
    }
  };

  // Handle Personal Info Save (for unverified fields)
  const handleSavePersonal = () => {
    if (!patient) return;
    setLoading(true);
    setFeedbackMessage(null);

    const res = updatePatientProfile(patient.identifier, {
      fullName: personalForm.fullName,
      dob: personalForm.dob,
      gender: personalForm.gender,
      email: personalForm.email,
      preferredLanguage: personalForm.preferredLanguage,
    });

    setLoading(false);
    if (res.success && res.updated) {
      setPatient(res.updated);
      setCompleteness(calculateProfileCompleteness(res.updated));
      setActiveModal(null);
      setFeedbackMessage({ type: "success", text: "Personal information saved successfully." });
    } else {
      setFeedbackMessage({ type: "error", text: res.error || "Failed to update profile." });
    }
  };

  // Handle Address Save
  const handleSaveAddress = () => {
    if (!patient) return;
    setLoading(true);
    setFeedbackMessage(null);

    const res = updatePatientAddress(patient.identifier, addressForm);
    setLoading(false);

    if (res.success && res.updated) {
      setPatient(res.updated);
      setCompleteness(calculateProfileCompleteness(res.updated));
      setActiveModal(null);
      setFeedbackMessage({ type: "success", text: "Address updated successfully." });
    } else {
      setFeedbackMessage({ type: "error", text: res.error || "Failed to update address." });
    }
  };

  // Handle Emergency Contact Save
  const handleSaveEmergency = () => {
    if (!patient) return;
    setLoading(true);
    setFeedbackMessage(null);

    const res = updatePatientEmergencyContact(patient.identifier, emergencyForm);
    setLoading(false);

    if (res.success && res.updated) {
      setPatient(res.updated);
      setCompleteness(calculateProfileCompleteness(res.updated));
      setActiveModal(null);
      setFeedbackMessage({ type: "success", text: "Emergency contact updated successfully." });
    } else {
      setFeedbackMessage({ type: "error", text: res.error || "Failed to update emergency contact." });
    }
  };

  // Handle Basic Health Save
  const handleSaveHealth = () => {
    if (!patient) return;
    setLoading(true);
    setFeedbackMessage(null);

    const bgRes = updatePatientBloodGroup(patient.identifier, healthForm.bloodGroup, "patient_reported");
    const allergiesArr = healthForm.allergies.split(",").map((s) => s.trim()).filter(Boolean);
    const conditionsArr = healthForm.chronicConditions.split(",").map((s) => s.trim()).filter(Boolean);
    const pRes = updatePatientProfile(patient.identifier, {
      allergies: allergiesArr,
      chronicConditions: conditionsArr,
    });

    setLoading(false);

    if (bgRes.success && pRes.success && pRes.updated) {
      setPatient(pRes.updated);
      setCompleteness(calculateProfileCompleteness(pRes.updated));
      setActiveModal(null);
      setFeedbackMessage({ type: "success", text: "Basic health information updated." });
    } else {
      setFeedbackMessage({ type: "error", text: bgRes.error || pRes.error || "Could not update health info." });
    }
  };

  const isAbhaLinked = patient?.patientData?.abhaStatus === "LINKED";

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in-50 duration-150 pb-16 font-sans">
        
        {/* Feedback Alert Toast */}
        {feedbackMessage && (
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-in slide-in-from-top duration-200 ${
              feedbackMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-red-50 border-red-200 text-red-900"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
            <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-slate-700">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* 1. Profile Header & Passport Identity Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-teal-100 border-2 border-teal-500 flex items-center justify-center text-teal-900 font-extrabold text-xl flex-shrink-0 shadow-2xs">
              {(patient?.fullName || "Patient").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 truncate">
                  {patient?.fullName || "Patient Name"}
                </h1>
                <Badge variant="teal" className="text-[10px] font-mono py-0">
                  {patient?.identifier || "PAT-1001"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {patient?.phone || "+91 98765 43210"} • {patient?.email || "patient@medora.health"}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="success" className="text-[10px] py-0">
                  ● Verified Identity
                </Badge>
                {isAbhaLinked ? (
                  <Badge variant="outline" className="text-[10px] text-teal-800 bg-teal-50 border-teal-200 py-0">
                    ABHA: {patient?.patientData?.abhaAddress}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-amber-700 bg-amber-50 border-amber-200 py-0">
                    ABHA: Not Linked
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Profile Completeness Progress Meter */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Profile Completeness</span>
              <span className="font-mono font-bold text-teal-700">{completeness.percentage}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completeness.percentage}%` }}
              />
            </div>
            {completeness.missingRecommended.length > 0 && (
              <p className="text-[11px] text-amber-700 flex items-center gap-1 pt-0.5">
                <Info className="h-3 w-3 flex-shrink-0" />
                Missing recommended: {completeness.missingRecommended.join(", ")}
              </p>
            )}
          </div>
        </div>

        {/* 2. Privacy & Consent Control Center Link Banner */}
        <Link href="/patient/privacy">
          <div className="p-4 rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 via-teal-50/50 to-white hover:border-teal-400 transition-all shadow-xs flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                    Privacy, Consent & Permissions
                  </span>
                  {pendingConsentCount > 0 && (
                    <Badge variant="destructive" className="text-[9px] py-0 px-1.5 font-mono">
                      {pendingConsentCount} Pending
                    </Badge>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 block">
                  {activeConsentCount} active permissions • {activeOrgCount} connected facilities
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700">
              <span>Control</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </Link>

        {/* 3. National Health IDs & Verification Card */}
        <Card className="bg-white">
          <CardHeader className="p-4 pb-2 border-b border-slate-100">
            <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-teal-600" /> Identity & National Health IDs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-3 space-y-3 text-xs">
            {/* Mobile Status */}
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600 flex items-center gap-2">
                <Smartphone className="h-3.5 w-3.5 text-slate-400" /> Mobile Identity
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-900">{patient?.phone}</span>
                <Badge variant="success" className="text-[9px] py-0">✓ Verified</Badge>
              </div>
            </div>

            {/* Email Status */}
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-400" /> Email Address
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-900">{patient?.email || "Not provided"}</span>
                {patient?.email ? (
                  <Badge variant="success" className="text-[9px] py-0">✓ Verified</Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px] py-0 text-slate-400">Optional</Badge>
                )}
              </div>
            </div>

            {/* Aadhaar Verification Status */}
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600 flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-slate-400" /> Aadhaar Verification
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-900">{patient?.patientData?.aadhaarMasked || "Not linked"}</span>
                {patient?.patientData?.aadhaarMasked ? (
                  <Badge variant="success" className="text-[9px] py-0">✓ Verified</Badge>
                ) : (
                  <Link href="/patient/profile/abha">
                    <Button variant="outline" size="sm" className="text-[10px] h-6 py-0 px-2">Verify</Button>
                  </Link>
                )}
              </div>
            </div>

            {/* ABHA Link Card */}
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-600 flex items-center gap-2">
                <QrCode className="h-3.5 w-3.5 text-teal-600" /> Ayushman Bharat (ABHA)
              </span>
              <div className="flex items-center gap-2">
                {isAbhaLinked ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-teal-800 font-bold">{patient?.patientData?.abhaAddress}</span>
                    <Link href="/patient/profile/abha">
                      <Button variant="outline" size="sm" className="text-[10px] h-6 py-0 px-2">Manage</Button>
                    </Link>
                  </div>
                ) : (
                  <Link href="/patient/profile/abha">
                    <Button size="sm" className="text-[10px] h-6 py-0 px-2.5 bg-teal-700 hover:bg-teal-800">
                      Link ABHA
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Personal Information Card */}
        <Card className="bg-white">
          <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-4 w-4 text-teal-600" /> Personal Information
              </CardTitle>
              {activeCorrectionsCount > 0 && (
                <span className="text-[10px] text-amber-700 font-semibold block">
                  ● {activeCorrectionsCount} correction request under review
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenCorrection("fullName", "Full Legal Name", patient?.fullName || "")}
                className="text-[10px] h-6 text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100"
              >
                Request Correction
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveModal("personal")}
                className="text-xs h-7 gap-1 text-slate-700"
              >
                <Edit2 className="h-3 w-3" /> Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-3 space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Full Legal Name</span>
              <div className="text-right">
                <span className="font-semibold text-slate-900">{patient?.fullName}</span>
                <span className="text-[9px] text-emerald-700 block">● Verified Field</span>
              </div>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Date of Birth</span>
              <span className="font-medium text-slate-900">{patient?.patientData?.dob || "Not provided"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Gender</span>
              <span className="font-medium text-slate-900 capitalize">{patient?.patientData?.gender || "Not provided"}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Preferred Language</span>
              <span className="font-medium text-slate-900 capitalize">
                {patient?.patientData?.preferredLanguage === "hi" ? "Hindi (हिंदी)" : patient?.patientData?.preferredLanguage === "or" ? "Odia (ଓଡ଼ିଆ)" : "English"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 5. Structured Address Card */}
        <Card className="bg-white">
          <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-teal-600" /> Residential Address
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveModal("address")}
              className="text-xs h-7 gap-1 text-slate-700"
            >
              <Edit2 className="h-3 w-3" /> Edit
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-3 text-xs text-slate-700 space-y-1 leading-relaxed">
            {patient?.patientData?.address?.line1 ? (
              <>
                <p className="font-semibold text-slate-900">{patient.patientData.address.line1}</p>
                {patient.patientData.address.line2 && <p className="text-slate-500">{patient.patientData.address.line2}</p>}
                <p>
                  {patient.patientData.address.city}, {patient.patientData.address.district}, {patient.patientData.address.state} —{" "}
                  <span className="font-mono font-bold text-slate-900">{patient.patientData.address.pincode}</span>
                </p>
                <p className="text-slate-400">{patient.patientData.address.country}</p>
              </>
            ) : (
              <p className="text-slate-400 italic">No residential address provided yet.</p>
            )}
          </CardContent>
        </Card>

        {/* 6. Basic Health Information Card */}
        <Card className="bg-white">
          <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-rose-600" /> Basic Health Information
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveModal("health")}
              className="text-xs h-7 gap-1 text-slate-700"
            >
              <Edit2 className="h-3 w-3" /> Edit
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-3 space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Blood Group</span>
              <div className="text-right">
                <span className="font-bold text-rose-700">{patient?.patientData?.bloodGroup || "Unknown"}</span>
                <span className="text-[10px] text-slate-400 block">
                  {patient?.patientData?.bloodGroupSource === "clinical_verified"
                    ? `● Clinically Certified (${patient.patientData.bloodGroupVerifiedBy || "Hospital Lab"})`
                    : "● Patient reported"}
                </span>
              </div>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Known Allergies</span>
              <span className="font-medium text-slate-900 text-right">
                {patient?.patientData?.allergies?.length ? patient.patientData.allergies.join(", ") : "None reported"}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-500">Existing Conditions</span>
              <span className="font-medium text-slate-900 text-right">
                {patient?.patientData?.chronicConditions?.length ? patient.patientData.chronicConditions.join(", ") : "None reported"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 7. Emergency Contact Card */}
        <Card className="bg-white">
          <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <PhoneCall className="h-4 w-4 text-red-600" /> Primary Emergency Contact
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveModal("emergency")}
              className="text-xs h-7 gap-1 text-slate-700"
            >
              <Edit2 className="h-3 w-3" /> Edit
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-3 text-xs space-y-1.5">
            {patient?.patientData?.emergencyContact?.name ? (
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">{patient.patientData.emergencyContact.name}</span>
                  <span className="text-[11px] text-slate-500">Relationship: {patient.patientData.emergencyContact.relation}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-teal-800 block">{patient.patientData.emergencyContact.phone}</span>
                  {patient.patientData.emergencyContact.altPhone && (
                    <span className="font-mono text-[10px] text-slate-400 block">{patient.patientData.emergencyContact.altPhone}</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-amber-700 italic">No emergency contact configured. Click Edit to add one.</p>
            )}
          </CardContent>
        </Card>

        {/* Sign Out Button */}
        <div className="pt-2">
          <Button
            variant="outline"
            onClick={() => logout()}
            className="w-full text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-10"
          >
            <LogOut className="h-4 w-4 mr-2" /> Sign Out of MEDORA
          </Button>
        </div>

        {/* ============================================================ */}
        {/* MODAL: IDENTITY CORRECTION REQUEST                           */}
        {/* ============================================================ */}
        {activeModal === "correction" && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 max-w-md w-full space-y-4 shadow-xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Request Identity Correction</h3>
                    <span className="text-[11px] text-slate-500">Legal rectification for verified fields</span>
                  </div>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Current Verified Value ({correctionFieldLabel})
                  </span>
                  <span className="font-bold text-slate-800 font-mono text-sm block mt-0.5">
                    {correctionCurrentValue}
                  </span>
                </div>

                <div>
                  <Label htmlFor="req-val" className="text-xs font-semibold">
                    Requested Corrected Value
                  </Label>
                  <Input
                    id="req-val"
                    placeholder="Enter the legally corrected name or value"
                    value={correctionRequestedValue}
                    onChange={(e) => setCorrectionRequestedValue(e.target.value)}
                    className="text-xs mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="req-reason" className="text-xs font-semibold">
                    Reason for Correction
                  </Label>
                  <Input
                    id="req-reason"
                    placeholder="e.g. Updated Aadhaar card / Gazette notification"
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    className="text-xs mt-1"
                  />
                </div>

                <div className="rounded-lg bg-amber-50 p-3 border border-amber-200 text-[11px] text-amber-900 space-y-1">
                  <span className="font-bold block">Verification Notice</span>
                  <p className="text-[10px] text-amber-800 leading-normal">
                    Verified legal identity fields cannot be overwritten immediately. Your request will be queued for administrative review.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => setActiveModal(null)} className="text-xs">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={loading || !correctionRequestedValue.trim() || !correctionReason.trim()}
                  onClick={handleSubmitCorrection}
                  className="text-xs bg-amber-700 hover:bg-amber-800 text-white"
                >
                  {loading ? "Submitting..." : "Submit Correction Request"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 1. Personal Information Modal (for general updates) */}
        {activeModal === "personal" && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 max-w-md w-full space-y-4 shadow-xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Edit Personal Information</h3>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <Label htmlFor="full-name" className="text-xs font-semibold">Full Legal Name</Label>
                  <Input
                    id="full-name"
                    value={personalForm.fullName}
                    onChange={(e) => setPersonalForm({ ...personalForm, fullName: e.target.value })}
                    className="text-xs mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="dob" className="text-xs font-semibold">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={personalForm.dob}
                      onChange={(e) => setPersonalForm({ ...personalForm, dob: e.target.value })}
                      className="text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender" className="text-xs font-semibold">Gender</Label>
                    <select
                      id="gender"
                      value={personalForm.gender}
                      onChange={(e) => setPersonalForm({ ...personalForm, gender: e.target.value as any })}
                      className="w-full text-xs mt-1 border border-slate-200 rounded-lg p-2 bg-white"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-xs font-semibold">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={personalForm.email}
                    onChange={(e) => setPersonalForm({ ...personalForm, email: e.target.value })}
                    className="text-xs mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="language" className="text-xs font-semibold">Preferred Language</Label>
                  <select
                    id="language"
                    value={personalForm.preferredLanguage}
                    onChange={(e) => setPersonalForm({ ...personalForm, preferredLanguage: e.target.value as any })}
                    className="w-full text-xs mt-1 border border-slate-200 rounded-lg p-2 bg-white"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi (हिंदी)</option>
                    <option value="or">Odia (ଓଡ଼ିଆ)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => setActiveModal(null)} className="text-xs">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={loading || !personalForm.fullName.trim()}
                  onClick={handleSavePersonal}
                  className="text-xs bg-teal-700 hover:bg-teal-800"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 2. Address Modal */}
        {activeModal === "address" && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 max-w-md w-full space-y-4 shadow-xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Edit Residential Address</h3>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <Label htmlFor="line1" className="text-xs font-semibold">House / Flat / Street (Line 1)</Label>
                  <Input
                    id="line1"
                    placeholder="e.g. Plot 42, Saheed Nagar"
                    value={addressForm.line1}
                    onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                    className="text-xs mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="line2" className="text-xs font-semibold">Locality / Landmark (Line 2)</Label>
                  <Input
                    id="line2"
                    placeholder="e.g. Near High School"
                    value={addressForm.line2}
                    onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                    className="text-xs mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="city" className="text-xs font-semibold">City</Label>
                    <Input
                      id="city"
                      placeholder="e.g. Bhubaneswar"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className="text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="district" className="text-xs font-semibold">District</Label>
                    <Input
                      id="district"
                      placeholder="e.g. Khordha"
                      value={addressForm.district}
                      onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                      className="text-xs mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="state" className="text-xs font-semibold">State</Label>
                    <Input
                      id="state"
                      placeholder="e.g. Odisha"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      className="text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode" className="text-xs font-semibold">PIN Code (6 digits)</Label>
                    <Input
                      id="pincode"
                      placeholder="e.g. 751007"
                      maxLength={6}
                      value={addressForm.pincode}
                      onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                      className="text-xs font-mono mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => setActiveModal(null)} className="text-xs">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={loading || !addressForm.line1.trim() || !addressForm.city.trim() || !addressForm.pincode.trim()}
                  onClick={handleSaveAddress}
                  className="text-xs bg-teal-700 hover:bg-teal-800"
                >
                  {loading ? "Saving..." : "Save Address"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 3. Emergency Contact Modal */}
        {activeModal === "emergency" && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 max-w-md w-full space-y-4 shadow-xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Edit Emergency Contact</h3>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <Label htmlFor="em-name" className="text-xs font-semibold">Contact Full Name</Label>
                  <Input
                    id="em-name"
                    placeholder="e.g. Anita Verma"
                    value={emergencyForm.name}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, name: e.target.value })}
                    className="text-xs mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="em-relation" className="text-xs font-semibold">Relationship</Label>
                  <select
                    id="em-relation"
                    value={emergencyForm.relation}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, relation: e.target.value })}
                    className="w-full text-xs mt-1 border border-slate-200 rounded-lg p-2 bg-white"
                  >
                    <option value="">Select Relationship</option>
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Child">Child</option>
                    <option value="Friend">Friend</option>
                    <option value="Guardian">Guardian</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="em-phone" className="text-xs font-semibold">Primary Phone</Label>
                    <Input
                      id="em-phone"
                      placeholder="e.g. +91 98765 43210"
                      value={emergencyForm.phone}
                      onChange={(e) => setEmergencyForm({ ...emergencyForm, phone: e.target.value })}
                      className="text-xs font-mono mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="em-alt" className="text-xs font-semibold">Alternate Phone (Optional)</Label>
                    <Input
                      id="em-alt"
                      placeholder="e.g. +91 98765 43211"
                      value={emergencyForm.altPhone}
                      onChange={(e) => setEmergencyForm({ ...emergencyForm, altPhone: e.target.value })}
                      className="text-xs font-mono mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => setActiveModal(null)} className="text-xs">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={loading || !emergencyForm.name.trim() || !emergencyForm.phone.trim()}
                  onClick={handleSaveEmergency}
                  className="text-xs bg-teal-700 hover:bg-teal-800"
                >
                  {loading ? "Saving..." : "Save Emergency Contact"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 4. Basic Health Information Modal */}
        {activeModal === "health" && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 max-w-md w-full space-y-4 shadow-xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Edit Basic Health Information</h3>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <Label htmlFor="blood-group" className="text-xs font-semibold">Blood Group</Label>
                  <select
                    id="blood-group"
                    value={healthForm.bloodGroup}
                    onChange={(e) => setHealthForm({ ...healthForm, bloodGroup: e.target.value })}
                    className="w-full text-xs mt-1 border border-slate-200 rounded-lg p-2 bg-white"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="allergies" className="text-xs font-semibold">Allergies (comma-separated)</Label>
                  <Input
                    id="allergies"
                    placeholder="e.g. Penicillin, Peanuts"
                    value={healthForm.allergies}
                    onChange={(e) => setHealthForm({ ...healthForm, allergies: e.target.value })}
                    className="text-xs mt-1"
                  />
                  <span className="text-[10px] text-slate-400">Self-reported by patient</span>
                </div>

                <div>
                  <Label htmlFor="conditions" className="text-xs font-semibold">Existing Conditions (comma-separated)</Label>
                  <Input
                    id="conditions"
                    placeholder="e.g. Mild Hypertension, Asthma"
                    value={healthForm.chronicConditions}
                    onChange={(e) => setHealthForm({ ...healthForm, chronicConditions: e.target.value })}
                    className="text-xs mt-1"
                  />
                  <span className="text-[10px] text-slate-400">Self-reported by patient</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => setActiveModal(null)} className="text-xs">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={loading}
                  onClick={handleSaveHealth}
                  className="text-xs bg-teal-700 hover:bg-teal-800"
                >
                  {loading ? "Saving..." : "Save Health Information"}
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </RoleGuard>
  );
}
