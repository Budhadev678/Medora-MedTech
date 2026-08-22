"use client";

import React from "react";
import { Search, Filter, Calendar } from "lucide-react";
import { AppointmentStatus } from "@/types/database.types";
import { APPOINTMENT_STATUS_MAP } from "@/lib/services/frontend-appointment-service";

interface AppointmentFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: AppointmentStatus | "ALL";
  onStatusChange: (s: AppointmentStatus | "ALL") => void;
  dateFilter?: string;
  onDateChange?: (d: string) => void;
  placeholder?: string;
}

export function AppointmentFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dateFilter,
  onDateChange,
  placeholder = "Search by ID, patient, doctor, or department...",
}: AppointmentFilterBarProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-700/20"
        />
      </div>

      {/* Date Filter (Optional) */}
      {onDateChange && (
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <input
            type="date"
            value={dateFilter || ""}
            onChange={(e) => onDateChange(e.target.value)}
            className="h-9 px-2.5 rounded-lg border border-slate-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-700/20"
          />
        </div>
      )}

      {/* Status Filter */}
      <div className="flex items-center gap-1.5">
        <Filter className="h-3.5 w-3.5 text-slate-400" />
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as any)}
          className="h-9 px-3 rounded-lg border border-slate-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 bg-white"
        >
          <option value="ALL">All Statuses</option>
          {Object.entries(APPOINTMENT_STATUS_MAP).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
