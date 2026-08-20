// ============================================================
// MEDORA — CENTRALIZED ACCESS DECISION ENGINE (PHASE 3.3 & 3.4)
// Multi-Factor Authorization: Actor + Org + Role + Relationship + Consent + Scope
// ============================================================

import { StoredIdentity } from "@/lib/data/identity-store";
import { getPatientConsents } from "@/lib/data/consent-store";
import { getPatientOrganizationRelationships } from "@/lib/data/relationship-store";
import { AccessCheckResult, AccessDecisionType, ConsentPurpose, ConsentDataScope } from "@/types/database.types";
import { logAuditEvent } from "@/lib/data/audit-store";

export class AccessEngine {
  /**
   * Authoritative Access Decision Evaluator.
   * Evaluates who is requesting, for which patient, at which organization, for what purpose, and for what data scope.
   */
  public static evaluateAccess(params: {
    actor: StoredIdentity | null;
    targetPatientId: string;
    organizationId?: string;
    purpose?: ConsentPurpose;
    requiredScope?: ConsentDataScope;
  }): AccessCheckResult {
    const now = new Date().toISOString();
    const { actor, targetPatientId, organizationId, purpose, requiredScope } = params;

    // 1. Check Authentication
    if (!actor) {
      return {
        decision: "NOT_AUTHORIZED",
        allowed: false,
        reason: "User is not authenticated.",
        evaluated_at: now,
      };
    }

    // 2. Check Account Status
    if (actor.accountStatus !== "active") {
      return {
        decision: "NOT_AUTHORIZED",
        allowed: false,
        reason: `Account is ${actor.accountStatus}. Access denied.`,
        evaluated_at: now,
      };
    }

    // 3. Patient Self-Access (Patient viewing their own records)
    if (actor.role === "patient" && actor.identifier === targetPatientId) {
      return {
        decision: "ALLOW",
        allowed: true,
        reason: "Patient has full sovereign access to their own medical record.",
        evaluated_at: now,
      };
    }

    // 4. Cross-Patient Attempt (Patient A trying to view Patient B)
    if (actor.role === "patient" && actor.identifier !== targetPatientId) {
      return {
        decision: "DENY",
        allowed: false,
        reason: "Patients cannot access health data belonging to other patient accounts.",
        evaluated_at: now,
      };
    }

    // 5. Professional Access Evaluation
    if (!organizationId) {
      return {
        decision: "NOT_AUTHORIZED",
        allowed: false,
        reason: "Organization context is required for professional healthcare data access.",
        evaluated_at: now,
      };
    }

    // 5a. Verify Organization Membership & Active Status
    if (actor.role === "doctor" && actor.doctorData) {
      const activeAffiliation = actor.doctorData.affiliations.find(
        (a) => (a.organizationId === organizationId || a.organizationIdentifier === organizationId) &&
               a.status === "active"
      );
      if (!activeAffiliation) {
        return {
          decision: "NOT_AUTHORIZED",
          allowed: false,
          reason: `Practitioner is not an active member of organization ${organizationId}.`,
          evaluated_at: now,
        };
      }
    }

    // 5b. Verify Patient ↔ Organization Care Relationship
    const relationships = getPatientOrganizationRelationships(targetPatientId);
    const orgRel = relationships.find(
      (r) => (r.organization_id === organizationId) && r.status === "ACTIVE"
    );

    if (!orgRel) {
      return {
        decision: "RELATIONSHIP_REQUIRED",
        allowed: false,
        reason: `No active care relationship exists between patient ${targetPatientId} and organization ${organizationId}.`,
        evaluated_at: now,
      };
    }

    // 5c. Verify Patient Consent
    const consents = getPatientConsents(targetPatientId);
    const orgConsents = consents.filter(
      (c) => c.organization_id === organizationId || c.requester_id === actor.identifier
    );

    if (orgConsents.length === 0) {
      return {
        decision: "CONSENT_REQUIRED",
        allowed: false,
        reason: "Explicit patient consent is required to access this patient's records.",
        evaluated_at: now,
        relationship_id: orgRel.id,
      };
    }

    // Check for an active, validly unexpired consent grant
    const activeGrant = orgConsents.find(
      (c) => c.status === "GRANTED" && new Date(c.expires_at).getTime() >= Date.now()
    );

    if (activeGrant) {
      // 5d. Verify Scope Authorization
      if (requiredScope && !activeGrant.granted_scopes.includes(requiredScope)) {
        return {
          decision: "SCOPE_NOT_ALLOWED",
          allowed: false,
          reason: `Consent scope does not include requested data category (${requiredScope}). Authorized scopes: ${activeGrant.granted_scopes.join(", ")}.`,
          evaluated_at: now,
          consent_id: activeGrant.id,
          authorized_scopes: activeGrant.granted_scopes,
        };
      }

      // All Checks Passed: ALLOW
      return {
        decision: "ALLOW",
        allowed: true,
        reason: `Authorized under active consent ${activeGrant.id} for purpose: ${activeGrant.purpose}.`,
        evaluated_at: now,
        consent_id: activeGrant.id,
        relationship_id: orgRel.id,
        authorized_scopes: activeGrant.granted_scopes,
      };
    }

    // No active grant found: inspect most recent consent to provide exact rejection reason
    const latestConsent = orgConsents[0];

    if (latestConsent.status === "REVOKED") {
      return {
        decision: "CONSENT_REVOKED",
        allowed: false,
        reason: "Patient has explicitly revoked access permissions for this organization.",
        evaluated_at: now,
        consent_id: latestConsent.id,
      };
    }

    if (latestConsent.status === "EXPIRED" || new Date(latestConsent.expires_at).getTime() < Date.now()) {
      return {
        decision: "CONSENT_EXPIRED",
        allowed: false,
        reason: "The time-bound consent granted by the patient has expired.",
        evaluated_at: now,
        consent_id: latestConsent.id,
      };
    }

    return {
      decision: "DENY",
      allowed: false,
      reason: `Consent status is ${latestConsent.status.toLowerCase()}. Access cannot be granted.`,
      evaluated_at: now,
      consent_id: latestConsent.id,
    };
  }
}
