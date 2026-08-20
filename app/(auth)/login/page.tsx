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
  Receipt,
  Eye,
  EyeOff
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { DEMO_PERSONAS, ROLE_LABELS, type UserRole } from "@/lib/constants";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  const router = useRouter();
  const { login, signIn, switchPersona, isLoading } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"standard" | "demo">("demo");

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    const result = await signIn(email, password);
    if (!result.success) {
      setError(result.error || "Invalid credentials.");
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "patient": return <Users className="h-4 w-4 text-teal-600" />;
      case "doctor": return <Stethoscope className="h-4 w-4 text-blue-600" />;
      case "hospital_admin": return <Building2 className="h-4 w-4 text-indigo-600" />;
      case "lab_staff": return <FlaskConical className="h-4 w-4 text-amber-600" />;
      case "pharmacy_staff": return <Pill className="h-4 w-4 text-emerald-600" />;
      case "emergency_staff": return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "blood_staff": return <Droplet className="h-4 w-4 text-rose-600" />;
      case "finance_staff": return <Receipt className="h-4 w-4 text-purple-600" />;
      case "admin": return <ShieldCheck className="h-4 w-4 text-slate-700" />;
      default: return <Activity className="h-4 w-4 text-teal-600" />;
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-xl space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs">
            <Activity className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Sign In to MEDORA
          </h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Unified authentication across Patients, Doctors, Hospitals, Labs, Pharmacies, Emergency and Financial Desks.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("demo")}
            className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "demo" ? "bg-white text-teal-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            SIH One-Click Role Launcher (Recommended)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("standard")}
            className={`flex-1 py-2 rounded-md transition-all ${
              activeTab === "standard" ? "bg-white text-teal-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Standard Credentials
          </button>
        </div>

        {/* Demo Fast Launcher Tab */}
        {activeTab === "demo" && (
          <Card className="bg-white border-teal-200">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Select Role Persona to Login Instantly
                </CardTitle>
                <Badge variant="teal" className="text-[10px]">
                  9 Demo Roles Seeded
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Click any persona below to launch their role-based portal with full context.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-2 max-h-[380px] overflow-y-auto">
              {DEMO_PERSONAS.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => switchPersona(persona.id)}
                  className="w-full text-left flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                      {getRoleIcon(persona.role)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{persona.name}</span>
                        <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded font-semibold">
                          {ROLE_LABELS[persona.role].split(" ")[0]}
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

        {/* Standard Email/Password Form Tab */}
        {activeTab === "standard" && (
          <Card className="bg-white">
            <form onSubmit={handleSubmit}>
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Enter Your Account Details
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Sign in with your registered email and password.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="e.g. patient@medora.health"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs">Password</Label>
                    <a href="#" className="text-[11px] text-teal-700 hover:underline">Forgot password?</a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-9 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full text-xs font-semibold" disabled={isLoading}>
                  {isLoading ? "Signing In..." : "Sign In to Portal"}
                </Button>
              </CardContent>

              <CardFooter className="p-5 pt-0 border-t border-slate-100 flex items-center justify-center text-xs text-slate-500">
                <span>New to MEDORA?</span>
                <Link href="/register" className="ml-1.5 font-bold text-teal-700 hover:underline">
                  Register as a New Patient
                </Link>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
