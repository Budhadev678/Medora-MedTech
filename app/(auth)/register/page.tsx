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
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function RegisterPage() {
  const router = useRouter();
  const { registerPatient, isLoading } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    gender: "male",
    bloodGroup: "O+",
    aadhaarLast4: "",
    abhaOption: "create_new" as "create_new" | "link_existing" | "skip",
    abhaAddress: "",
  });

  const [error, setError] = useState<string | null>(null);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone || !formData.dob) {
      setError("Please fill in all required profile fields.");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStep(3);
  };

  const handleFinalSubmit = async () => {
    setError(null);
    const abhaId = formData.abhaOption !== "skip" 
      ? `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}` 
      : undefined;

    const result = await registerPatient({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      dob: formData.dob,
      gender: formData.gender,
      bloodGroup: formData.bloodGroup,
      aadhaarLast4: formData.aadhaarLast4 || "8912",
      abhaId,
    });

    if (!result.success) {
      setError(result.error || "Registration failed.");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs">
            <Activity className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Patient Registration & Onboarding
          </h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create your unified MEDORA healthcare account with integrated ABHA & emergency profile.
          </p>
        </div>

        {/* Stepper Progress Bar */}
        <div className="flex items-center justify-between px-6 py-2 bg-slate-100 rounded-xl text-xs font-semibold">
          <div className={`flex items-center gap-1.5 ${step >= 1 ? "text-teal-800 font-bold" : "text-slate-400"}`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${step >= 1 ? "bg-teal-600 text-white" : "bg-slate-300 text-slate-600"}`}>1</span>
            <span>Profile</span>
          </div>
          <span className="text-slate-300">──</span>
          <div className={`flex items-center gap-1.5 ${step >= 2 ? "text-teal-800 font-bold" : "text-slate-400"}`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${step >= 2 ? "bg-teal-600 text-white" : "bg-slate-300 text-slate-600"}`}>2</span>
            <span>Verification</span>
          </div>
          <span className="text-slate-300">──</span>
          <div className={`flex items-center gap-1.5 ${step >= 3 ? "text-teal-800 font-bold" : "text-slate-400"}`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${step >= 3 ? "bg-teal-600 text-white" : "bg-slate-300 text-slate-600"}`}>3</span>
            <span>ABHA ID</span>
          </div>
        </div>

        {/* Form Card */}
        <Card className="bg-white">
          {error && (
            <div className="m-5 mb-0 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* STEP 1: Basic Profile */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit}>
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Step 1: Personal & Health Profile
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Essential demographic details for hospital coordination and electronic records.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs">Full Name *</Label>
                  <Input
                    id="fullName"
                    placeholder="e.g. Rahul Verma"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="e.g. rahul@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs">Mobile Phone (+91) *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="dob" className="text-xs">Date of Birth *</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gender" className="text-xs">Gender *</Label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-xs"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bloodGroup" className="text-xs">Blood Group *</Label>
                    <select
                      id="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold text-rose-700"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>

                <Button type="submit" className="w-full text-xs font-semibold gap-1.5">
                  Continue to Identity Verification <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </form>
          )}

          {/* STEP 2: Simulated Identity Verification */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit}>
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Step 2: Simulated Identity Verification
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Simulating national identity integration. Full numbers are never stored unmasked.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-4">
                <div className="rounded-lg bg-teal-50 border border-teal-200 p-3 text-xs text-teal-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="h-4 w-4 text-teal-600" />
                    <span>Demo Identity Verification Protocol</span>
                  </div>
                  <p className="text-[11px] text-teal-700">
                    For SIH demonstration, enter any 4 digits to simulate verified Aadhaar linking.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="aadhaar" className="text-xs">Aadhaar Last 4 Digits</Label>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400 bg-slate-100 px-3 py-2 rounded-md border border-slate-200 select-none">
                      XXXX XXXX
                    </span>
                    <Input
                      id="aadhaar"
                      placeholder="8912"
                      maxLength={4}
                      value={formData.aadhaarLast4}
                      onChange={(e) => setFormData({ ...formData, aadhaarLast4: e.target.value })}
                      className="font-mono text-xs font-bold text-slate-900 max-w-[120px]"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setStep(1)} className="text-xs">
                    <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
                  </Button>
                  <Button type="submit" size="sm" className="flex-1 text-xs font-semibold gap-1.5">
                    Verify & Continue to ABHA <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </form>
          )}

          {/* STEP 3: Simulated ABHA Connection */}
          {step === 3 && (
            <div>
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Step 3: Ayushman Bharat Health Account (ABHA)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Connect your existing 14-digit ABHA address or create a new digital health card.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-teal-300 bg-teal-50/50 cursor-pointer">
                    <input
                      type="radio"
                      name="abhaOption"
                      checked={formData.abhaOption === "create_new"}
                      onChange={() => setFormData({ ...formData, abhaOption: "create_new" })}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">
                        Create New Simulated ABHA Card (Recommended)
                      </span>
                      <span className="text-[11px] text-slate-600">
                        Auto-generate 14-digit ABHA number and digital QR card for hospital check-in.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="abhaOption"
                      checked={formData.abhaOption === "skip"}
                      onChange={() => setFormData({ ...formData, abhaOption: "skip" })}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">
                        Skip for Now (Can be linked later)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Proceed with internal Medora Patient ID only.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setStep(2)} className="text-xs">
                    <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
                  </Button>
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={handleFinalSubmit} 
                    className="flex-1 text-xs font-semibold gap-1.5"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Complete Registration & Open Dashboard"}
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </div>
          )}

          <CardFooter className="p-5 pt-0 border-t border-slate-100 flex items-center justify-center text-xs text-slate-500">
            <span>Already have an account?</span>
            <Link href="/login" className="ml-1.5 font-bold text-teal-700 hover:underline">
              Sign In Here
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
