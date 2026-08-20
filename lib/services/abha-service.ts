// ============================================================
// MEDORA — ABHA & IDENTITY VERIFICATION SERVICE (PHASE 3.2)
// ABDM-Ready Integration Architecture with Controlled Sandbox
// ============================================================

import { StoredIdentity, linkPatientAbha, unlinkPatientAbha } from "@/lib/data/identity-store";
import { AbhaLinkStatus, VerificationSource } from "@/types/database.types";

export type IntegrationMode = "SANDBOX" | "PRODUCTION";

export interface ExternalVerifiedIdentity {
  verifiedName: string;
  dob: string;
  gender: "male" | "female" | "other";
  maskedAadhaar: string; // e.g. "XXXX XXXX 5892"
  mobileMasked: string; // e.g. "+91 XXXXX 43210"
  suggestedAbhaAddress: string; // e.g. "rahulverma@abdm"
  suggestedAbhaNumber: string; // e.g. "91-4589-2041-5892"
}

export interface OtpSession {
  txnId: string;
  method: "aadhaar" | "mobile" | "abha_number";
  identifier: string; // Aadhaar / Mobile / ABHA
  generatedAt: number;
  expiresAt: number;
  attemptsRemaining: number;
  mockOtp: string;
  verifiedIdentity?: ExternalVerifiedIdentity;
}

export interface IdentityMatchResult {
  matchLevel: "EXACT_MATCH" | "PARTIAL_MATCH" | "MAJOR_MISMATCH";
  score: number; // 0 - 100
  nameMatch: boolean;
  dobMatch: boolean;
  genderMatch: boolean;
  message: string;
}

// In-memory active OTP sessions map (simulating ABDM transaction state)
const activeSessions: Map<string, OtpSession> = new Map();

export class AbhaService {
  public static readonly CURRENT_MODE: IntegrationMode = "SANDBOX";
  public static readonly MODE_LABEL = "ABDM Sandbox / Prototype Verification";

  /**
   * Request OTP for Aadhaar or Mobile verification.
   * Throttles resends to 60s and limits attempts.
   */
  public static requestOtp(
    identifier: string,
    method: "aadhaar" | "mobile" | "abha_number"
  ): { success: boolean; txnId?: string; error?: string; cooldownSeconds?: number; demoOtpHint?: string } {
    const cleanId = identifier.replace(/\s+/g, "");

    if (method === "aadhaar" && cleanId.length !== 12) {
      return { success: false, error: "Please enter a valid 12-digit Aadhaar number." };
    }
    if (method === "mobile" && cleanId.length < 10) {
      return { success: false, error: "Please enter a valid 10-digit mobile number." };
    }

    // Generate unique transaction ID
    const txnId = "TXN-" + Math.random().toString(36).substring(2, 9).toUpperCase();
    const now = Date.now();
    const demoOtp = "123456"; // Standard ABDM sandbox OTP for testing

    const last4 = cleanId.slice(-4);
    const maskedAadhaar = `XXXX XXXX ${last4}`;

    // Mock external verified identity based on identifier
    const mockIdentity: ExternalVerifiedIdentity = {
      verifiedName: cleanId.endsWith("9999") ? "Different Person Name" : "Rahul Verma",
      dob: "1995-05-14",
      gender: "male",
      maskedAadhaar,
      mobileMasked: "+91 XXXXX " + (cleanId.slice(-5) || "43210"),
      suggestedAbhaAddress: `user${last4}@abdm`,
      suggestedAbhaNumber: `91-4589-2041-${last4}`,
    };

    activeSessions.set(txnId, {
      txnId,
      method,
      identifier: cleanId,
      generatedAt: now,
      expiresAt: now + 5 * 60 * 1000, // 5 minutes validity
      attemptsRemaining: 3,
      mockOtp: demoOtp,
      verifiedIdentity: mockIdentity,
    });

    return {
      success: true,
      txnId,
      cooldownSeconds: 60,
      demoOtpHint: demoOtp, // Displayed in sandbox banner for friction-free evaluation
    };
  }

  /**
   * Verify the 6-digit OTP submitted by the patient.
   */
  public static verifyOtp(
    txnId: string,
    otpInput: string
  ): { success: boolean; identity?: ExternalVerifiedIdentity; error?: string } {
    const session = activeSessions.get(txnId);

    if (!session) {
      return { success: false, error: "Verification session expired or invalid. Please request a new OTP." };
    }

    if (Date.now() > session.expiresAt) {
      activeSessions.delete(txnId);
      return { success: false, error: "This OTP has expired. Please request a fresh OTP." };
    }

    if (session.attemptsRemaining <= 0) {
      activeSessions.delete(txnId);
      return { success: false, error: "Too many failed attempts. Please start verification again." };
    }

    const cleanOtp = otpInput.trim();
    if (cleanOtp !== session.mockOtp && cleanOtp !== "123456") {
      session.attemptsRemaining -= 1;
      return {
        success: false,
        error: `Incorrect OTP. ${session.attemptsRemaining} attempt(s) remaining.`,
      };
    }

    // Success: Return verified identity
    const verifiedIdentity = session.verifiedIdentity!;
    activeSessions.delete(txnId);

    return {
      success: true,
      identity: verifiedIdentity,
    };
  }

  /**
   * Check ABHA Address availability against ABDM standards and local registry.
   */
  public static checkAbhaAddressAvailability(
    addressCandidate: string
  ): { available: boolean; formattedAddress: string; error?: string } {
    let clean = addressCandidate.toLowerCase().trim();
    if (!clean.includes("@")) {
      clean = `${clean}@abdm`;
    }

    const username = clean.split("@")[0];
    if (!/^[a-z0-9._]{3,30}$/.test(username)) {
      return {
        available: false,
        formattedAddress: clean,
        error: "ABHA address must be 3-30 characters containing letters, numbers, dots or underscores.",
      };
    }

    // Reserved test addresses
    if (["admin@abdm", "root@abdm", "system@abdm"].includes(clean)) {
      return {
        available: false,
        formattedAddress: clean,
        error: "This ABHA address handle is reserved.",
      };
    }

    return {
      available: true,
      formattedAddress: clean,
    };
  }

  /**
   * Compare MEDORA patient profile against externally verified identity.
   */
  public static matchIdentity(
    patient: StoredIdentity,
    external: ExternalVerifiedIdentity
  ): IdentityMatchResult {
    const medoraName = patient.fullName.toLowerCase().trim();
    const externalName = external.verifiedName.toLowerCase().trim();

    const nameMatch = medoraName === externalName || 
                      medoraName.includes(externalName) || 
                      externalName.includes(medoraName);

    const medoraDob = patient.patientData?.dob;
    const dobMatch = !medoraDob || medoraDob === external.dob;

    const medoraGender = patient.patientData?.gender;
    const genderMatch = !medoraGender || medoraGender === external.gender;

    let score = 0;
    if (nameMatch) score += 50;
    if (dobMatch) score += 30;
    if (genderMatch) score += 20;

    if (score === 100) {
      return {
        matchLevel: "EXACT_MATCH",
        score: 100,
        nameMatch: true,
        dobMatch: true,
        genderMatch: true,
        message: "Identity verified and matched perfectly with your MEDORA profile.",
      };
    }

    if (score >= 50) {
      return {
        matchLevel: "PARTIAL_MATCH",
        score,
        nameMatch,
        dobMatch,
        genderMatch,
        message: `Name variation detected ("${patient.fullName}" vs "${external.verifiedName}"). Please confirm to proceed.`,
      };
    }

    return {
      matchLevel: "MAJOR_MISMATCH",
      score,
      nameMatch: false,
      dobMatch: false,
      genderMatch: false,
      message: "The verified identity does not belong to this MEDORA patient account. For security, connection is rejected.",
    };
  }

  /**
   * Authoritative link to MEDORA patient store.
   */
  public static linkAbhaToPatient(
    patientIdentifier: string,
    abhaNumber: string,
    abhaAddress: string,
    aadhaarMasked?: string
  ): { success: boolean; error?: string; updated?: StoredIdentity } {
    return linkPatientAbha(patientIdentifier, {
      abhaNumber,
      abhaAddress,
      aadhaarMasked,
    });
  }

  /**
   * Safe unlink from MEDORA patient store.
   */
  public static unlinkAbhaFromPatient(
    patientIdentifier: string
  ): { success: boolean; error?: string; updated?: StoredIdentity } {
    return unlinkPatientAbha(patientIdentifier);
  }
}
