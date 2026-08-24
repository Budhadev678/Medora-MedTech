"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Stethoscope,
  Building2,
  MapPin,
  Search,
  CheckCircle2,
  AlertCircle,
  Users,
  Activity,
  ArrowRight,
  ShieldCheck,
  Check,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Filter,
  User,
  HeartPulse,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth-context";
import {
  AppointmentBookingService,
  DoctorHospitalMatch,
  FilteredSlot,
} from "@/lib/services/appointment-booking-service";
import { AppointmentStore } from "@/lib/data/appointment-store";
import { getAllFacilities } from "@/lib/data/facility-store";
import { getRemainingCurrentWeekDates } from "@/lib/utils";
import { BookingResult, Appointment } from "@/types/database.types";

// Standard canonical medical specialties
const SPECIALTIES = [
  { id: "all", name: "All Specialties" },
  { id: "cardiology", name: "Cardiology" },
  { id: "general_medicine", name: "General Medicine / Physician" },
  { id: "general_surgery", name: "General Surgery" },
  { id: "orthopedics", name: "Orthopedics" },
  { id: "pediatrics", name: "Pediatrics" },
  { id: "dermatology", name: "Dermatology" },
  { id: "ent", name: "ENT (Ear, Nose, Throat)" },
  { id: "gynecology", name: "Gynecology & Obstetrics" },
  { id: "neurology", name: "Neurology" },
];

export default function BookAppointmentPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Filter States
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedHospital, setSelectedHospital] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [availableOnly, setAvailableOnly] = useState<boolean>(true);

  // Date selection (default to today or first available date in current calendar week)
  const dateOptions = useMemo(() => getRemainingCurrentWeekDates(), []);
  const [selectedDate, setSelectedDate] = useState<string>(dateOptions[0]?.iso || new Date().toISOString().split("T")[0]);

  // Results & Availability State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [matches, setMatches] = useState<DoctorHospitalMatch[]>([]);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [availableHospitals, setAvailableHospitals] = useState<{ id: string; name: string; city: string }[]>([]);

  // Selection & Review State
  const [selectedMatch, setSelectedMatch] = useState<DoctorHospitalMatch | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<FilteredSlot | null>(null);
  const [reasonForVisit, setReasonForVisit] = useState<string>("");
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);

  // Booking Execution State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load facility locations and hospitals list
  useEffect(() => {
    const facilities = getAllFacilities();
    const cities = Array.from(new Set(facilities.map((f) => f.city).filter(Boolean)));
    setAvailableLocations(cities);

    const hosps = facilities.map((f) => ({
      id: f.facility_code || f.organization_identifier || f.id,
      name: f.name,
      city: f.city,
    }));
    setAvailableHospitals(hosps);
  }, []);

  // Filter hospitals based on selected location
  const filteredHospitalOptions = useMemo(() => {
    if (selectedLocation === "all" || selectedLocation === "All Locations") {
      return availableHospitals;
    }
    return availableHospitals.filter(
      (h) => h.city.toLowerCase() === selectedLocation.toLowerCase()
    );
  }, [availableHospitals, selectedLocation]);

  // Query Real Doctor & Hospital Matches with Live Availability Slots
  const fetchMatches = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const results = await AppointmentBookingService.searchDoctorHospitalSlots({
        specialty: selectedSpecialty,
        location: selectedLocation,
        hospitalId: selectedHospital,
        date: selectedDate,
        availableOnly: availableOnly,
        searchQuery: searchQuery,
      });
      setMatches(results);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load doctor schedules.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [selectedSpecialty, selectedLocation, selectedHospital, selectedDate, availableOnly, searchQuery]);

  const handleClearFilters = () => {
    setSelectedSpecialty("all");
    setSelectedLocation("all");
    setSelectedHospital("all");
    setSearchQuery("");
    setAvailableOnly(false);
    setSelectedDate(dateOptions[0]?.iso || new Date().toISOString().split("T")[0]);
  };

  const handleSelectSlot = (match: DoctorHospitalMatch, slot: FilteredSlot) => {
    if (!slot.is_available) return;
    setSelectedMatch(match);
    setSelectedSlot(slot);
    setReasonForVisit("");
    setErrorMessage(null);
    setShowReviewModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedMatch || !selectedSlot || !user) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const pId = user.identifier || user.id || "PAT-1001";
      const result = await AppointmentBookingService.bookAppointment(
        {
          patient_id: pId,
          doctor_id: selectedMatch.doctor_id,
          organization_identifier: selectedMatch.organization_identifier,
          facility_id: selectedMatch.facility_id,
          department_id: selectedMatch.department_id,
          session_id: selectedMatch.session_id,
          appointment_date: selectedMatch.date,
          reason_for_visit: reasonForVisit.trim() || `Consultation with ${selectedMatch.doctor_name}`,
          booking_source: "PATIENT",
        },
        user
      );

      if (result.success && result.appointment) {
        setBookingResult(result);
        setConfirmedAppointment(result.appointment);
        setShowReviewModal(false);
        // Refresh matches to remove booked slot immediately
        fetchMatches();
      } else {
        setErrorMessage(result.message || "The selected slot is no longer available. Please choose another time.");
        // Refresh availability on failure
        fetchMatches();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to confirm appointment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------------------------------------------------
  // VIEW: CONFIRMATION SCREEN
  // ------------------------------------------------------------
  if (confirmedAppointment) {
    return (
      <RoleGuard allowedRoles={["patient", "admin"]}>
        <div className="max-w-xl mx-auto space-y-6 p-4 sm:p-6 animate-in fade-in-50 duration-200">
          <Card className="bg-white rounded-3xl shadow-xs border-emerald-200 overflow-hidden text-center p-6 sm:p-8 space-y-6">
            <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div className="space-y-1">
              <Badge className="bg-emerald-100 text-emerald-800 font-mono text-xs">
                {confirmedAppointment.appointment_no}
              </Badge>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Appointment Confirmed!
              </h1>
              <p className="text-xs text-slate-500">
                Your consultation has been recorded on the hospital master roster.
              </p>
            </div>

            {/* Structured Appointment Details */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2.5">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Doctor:</span>
                <span className="font-bold text-slate-900">{confirmedAppointment.doctor_name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Specialty / Department:</span>
                <span className="font-bold text-slate-900">{confirmedAppointment.department_name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Hospital:</span>
                <span className="font-bold text-slate-900">{confirmedAppointment.organization_name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Date & Time:</span>
                <span className="font-bold text-indigo-700">
                  {new Date(confirmedAppointment.appointment_date).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  • {confirmedAppointment.scheduled_time || confirmedAppointment.slot_display_time}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">OPD Room:</span>
                <span className="font-bold text-slate-900">{confirmedAppointment.opd_room}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Queue Token #:</span>
                <span className="font-mono font-black text-slate-900">{confirmedAppointment.token_number}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <Link href={`/patient/appointments/${confirmedAppointment.id}`} className="flex-1">
                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs h-10">
                  View Appointment Details
                </Button>
              </Link>
              <Link href="/patient/appointments" className="flex-1">
                <Button variant="outline" className="w-full rounded-2xl text-xs h-10 border-slate-300">
                  My Appointments
                </Button>
              </Link>
              <Button
                variant="ghost"
                onClick={() => {
                  setConfirmedAppointment(null);
                  setSelectedMatch(null);
                  setSelectedSlot(null);
                  handleClearFilters();
                }}
                className="text-xs text-slate-600 rounded-2xl h-10"
              >
                Book Another
              </Button>
            </div>
          </Card>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6 pb-24 animate-in fade-in-50 duration-150">
        
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/patient" className="text-xs font-semibold text-slate-500 hover:text-slate-900">
              Dashboard
            </Link>
            <span className="text-slate-400">/</span>
            <Link href="/patient/appointments" className="text-xs font-semibold text-slate-500 hover:text-slate-900">
              Appointments
            </Link>
            <span className="text-slate-400">/</span>
            <span className="text-xs font-semibold text-indigo-700">Book Appointment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Stethoscope className="h-7 w-7 text-indigo-600" />
            Book Doctor Appointment
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Find specialists, filter by hospital & location, inspect real available slots, and confirm your visit.
          </p>
        </div>

        {/* Global Error Alert */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-xs font-bold underline ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* STEP 1: CLEAN PROGRESSIVE FILTER BAR */}
        <Card className="bg-white rounded-3xl shadow-xs border-slate-200 overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Filter className="h-4 w-4 text-indigo-600" /> Filter Doctors & Hospitals
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-7 text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Clear Filters
            </Button>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
              <Input
                placeholder="Search by doctor name, hospital, or condition..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-xs rounded-2xl bg-white border-slate-200 h-10 shadow-2xs"
              />
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              
              {/* Specialty Filter */}
              <div>
                <Label className="text-[11px] font-bold text-slate-700 block mb-1">
                  1. What do you need? (Specialty)
                </Label>
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="w-full h-10 rounded-2xl border border-input bg-white px-3 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                >
                  {SPECIALTIES.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <Label className="text-[11px] font-bold text-slate-700 block mb-1">
                  2. Location (City)
                </Label>
                <select
                  value={selectedLocation}
                  onChange={(e) => {
                    setSelectedLocation(e.target.value);
                    setSelectedHospital("all"); // Reset hospital when location changes
                  }}
                  className="w-full h-10 rounded-2xl border border-input bg-white px-3 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="all">All Locations (Any City)</option>
                  {availableLocations.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hospital / Facility Filter */}
              <div>
                <Label className="text-[11px] font-bold text-slate-700 block mb-1">
                  3. Hospital / Clinic
                </Label>
                <select
                  value={selectedHospital}
                  onChange={(e) => setSelectedHospital(e.target.value)}
                  className="w-full h-10 rounded-2xl border border-input bg-white px-3 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="all">Any Hospital</option>
                  {filteredHospitalOptions.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Date Pills & Availability Checkbox */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-700 block">
                  Select Date (Current Week)
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {dateOptions.map((opt) => (
                    <button
                      key={opt.iso}
                      type="button"
                      onClick={() => setSelectedDate(opt.iso)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        selectedDate === opt.iso
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {opt.isToday ? "Today" : opt.dayName} ({opt.dayNum})
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center pt-2 sm:pt-4">
                <input
                  type="checkbox"
                  id="availOnly"
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="availOnly" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Show Available Only
                </label>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* STEP 2: RESULTS SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span>Matching Doctors & Hospital Schedules</span>
              <Badge variant="outline" className="text-xs font-mono font-bold">
                {matches.length} Available
              </Badge>
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Date: {new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
            </span>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-r-transparent" />
              <p className="text-xs text-slate-500 font-bold">Checking doctor availability & live capacity...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && matches.length === 0 && (
            <Card className="bg-white rounded-3xl border border-dashed border-slate-300 text-center p-8 space-y-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Stethoscope className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">No doctors found for these filters</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  No affiliated doctors have practice sessions matching this specialty, location, or selected date.
                </p>
              </div>
              <div className="flex justify-center gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClearFilters}
                  className="rounded-2xl text-xs font-bold"
                >
                  Clear Filters
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const nextDate = dateOptions.find((d) => d.iso !== selectedDate)?.iso || selectedDate;
                    setSelectedDate(nextDate);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs"
                >
                  Try Another Date
                </Button>
              </div>
            </Card>
          )}

          {/* Results Grid */}
          {!isLoading && matches.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              {matches.map((match) => {
                const isFull = match.status === "FULL";
                const isLeave = match.status === "DOCTOR_LEAVE" || match.status === "FACILITY_CLOSURE";

                return (
                  <Card
                    key={`${match.doctor_id}-${match.session_id}`}
                    className="bg-white rounded-3xl shadow-xs border-slate-200 overflow-hidden hover:border-slate-300 transition-all"
                  >
                    <div className="p-5 sm:p-6 space-y-4">
                      
                      {/* Doctor & Facility Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <img
                            src={match.avatar_url}
                            alt={match.doctor_name}
                            className="h-12 w-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-extrabold text-slate-900">{match.doctor_name}</h3>
                              <Badge className="bg-indigo-50 text-indigo-800 border-indigo-200 text-[10px] font-bold">
                                {match.specialization}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500">{match.qualifications} • {match.experience_years}+ Years Experience</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pt-1">
                              <span className="font-semibold text-slate-900 flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5 text-slate-400" /> {match.hospital_name}
                              </span>
                              <span>•</span>
                              <span className="text-slate-500">{match.department_name} ({match.opd_room})</span>
                              <span>•</span>
                              <span className="text-slate-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-slate-400" /> {match.city}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status & Fee */}
                        <div className="text-right shrink-0">
                          <Badge
                            className={`text-[10px] font-bold ${
                              match.status === "AVAILABLE"
                                ? "bg-emerald-100 text-emerald-900"
                                : match.status === "LIMITED"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-rose-100 text-rose-900"
                            }`}
                          >
                            {match.status === "AVAILABLE" && `${match.remaining_capacity} Slots Available`}
                            {match.status === "LIMITED" && `Only ${match.remaining_capacity} Left`}
                            {match.status === "FULL" && "Fully Booked"}
                            {match.status === "DOCTOR_LEAVE" && "Doctor on Leave"}
                            {match.status === "FACILITY_CLOSURE" && "Facility Closed"}
                          </Badge>
                          <span className="block text-xs font-mono font-extrabold text-slate-900 mt-1">
                            ₹{match.consultation_fee} <span className="text-[10px] text-slate-400 font-normal">DEMO</span>
                          </span>
                        </div>
                      </div>

                      {/* Time Slots Selector */}
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-indigo-600" /> Available Time Slots ({match.slot_display_time}):
                          </span>
                          <span className="text-[10px] text-slate-400">Click any open time slot to book</span>
                        </div>

                        {isLeave ? (
                          <p className="text-xs text-rose-600 italic bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                            {match.status_reason || "Unavailable on this date."}
                          </p>
                        ) : isFull ? (
                          <p className="text-xs text-amber-700 italic bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                            All appointment slots for this session are booked.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {match.slots.map((slot, sIdx) => (
                              <button
                                key={sIdx}
                                type="button"
                                disabled={!slot.is_available}
                                onClick={() => handleSelectSlot(match, slot)}
                                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                                  slot.is_available
                                    ? "bg-slate-100 text-slate-900 hover:bg-indigo-600 hover:text-white shadow-2xs cursor-pointer active:scale-95"
                                    : "bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed line-through"
                                }`}
                              >
                                {slot.slot_time}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* STEP 3: REVIEW & CONFIRMATION MODAL */}
        {showReviewModal && selectedMatch && selectedSlot && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Appointment Review</h3>
                    <p className="text-[11px] text-slate-500">Verify your consultation details</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="rounded-full p-1 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              {/* Summary Dossier */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2.5">
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">Doctor:</span>
                  <span className="font-bold text-slate-900">{selectedMatch.doctor_name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">Specialty:</span>
                  <span className="font-bold text-slate-900">{selectedMatch.specialization}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">Hospital:</span>
                  <span className="font-bold text-slate-900">{selectedMatch.hospital_name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-bold text-indigo-700">
                    {new Date(selectedMatch.date).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">Time Slot:</span>
                  <span className="font-bold text-indigo-700">{selectedSlot.slot_time}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">OPD Room:</span>
                  <span className="font-bold text-slate-900">{selectedMatch.opd_room}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Consultation Fee:</span>
                  <span className="font-mono font-bold text-slate-900">₹{selectedMatch.consultation_fee} (DEMO)</span>
                </div>
              </div>

              {/* Optional Reason for visit */}
              <div>
                <Label className="text-[11px] font-bold text-slate-700">
                  Reason for Consultation / Symptoms (Optional)
                </Label>
                <Input
                  placeholder="e.g. Hypertension follow-up, ECG review, chest tightness..."
                  value={reasonForVisit}
                  onChange={(e) => setReasonForVisit(e.target.value)}
                  className="text-xs mt-1 rounded-xl h-9"
                />
              </div>

              {/* Confirmation CTA */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReviewModal(false)}
                  className="text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={handleConfirmBooking}
                  className="text-xs font-bold rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-xs"
                >
                  {isSubmitting ? "Confirming Appointment..." : "Confirm Appointment"}
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </RoleGuard>
  );
}
