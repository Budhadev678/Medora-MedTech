"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  Clock, 
  Stethoscope, 
  Building2, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  MapPin, 
  Activity, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-context";
import { AppointmentBookingService } from "@/lib/services/appointment-booking-service";
import { AlternativeSearchService } from "@/lib/services/alternative-search-service";
import { WaitlistStore } from "@/lib/data/waitlist-store";
import { SessionAvailability, BookingResult, AlternativeAppointmentOption, WaitlistEntry } from "@/types/database.types";

// Pre-defined Specialities
const SPECIALTIES = [
  { id: "cardiology", name: "Cardiology", icon: Activity, desc: "Heart conditions, hypertension & ECG reviews" },
  { id: "general_medicine", name: "General Medicine", icon: Stethoscope, desc: "Primary care, fevers & general health checks" },
  { id: "pediatrics", name: "Pediatrics", icon: Users, desc: "Child health, growth & vaccinations" },
  { id: "orthopedics", name: "Orthopedics", icon: Building2, desc: "Bone, joint & musculoskeletal disorders" },
];

// Healthcare Facilities
const FACILITIES = [
  {
    id: "FAC-1001",
    orgId: "11111111-1111-1111-1111-111111111101",
    orgIdentifier: "HSP-1001",
    name: "City Hospital",
    type: "Multispeciality Hospital",
    address: "Plot 102, Unit 4, Bhubaneswar",
    badge: "Hospital Hub",
  },
  {
    id: "FAC-1003",
    orgId: "11111111-1111-1111-1111-111111111103",
    orgIdentifier: "CLN-1001",
    name: "Green Care Clinic",
    type: "Day-Care Specialist Clinic",
    address: "Saheed Nagar, Bhubaneswar",
    badge: "Outpatient Clinic",
  },
  {
    id: "FAC-1002",
    orgId: "11111111-1111-1111-1111-111111111102",
    orgIdentifier: "HSP-1002",
    name: "Green Care Hospital",
    type: "Super-Speciality Hospital",
    address: "Sector 9, CDA, Cuttack",
    badge: "Hospital",
  },
];

// Affiliated Doctors
const DOCTORS = [
  {
    id: "DOC-1001",
    name: "Dr. Ananya Sharma",
    qualification: "MD, DM (Cardiology), AIIMS",
    specialty: "cardiology",
    experience: "12+ Years Exp.",
    organizations: ["HSP-1001", "CLN-1001", "HSP-1002"],
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "MULTI-1001",
    name: "Dr. Rahul Sharma",
    qualification: "MD (General Medicine)",
    specialty: "general_medicine",
    experience: "8+ Years Exp.",
    organizations: ["HSP-1001", "CLN-1001"],
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
  },
];

export default function BookAppointmentPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Phase 6 Discovery Modes
  const [discoveryMode, setDiscoveryMode] = useState<"DOCTOR_FIRST" | "FACILITY_FIRST" | "SERVICE_FIRST">("DOCTOR_FIRST");
  const [doctorPreference, setDoctorPreference] = useState<"SAME_DOCTOR_ONLY" | "PREFER_DOCTOR_ALLOW_ALTERNATIVES">("SAME_DOCTOR_ONLY");

  // Wizard Steps: 1=Specialty, 2=Facility, 3=Doctor, 4=Date & Session, 5=Confirmation
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form State
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("cardiology");
  const [selectedFacility, setSelectedFacility] = useState(FACILITIES[0]);
  const [selectedDoctor, setSelectedDoctor] = useState(DOCTORS[0]);
  
  // Date selection: default to today
  const todayIso = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [availableSessions, setAvailableSessions] = useState<SessionAvailability[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionAvailability | null>(null);
  const [reasonForVisit, setReasonForVisit] = useState<string>("");

  // Loading & Submission State
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Phase B.4 / 6.4: Alternatives & Waitlist State
  const [alternatives, setAlternatives] = useState<AlternativeAppointmentOption[]>([]);
  const [waitlistStatusMsg, setWaitlistStatusMsg] = useState<string | null>(null);
  const [isWaitlisting, setIsWaitlisting] = useState<boolean>(false);

  // Generate Quick Date Options (Next 7 days)
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split("T")[0];
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    const dayNum = d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    return { iso, dayName, dayNum };
  });

  // Fetch real-time doctor availability whenever doctor, facility, or date changes
  useEffect(() => {
    async function fetchAvailability() {
      if (!selectedDoctor || !selectedFacility || !selectedDate) return;
      setIsLoadingAvailability(true);
      setSelectedSession(null);
      setErrorMessage(null);
      setWaitlistStatusMsg(null);
      try {
        const sessions = await AppointmentBookingService.getDoctorAvailability(
          selectedDoctor.id,
          selectedFacility.orgIdentifier,
          selectedFacility.id,
          selectedDate
        );
        setAvailableSessions(sessions);
        if (sessions.length > 0) {
          const firstAvailable = sessions.find((s) => s.status === "AVAILABLE" || s.status === "LIMITED");
          if (firstAvailable) {
            setSelectedSession(firstAvailable);
          }
        }

        // Phase B.4: Load valid, explainable alternatives
        const alts = AlternativeSearchService.findAppointmentAlternatives(
          {
            patient_id: user?.identifier || user?.id || "PAT-1001",
            preferred_doctor_id: selectedDoctor.id,
            preferred_organization_identifier: selectedFacility.orgIdentifier,
            preferred_facility_id: selectedFacility.id,
            preferred_date: selectedDate,
            specialty: selectedSpecialty,
          },
          user
        );
        setAlternatives(alts);
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to load doctor schedule.");
      } finally {
        setIsLoadingAvailability(false);
      }
    }

    if (step >= 4) {
      fetchAvailability();
    }
  }, [selectedDoctor, selectedFacility, selectedDate, selectedSpecialty, step, user]);

  const handleSelectAlternative = (alt: AlternativeAppointmentOption) => {
    const docMatch = DOCTORS.find((d) => d.id === alt.doctor_id) || {
      id: alt.doctor_id,
      name: alt.doctor_name,
      qualification: "MD Specialist",
      specialty: alt.medical_specialty,
      experience: "Consultant",
      organizations: [alt.organization_identifier],
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80",
    };
    const facMatch = FACILITIES.find((f) => f.orgIdentifier === alt.organization_identifier) || {
      id: alt.facility_id,
      orgId: alt.organization_id,
      orgIdentifier: alt.organization_identifier,
      name: alt.organization_name,
      type: "Connected Facility",
      address: "Bhubaneswar",
      badge: "Hospital",
    };

    setSelectedDoctor(docMatch);
    setSelectedFacility(facMatch);
    setSelectedDate(alt.date);
    setSelectedSession({
      session_id: alt.session_id,
      doctor_id: alt.doctor_id,
      doctor_name: alt.doctor_name,
      organization_id: alt.organization_id,
      organization_identifier: alt.organization_identifier,
      organization_name: alt.organization_name,
      facility_id: alt.facility_id,
      department_id: alt.department_id,
      department_name: alt.department_name,
      date: alt.date,
      start_time: alt.slot_display_time.split("-")[0]?.trim() || "09:00 AM",
      end_time: alt.slot_display_time.split("-")[1]?.trim() || "01:00 PM",
      slot_display_time: alt.slot_display_time,
      room_number: alt.opd_room,
      capacity: alt.total_capacity,
      booked_count: alt.total_capacity - alt.available_capacity,
      remaining_capacity: alt.available_capacity,
      status: alt.available_capacity > 0 ? "AVAILABLE" : "FULL",
    });
  };

  const handleJoinWaitlist = () => {
    if (!user || !selectedDoctor || !selectedFacility) return;
    setIsWaitlisting(true);
    setWaitlistStatusMsg(null);

    const result = WaitlistStore.joinWaitlist(
      {
        patient_id: user.identifier || user.id,
        doctor_id: selectedDoctor.id,
        organization_identifier: selectedFacility.orgIdentifier,
        facility_id: selectedFacility.id,
        department_id: selectedSession?.department_id || "DEP-CARD-1001",
        preferred_date: selectedDate,
        preferred_session_id: selectedSession?.session_id,
        preferred_time_window: selectedSession?.slot_display_time,
        notification_channel: "SMS",
      },
      user.fullName,
      selectedDoctor.name,
      selectedSession?.department_name || "Outpatient Department",
      selectedFacility.name
    );

    setIsWaitlisting(false);
    setWaitlistStatusMsg(result.message);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSession || !user) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await AppointmentBookingService.bookAppointment(
        {
          patient_id: user.identifier || user.id,
          doctor_id: selectedDoctor.id,
          organization_identifier: selectedFacility.orgIdentifier,
          facility_id: selectedFacility.id,
          department_id: selectedSession.department_id,
          session_id: selectedSession.session_id,
          appointment_date: selectedDate,
          reason_for_visit: reasonForVisit || "Specialist Outpatient Consultation",
          booking_source: "PATIENT",
        },
        user
      );

      if (result.success) {
        setBookingResult(result);
        setStep(5); // Show confirmation view
      } else {
        setErrorMessage(result.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred while booking.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="max-w-xl mx-auto space-y-6 pb-12 animate-in fade-in-50 duration-150">
        <PageHeader
          title="Book Doctor Appointment"
          description="Schedule a specialist outpatient consultation with verified doctor capacity."
          breadcrumbs={[
            { label: "Patient Portal", href: "/patient" },
            { label: "Appointments", href: "/patient/appointments" },
            { label: "Book Session" },
          ]}
        />

        {/* Phase 6 Discovery Mode Selector */}
        {step < 5 && (
          <div className="bg-slate-100/90 p-1.5 rounded-2xl flex items-center gap-1 text-xs font-bold text-slate-600 border border-slate-200/80 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setDiscoveryMode("DOCTOR_FIRST");
                setStep(3);
              }}
              className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                discoveryMode === "DOCTOR_FIRST"
                  ? "bg-white text-teal-800 shadow-xs font-extrabold"
                  : "hover:text-slate-900 text-slate-500"
              }`}
            >
              <Stethoscope className="h-3.5 w-3.5" />
              <span>Doctor-First</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDiscoveryMode("FACILITY_FIRST");
                setStep(1);
              }}
              className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                discoveryMode === "FACILITY_FIRST"
                  ? "bg-white text-teal-800 shadow-xs font-extrabold"
                  : "hover:text-slate-900 text-slate-500"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Facility-First</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDiscoveryMode("SERVICE_FIRST");
                setStep(1);
              }}
              className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                discoveryMode === "SERVICE_FIRST"
                  ? "bg-white text-teal-800 shadow-xs font-extrabold"
                  : "hover:text-slate-900 text-slate-500"
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Service-First</span>
            </button>
          </div>
        )}

        {/* Step Indicator Progress Bar */}
        {step < 5 && (
          <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-500">
            <span className={step >= 1 ? "text-teal-700 font-extrabold" : ""}>1. Specialty</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className={step >= 2 ? "text-teal-700 font-extrabold" : ""}>2. Facility</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className={step >= 3 ? "text-teal-700 font-extrabold" : ""}>3. Doctor</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className={step >= 4 ? "text-teal-700 font-extrabold" : ""}>4. Session</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-xs text-red-700 font-medium flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: SELECT SPECIALTY */}
        {step === 1 && (
          <Card className="bg-white border-slate-200 shadow-xs rounded-3xl">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900">
                Step 1: Choose Medical Specialty
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Select clinical department for your consultation:
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-2.5">
              {SPECIALTIES.map((sp) => {
                const Icon = sp.icon;
                const isSelected = selectedSpecialty === sp.id;
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => setSelectedSpecialty(sp.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-teal-50/70 border-teal-500 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                          isSelected ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">{sp.name}</span>
                        <span className="text-[11px] text-slate-500">{sp.desc}</span>
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-teal-600 stroke-[3]" />}
                  </button>
                );
              })}
            </CardContent>
            <CardFooter className="p-5 pt-0 border-t border-slate-100 flex justify-end">
              <Button
                onClick={() => setStep(2)}
                className="rounded-2xl h-10 px-6 text-xs font-bold bg-teal-700 hover:bg-teal-800"
              >
                <span>Continue to Facility</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* STEP 2: SELECT FACILITY */}
        {step === 2 && (
          <Card className="bg-white border-slate-200 shadow-xs rounded-3xl">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Step 2: Choose Healthcare Facility
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(1)}
                  className="h-8 text-xs text-slate-500"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-0.5" /> Back
                </Button>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Select hospital or clinic location:
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-2.5">
              {FACILITIES.map((fac) => {
                const isSelected = selectedFacility.id === fac.id;
                return (
                  <button
                    key={fac.id}
                    type="button"
                    onClick={() => setSelectedFacility(fac)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-teal-50/70 border-teal-500 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                          isSelected ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{fac.name}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {fac.badge}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-slate-500 block truncate max-w-xs">{fac.address}</span>
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-teal-600 stroke-[3]" />}
                  </button>
                );
              })}
            </CardContent>
            <CardFooter className="p-5 pt-0 border-t border-slate-100 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="rounded-2xl h-10 px-4 text-xs font-semibold"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="rounded-2xl h-10 px-6 text-xs font-bold bg-teal-700 hover:bg-teal-800"
              >
                <span>Select Doctor</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* STEP 3: SELECT DOCTOR */}
        {step === 3 && (
          <Card className="bg-white border-slate-200 shadow-xs rounded-3xl">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Step 3: Choose Specialist Doctor
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(discoveryMode === "DOCTOR_FIRST" ? 1 : 2)}
                  className="h-8 text-xs text-slate-500"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-0.5" /> Back
                </Button>
              </div>
              <CardDescription className="text-xs text-slate-500">
                {discoveryMode === "DOCTOR_FIRST" ? "Select your preferred doctor across all campuses:" : `Practicing at ${selectedFacility.name}:`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-3.5">
              {/* Doctor Preference Mode Toggle (Phase 6.1) */}
              <div className="bg-teal-50/60 p-3 rounded-2xl border border-teal-100 text-xs">
                <span className="font-bold text-teal-900 block mb-1.5">Doctor Preference:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDoctorPreference("SAME_DOCTOR_ONLY")}
                    className={`p-2 rounded-xl text-left border text-[11px] font-semibold transition-all ${
                      doctorPreference === "SAME_DOCTOR_ONLY"
                        ? "bg-teal-700 text-white border-teal-700 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    <span className="block font-bold">Same doctor only</span>
                    <span className="text-[10px] opacity-80">Search all campuses</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDoctorPreference("PREFER_DOCTOR_ALLOW_ALTERNATIVES")}
                    className={`p-2 rounded-xl text-left border text-[11px] font-semibold transition-all ${
                      doctorPreference === "PREFER_DOCTOR_ALLOW_ALTERNATIVES"
                        ? "bg-teal-700 text-white border-teal-700 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    <span className="block font-bold">Prefer this doctor</span>
                    <span className="text-[10px] opacity-80">Show alternatives if full</span>
                  </button>
                </div>
              </div>

              {DOCTORS.map((doc) => {
                const isSelected = selectedDoctor.id === doc.id;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setSelectedDoctor(doc)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-teal-50/70 border-teal-500 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={doc.avatar}
                        alt={doc.name}
                        className="h-11 w-11 rounded-2xl object-cover border border-slate-200"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{doc.name}</span>
                          <span className="font-mono text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded font-semibold">
                            {doc.id}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-600 block">{doc.qualification}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{doc.experience} • {doc.organizations.length} Connected Facilities</span>
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-teal-600 stroke-[3]" />}
                  </button>
                );
              })}
            </CardContent>
            <CardFooter className="p-5 pt-0 border-t border-slate-100 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(discoveryMode === "DOCTOR_FIRST" ? 1 : 2)}
                className="rounded-2xl h-10 px-4 text-xs font-semibold"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(4)}
                className="rounded-2xl h-10 px-6 text-xs font-bold bg-teal-700 hover:bg-teal-800"
              >
                <span>Select Date & Session</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* STEP 4: SELECT DATE & SESSION & CLINICAL REASON */}
        {step === 4 && (
          <div className="space-y-4">
            <Card className="bg-white border-slate-200 shadow-xs rounded-3xl">
              <CardHeader className="p-5 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900">
                      Step 4: Select Appointment Session & Capacity
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      {selectedDoctor.name} @ {selectedFacility.name}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(3)}
                    className="h-8 text-xs text-slate-500"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 mr-0.5" /> Back
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-4">
                {/* Quick Date Selector Horizontal Pills */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Select Date:</label>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {dateOptions.map((opt) => {
                      const isSelected = selectedDate === opt.iso;
                      return (
                        <button
                          key={opt.iso}
                          type="button"
                          onClick={() => setSelectedDate(opt.iso)}
                          className={`flex-1 min-w-[64px] py-2 px-2.5 rounded-2xl text-center border transition-all ${
                            isSelected
                              ? "bg-teal-700 text-white border-teal-700 shadow-xs"
                              : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          <span className="text-[10px] uppercase font-bold block opacity-80">
                            {opt.dayName}
                          </span>
                          <span className="text-xs font-black block">{opt.dayNum}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Available Sessions List */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Working Sessions on {selectedDate}:</label>
                    {isLoadingAvailability && (
                      <span className="text-[11px] text-teal-700 animate-pulse font-medium">Checking capacity...</span>
                    )}
                  </div>

                  {!isLoadingAvailability && availableSessions.length === 0 && (
                    <div className="rounded-2xl bg-amber-50/80 border border-amber-200 p-4 text-center space-y-1">
                      <Clock className="h-5 w-5 text-amber-600 mx-auto" />
                      <p className="text-xs font-bold text-amber-900">No Doctor Sessions Scheduled</p>
                      <p className="text-[11px] text-amber-700">
                        {selectedDoctor.name} does not have regular OPD sessions at {selectedFacility.name} on this date.
                      </p>
                    </div>
                  )}

                  {availableSessions.map((session) => {
                    const isSelected = selectedSession?.session_id === session.session_id;
                    const isFull = session.status === "FULL";
                    const isLeave = session.status === "DOCTOR_LEAVE";
                    const isClosure = session.status === "FACILITY_CLOSURE";
                    const isPast = session.status === "PAST_SESSION";
                    const isBookable = session.status === "AVAILABLE" || session.status === "LIMITED";

                    return (
                      <button
                        key={session.session_id}
                        type="button"
                        disabled={!isBookable}
                        onClick={() => setSelectedSession(session)}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                          !isBookable
                            ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
                            : isSelected
                            ? "bg-teal-50/80 border-teal-500 ring-2 ring-teal-500/20 shadow-xs"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-teal-600" />
                              {session.slot_display_time}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              ({session.room_number || "OPD Room"})
                            </span>
                          </div>

                          {/* Capacity Information Strip */}
                          <div className="flex items-center gap-2 text-[11px]">
                            {isBookable && (
                              <span className="font-semibold text-slate-600">
                                {session.booked_count}/{session.capacity} Booked •{" "}
                                <strong className="text-teal-700">{session.remaining_capacity} Remaining</strong>
                              </span>
                            )}
                            {isFull && <span className="font-bold text-red-600">Session Fully Booked</span>}
                            {isLeave && <span className="font-bold text-amber-700">{session.status_reason}</span>}
                            {isClosure && <span className="font-bold text-red-700">{session.status_reason}</span>}
                            {isPast && <span className="font-bold text-slate-500">Session Ended Today</span>}
                          </div>
                        </div>

                        <div>
                          {isBookable && isSelected && (
                            <Badge variant="teal" className="text-[10px]">
                              ● Selected
                            </Badge>
                          )}
                          {isFull && <Badge variant="destructive" className="text-[10px]">Full</Badge>}
                          {(isLeave || isClosure) && <Badge variant="outline" className="text-[10px]">Closed</Badge>}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* PHASE B.4: ALTERNATIVE APPOINTMENT OPTIONS & SAME-DOCTOR OPTIONS */}
                {alternatives.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-teal-600" />
                        <label className="text-xs font-black text-slate-800">
                          Earlier & Connected Alternatives
                        </label>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Transparent Options
                      </span>
                    </div>

                    <div className="space-y-2">
                      {alternatives.slice(0, 4).map((alt) => {
                        const isAltSelected = selectedSession?.session_id === alt.session_id && selectedDoctor.id === alt.doctor_id;
                        return (
                          <div
                            key={`${alt.session_id}-${alt.doctor_id}-${alt.organization_identifier}`}
                            className={`p-3 rounded-2xl border transition-all ${
                              isAltSelected
                                ? "bg-teal-50/80 border-teal-500 ring-2 ring-teal-500/20"
                                : "bg-slate-50/70 border-slate-200 hover:bg-slate-100/80"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {alt.is_same_doctor ? (
                                    <Badge variant="teal" className="text-[9px] font-black uppercase tracking-wider">
                                      Same Doctor
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-[9px] font-bold">
                                      Same Specialty
                                    </Badge>
                                  )}
                                  {alt.distance_km && (
                                    <Badge variant="outline" className="text-[9px] text-slate-600 font-medium">
                                      {alt.distance_km} km away
                                    </Badge>
                                  )}
                                  {alt.estimated_waiting_minutes_range && (
                                    <Badge variant="outline" className="text-[9px] text-teal-700 font-semibold border-teal-200 bg-teal-50/50">
                                      ~{alt.estimated_waiting_minutes_range} wait
                                    </Badge>
                                  )}
                                </div>

                                <div className="text-xs font-bold text-slate-900">
                                  {alt.doctor_name} • <span className="text-slate-600 font-normal">{alt.organization_name}</span>
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                                  <Clock className="h-3 w-3 text-slate-400" />
                                  <span>{alt.slot_display_time} • {alt.date}</span>
                                </div>
                                <p className="text-[10px] text-slate-600 italic">
                                  "{alt.reason_explanation}"
                                </p>
                              </div>

                              <Button
                                type="button"
                                size="sm"
                                variant={isAltSelected ? "default" : "outline"}
                                onClick={() => handleSelectAlternative(alt)}
                                className={`rounded-xl h-8 px-3 text-[11px] font-bold shrink-0 ${
                                  isAltSelected
                                    ? "bg-teal-700 hover:bg-teal-800 text-white"
                                    : "border-teal-300 text-teal-800 hover:bg-teal-50"
                                }`}
                              >
                                {isAltSelected ? "Selected" : "Select Option"}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* PHASE B.4: WAITLIST ACTION */}
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-slate-900">Can't find a suitable time?</p>
                      <p className="text-[11px] text-slate-500">
                        Join the cancellation waitlist for {selectedDoctor.name}. You will be notified immediately if a slot opens.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleJoinWaitlist}
                      disabled={isWaitlisting}
                      className="rounded-xl h-8 px-3 text-[11px] font-bold border-slate-300 text-slate-800 hover:bg-slate-200/60 shrink-0"
                    >
                      {isWaitlisting ? "Joining..." : "Join Waitlist"}
                    </Button>
                  </div>

                  {waitlistStatusMsg && (
                    <div className="rounded-xl bg-teal-100/70 border border-teal-300 p-2.5 text-[11px] text-teal-900 font-semibold animate-in fade-in">
                      {waitlistStatusMsg}
                    </div>
                  )}
                </div>

                {/* Reason for Visit (Chief Complaint) */}
                <div className="space-y-1.5 pt-2">
                  <label htmlFor="reason" className="text-xs font-bold text-slate-700">
                    Reason for Consultation / Symptoms (Optional):
                  </label>
                  <input
                    id="reason"
                    type="text"
                    placeholder="e.g. Routine blood pressure review, chest tightness, second opinion"
                    value={reasonForVisit}
                    onChange={(e) => setReasonForVisit(e.target.value)}
                    className="w-full text-xs p-3 rounded-2xl border border-slate-200 focus:outline-teal-600 bg-slate-50/50"
                  />
                </div>

                {/* Booking Notice */}
                <div className="rounded-2xl bg-teal-50/50 border border-teal-100 p-3 text-[11px] text-teal-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="h-4 w-4 text-teal-600" />
                    <span>MEDORA Operational Capacity Model</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    This booking reserves your entry in the doctor's planned session. Doctor consultation durations are determined by clinical necessity, not rigid timers.
                  </p>
                </div>
              </CardContent>

              <CardFooter className="p-5 pt-0 border-t border-slate-100 flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(3)}
                  className="rounded-2xl h-10 px-4 text-xs font-semibold"
                >
                  Back
                </Button>
                <Button
                  disabled={!selectedSession || isSubmitting}
                  onClick={handleConfirmBooking}
                  className="rounded-2xl h-10 px-6 text-xs font-bold bg-teal-700 hover:bg-teal-800 shadow-xs"
                >
                  {isSubmitting ? "Confirming Session..." : "Confirm & Book Appointment"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* STEP 5: BOOKING SUCCESS CONFIRMATION */}
        {step === 5 && bookingResult?.appointment && (
          <Card className="bg-white border-teal-200 shadow-lg rounded-3xl text-center p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="h-14 w-14 rounded-3xl bg-teal-600 text-white flex items-center justify-center mx-auto shadow-md shadow-teal-700/30">
              <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[10px] font-bold uppercase tracking-wider font-mono">
                Booking Confirmed • {bookingResult.appointment.appointment_no}
              </div>
              <h2 className="text-lg font-black text-slate-900">
                Appointment Successfully Booked!
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Your consultation has been registered in {bookingResult.appointment.organization_name}'s operational roster.
              </p>
            </div>

            {/* Appointment Details Box */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-left space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Doctor:</span>
                <span className="font-bold text-slate-900">{bookingResult.appointment.doctor_name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Facility:</span>
                <span className="font-semibold text-slate-900">{bookingResult.appointment.organization_name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Department:</span>
                <span className="font-semibold text-slate-900">{bookingResult.appointment.department_name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Date & Session:</span>
                <span className="font-bold text-teal-800">
                  {bookingResult.appointment.appointment_date} • {bookingResult.appointment.slot_display_time}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500 font-medium">OPD Room:</span>
                <span className="font-bold text-slate-900">{bookingResult.appointment.opd_room || "Room 102"}</span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Link href="/patient/appointments" className="flex-1">
                <Button className="w-full h-11 rounded-2xl text-xs font-bold bg-teal-700 hover:bg-teal-800 shadow-xs">
                  View in My Appointments
                </Button>
              </Link>
              <Link href="/patient" className="flex-1">
                <Button variant="outline" className="w-full h-11 rounded-2xl text-xs font-semibold">
                  Return Home
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </RoleGuard>
  );
}
