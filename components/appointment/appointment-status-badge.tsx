"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { AppointmentStatus } from "@/types/database.types";
import { APPOINTMENT_STATUS_MAP } from "@/lib/services/frontend-appointment-service";
import {
  CheckCircle2,
  Clock,
  Activity,
  XCircle,
  RefreshCw,
  AlertTriangle,
  FileCheck2,
  HelpCircle,
} from "lucide-react";

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus;
  className?: string;
  showIcon?: boolean;
}

export function AppointmentStatusBadge({
  status,
  className,
  showIcon = true,
}: AppointmentStatusBadgeProps) {
  const meta = APPOINTMENT_STATUS_MAP[status] || {
    label: status,
    variant: "secondary" as const,
    description: "",
  };

  const renderIcon = () => {
    switch (status) {
      case "CONFIRMED":
        return <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600 shrink-0" aria-hidden="true" />;
      case "CHECKED_IN":
      case "WAITING":
        return <Clock className="h-3 w-3 mr-1 text-amber-600 shrink-0" aria-hidden="true" />;
      case "IN_CONSULTATION":
        return <Activity className="h-3 w-3 mr-1 text-teal-600 shrink-0 animate-pulse" aria-hidden="true" />;
      case "COMPLETED":
        return <FileCheck2 className="h-3 w-3 mr-1 text-teal-700 shrink-0" aria-hidden="true" />;
      case "CANCELLED":
        return <XCircle className="h-3 w-3 mr-1 text-red-600 shrink-0" aria-hidden="true" />;
      case "RESCHEDULED":
        return <RefreshCw className="h-3 w-3 mr-1 text-slate-600 shrink-0" aria-hidden="true" />;
      case "NO_SHOW":
        return <AlertTriangle className="h-3 w-3 mr-1 text-red-600 shrink-0" aria-hidden="true" />;
      default:
        return <HelpCircle className="h-3 w-3 mr-1 text-slate-500 shrink-0" aria-hidden="true" />;
    }
  };

  return (
    <Badge
      variant={meta.variant}
      className={`inline-flex items-center font-semibold text-[11px] px-2.5 py-0.5 rounded-full ${className || ""}`}
      title={meta.description}
      aria-label={`Status: ${meta.label}`}
    >
      {showIcon && renderIcon()}
      <span>{meta.label}</span>
    </Badge>
  );
}
