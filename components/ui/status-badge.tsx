"use client";

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
import { useLocalization } from "@/lib/localization";

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
  const { formatStatus } = useLocalization();
  const normalized = status?.toLowerCase() || "";
  const localizedDefault = formatStatus(normalized);

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
          label: customLabel || localizedDefault,
        };

      case "report_ready":
        return {
          variant: "success" as const,
          icon: <FileCheck className="h-3 w-3 mr-1 text-emerald-600" />,
          label: customLabel || localizedDefault,
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
          label: customLabel || localizedDefault,
        };

      case "testing":
        return {
          variant: "info" as const,
          icon: <Loader2 className="h-3 w-3 mr-1 animate-spin text-blue-600" />,
          label: customLabel || localizedDefault,
        };

      case "ready_for_pickup":
        return {
          variant: "teal" as const,
          icon: <Package className="h-3 w-3 mr-1 text-teal-700" />,
          label: customLabel || localizedDefault,
        };

      case "booked":
      case "in_consultation":
        return {
          variant: "info" as const,
          icon: <Activity className="h-3 w-3 mr-1 text-blue-600" />,
          label: customLabel || localizedDefault,
        };

      // Emergency Triage
      case "critical":
        return {
          variant: "emergency" as const,
          icon: <AlertTriangle className="h-3 w-3 mr-1 text-red-700 animate-bounce" />,
          label: customLabel || localizedDefault,
        };
      case "high":
        return {
          variant: "warning" as const,
          icon: <AlertTriangle className="h-3 w-3 mr-1 text-orange-600" />,
          label: customLabel || localizedDefault,
        };
      case "moderate":
        return {
          variant: "warning" as const,
          icon: <AlertCircle className="h-3 w-3 mr-1 text-yellow-600" />,
          label: customLabel || localizedDefault,
        };
      case "low":
        return {
          variant: "success" as const,
          icon: <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />,
          label: customLabel || localizedDefault,
        };

      // Disputed / Error / Cancelled
      case "cancelled":
      case "disputed":
      case "emergency_occupied":
        return {
          variant: "destructive" as const,
          icon: <XCircle className="h-3 w-3 mr-1 text-red-600" />,
          label: customLabel || localizedDefault,
        };

      default:
        return {
          variant: "secondary" as const,
          icon: <AlertCircle className="h-3 w-3 mr-1 text-slate-500" />,
          label: customLabel || localizedDefault,
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
