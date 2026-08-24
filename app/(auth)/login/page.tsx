"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Activity, 
  Lock, 
  Mail, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Users,
  Stethoscope,
  Building2,
  FlaskConical,
  Pill,
  AlertTriangle,
  Droplet,
  Eye,
  EyeOff,
  KeyRound,
  ClipboardList,
  Loader2
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { DEMO_PERSONAS, ROLE_DASHBOARD_ROUTES, type DemoPersona } from "@/lib/constants";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, switchPersona } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"standard" | "demo">("standard");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signIn(cleanEmail, password || "Password@123");
      if (!result.success) {
        setError(result.error || "Invalid credentials.");
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLaunch = (persona: DemoPersona) => {
    switchPersona(persona.identifier);
    const targetRoute = ROLE_DASHBOARD_ROUTES[persona.role] || "/patient";
    router.push(targetRoute);
  };

  const quickFillPreset = (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword("Password@123");
    setActiveTab("standard");
    setError(null);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "patient": return <Users className="h-4 w-4 text-teal-600" />;
      case "doctor": return <Stethoscope className="h-4 w-4 text-blue-600" />;
      case "hospital_admin": return <Building2 className="h-4 w-4 text-indigo-600" />;
      case "lab_staff": return <FlaskConical className="h-4 w-4 text-purple-600" />;
      case "pharmacy_staff": return <Pill className="h-4 w-4 text-emerald-600" />;
      case "blood_staff": return <Droplet className="h-4 w-4 text-rose-600" />;
      case "admin": return <ShieldCheck className="h-4 w-4 text-slate-800" />;
      default: return <Activity className="h-4 w-4 text-teal-600" />;
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6 animate-in fade-in-50 duration-150">
      <div className="w-full max-w-xl space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-xs">
            <Activity className="h-6 w-6 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Sign In to MEDORA
          </h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-medium">
            Transparent, Connected & Auditable Healthcare Platform. Identity is strictly verified with zero cross-account data leakage.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("standard")}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "standard" ? "bg-white text-teal-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <KeyRound className="h-3.5 w-3.5 text-teal-600" />
            Standard Email & Password
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("demo")}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "demo" ? "bg-white text-teal-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            Verified Demo Accounts ({DEMO_PERSONAS.length})
          </button>
        </div>

        {/* Standard Email/Password Form Tab */}
        {activeTab === "standard" && (
          <Card className="bg-white shadow-xs border-slate-200 rounded-2xl">
            <form onSubmit={handleSubmit}>
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Enter Your Account Credentials
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Role and profile identity are loaded dynamically from the verified identity store.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-4">
                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium flex items-start gap-2 animate-in fade-in-50 duration-150">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Email Address */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-700">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="e.g. patient@medora.health, doctor@medora.health"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 text-xs rounded-xl h-9"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold text-slate-700">Password</Label>
                    <span className="text-[11px] text-teal-700">Default: Password@123</span>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password@123"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-9 text-xs rounded-xl h-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Action Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full text-xs font-bold h-9 shadow-xs rounded-xl bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <span>Sign In to MEDORA</span>
                  )}
                </Button>

                {/* Quick-Fill Sample Credentials Helper Strip */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Quick-Fill Test Accounts:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => quickFillPreset("patient@medora.health")}
                      className="rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 px-2.5 py-1 text-[11px] font-medium transition-colors"
                    >
                      Patient A (Rahul)
                    </button>
                    <button
                      type="button"
                      onClick={() => quickFillPreset("priya@medora.health")}
                      className="rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 px-2.5 py-1 text-[11px] font-medium transition-colors"
                    >
                      Patient B (Priya)
                    </button>
                    <button
                      type="button"
                      onClick={() => quickFillPreset("doctor@medora.health")}
                      className="rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-800 text-slate-700 px-2.5 py-1 text-[11px] font-medium transition-colors"
                    >
                      Doctor (Dr. Ananya)
                    </button>
                    <button
                      type="button"
                      onClick={() => quickFillPreset("bloodbank@medora.health")}
                      className="rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-800 text-slate-700 px-2.5 py-1 text-[11px] font-medium transition-colors"
                    >
                      Blood Centre (City Blood)
                    </button>
                    <button
                      type="button"
                      onClick={() => quickFillPreset("admin@cityhospital.org")}
                      className="rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-800 text-slate-700 px-2.5 py-1 text-[11px] font-medium transition-colors"
                    >
                      Hospital (City Hosp)
                    </button>
                    <button
                      type="button"
                      onClick={() => quickFillPreset("clinic@medora.health")}
                      className="rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-800 text-slate-700 px-2.5 py-1 text-[11px] font-medium transition-colors"
                    >
                      Clinic (Green Care)
                    </button>
                    <button
                      type="button"
                      onClick={() => quickFillPreset("lab@medora.health")}
                      className="rounded-lg bg-slate-100 hover:bg-purple-50 hover:text-purple-800 text-slate-700 px-2.5 py-1 text-[11px] font-medium transition-colors"
                    >
                      Lab (ABC Diag)
                    </button>
                    <button
                      type="button"
                      onClick={() => quickFillPreset("pharmacy@medora.health")}
                      className="rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 px-2.5 py-1 text-[11px] font-medium transition-colors"
                    >
                      Pharmacy (ABC Pharm)
                    </button>
                    <button
                      type="button"
                      onClick={() => quickFillPreset("bloodbank@medora.health")}
                      className="rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-800 text-slate-700 px-2.5 py-1 text-[11px] font-medium transition-colors"
                    >
                      Blood Centre
                    </button>
                    <button
                      type="button"
                      onClick={() => quickFillPreset("admin@medora.health")}
                      className="rounded-lg bg-slate-100 hover:bg-slate-200 hover:text-slate-900 text-slate-700 px-2.5 py-1 text-[11px] font-medium transition-colors"
                    >
                      Platform Admin
                    </button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-5 pt-0 border-t border-slate-100 flex items-center justify-center text-xs text-slate-500">
                <span>New to MEDORA?</span>
                <Link href="/register" className="ml-1.5 font-bold text-teal-700 hover:underline">
                  Register an Account
                </Link>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* Demo Fast Launcher Tab */}
        {activeTab === "demo" && (
          <Card className="bg-white border-teal-200 shadow-xs rounded-2xl">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Select Verified Persona to Login & Launch
                </CardTitle>
                <Badge variant="teal" className="text-[10px]">
                  {DEMO_PERSONAS.length} Verified Accounts
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Click any persona below to authenticate session and route directly into their scoped workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-2 max-h-[400px] overflow-y-auto">
              {DEMO_PERSONAS.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => handleDemoLaunch(persona)}
                  className="w-full text-left flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 transition-all group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                      {getRoleIcon(persona.role)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{persona.name}</span>
                        <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded font-semibold">
                          {persona.identifier}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block truncate max-w-xs">
                        {persona.organization}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}