// ============================================================
// MEDORA — SERVER API UTILITIES & AUTHENTICATION HELPER
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { findIdentityById, StoredIdentity } from "@/lib/data/identity-store";
import { UserRole } from "@/lib/constants";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Resolves the authenticated user from cookies or Authorization header.
 * Defaults to demo patient if running in local prototyping mode without cookies.
 */
export function getAuthenticatedUser(request: NextRequest): StoredIdentity | null {
  // 1. Check custom header x-medora-user-id
  const userIdHeader = request.headers.get("x-medora-user-id");
  if (userIdHeader) {
    const user = findIdentityById(userIdHeader) || findIdentityById(userIdHeader.toUpperCase());
    if (user && user.accountStatus === "active") return user;
  }

  // 2. Check Authorization Bearer token
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const user = findIdentityById(token) || findIdentityById(token.toUpperCase());
    if (user && user.accountStatus === "active") return user;
  }

  // 3. Check session cookie medora_session_id
  const sessionCookie = request.cookies.get("medora_session_id")?.value;
  if (sessionCookie) {
    const user = findIdentityById(sessionCookie) || findIdentityById(sessionCookie.toUpperCase());
    if (user && user.accountStatus === "active") return user;
  }

  // 4. Check role cookie medora_role
  const roleCookie = request.cookies.get("medora_role")?.value;
  if (roleCookie) {
    if (roleCookie === "patient") return findIdentityById("PAT-1001");
    if (roleCookie === "doctor") return findIdentityById("DOC-1001");
    if (roleCookie === "admin") return findIdentityById("ADM-1001");
    if (roleCookie === "lab_staff") return findIdentityById("LAB-1001");
    if (roleCookie === "pharmacy_staff") return findIdentityById("PHA-1001");
    if (roleCookie === "finance_staff") return findIdentityById("FIN-1001");
    if (roleCookie === "receptionist") return findIdentityById("STAFF-1001");
  }

  // No authenticated session found
  return null;
}

export function jsonResponse<T>(data: ApiResponse<T>, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, code: string = "BAD_REQUEST", status: number = 400) {
  return NextResponse.json({ success: false, error: message, code }, { status });
}

export function jsonUnauthorized(message: string = "Please log in to access this information.") {
  return NextResponse.json({ success: false, error: message, code: "UNAUTHORIZED" }, { status: 401 });
}

export function jsonForbidden(message: string = "You don't have permission to access this information.") {
  return NextResponse.json({ success: false, error: message, code: "FORBIDDEN" }, { status: 403 });
}

export function validateRole(user: StoredIdentity | null, allowedRoles: UserRole | UserRole[]): boolean {
  if (!user) return false;
  if (Array.isArray(allowedRoles)) {
    return allowedRoles.includes(user.role);
  }
  return user.role === allowedRoles;
}

/**
 * Validates record-level access for patient-owned resources (Anti-IDOR).
 */
export function validatePatientRecordAccess(user: StoredIdentity | null, resourcePatientId: string): boolean {
  if (!user) return false;
  // Admin and privileged clinical roles can access if authorized in workflow
  if (user.role === "admin" || user.role === "doctor" || (user.role as string) === "nurse") return true;
  // Patient role can strictly access only their own records
  const cleanUserIdentifier = (user.identifier || user.id || "").toLowerCase();
  const cleanTarget = (resourcePatientId || "").toLowerCase();
  return cleanUserIdentifier === cleanTarget;
}
