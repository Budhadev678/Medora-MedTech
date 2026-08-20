import * as React from "react";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  AlertTriangle, 
  XCircle, 
  FileCheck, 
  Package, 
  Loader2,
  Activity,
  Droplet
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusType = 
  // General
  | "active" 
  | "completed" 
  | "pending" 
  | "cancelled"
  // Appointment
  | "booked" 
  | "in_consultation" 
  | "waiting"
  // Lab
  | "ordered" 
  | "sample_collected" 
  | "testing" 
  | "report_ready"
  // Pharmacy
  | "preparing" 
  | "ready_for_pickup" 
  | "dispensed"
  // Billing
  | "generated" 
  | "paid" 
  | "disputed"
  // Emergency Triage
  | "critical" 
  | "high" 
  | "moderate" 
  | "low"
  // Doctor Availability
  | "available" 
  | "busy" 
  | "on_call" 
  | "emergency_occupied" 
  | "off_duty";

interface StatusBadgeProps {
  status: StatusType | string;
  customLabel?: string;
  className?: string;
  size?: "sm" | "default";
}

export function StatusBadge({ status, customLabel, className, size = "default" }: StatusBadgeProps) {
  const normalized = status?.toLowerCase() || "";

  // Dynamic status mapping ensuring: Color + Icon + Clear Label
  const getStatusConfig = () => {
    switch (normalized) {
      // Success / Completed
      case "completed":
      case "dispensed":
      case "paid":
      case "available":
        return {
          variant: "success" as const,
          icon: <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />,
          label: customLabel || (normalized === "paid" ? "Paid in Full" : normalized === "dispensed" ? "Dispensed" : "Completed"),
        };

      case "report_ready":
        return {
          variant: "success" as const,
          icon: <FileCheck className="h-3 w-3 mr-1 text-emerald-600" />,
          label: customLabel || "Report Approved",
        };

      // In-Progress / Warnings
      case "pending":
      case "waiting":
      case "sample_collected":
      case "preparing":
      case "busy":
        return {
          variant: "warning" as const,
          icon: <Clock className="h-3 w-3 mr-1 text-amber-600" />,
          label: customLabel || (normalized === "sample_collected" ? "Sample Collected" : normalized === "preparing" ? "Medication Packaging" : "In Queue"),
        };

      case "testing":
        return {
          variant: "info" as const,
          icon: <Loader2 className="h-3 w-3 mr-1 animate-spin text-blue-600" />,
          label: customLabel || "In Testing",
        };

      case "ready_for_pickup":
        return {
          variant: "teal" as const,
          icon: <Package className="h-3 w-3 mr-1 text-teal-700" />,
          label: customLabel || "Ready for Pickup",
        };

      case "booked":
      case "in_consultation":
        return {
          variant: "info" as const,
          icon: <Activity className="h-3 w-3 mr-1 text-blue-600" />,
          label: customLabel || (normalized === "in_consultation" ? "In Consultation" : "Confirmed"),
        };

      // Emergency Triage
      case "critical":
        return {
          variant: "emergency" as const,
          icon: <AlertTriangle className="h-3 w-3 mr-1 text-red-700 animate-bounce" />,
          label: customLabel || "Triage Level 1: Critical",
        };
      case "high":
        return {
          variant: "warning" as const,
          icon: <AlertTriangle className="h-3 w-3 mr-1 text-orange-600" />,
          label: customLabel || "Triage Level 2: Urgent",
        };
      case "moderate":
        return {
          variant: "warning" as const,
          icon: <AlertCircle className="h-3 w-3 mr-1 text-yellow-600" />,
          label: customLabel || "Triage Level 3: Moderate",
        };
      case "low":
        return {
          variant: "success" as const,
          icon: <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />,
          label: customLabel || "Triage Level 4: Routine",
        };

      // Disputed / Error / Cancelled
      case "cancelled":
      case "disputed":
      case "emergency_occupied":
        return {
          variant: "destructive" as const,
          icon: <XCircle className="h-3 w-3 mr-1 text-red-600" />,
          label: customLabel || (normalized === "disputed" ? "Dispute Filed" : normalized === "emergency_occupied" ? "Emergency Occupied" : "Cancelled"),
        };

      default:
        return {
          variant: "secondary" as const,
          icon: <AlertCircle className="h-3 w-3 mr-1 text-slate-500" />,
          label: customLabel || status.replace(/_/g, " ").toUpperCase(),
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge
      variant={config.variant}
      className={cn(
        "inline-flex items-center font-medium capitalize",
        size === "sm" ? "px-2 py-0.2 text-[11px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
}
