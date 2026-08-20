# 🛡️ MEDORA — Security, Identity Isolation & RLS Policy

## 1. Zero Cross-Account Leakage Policy
- All authenticated sessions resolve through `auth.uid()`.
- Unauthenticated requests default to `null`, ensuring no stale persona or fallback data is rendered.
- On logout (`signOut()`), all cached context, localStorage tokens, and browser cookies are completely cleared.

## 2. In-Depth Row-Level Security (RLS)
- **`patients` Table:** Protected by `USING (user_id = auth.uid())`. Patient A cannot access Patient B's data via URL parameter or direct query manipulation.
- **`doctors` Table:** Public can view active doctor profiles for discovery, but update/write permissions require `user_id = auth.uid()`.
- **`doctor_affiliations` Table:** Affiliations can only be managed by the authentic doctor linked via `user_id = auth.uid()`.
- **`audit_logs` Table:** Append-only by users, readable only by platform administrators (`role = 'admin'`).

## 3. IDOR & Parameter Tampering Protection
- Database queries do not blindly trust client-supplied query parameters (e.g. `patient_id`). They are evaluated against the verified session `auth.uid()`.

## 4. Multi-Factor Centralized Access Decision Engine (`AccessEngine`)
- Access to clinical resources requires:
  1. Authenticated actor with active account status.
  2. Doctor/staff active affiliation with the requesting organization (`organizationId`).
  3. Recorded care relationship between the patient and organization.
  4. Active, non-expired, non-revoked patient consent grant (`CNS-*`).
  5. Requested data category explicitly included in `granted_scopes`.

## 5. Sanitized Append-Only Audit Ledger
- Immutable audit trail recording every consent grant, decline, revocation, and identity correction.
- Strict PII redaction: Aadhaar numbers, OTP codes, raw passwords, and secret tokens are stripped before persistence.

## 6. Verified Identity Protection & Correction Pipeline
- Patients cannot directly overwrite verified identity fields (`fullName`, `dob`, `gender`, `bloodGroup`, `aadhaarMasked`).
- All changes must pass through the `identity_correction_requests` verification workflow.

