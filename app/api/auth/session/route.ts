import { NextRequest } from "next/server";
import { getAuthenticatedUser, jsonResponse, jsonUnauthorized } from "@/lib/api/api-utils";

export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) {
    return jsonUnauthorized();
  }
  return jsonResponse({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      identifier: user.identifier,
      organizationName: user.organizationName,
    },
  });
}
