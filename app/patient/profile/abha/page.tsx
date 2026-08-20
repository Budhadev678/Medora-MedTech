"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  QrCode, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft, 
  RefreshCw, 
  FileText, 
  Smartphone, 
  CreditCard,
  UserCheck,
  ChevronRight,
  Info,
  ExternalLink,
  ShieldAlert,
  Unlink
} from "lucide-react";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth-context";
import { AbhaService, ExternalVerifiedIdentity, IdentityMatchResult } from "@/lib/services/abha-service";
import { findIdentityById } from "@/lib/data/identity-store";

export default function AbhaLinkingPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Active patient data state
  const [patient, setPatient] = useState(() => {
    return user ? findIdentityById(user.identifier) || user : null;
  });

  const isLinked = patient?.patientData?.abhaStatus === "LINKED";

  // Wizard state: 1: Choose -> 2: Input -> 3: OTP -> 4: Match -> 5: Address -> 6: Success
  const [step, setStep] = useState<number>(1);
  const [method, setMethod] = useState<"aadhaar" | "mobile">("aadhaar");
  const [identifierInput, setIdentifierInput] = useState("");
  const [txnId, setTxnId] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifiedIdentity, setVerifiedIdentity] = useState<ExternalVerifiedIdentity | null>(null);
  const [matchResult, setMatchResult] = useState<IdentityMatchResult | null>(null);
  const [abhaAddressInput, setAbhaAddressInput] = useState("");
  const [addressAvailable, setAddressAvailable] = useState<boolean | null>(null);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);

  // Sync current patient on mount
  useEffect(() => {
    if (user) {
      const live = findIdentityById(user.identifier);
      if (live) setPatient(live);
    }
  }, [user]);

  // Timer countdown for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 3 && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Step 2 -> 3: Request OTP
  const handleRequestOtp = () => {
    setErrorMessage(null);
    setLoading(true);

    const res = AbhaService.requestOtp(
      identifierInput, 
      method, 
      patient ? { fullName: patient.fullName, dob: patient.patientData?.dob, gender: patient.patientData?.gender } : undefined
    );
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || "Failed to initiate verification.");
      return;
    }

    setTxnId(res.txnId!);
    setCountdown(60);
    setStep(3);
  };

  // Step 3 -> 4: Verify OTP
  const handleVerifyOtp = () => {
    setErrorMessage(null);
    setLoading(true);

    const res = AbhaService.verifyOtp(txnId, otpInput);
    setLoading(false);

    if (!res.success || !res.identity) {
      setErrorMessage(res.error || "Invalid OTP code.");
      return;
    }

    setVerifiedIdentity(res.identity);
    setAbhaAddressInput(res.identity.suggestedAbhaAddress);

    // Run identity matching
    if (patient) {
      const match = AbhaService.matchIdentity(patient, res.identity);
      setMatchResult(match);
    }

    setStep(4);
  };

  // Check ABHA Address availability
  const handleCheckAddress = (val: string) => {
    setAbhaAddressInput(val);
    if (val.length >= 3) {
      const check = AbhaService.checkAbhaAddressAvailability(val);
      setAddressAvailable(check.available);
    } else {
      setAddressAvailable(null);
    }
  };

  // Step 5: Final Confirmation & Linking
  const handleFinalLink = () => {
    if (!patient || !verifiedIdentity) return;
    setErrorMessage(null);
    setLoading(true);

    const linkRes = AbhaService.linkAbhaToPatient(
      patient.identifier,
      verifiedIdentity.suggestedAbhaNumber,
      abhaAddressInput.includes("@") ? abhaAddressInput : `${abhaAddressInput}@abdm`,
      verifiedIdentity.maskedAadhaar
    );

    setLoading(false);

    if (!linkRes.success) {
      setErrorMessage(linkRes.error || "Unable to link ABHA at this time.");
      return;
    }

    if (linkRes.updated) {
      setPatient(linkRes.updated);
    }

    setStep(6); // Success
  };

  // Unlink ABHA
  const handleUnlink = () => {
    if (!patient) return;
    setLoading(true);
    const res = AbhaService.unlinkAbhaFromPatient(patient.identifier);
    setLoading(false);
    setShowUnlinkDialog(false);

    if (res.success && res.updated) {
      setPatient(res.updated);
      setStep(1);
    }
  };

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="max-w-xl mx-auto space-y-5 animate-in fade-in-50 duration-150 pb-12">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/patient/profile"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Profile
          </Link>
          <Badge variant="outline" className="text-[10px] font-mono text-teal-800 bg-teal-50 border-teal-200">
            {patient?.identifier || "PAT-1001"}
          </Badge>
        </div>

        {/* Sandbox Mode Explanation Banner */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
          <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">ABDM Sandbox / Prototype Verification</span>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              This verification runs in a controlled ABDM sandbox environment. Use standard test OTP <strong>123456</strong> for testing identity linking.
            </p>
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 flex items-start gap-2.5 text-xs text-red-900 animate-in fade-in-50">
            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">Verification Notice</span>
              <p className="text-[11px] text-red-700">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW A: ALREADY LINKED STATE                                 */}
        {/* ============================================================ */}
        {isLinked && step !== 6 ? (
          <div className="space-y-4">
            {/* Digital ABHA Card */}
            <Card className="border-teal-300 bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white shadow-md overflow-hidden relative">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <QrCode className="h-32 w-32" />
              </div>

              <CardHeader className="p-5 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center">
                      <QrCode className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold tracking-wide">Ayushman Bharat Health Account</CardTitle>
                      <span className="text-[10px] text-teal-200">National Health Authority (ABDM)</span>
                    </div>
                  </div>
                  <Badge variant="success" className="text-[10px]">✓ Linked</Badge>
                </div>
              </CardHeader>

              <CardContent className="p-5 pt-2 space-y-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-teal-200 block">ABHA Number</span>
                  <span className="font-mono text-base sm:text-lg font-bold tracking-widest text-white">
                    {patient?.patientData?.abhaNumber || "91-4589-2041-5892"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1 border-t border-white/10">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-teal-200 block">ABHA Address</span>
                    <span className="font-semibold text-xs text-white truncate block">
                      {patient?.patientData?.abhaAddress || "rahulverma@abdm"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-teal-200 block">Aadhaar Linked</span>
                    <span className="font-mono text-xs text-white">
                      {patient?.patientData?.aadhaarMasked || "XXXX XXXX 5892"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-teal-300 pt-2 border-t border-white/10">
                  <span>Linked to MEDORA: {patient?.identifier}</span>
                  <span>Source: ABDM Sandbox</span>
                </div>
              </CardContent>
            </Card>

            {/* Privacy & Interoperability Notes */}
            <Card className="bg-white">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-teal-600" /> Identity & Consent Control
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 text-xs text-slate-600 space-y-2 leading-relaxed">
                <p>
                  • Your ABHA establishes your nationwide healthcare identity.
                </p>
                <p>
                  • <strong>Medical Record Privacy:</strong> Linking your ABHA does <em>not</em> automatically expose your medical records. Doctors and hospitals must request your explicit consent before accessing any consultation or diagnostic report.
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between items-center border-t border-slate-100 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUnlinkDialog(true)}
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Unlink className="h-3.5 w-3.5 mr-1" /> Disconnect ABHA
                </Button>
                <Link href="/patient/profile">
                  <Button size="sm" className="text-xs bg-teal-700 hover:bg-teal-800">
                    Done
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Unlink Confirmation Dialog */}
            {showUnlinkDialog && (
              <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl animate-in zoom-in-95">
                  <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-sm font-bold text-slate-900">Disconnect ABHA from MEDORA?</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      This removes the association with your MEDORA profile ({patient?.identifier}). Your ABHA itself remains active with the National Health Authority.
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUnlinkDialog(false)}
                      className="flex-1 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={loading}
                      onClick={handleUnlink}
                      className="flex-1 text-xs"
                    >
                      {loading ? "Disconnecting..." : "Confirm Disconnect"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ============================================================ */
          /* VIEW B: WIZARD FLOW (UNLINKED / LINKING)                     */
          /* ============================================================ */
          <Card className="bg-white shadow-xs">
            {/* Step Progress Bar */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold text-slate-900">
                {step === 1 && "Step 1 of 5: Choose Method"}
                {step === 2 && "Step 2 of 5: Enter Identity Details"}
                {step === 3 && "Step 3 of 5: Verify OTP"}
                {step === 4 && "Step 4 of 5: Identity Matching"}
                {step === 5 && "Step 5 of 5: Choose ABHA Address"}
                {step === 6 && "ABHA Connected Successfully"}
              </span>
              <span className="font-mono text-[11px] text-teal-700 font-bold">
                {step <= 5 ? `${Math.round((step / 5) * 100)}%` : "100%"}
              </span>
            </div>

            {/* STEP 1: CHOOSE METHOD */}
            {step === 1 && (
              <CardContent className="p-5 space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Connect Your ABHA Health Identity</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Your Ayushman Bharat Health Account connects your health records across hospitals and clinics with your consent.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <div
                    onClick={() => { setMethod("aadhaar"); setStep(2); }}
                    className="p-4 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block group-hover:text-teal-900">
                          Verify via Aadhaar OTP (Recommended)
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Instant verification using your 12-digit Aadhaar number
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600" />
                  </div>

                  <div
                    onClick={() => { setMethod("mobile"); setStep(2); }}
                    className="p-4 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center flex-shrink-0">
                        <Smartphone className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block group-hover:text-blue-900">
                          Verify via Mobile OTP
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Verify using your ABHA-registered mobile number
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
                  </div>
                </div>
              </CardContent>
            )}

            {/* STEP 2: INPUT IDENTITY CREDENTIALS */}
            {step === 2 && (
              <CardContent className="p-5 space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {method === "aadhaar" ? "Enter Aadhaar Number" : "Enter Mobile Number"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {method === "aadhaar"
                      ? "A 6-digit OTP will be sent to the mobile number linked with your Aadhaar."
                      : "A 6-digit OTP will be sent to your mobile phone."}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="id-input" className="text-xs font-semibold">
                    {method === "aadhaar" ? "12-Digit Aadhaar Number" : "10-Digit Mobile Number"}
                  </Label>
                  <Input
                    id="id-input"
                    placeholder={method === "aadhaar" ? "e.g. 5892 4810 5892" : "e.g. 9876543210"}
                    value={identifierInput}
                    onChange={(e) => setIdentifierInput(e.target.value)}
                    maxLength={method === "aadhaar" ? 14 : 10}
                    className="font-mono text-sm tracking-wider"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    {method === "aadhaar" ? "Demo test: Enter any 12 digits (e.g. 123456785892)" : "Enter 10 digit number"}
                  </span>
                </div>

                {/* Consent Disclosure */}
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Lock className="h-3.5 w-3.5 text-teal-600" /> ABDM Consent Declaration
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    I hereby give my voluntary consent to MEDORA for authenticating my identity through the National Health Authority ABDM gateway. Full Aadhaar numbers are never stored in plaintext.
                  </p>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" size="sm" onClick={() => setStep(1)} className="text-xs">
                    Back
                  </Button>
                  <Button
                    size="sm"
                    disabled={!identifierInput || loading}
                    onClick={handleRequestOtp}
                    className="text-xs bg-teal-700 hover:bg-teal-800"
                  >
                    {loading ? "Sending OTP..." : "Get OTP Code"}
                  </Button>
                </div>
              </CardContent>
            )}

            {/* STEP 3: OTP VERIFICATION */}
            {step === 3 && (
              <CardContent className="p-5 space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Enter Verification Code (OTP)</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Sent to registered mobile for transaction <span className="font-mono font-bold text-slate-700">{txnId}</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp-input" className="text-xs font-semibold">
                    6-Digit OTP Code
                  </Label>
                  <Input
                    id="otp-input"
                    placeholder="123456"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.trim())}
                    maxLength={6}
                    className="font-mono text-center text-lg tracking-widest"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Demo OTP: <strong className="text-teal-700 font-mono">123456</strong></span>
                    {countdown > 0 ? (
                      <span className="text-[11px] text-slate-400 font-mono">Resend in 00:{countdown < 10 ? `0${countdown}` : countdown}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRequestOtp}
                        className="text-[11px] text-teal-700 font-bold hover:underline"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" size="sm" onClick={() => setStep(2)} className="text-xs">
                    Back
                  </Button>
                  <Button
                    size="sm"
                    disabled={otpInput.length < 6 || loading}
                    onClick={handleVerifyOtp}
                    className="text-xs bg-teal-700 hover:bg-teal-800"
                  >
                    {loading ? "Verifying..." : "Verify & Continue"}
                  </Button>
                </div>
              </CardContent>
            )}

            {/* STEP 4: IDENTITY MATCHING & REVIEW */}
            {step === 4 && verifiedIdentity && matchResult && (
              <CardContent className="p-5 space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Review Verified Identity</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    External identity returned from the ABDM gateway compared against your MEDORA profile.
                  </p>
                </div>

                {/* Match Result Banner */}
                {matchResult.matchLevel === "EXACT_MATCH" && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 flex items-start gap-2.5 text-xs text-emerald-900">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Exact Identity Match (100%)</span>
                      <p className="text-[11px] text-emerald-700">{matchResult.message}</p>
                    </div>
                  </div>
                )}

                {matchResult.matchLevel === "PARTIAL_MATCH" && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
                    <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Partial Variation Detected ({matchResult.score}%)</span>
                      <p className="text-[11px] text-amber-700">{matchResult.message}</p>
                    </div>
                  </div>
                )}

                {matchResult.matchLevel === "MAJOR_MISMATCH" && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 flex items-start gap-2.5 text-xs text-red-900">
                    <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Identity Mismatch (Rejected)</span>
                      <p className="text-[11px] text-red-700">{matchResult.message}</p>
                    </div>
                  </div>
                )}

                {/* Comparison Details Table */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">MEDORA Patient:</span>
                    <span className="font-bold text-slate-900">{patient?.fullName} ({patient?.identifier})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Verified Legal Name:</span>
                    <span className="font-bold text-teal-800">{verifiedIdentity.verifiedName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Assigned ABHA Number:</span>
                    <span className="font-mono font-bold text-slate-900">{verifiedIdentity.suggestedAbhaNumber}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Aadhaar (Masked):</span>
                    <span className="font-mono text-slate-900">{verifiedIdentity.maskedAadhaar}</span>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" size="sm" onClick={() => setStep(3)} className="text-xs">
                    Back
                  </Button>
                  {matchResult.matchLevel !== "MAJOR_MISMATCH" ? (
                    <Button
                      size="sm"
                      onClick={() => setStep(5)}
                      className="text-xs bg-teal-700 hover:bg-teal-800"
                    >
                      Continue to ABHA Address
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/patient/profile")}
                      className="text-xs text-red-600"
                    >
                      Return to Profile
                    </Button>
                  )}
                </div>
              </CardContent>
            )}

            {/* STEP 5: CHOOSE / CONFIRM ABHA ADDRESS */}
            {step === 5 && verifiedIdentity && (
              <CardContent className="p-5 space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Choose Your ABHA Address</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Your unique username for health record access (similar to a UPI ID).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="abha-address" className="text-xs font-semibold">
                    ABHA Handle (@abdm)
                  </Label>
                  <Input
                    id="abha-address"
                    value={abhaAddressInput}
                    onChange={(e) => handleCheckAddress(e.target.value)}
                    placeholder="e.g. rahulverma@abdm"
                    className="font-mono text-sm"
                  />
                  {addressAvailable === true && (
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Address is available
                    </span>
                  )}
                  {addressAvailable === false && (
                    <span className="text-[11px] font-semibold text-red-600 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Invalid or reserved handle
                    </span>
                  )}
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" size="sm" onClick={() => setStep(4)} className="text-xs">
                    Back
                  </Button>
                  <Button
                    size="sm"
                    disabled={addressAvailable === false || loading}
                    onClick={handleFinalLink}
                    className="text-xs bg-teal-700 hover:bg-teal-800"
                  >
                    {loading ? "Linking..." : "Confirm & Link ABHA"}
                  </Button>
                </div>
              </CardContent>
            )}

            {/* STEP 6: SUCCESS CARD */}
            {step === 6 && (
              <CardContent className="p-6 text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-in zoom-in-75">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">ABHA Linked Successfully!</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Your MEDORA identity <strong className="text-teal-700">{patient?.identifier}</strong> is now securely associated with your national health identity.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-left space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">ABHA Number:</span>
                    <span className="font-bold text-slate-900">{patient?.patientData?.abhaNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ABHA Address:</span>
                    <span className="font-bold text-teal-800">{patient?.patientData?.abhaAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <Badge variant="success" className="text-[10px]">● Connected</Badge>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href="/patient/profile">
                    <Button className="w-full text-xs font-semibold bg-teal-700 hover:bg-teal-800">
                      Return to Patient Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </RoleGuard>
  );
}
