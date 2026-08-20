"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Truck, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Activity, 
  PhoneCall, 
  Building2, 
  CheckCircle2, 
  Navigation,
  ShieldAlert
} from "lucide-react";
import { WorkspaceHeader } from "@/components/professional/workspace-header";
import { MetricCard } from "@/components/professional/metric-card";
import { FilterBar } from "@/components/professional/filter-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default function AmbulanceDispatchPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const dispatchTickets = [
    {
      id: "DISP-1001",
      unit: "AMB-Unit-04 (ALS)",
      type: "Road Traffic Accident",
      location: "NH-16, Khandagiri Crossing (Bhubaneswar)",
      destinationHospital: "City Hospital Emergency Trauma Unit",
      preAlertStatus: "PRE-ALERT SENT",
      eta: "6 mins",
      status: "IN_TRANSIT",
    },
    {
      id: "DISP-1002",
      unit: "AMB-Unit-02 (BLS)",
      type: "Inter-Hospital ICU Transfer",
      location: "Green Care Clinic → City Hospital",
      destinationHospital: "City Hospital Cardiology ICU",
      preAlertStatus: "BED RESERVED",
      eta: "14 mins",
      status: "IN_TRANSIT",
    },
    {
      id: "DISP-1003",
      unit: "AMB-Unit-07 (ALS)",
      type: "Emergency Cardiac Distress",
      location: "Saheed Nagar, Lane 4",
      destinationHospital: "City Hospital Emergency Room",
      preAlertStatus: "COMPLETED",
      eta: "Delivered",
      status: "COMPLETED",
    },
  ];

  const filteredTickets = dispatchTickets.filter(t => {
    const matchesSearch = t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.destinationHospital.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <RoleGuard allowedRoles={["ambulance_staff", "emergency_staff", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150">
        <WorkspaceHeader
          title="Emergency Dispatch Console"
          description="Real-time road accident response, ambulance fleet dispatch, trauma patient pre-alert, and inter-hospital emergency transit."
          facilityContext={user?.organizationName || "FastTrack Emergency Transit (AMB-1001)"}
          badgeText="Live Fleet Dispatch"
          actions={
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-500">
                {user?.identifier || "AMB-1001"}
              </span>
            </div>
          }
        />

        {/* Operational Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Active Emergency Dispatches"
            value="2 In Transit"
            subtext="1 Trauma • 1 ICU Transfer"
            badge="Live"
            icon={<Truck className="h-4 w-4 text-red-600" />}
          />
          <MetricCard
            label="Available Ambulance Fleet"
            value="5 Ready"
            subtext="3 ALS • 2 BLS Units"
            icon={<Activity className="h-4 w-4 text-emerald-600" />}
          />
          <MetricCard
            label="Average Response Time"
            value="7.8 mins"
            subtext="Within National Golden Hour"
            icon={<Clock className="h-4 w-4 text-blue-600" />}
          />
          <MetricCard
            label="Hospital Pre-Alerts Sent"
            value="100%"
            subtext="Live telemetry & bed prep"
            icon={<ShieldAlert className="h-4 w-4 text-amber-600" />}
          />
        </div>

        {/* Active Emergency Dispatch Queue */}
        <Card className="bg-white">
          <CardHeader className="p-4 pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Active Emergency Transit & Dispatch Tickets
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Ambulance telemetry, patient destination hospital, and live emergency room pre-alerts.
                </CardDescription>
              </div>

              <FilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search ticket ID, unit or location..."
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                statusOptions={[
                  { label: "All Tickets", value: "all" },
                  { label: "In Transit", value: "in_transit" },
                  { label: "Completed", value: "completed" },
                ]}
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Ticket ID</TableHead>
                  <TableHead className="text-xs">Ambulance Unit</TableHead>
                  <TableHead className="text-xs">Incident Type</TableHead>
                  <TableHead className="text-xs">Pickup Location</TableHead>
                  <TableHead className="text-xs">Destination Hospital</TableHead>
                  <TableHead className="text-xs">Hospital Pre-Alert</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id} className="text-xs">
                    <TableCell className="font-mono font-bold text-red-900">{ticket.id}</TableCell>
                    <TableCell className="font-semibold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Truck className="h-3.5 w-3.5 text-red-600" />
                        <span>{ticket.unit}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] text-red-800 border-red-200 bg-red-50/50">
                        {ticket.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600 max-w-[200px] truncate">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{ticket.location}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-900 font-medium">
                      {ticket.destinationHospital}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        <Activity className="h-2.5 w-2.5" /> {ticket.preAlertStatus}
                      </span>
                    </TableCell>
                    <TableCell>
                      {ticket.status === "IN_TRANSIT" ? (
                        <Badge variant="destructive" className="text-[10px] animate-pulse">
                          ● ETA {ticket.eta}
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-[10px]">
                          ● Completed
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Phase 18 Placeholder */}
        <EmptyState
          icon={<Truck className="h-6 w-6 text-red-600" />}
          title="Road Accident Detection & Autonomous Transit Engine"
          description="GPS collision telemetry ingestion, automated ambulance unit allocation, and emergency ICU pre-arrival notifications will be implemented in Phase 18."
          phase="Phase 18 — Road Accident Simulation & Transit Pre-Alert"
          actionHref="/emergency"
          actionLabel="View Emergency Trauma Unit"
        />
      </div>
    </RoleGuard>
  );
}
