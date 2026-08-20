"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  DEMO_PERSONAS, 
  ROLE_DASHBOARD_ROUTES, 
  type DemoPersona, 
  type UserRole 
} from "@/lib/constants";
import type { Profile } from "@/types/database.types";
import { createClient } from "@/lib/supabase/client";

interface AuthResponse {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: Profile | null;
  profile: Profile | null;
  activePersona: DemoPersona;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password?: string, specificRole?: UserRole) => Promise<AuthResponse>;
  signUp: (data: {
    fullName: string;
    email: string;
    phone: string;
    password?: string;
    dob: string;
    gender: string;
    bloodGroup: string;
    aadhaarLast4?: string;
    abhaId?: string;
  }) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  // Aliases for convenience
  login: (email: string, password?: string, specificRole?: UserRole) => Promise<AuthResponse>;
  registerPatient: (data: {
    fullName: string;
    email: string;
    phone: string;
    password?: string;
    dob: string;
    gender: string;
    bloodGroup: string;
    aadhaarLast4?: string;
    abhaId?: string;
  }) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  switchPersona: (personaId: string) => void;
  hasRole: (allowedRoles: UserRole | UserRole[]) => boolean;
  canAccessRoute: (targetPath: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [activePersona, setActivePersona] = useState<DemoPersona>(DEMO_PERSONAS[0]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper to map error messages to human-readable strings
  const sanitizeErrorMessage = (errorText: string): string => {
    const lower = errorText.toLowerCase();
    if (lower.includes("invalid login credentials") || lower.includes("invalid_grant")) {
      return "The email or password you entered is incorrect.";
    }
    if (lower.includes("user already registered") || lower.includes("already exists")) {
      return "An account with this email address already exists.";
    }
    if (lower.includes("network") || lower.includes("failed to fetch")) {
      return "Unable to connect to the healthcare server. Please check your internet connection.";
    }
    if (lower.includes("password") && lower.includes("short")) {
      return "Password must be at least 6 characters long.";
    }
    return errorText || "An unexpected authentication error occurred. Please try again.";
  };

  // Restore authenticated session from localStorage or Supabase on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // First check for active persona in localStorage (for zero-latency demonstration)
        const storedPersona = localStorage.getItem("medora_active_persona");
        if (storedPersona) {
          const parsed = JSON.parse(storedPersona) as DemoPersona;
          setActivePersona(parsed);
          setIsAuthenticated(true);
        } else {
          // Check if current route indicates a specific role
          const matched = DEMO_PERSONAS.find(p => pathname?.startsWith(ROLE_DASHBOARD_ROUTES[p.role]));
          if (matched) {
            setActivePersona(matched);
            setIsAuthenticated(true);
            localStorage.setItem("medora_active_persona", JSON.stringify(matched));
            document.cookie = `medora_role=${matched.role}; path=/; max-age=86400`;
          } else {
            // Default to logged-in patient demo persona
            setActivePersona(DEMO_PERSONAS[0]);
            setIsAuthenticated(true);
          }
        }
      } catch {
        setActivePersona(DEMO_PERSONAS[0]);
        setIsAuthenticated(true);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, [pathname]);

  const switchPersona = useCallback((personaId: string) => {
    const target = DEMO_PERSONAS.find(p => p.id === personaId) || DEMO_PERSONAS[0];
    setActivePersona(target);
    setIsAuthenticated(true);
    localStorage.setItem("medora_active_persona", JSON.stringify(target));
    document.cookie = `medora_role=${target.role}; path=/; max-age=86400`;
    router.push(ROLE_DASHBOARD_ROUTES[target.role]);
  }, [router]);

  const signIn = async (email: string, password?: string, specificRole?: UserRole): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      // 1. Attempt Supabase Auth signIn if live credentials are configured
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: password || "password123",
        });
        if (error) {
          return { success: false, error: sanitizeErrorMessage(error.message) };
        }
      }

      // 2. Demo Persona Matcher / Seeded Session Handler
      const target = DEMO_PERSONAS.find(
        p => p.email.toLowerCase() === email.toLowerCase() || (specificRole && p.role === specificRole)
      );

      if (target) {
        setActivePersona(target);
        setIsAuthenticated(true);
        localStorage.setItem("medora_active_persona", JSON.stringify(target));
        document.cookie = `medora_role=${target.role}; path=/; max-age=86400`;
        router.push(ROLE_DASHBOARD_ROUTES[target.role]);
        return { success: true };
      }

      // If custom email entered, create active patient session
      const customPatient: DemoPersona = {
        id: `pat-${Date.now()}`,
        name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        email: email,
        role: "patient",
        identifier: `MED-PAT-${Math.floor(1000 + Math.random() * 9000)}`,
        organization: "Registered Patient",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        description: "Authenticated Patient Portal Account",
      };

      setActivePersona(customPatient);
      setIsAuthenticated(true);
      localStorage.setItem("medora_active_persona", JSON.stringify(customPatient));
      document.cookie = `medora_role=patient; path=/; max-age=86400`;
      router.push("/patient");
      return { success: true };
    } catch (err: any) {
      return { success: false, error: sanitizeErrorMessage(err.message) };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: {
    fullName: string;
    email: string;
    phone: string;
    password?: string;
    dob: string;
    gender: string;
    bloodGroup: string;
    aadhaarLast4?: string;
    abhaId?: string;
  }): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      // 1. Attempt Supabase Auth signup if configured
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password || "Password@123",
          options: {
            data: {
              full_name: data.fullName,
              role: "patient",
              phone: data.phone,
            },
          },
        });
        if (error) {
          return { success: false, error: sanitizeErrorMessage(error.message) };
        }
      }

      // 2. Create local patient profile
      const newPatient: DemoPersona = {
        id: `pat-${Date.now()}`,
        name: data.fullName,
        email: data.email,
        role: "patient",
        identifier: `MED-PAT-${Math.floor(1000 + Math.random() * 9000)}`,
        organization: "Newly Registered Patient",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        description: `Patient registered with blood group ${data.bloodGroup}`,
      };

      setActivePersona(newPatient);
      setIsAuthenticated(true);
      localStorage.setItem("medora_active_persona", JSON.stringify(newPatient));
      localStorage.setItem("medora_registered_patient_data", JSON.stringify(data));
      document.cookie = `medora_role=patient; path=/; max-age=86400`;

      router.push("/patient");
      return { success: true };
    } catch (err: any) {
      return { success: false, error: sanitizeErrorMessage(err.message) };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
        await supabase.auth.signOut();
      }
    } catch {
      // Ignore
    } finally {
      localStorage.removeItem("medora_active_persona");
      document.cookie = "medora_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      setIsAuthenticated(false);
      setIsLoading(false);
      router.push("/login");
    }
  };

  const hasRole = useCallback((allowedRoles: UserRole | UserRole[]): boolean => {
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(activePersona.role);
    }
    return activePersona.role === allowedRoles;
  }, [activePersona.role]);

  const canAccessRoute = useCallback((targetPath: string): boolean => {
    if (targetPath === "/" || targetPath.startsWith("/login") || targetPath.startsWith("/register")) {
      return true;
    }
    if (targetPath.startsWith("/patient")) return activePersona.role === "patient" || activePersona.role === "admin";
    if (targetPath.startsWith("/doctor")) return activePersona.role === "doctor" || activePersona.role === "admin";
    if (targetPath.startsWith("/hospital")) return activePersona.role === "hospital_admin" || activePersona.role === "admin";
    if (targetPath.startsWith("/lab")) return activePersona.role === "lab_staff" || activePersona.role === "admin";
    if (targetPath.startsWith("/pharmacy")) return activePersona.role === "pharmacy_staff" || activePersona.role === "admin";
    if (targetPath.startsWith("/emergency")) return activePersona.role === "emergency_staff" || activePersona.role === "admin";
    if (targetPath.startsWith("/blood-bank")) return activePersona.role === "blood_staff" || activePersona.role === "admin";
    if (targetPath.startsWith("/finance")) return activePersona.role === "finance_staff" || activePersona.role === "admin";
    if (targetPath.startsWith("/admin")) return activePersona.role === "admin";
    return true;
  }, [activePersona.role]);

  const currentProfile: Profile = {
    id: activePersona.id,
    full_name: activePersona.name,
    email: activePersona.email,
    role: activePersona.role,
    avatar_url: activePersona.avatar,
    account_status: "active",
    profile_complete: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <AuthContext.Provider
      value={{
        user: currentProfile,
        profile: currentProfile,
        activePersona,
        role: activePersona.role,
        isAuthenticated,
        isLoading,
        signIn,
        signUp,
        signOut,
        login: signIn,
        registerPatient: signUp,
        logout: signOut,
        switchPersona,
        hasRole,
        canAccessRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
