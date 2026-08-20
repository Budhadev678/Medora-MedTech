"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Activity, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  QrCode,
  AlertCircle,
  Stethoscope,
  Building2,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type AccountType = "patient" | "doctor" | "staff";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, signUpDoctor, signUpStaff, isLoading } = useAuth();

  const [accountType, setAccountType] = useState<AccountType>("patient");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Patient Registration State
  const [patientStep, setPatientStep] = useState<1 | 2 | 3>(1);
  const [patientForm, setPatientForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    dob: "",
    gender: "male" as "male" | "female" | "other",
    bloodGroup: "O+",
    aadhaarLast4: "",
    abhaOption: "create_new" as "create_new" | "skip",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  // Doctor Registration State (Multi-Hospital Affiliation)
  const [doctorForm, setDoctorForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    medicalRegNo: "",
    medicalCouncil: "Medical Council of India / State Medical Council",
    specialization: "Cardiology",
    degree: "MBBS, MD",
    experienceYears: 5,
    primaryHospitalName: "City Hospital",
    primaryHospitalId: "HSP-1001",
    primaryDepartmentName: "Department of Cardiology",
    primaryConsultationFee: 500,
    hasSecondaryHospital: true,
    secondaryHospitalName: "Green Care Hospital",
    secondaryHospitalId: "HSP-1002",
    secondaryDepartmentName: "Cardiovascular Outpatient Suite",
    secondaryConsultationFee: 600,
  });

  // Patient Registration Steps
  const handlePatientStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientForm.fullName || !patientForm.email || !patientForm.phone || !patientForm.dob) {
      setError("Please fill in all required demographic fields.");
      return;
    }
    setError(null);
    setPatientStep(2);
  };

  const handlePatientStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPatientStep(3);
  };

  const handlePatientFinalSubmit = async () => {
    setError(null);
    const result = await signUp({
      fullName: patientForm.fullName,
      email: patientForm.email,
      phone: patientForm.phone,
      password: patientForm.password || "Password@123",
      dob: patientForm.dob,
      gender: patientForm.gender,
      bloodGroup: patientForm.bloodGroup,
      aadhaarLast4: patientForm.aadhaarLast4 || undefined,
      abhaId: patientForm.abhaOption === "create_new" 
        ? `${patientForm.fullName.toLowerCase().replace(/\s+/g, "")}@abdm` 
        : undefined,
      emergencyContactName: patientForm.emergencyContactName,
      emergencyContactPhone: patientForm.emergencyContactPhone,
    });

    if (!result.success) {
      setError(result.error || "Patient registration failed.");
    }
  };

  // Doctor Registration Submit
  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorForm.fullName || !doctorForm.email || !doctorForm.medicalRegNo) {
      setError("Please enter full doctor name, email, and Medical Council Registration Number.");
      return;
    }
    setError(null);

    const result = await signUpDoctor({
      fullName: doctorForm.fullName,
      email: doctorForm.email,
      phone: doctorForm.phone,
      password: doctorForm.password || "Password@123",
      medicalRegNo: doctorForm.medicalRegNo,
      medicalCouncil: doctorForm.medicalCouncil,
      specialization: doctorForm.specialization,
      degree: doctorForm.degree,
      experienceYears: doctorForm.experienceYears,
      primaryHospitalId: doctorForm.primaryHospitalId,
      primaryHospitalName: doctorForm.primaryHospitalName,
      primaryDepartmentName: doctorForm.primaryDepartmentName,
      primaryConsultationFee: doctorForm.primaryConsultationFee,
      secondaryHospitalId: doctorForm.hasSecondaryHospital ? doctorForm.secondaryHospitalId : undefined,
      secondaryHospitalName: doctorForm.hasSecondaryHospital ? doctorForm.secondaryHospitalName : undefined,
      secondaryDepartmentName: doctorForm.hasSecondaryHospital ? doctorForm.secondaryDepartmentName : undefined,
      secondaryConsultationFee: doctorForm.hasSecondaryHospital ? doctorForm.secondaryConsultationFee : undefined,
    });

    if (!result.success) {
      setError(result.error || "Doctor registration failed.");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-xl space-y-6 animate-in fade-in-50 duration-200">
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs">
            <Activity className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Register on MEDORA
          </h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Choose your account role below to establish a verified healthcare identity.
          </p>
        </div>

        {/* Account Type Selector Strip */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => { setAccountType("patient"); setError(null); }}
            className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
              accountType === "patient"
                ? "bg-teal-50 border-teal-500 text-teal-900 font-bold shadow-xs"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            <User className="h-4 w-4 text-teal-600" />
            <span className="text-xs">Patient Account</span>
          </button>

          <button
            type="button"
            onClick={() => { setAccountType("doctor"); setError(null); }}
            className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
              accountType === "doctor"
                ? "bg-blue-50 border-blue-500 text-blue-900 font-bold shadow-xs"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            <Stethoscope className="h-4 w-4 text-blue-600" />
            <span className="text-xs">Doctor / Specialist</span>
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. PATIENT REGISTRATION FORM */}
        {accountType === "patient" && (
          <Card className="bg-white shadow-xs">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Patient Onboarding & Identity Foundation
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Step {patientStep} of 3 • {patientStep === 1 ? "Demographics" : patientStep === 2 ? "Identity & Contacts" : "ABHA Preview"}
                  </CardDescription>
                </div>
                <Badge variant="teal" className="text-xs">
                  Zero Data Selling
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="grid grid-cols-3 gap-1.5 pt-3">
                <div className={`h-1.5 rounded-full ${patientStep >= 1 ? "bg-teal-600" : "bg-slate-200"}`} />
                <div className={`h-1.5 rounded-full ${patientStep >= 2 ? "bg-teal-600" : "bg-slate-200"}`} />
                <div className={`h-1.5 rounded-full ${patientStep === 3 ? "bg-teal-600" : "bg-slate-200"}`} />
              </div>
            </CardHeader>

            {/* Step 1 */}
            {patientStep === 1 && (
              <form onSubmit={handlePatientStep1Submit}>
                <CardContent className="p-5 pt-0 space-y-3.5 text-xs">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-xs">Full Name</Label>
                    <Input
                      id="fullName"
                      placeholder="e.g. Rahul Verma"
                      value={patientForm.fullName}
                      onChange={(e) => setPatientForm({ ...patientForm, fullName: e.target.value })}
                      className="text-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="e.g. rahul@example.com"
                        value={patientForm.email}
                        onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                        className="text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs">Mobile Number</Label>
                      <Input
                        id="phone"
                        placeholder="e.g. +91 98765 43210"
                        value={patientForm.phone}
                        onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                        className="text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="dob" className="text-xs">DOB</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={patientForm.dob}
                        onChange={(e) => setPatientForm({ ...patientForm, dob: e.target.value })}
                        className="text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="gender" className="text-xs">Gender</Label>
                      <select
                        id="gender"
                        value={patientForm.gender}
                        onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value as any })}
                        className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="blood" className="text-xs">Blood Group</Label>
                      <select
                        id="blood"
                        value={patientForm.bloodGroup}
                        onChange={(e) => setPatientForm({ ...patientForm, bloodGroup: e.target.value })}
                        className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-rose-700"
                      >
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                  </div>

                  <Button type="submit" className="w-full text-xs font-semibold h-9 mt-2">
                    Continue to Step 2 <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </form>
            )}

            {/* Step 2 */}
            {patientStep === 2 && (
              <form onSubmit={handlePatientStep2Submit}>
                <CardContent className="p-5 pt-0 space-y-3.5 text-xs">
                  <div className="space-y-1.5">
                    <Label htmlFor="aadhaar" className="text-xs">Masked Aadhaar (Last 4 Digits)</Label>
                    <Input
                      id="aadhaar"
                      maxLength={4}
                      placeholder="e.g. 5892"
                      value={patientForm.aadhaarLast4}
                      onChange={(e) => setPatientForm({ ...patientForm, aadhaarLast4: e.target.value })}
                      className="text-xs font-mono tracking-widest text-center"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="ec-name" className="text-xs">Emergency Contact Name</Label>
                      <Input
                        id="ec-name"
                        placeholder="e.g. Anita Verma"
                        value={patientForm.emergencyContactName}
                        onChange={(e) => setPatientForm({ ...patientForm, emergencyContactName: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ec-phone" className="text-xs">Emergency Contact Phone</Label>
                      <Input
                        id="ec-phone"
                        placeholder="e.g. +91 98765 43210"
                        value={patientForm.emergencyContactPhone}
                        onChange={(e) => setPatientForm({ ...patientForm, emergencyContactPhone: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-pwd" className="text-xs">Set Account Password</Label>
                    <Input
                      id="reg-pwd"
                      type="password"
                      placeholder="•••••••• (Min 6 characters)"
                      value={patientForm.password}
                      onChange={(e) => setPatientForm({ ...patientForm, password: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setPatientStep(1)} className="flex-1 text-xs h-9">
                      <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back
                    </Button>
                    <Button type="submit" className="flex-1 text-xs h-9">
                      Review & ABHA <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </form>
            )}

            {/* Step 3 */}
            {patientStep === 3 && (
              <CardContent className="p-5 pt-0 space-y-3.5 text-xs">
                <div className="rounded-xl border border-teal-300 bg-gradient-to-br from-teal-900 to-teal-950 p-4 text-white shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-teal-300 tracking-wider">Ayushman Bharat Digital Mission (ABDM)</span>
                      <h4 className="font-extrabold text-sm mt-0.5">{patientForm.fullName}</h4>
                    </div>
                    <QrCode className="h-7 w-7 text-teal-200" />
                  </div>
                  <div className="pt-2 border-t border-teal-700/50 flex justify-between text-[11px] text-teal-200">
                    <span>ABHA ID: <strong className="text-white">{patientForm.fullName.toLowerCase().replace(/\s+/g, "")}@abdm</strong></span>
                    <span>Blood: <strong className="text-rose-300">{patientForm.bloodGroup}</strong></span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setPatientStep(2)} className="flex-1 text-xs h-9">
                    <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back
                  </Button>
                  <Button type="button" onClick={handlePatientFinalSubmit} className="flex-1 text-xs font-bold h-9" disabled={isLoading}>
                    {isLoading ? "Establishing Identity..." : "Complete Registration"}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* 2. DOCTOR REGISTRATION FORM (MULTI-AFFILIATION FOUNDATION) */}
        {accountType === "doctor" && (
          <Card className="bg-white border-blue-200 shadow-xs">
            <form onSubmit={handleDoctorSubmit}>
              <CardHeader className="p-5 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-blue-600" />
                    Doctor Credential & Multi-Practice Registration
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] text-blue-700 border-blue-300">
                    MCI Verified
                  </Badge>
                </div>
                <CardDescription className="text-xs text-slate-500">
                  Doctor identity is independent and can be affiliated with multiple hospitals and clinics.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="doc-name" className="text-xs">Doctor Full Name</Label>
                    <Input
                      id="doc-name"
                      placeholder="e.g. Dr. Ananya Sharma"
                      value={doctorForm.fullName}
                      onChange={(e) => setDoctorForm({ ...doctorForm, fullName: e.target.value })}
                      className="text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="doc-email" className="text-xs">Email Address</Label>
                    <Input
                      id="doc-email"
                      type="email"
                      placeholder="e.g. ananya.sharma@medora.health"
                      value={doctorForm.email}
                      onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                      className="text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="doc-reg" className="text-xs">Medical Registration Number (MCI / State)</Label>
                    <Input
                      id="doc-reg"
                      placeholder="e.g. MCI-2014-99214"
                      value={doctorForm.medicalRegNo}
                      onChange={(e) => setDoctorForm({ ...doctorForm, medicalRegNo: e.target.value })}
                      className="text-xs font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="doc-spec" className="text-xs">Specialization</Label>
                    <select
                      id="doc-spec"
                      value={doctorForm.specialization}
                      onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800"
                    >
                      <option value="Cardiology">Cardiology</option>
                      <option value="General Medicine">General Medicine</option>
                      <option value="Emergency Medicine">Emergency Medicine</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Pathology">Pathology</option>
                    </select>
                  </div>
                </div>

                {/* Primary Hospital Affiliation */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    🏥 Primary Hospital Affiliation (HSP-1001)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] text-slate-500">Hospital Facility</Label>
                      <Input
                        value={doctorForm.primaryHospitalName}
                        onChange={(e) => setDoctorForm({ ...doctorForm, primaryHospitalName: e.target.value })}
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-slate-500">OPD Consultation Fee (₹)</Label>
                      <Input
                        type="number"
                        value={doctorForm.primaryConsultationFee}
                        onChange={(e) => setDoctorForm({ ...doctorForm, primaryConsultationFee: Number(e.target.value) })}
                        className="text-xs h-8"
                      />
                    </div>
                  </div>
                </div>

                {/* Secondary Hospital Affiliation */}
                <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-900">
                      🏥 Secondary / Visiting Hospital Affiliation (HSP-1002)
                    </span>
                    <label className="flex items-center gap-1.5 text-[11px] text-blue-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={doctorForm.hasSecondaryHospital}
                        onChange={(e) => setDoctorForm({ ...doctorForm, hasSecondaryHospital: e.target.checked })}
                        className="rounded text-blue-600"
                      />
                      Enable Multi-Practice
                    </label>
                  </div>
                  {doctorForm.hasSecondaryHospital && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <Label className="text-[10px] text-slate-500">Visiting Hospital</Label>
                        <Input
                          value={doctorForm.secondaryHospitalName}
                          onChange={(e) => setDoctorForm({ ...doctorForm, secondaryHospitalName: e.target.value })}
                          className="text-xs h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-slate-500">Visiting Fee (₹)</Label>
                        <Input
                          type="number"
                          value={doctorForm.secondaryConsultationFee}
                          onChange={(e) => setDoctorForm({ ...doctorForm, secondaryConsultationFee: Number(e.target.value) })}
                          className="text-xs h-8"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full text-xs font-bold h-9 bg-blue-700 hover:bg-blue-800" disabled={isLoading}>
                  {isLoading ? "Creating Doctor Identity..." : "Complete Doctor Registration"}
                </Button>
              </CardContent>
            </form>
          </Card>
        )}

        {/* Sign In Link */}
        <div className="text-center text-xs text-slate-500">
          Already have a MEDORA account?{" "}
          <Link href="/login" className="font-bold text-teal-700 hover:underline">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
