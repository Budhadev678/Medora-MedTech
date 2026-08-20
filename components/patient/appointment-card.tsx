"use client";

import React from "react";
import { Calendar, Clock, MapPin, Stethoscope, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface PatientAppointmentProps {
  id: string;
  doctorName: string;
  specialization: string;
  hospitalName: string;
  departmentName: string;
  date: string;
  time: string;
  tokenNumber?: string;
  opdRoom?: string;
  status: "confirmed" | "completed" | "cancelled" | "pending";
  type?: "In-Person OPD" | "Follow-up" | "Emergency";
}

export function AppointmentCard({
  id,
  doctorName,
  specialization,
  hospitalName,
  departmentName,
  date,
  time,
  tokenNumber,
  opdRoom,
  status,
  type = "In-Person OPD",
}: PatientAppointmentProps) {
  const getStatusBadge = () => {
    switch (status) {
      case "confirmed":
        return <Badge variant="teal" className="text-[10px]">● Confirmed</Badge>;
      case "completed":
        return <Badge variant="success" className="text-[10px]">● Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="text-[10px]">● Cancelled</Badge>;
      default:
        return <Badge variant="warning" className="text-[10px]">● Pending</Badge>;
    }
  };

  return (
    <Card className="bg-white border-slate-200 hover:border-teal-300 transition-all shadow-2xs">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded font-mono">
            {id}
          </span>
          {getStatusBadge()}
        </div>

        <div className="flex items-start gap-3 mt-2">
          <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 flex-shrink-0">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm font-bold text-slate-900 truncate">
              {doctorName}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 font-medium truncate">
              {specialization} • {departmentName}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2 space-y-2.5 text-xs text-slate-600">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <Calendar className="h-3.5 w-3.5 text-teal-600" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>{time}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1 truncate max-w-[200px]">
            <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">{hospitalName} {opdRoom ? `(${opdRoom})` : ""}</span>
          </div>
          {tokenNumber && (
            <span className="font-bold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded font-mono">
              Token #{tokenNumber}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
