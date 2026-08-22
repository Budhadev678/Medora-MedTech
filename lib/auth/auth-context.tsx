"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  DEMO_PERSONAS, 
  ROLE_DASHBOARD_ROUTES, 
  type DemoPersona, 
  type UserRole 
} from "@/lib/constants";
import type { Profile, DoctorAffiliation, OrganizationMembership } from "@/types/database.types";
import { createClient } from "@/lib/supabase/client";
import { 
  StoredIdentity, 
  StoredDoctorAffiliation,
  StoredStaffMembership,
  getAllIdentities, 
  saveIdentity, 
  findIdentityByEmail, 
  findIdentityById, 
  authenticateCredentials,
  getPersonMemberships,
  getAllMemberships,
  SEEDED_IDENTITIES 
} from "@/lib/data/identity-store";

interface AuthResponse {
  success: boolean;
  error?: string;
}

export interface PatientRegistrationData {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  dob: string;
  gender: "male" | "female" | "other";
  bloodGroup: string;
  aadhaarLast4?: string;
  abhaId?: string;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface DoctorRegistrationData {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  medicalRegNo: string;
  medicalCouncil: string;
  specialization: string;
  degree: string;
  experienceYears?: number;
  primaryHospitalId?: string;
  primaryHospitalName?: string;
  primaryDepartmentName?: string;
  primaryConsultationFee?: number;
  primaryOpdRoom?: string;
  secondaryHospitalId?: string;
  secondaryHospitalName?: string;
  secondaryDepartmentName?: string;
  secondaryConsultationFee?: number;
  secondaryOpdRoom?: string;
}

export interface StaffRegistrationData {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
  roleTitle?: string;
}

interface AuthContextType {
  user: StoredIdentity | null;
  profile: Profile | null;
  activePersona: DemoPersona | null;
  role: UserRole | null;
  affiliations: StoredDoctorAffiliation[];
  staffMemberships: StoredStaffMembership[];
  memberships: OrganizationMembership[];
  activeMembership: OrganizationMembership | null;
  setActiveMembershipId: (membershipId: string) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password?: string) => Promise<AuthResponse>;
  signUp: (data: PatientRegistrationData) => Promise<AuthResponse>;
  signUpDoctor: (data: DoctorRegistrationData) => Promise<AuthResponse>;
  signUpStaff: (data: StaffRegistrationData) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  // Compatibility Aliases
  login: (email: string, password?: string) => Promise<AuthResponse>;
  registerPatient: (data: PatientRegistrationData) => Promise<AuthResponse>;
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

  const [currentIdentity, setCurrentIdentity] = useState<StoredIdentity | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper to convert StoredIdentity into standard DemoPersona format
  const buildPersona = (identity: StoredIdentity): DemoPersona => {
    let org = identity.organizationName || "MEDORA Network Member";
    let desc = `Active ${identity.role.replace("_", " ")} account`;

    if (identity.role === "doctor" && identity.doctorData) {
      const primaryAff = identity.doctorData.affiliations[0];
      org = primaryAff ? `${primaryAff.organizationName} (${primaryAff.roleTitle})` : `${identity.doctorData.specialization} Specialist`;
      desc = `Reg: ${identity.doctorData.medicalRegNo} • ${identity.doctorData.qualifications}`;
    } else if (identity.role === "patient" && identity.patientData) {
      org = `Patient • Blood: ${identity.patientData.bloodGroup}`;
      desc = `ABHA: ${identity.patientData.abhaId || "Not Linked"} • DOB: ${identity.patientData.dob}`;
    }

    return {
      id: identity.id,
      name: identity.fullName,
      email: identity.email,
      role: identity.role,
      identifier: identity.identifier,
      organization: org,
      avatar: identity.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      description: desc,
    };
  };

  // Restore authenticated session from localStorage on mount (Zero silent fallbacks)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedSessionId = localStorage.getItem("medora_session_id");
        if (storedSessionId) {
          const matched = findIdentityById(storedSessionId);
          if (matched && matched.accountStatus === "active") {
            setCurrentIdentity(matched);
          } else {
            // Invalid or disabled session: clear it
            localStorage.removeItem("medora_session_id");
            document.cookie = "medora_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            setCurrentIdentity(null);
          }
        } else {
          // Strictly null when unauthenticated — NO Rahul fallback!
          setCurrentIdentity(null);
        }
      } catch {
        setCurrentIdentity(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const switchPersona = useCallback((personaId: string) => {
    const matched = findIdentityById(personaId) || findIdentityByEmail(personaId);
    if (matched && matched.accountStatus === "active") {
      setCurrentIdentity(matched);
      localStorage.setItem("medora_session_id", matched.id);
      document.cookie = `medora_role=${matched.role}; path=/; max-age=86400`;
      router.push(ROLE_DASHBOARD_ROUTES[matched.role]);
    }
  }, [router]);

  const signIn = async (email: string, password?: string): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      // 1. Live Supabase Auth if configured
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: password || "Password@123",
        });
        if (error) {
          return { success: false, error: error.message };
        }
      }

      // 2. Validate Credentials & Account Status against Identity Store
      const authResult = authenticateCredentials(email, password);
      if (!authResult.success || !authResult.identity) {
        return { success: false, error: authResult.error || "Invalid login credentials." };
      }

      const identity = authResult.identity;
      setCurrentIdentity(identity);
      localStorage.setItem("medora_session_id", identity.id);
      document.cookie = `medora_role=${identity.role}; path=/; max-age=86400`;

      router.push(ROLE_DASHBOARD_ROUTES[identity.role]);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "An authentication error occurred." };
    } finally {
      setIsLoading(false);
    }
  };

  // Patient Registration (Idempotent & Isolated)
  const signUp = async (data: PatientRegistrationData): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const existing = findIdentityByEmail(data.email);
      if (existing) {
        return { success: false, error: "An account with this email address already exists. Please sign in." };
      }

      const patientCount = getAllIdentities().filter(u => u.role === "patient").length + 1;
      const formattedCount = String(patientCount).padStart(4, "0");
      const medoraId = `PAT-${formattedCount}`;
      const newId = `pat-uuid-${Date.now()}`;

      const newPatient: StoredIdentity = {
        id: newId,
        email: data.email.trim().toLowerCase(),
        passwordHash: data.password || "Password@123",
        fullName: data.fullName,
        role: "patient",
        identifier: medoraId,
        phone: data.phone,
        accountStatus: "active",
        verificationStatus: "verified",
        createdAt: new Date().toISOString(),
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        patientData: {
          dob: data.dob,
          gender: data.gender,
          bloodGroup: data.bloodGroup,
          aadhaarMasked: data.aadhaarLast4,
          abhaId: data.abhaId || `${data.fullName.toLowerCase().replace(/\s+/g, "")}@abdm`,
          allergies: data.allergies || [],
          chronicConditions: data.chronicConditions || [],
          emergencyContact: {
            name: data.emergencyContactName || "Primary Contact",
            phone: data.emergencyContactPhone || data.phone,
            relation: "Family",
          },
        },
      };

      saveIdentity(newPatient);
      setCurrentIdentity(newPatient);
      localStorage.setItem("medora_session_id", newPatient.id);
      document.cookie = `medora_role=patient; path=/; max-age=86400`;

      router.push("/patient");
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Patient registration failed." };
    } finally {
      setIsLoading(false);
    }
  };

  // Doctor Registration (With Multi-Hospital Affiliation Foundation)
  const signUpDoctor = async (data: DoctorRegistrationData): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const existing = findIdentityByEmail(data.email);
      if (existing) {
        return { success: false, error: "An account with this email address already exists. Please sign in." };
      }

      const doctorCount = getAllIdentities().filter(u => u.role === "doctor").length + 1;
      const formattedCount = String(doctorCount).padStart(4, "0");
      const medoraId = `DOC-${formattedCount}`;
      const newId = `doc-uuid-${Date.now()}`;

      // Build primary and secondary affiliations
      const affiliations: StoredDoctorAffiliation[] = [
        {
          organizationId: data.primaryHospitalId || "11111111-1111-1111-1111-111111111101",
          organizationName: data.primaryHospitalName || "City Hospital (HSP-1001)",
          departmentName: data.primaryDepartmentName || "Department of Cardiology",
          roleTitle: "Consultant Physician",
          consultationFee: data.primaryConsultationFee || 500,
          opdRoom: data.primaryOpdRoom || "OPD Room 101",
          status: "active",
          verificationStatus: "verified",
        },
      ];

      if (data.secondaryHospitalId || data.secondaryHospitalName) {
        affiliations.push({
          organizationId: data.secondaryHospitalId || "11111111-1111-1111-1111-111111111102",
          organizationName: data.secondaryHospitalName || "Green Care Hospital (HSP-1002)",
          departmentName: data.secondaryDepartmentName || "Outpatient Specialist Clinic",
          roleTitle: "Visiting Specialist",
          consultationFee: data.secondaryConsultationFee || 600,
          opdRoom: data.secondaryOpdRoom || "Visiting OPD 2",
          status: "active",
          verificationStatus: "verified",
        });
      }

      const newDoctor: StoredIdentity = {
        id: newId,
        email: data.email.trim().toLowerCase(),
        passwordHash: data.password || "Password@123",
        fullName: data.fullName.startsWith("Dr.") ? data.fullName : `Dr. ${data.fullName}`,
        role: "doctor",
        identifier: medoraId,
        phone: data.phone,
        accountStatus: "active",
        verificationStatus: "verified",
        createdAt: new Date().toISOString(),
        avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80",
        doctorData: {
          medicalRegNo: data.medicalRegNo,
          medicalCouncil: data.medicalCouncil,
          specialization: data.specialization,
          qualifications: data.degree,
          experienceYears: data.experienceYears || 5,
          affiliations,
        },
      };

      saveIdentity(newDoctor);
      setCurrentIdentity(newDoctor);
      localStorage.setItem("medora_session_id", newDoctor.id);
      document.cookie = `medora_role=doctor; path=/; max-age=86400`;

      router.push("/doctor");
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Doctor registration failed." };
    } finally {
      setIsLoading(false);
    }
  };

  // Staff Registration (Hospital Admin, Lab, Pharmacy, Emergency, Blood, Finance, Insurance, Govt, Ambulance)
  const signUpStaff = async (data: StaffRegistrationData): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const existing = findIdentityByEmail(data.email);
      if (existing) {
        return { success: false, error: "An account with this email address already exists. Please sign in." };
      }

      const rolePrefix = data.role.slice(0, 3).toUpperCase();
      const medoraId = `${rolePrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newId = `staff-uuid-${Date.now()}`;

      const newStaff: StoredIdentity = {
        id: newId,
        email: data.email.trim().toLowerCase(),
        passwordHash: data.password || "Password@123",
        fullName: data.fullName,
        role: data.role,
        identifier: medoraId,
        phone: data.phone,
        accountStatus: "active",
        verificationStatus: "verified",
        createdAt: new Date().toISOString(),
        organizationName: data.organizationName,
        staffData: [
          {
            organizationId: data.organizationId,
            organizationName: data.organizationName,
            roleTitle: data.roleTitle || "Healthcare Staff Officer",
            status: "active",
            verificationStatus: "verified",
          },
        ],
      };

      saveIdentity(newStaff);
      setCurrentIdentity(newStaff);
      localStorage.setItem("medora_session_id", newStaff.id);
      document.cookie = `medora_role=${data.role}; path=/; max-age=86400`;

      router.push(ROLE_DASHBOARD_ROUTES[data.role]);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Staff registration failed." };
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
    } finally {
      // Clear all session markers to guarantee zero cross-account leakage
      localStorage.removeItem("medora_session_id");
      document.cookie = "medora_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      setCurrentIdentity(null);
      setIsLoading(false);
      router.push("/login");
    }
  };

  const hasRole = useCallback((allowedRoles: UserRole | UserRole[]): boolean => {
    if (!currentIdentity) return false;
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(currentIdentity.role);
    }
    return currentIdentity.role === allowedRoles;
  }, [currentIdentity]);

  const canAccessRoute = useCallback((targetPath: string): boolean => {
    if (targetPath === "/" || targetPath.startsWith("/login") || targetPath.startsWith("/register") || targetPath.startsWith("/verify")) {
      return true;
    }
    if (!currentIdentity) return false;
    const role = currentIdentity.role;
    if (targetPath.startsWith("/patient")) return role === "patient" || role === "admin";
    if (targetPath.startsWith("/doctor")) return role === "doctor" || role === "admin";
    if (targetPath.startsWith("/hospital")) return role === "hospital_admin" || role === "staff" || role === "admin";
    if (targetPath.startsWith("/clinic")) return role === "hospital_admin" || role === "doctor" || role === "staff" || role === "admin";
    if (targetPath.startsWith("/lab")) return role === "lab_staff" || role === "admin";
    if (targetPath.startsWith("/pharmacy")) return role === "pharmacy_staff" || role === "admin";
    if (targetPath.startsWith("/government")) return role === "government_staff" || role === "admin";
    if (targetPath.startsWith("/ambulance")) return role === "ambulance_staff" || role === "emergency_staff" || role === "admin";
    if (targetPath.startsWith("/emergency")) return role === "emergency_staff" || role === "ambulance_staff" || role === "admin";
    if (targetPath.startsWith("/blood-bank")) return role === "blood_staff" || role === "admin";
    if (targetPath.startsWith("/insurance")) return role === "insurance_staff" || role === "admin";
    if (targetPath.startsWith("/finance")) return role === "finance_staff" || role === "admin";
    if (targetPath.startsWith("/admin")) return role === "admin";
    return true;
  }, [currentIdentity]);

  const currentProfile: Profile | null = currentIdentity ? {
    id: currentIdentity.id,
    full_name: currentIdentity.fullName,
    email: currentIdentity.email,
    phone: currentIdentity.phone,
    role: currentIdentity.role,
    avatar_url: currentIdentity.avatarUrl,
    account_status: currentIdentity.accountStatus,
    profile_complete: true,
    created_at: currentIdentity.createdAt,
    updated_at: new Date().toISOString(),
  } : null;

  const currentPersona = currentIdentity ? buildPersona(currentIdentity) : null;
  const currentAffiliations = currentIdentity?.doctorData?.affiliations || [];
  const currentStaffMemberships = currentIdentity?.staffData || [];
  const currentMemberships = currentIdentity 
    ? getPersonMemberships(currentIdentity.id)
    : [];

  const [activeMembershipId, setActiveMembershipId] = useState<string | null>(null);

  const activeMembership = currentMemberships.find(m => m.id === activeMembershipId) 
    || currentMemberships.find(m => m.status === "ACTIVE") 
    || null;

  return (
    <AuthContext.Provider
      value={{
        user: currentIdentity,
        profile: currentProfile,
        activePersona: currentPersona,
        role: currentIdentity?.role || null,
        affiliations: currentAffiliations,
        staffMemberships: currentStaffMemberships,
        memberships: currentMemberships,
        activeMembership,
        setActiveMembershipId,
        isAuthenticated: !!currentIdentity,
        isLoading,
        signIn,
        signUp,
        signUpDoctor,
        signUpStaff,
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
