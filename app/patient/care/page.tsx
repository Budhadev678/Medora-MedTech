"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Stethoscope,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Filter,
  ChevronRight,
  Activity,
  Heart,
  FlaskConical,
  Pill,
  Sparkles,
  CheckCircle2,
  X,
  Phone,
  ShieldCheck
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getRemainingCurrentWeekDates } from "@/lib/utils";

interface CareItem {
  id: string;
  type: "DOCTOR" | "SPECIALTY" | "HOSPITAL" | "SERVICE";
  title: string;
  subtitle: string;
  specialty: string;
  facility: string;
  location: string;
  fee: string;
  consultationType: "In-Person" | "Video" | "Both";
  availableThisWeek: boolean;
  nextAvailableSlot: string;
  rating?: string;
  tags: string[];
}

const CARE_CATALOG: CareItem[] = [
  {
    id: "DOC-1001",
    type: "DOCTOR",
    title: "Dr. Ananya Sharma",
    subtitle: "MD, DM (Cardiology), AIIMS • 12+ Yrs Exp",
    specialty: "Cardiology",
    facility: "City Hospital Trauma Center",
    location: "Plot 102, Unit 4, Bhubaneswar",
    fee: "₹800",
    consultationType: "Both",
    availableThisWeek: true,
    nextAvailableSlot: "Today, 10:30 AM",
    rating: "4.9 ★ (120+ reviews)",
    tags: ["heart", "cardio", "chest pain", "ecg", "hypertension"],
  },
  {
    id: "DOC-1002",
    type: "DOCTOR",
    title: "Dr. Rajesh Sharma",
    subtitle: "MBBS, MD (General Medicine) • 16+ Yrs Exp",
    specialty: "General Medicine",
    facility: "City Hospital",
    location: "Bhubaneswar",
    fee: "₹600",
    consultationType: "In-Person",
    availableThisWeek: true,
    nextAvailableSlot: "Tomorrow, 09:00 AM",
    rating: "4.8 ★ (95+ reviews)",
    tags: ["fever", "cough", "infection", "diabetes", "primary care"],
  },
  {
    id: "MULTI-1001",
    type: "DOCTOR",
    title: "Dr. Rahul Sharma",
    subtitle: "MD (General Medicine) • 8+ Yrs Exp",
    specialty: "General Medicine",
    facility: "Green Care Clinic",
    location: "Saheed Nagar, Bhubaneswar",
    fee: "₹500",
    consultationType: "Both",
    availableThisWeek: true,
    nextAvailableSlot: "Today, 02:00 PM",
    rating: "4.7 ★ (60+ reviews)",
    tags: ["general", "fever", "checkup", "medicine"],
  },
  {
    id: "DOC-1003",
    type: "DOCTOR",
    title: "Dr. Priya Das",
    subtitle: "MS (General Surgery) • 10+ Yrs Exp",
    specialty: "General Surgery",
    facility: "City Hospital",
    location: "Bhubaneswar",
    fee: "₹900",
    consultationType: "In-Person",
    availableThisWeek: true,
    nextAvailableSlot: "Friday, 11:00 AM",
    rating: "4.9 ★ (80+ reviews)",
    tags: ["surgery", "appendix", "hernia", "wound"],
  },
  {
    id: "HSP-1001",
    type: "HOSPITAL",
    title: "City Hospital Multispeciality & Trauma Center",
    subtitle: "24/7 ER, ICU, Cardiology, Surgery, Diagnostics",
    specialty: "Multispeciality",
    facility: "City Hospital Network",
    location: "Plot 102, Unit 4, Bhubaneswar",
    fee: "Varies by department",
    consultationType: "Both",
    availableThisWeek: true,
    nextAvailableSlot: "24/7 Emergency & Regular OPD",
    tags: ["hospital", "emergency", "icu", "trauma", "bhubaneswar"],
  },
  {
    id: "HSP-1002",
    type: "HOSPITAL",
    title: "Green Care Hospital & Research Center",
    subtitle: "Super-Speciality Inpatient & Surgical Suites",
    specialty: "Super-Speciality",
    facility: "Green Care Network",
    location: "Sector 9, CDA, Cuttack",
    fee: "Varies by department",
    consultationType: "In-Person",
    availableThisWeek: true,
    nextAvailableSlot: "Open for OPD booking",
    tags: ["hospital", "cuttack", "super speciality", "surgery"],
  },
  {
    id: "SRV-1001",
    type: "SERVICE",
    title: "Complete Blood Count (CBC) Diagnostic Test",
    subtitle: "NABL Certified Pathology Lab • Digital Report in 6 Hours",
    specialty: "Pathology / Diagnostics",
    facility: "City Hospital Diagnostic Lab",
    location: "Bhubaneswar",
    fee: "₹350",
    consultationType: "In-Person",
    availableThisWeek: true,
    nextAvailableSlot: "Walk-in Today, 08:00 AM - 08:00 PM",
    tags: ["blood test", "cbc", "lab", "pathology", "hemoglobin"],
  },
  {
    id: "SRV-1002",
    type: "SERVICE",
    title: "12-Lead Electrocardiogram (ECG) & Review",
    subtitle: "Cardiac Rhythm Screening with Specialist Review",
    specialty: "Cardiology Diagnostics",
    facility: "City Hospital Cardiology Wing",
    location: "Bhubaneswar",
    fee: "₹500",
    consultationType: "In-Person",
    availableThisWeek: true,
    nextAvailableSlot: "Available Daily",
    tags: ["ecg", "heart test", "cardio", "chest pain screening"],
  },
];

export default function PatientFindCarePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"ALL" | "DOCTOR" | "HOSPITAL" | "SERVICE">("ALL");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("ALL");
  const [availableOnly, setAvailableOnly] = useState<boolean>(true);
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);

  const specialtiesList = [
    "ALL",
    "Cardiology",
    "General Medicine",
    "General Surgery",
    "Pathology / Diagnostics",
    "Multispeciality"
  ];

  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CARE_CATALOG.filter((item) => {
      // Type match
      if (selectedType !== "ALL" && item.type !== selectedType) return false;

      // Specialty match
      if (selectedSpecialty !== "ALL" && item.specialty !== selectedSpecialty) return false;

      // Availability match
      if (availableOnly && !item.availableThisWeek) return false;

      // Text query match
      if (q) {
        const inTitle = item.title.toLowerCase().includes(q);
        const inSub = item.subtitle.toLowerCase().includes(q);
        const inSpec = item.specialty.toLowerCase().includes(q);
        const inFac = item.facility.toLowerCase().includes(q);
        const inLoc = item.location.toLowerCase().includes(q);
        const inTags = item.tags.some(t => t.toLowerCase().includes(q));
        if (!inTitle && !inSub && !inSpec && !inFac && !inLoc && !inTags) {
          return false;
        }
      }

      return true;
    });
  }, [query, selectedType, selectedSpecialty, availableOnly]);

  const handleBook = (item: CareItem) => {
    if (item.type === "DOCTOR") {
      router.push(`/patient/appointments/book?doctorId=${item.id}`);
    } else {
      router.push(`/patient/appointments/book`);
    }
  };

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150 max-w-4xl mx-auto pb-24">
        {/* Top Search Hero */}
        <div className="rounded-2xl border border-teal-200 bg-linear-to-r from-teal-50/80 to-emerald-50/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
              <Search className="h-4 w-4 text-teal-600" /> Find Healthcare & Specialists
            </span>
            <Badge variant="outline" className="text-[10px] border-teal-300 text-teal-800">
              Current-Week Booking Only
            </Badge>
          </div>

          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Search Doctors, Specialists, Hospitals & Diagnostic Services
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Find certified doctors and healthcare facilities with real-time slot availability for this current week.
          </p>

          {/* Unified Search Input */}
          <div className="relative pt-1">
            <Search className="absolute left-3.5 top-4 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by doctor name, specialty (e.g. Cardiology), hospital, or diagnostic test..."
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-teal-300 bg-white text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 shadow-xs"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-4 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs pt-1">
            {(["ALL", "DOCTOR", "HOSPITAL", "SERVICE"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                  selectedType === t
                    ? "bg-teal-800 text-white shadow-xs"
                    : "bg-white/80 border border-teal-200 text-teal-900 hover:bg-white"
                }`}
              >
                {t === "ALL" ? "All Results" : t === "DOCTOR" ? "Doctors" : t === "HOSPITAL" ? "Hospitals" : "Diagnostic Services"}
              </button>
            ))}
          </div>
        </div>

        {/* Filters Summary & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700">Specialty:</span>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="p-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 font-medium"
            >
              {specialtiesList.map((s) => (
                <option key={s} value={s}>
                  {s === "ALL" ? "All Specialties" : s}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-200">
              <input
                type="checkbox"
                id="availCheck"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <label htmlFor="availCheck" className="text-slate-700 font-semibold cursor-pointer">
                Available this week only
              </label>
            </div>
          </div>

          <span className="text-slate-400 text-[11px] self-end sm:self-center">
            Found {filteredResults.length} options
          </span>
        </div>

        {/* Results List */}
        <div className="space-y-3">
          {filteredResults.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400 text-xs space-y-2">
              <Search className="h-8 w-8 mx-auto text-slate-300 stroke-[1.5]" />
              <p className="font-bold text-slate-700 text-sm">No care options matched your search.</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Try adjusting your search terms or clearing specialty filters.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setSelectedType("ALL");
                  setSelectedSpecialty("ALL");
                  setAvailableOnly(false);
                }}
                className="rounded-xl text-xs mt-2"
              >
                Reset All Filters
              </Button>
            </div>
          ) : (
            filteredResults.map((item) => (
              <Card
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 transition-all overflow-hidden"
              >
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={item.type === "DOCTOR" ? "default" : item.type === "HOSPITAL" ? "outline" : "secondary"}
                        className="text-[10px] font-bold uppercase"
                      >
                        {item.type}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-600">
                        {item.specialty}
                      </Badge>
                      {item.consultationType && (
                        <span className="text-[10px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md font-semibold">
                          {item.consultationType} Consultation
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-600">{item.subtitle}</p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap pt-0.5">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        {item.facility}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {item.location}
                      </span>
                      <span className="font-bold text-slate-800">Fee: {item.fee}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50/60 p-1.5 rounded-lg w-fit mt-1">
                      <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="font-semibold">Next Available: {item.nextAvailableSlot}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <Button
                      onClick={() => handleBook(item)}
                      className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl px-4 h-9 shadow-xs"
                    >
                      <span>Book Appointment</span>
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
