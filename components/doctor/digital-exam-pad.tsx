"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  HeartPulse,
  Activity,
  FileText,
  ShieldCheck,
  Edit3,
  Eraser,
  RotateCcw,
  Trash2,
  Plus,
  Sparkles,
  Check,
  AlertCircle,
  PenTool,
  Sliders,
  Palette,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ClinicalSymptom,
  ClinicalVitals,
  ClinicalDiagnosis,
  ClinicalFollowUpPlan,
} from "@/types/database.types";

export interface DigitalExamPadProps {
  chiefComplaint: string;
  onChangeChiefComplaint: (value: string) => void;
  symptoms: ClinicalSymptom[];
  onChangeSymptoms: (symptoms: ClinicalSymptom[]) => void;
  vitals: ClinicalVitals;
  onChangeVitals: (vitals: ClinicalVitals) => void;
  observations: string;
  onChangeObservations: (value: string) => void;
  freehandDrawing?: string;
  onChangeFreehandDrawing: (dataUrl: string) => void;
  assessment: string;
  onChangeAssessment: (value: string) => void;
  diagnoses: ClinicalDiagnosis[];
  onChangeDiagnoses: (diagnoses: ClinicalDiagnosis[]) => void;
  treatmentPlan: string;
  onChangeTreatmentPlan: (value: string) => void;
  followUpPlan: ClinicalFollowUpPlan;
  onChangeFollowUpPlan: (plan: ClinicalFollowUpPlan) => void;
  isReadOnly?: boolean;
  specialty?: string;
}

const COMMON_ICD_QUICK_LIST = [
  { code: "I10", name: "Essential (Primary) Hypertension" },
  { code: "E11.9", name: "Type 2 Diabetes Mellitus without complications" },
  { code: "I20.9", name: "Angina Pectoris, unspecified" },
  { code: "J06.9", name: "Acute Upper Respiratory Infection" },
  { code: "R07.9", name: "Chest Pain, unspecified" },
  { code: "R51", name: "Headache / Cephalgia" },
  { code: "K21.9", name: "Gastro-esophageal Reflux Disease (GERD)" },
  { code: "M54.5", name: "Low Back Pain / Lumbago" },
];

export function DigitalExamPad({
  chiefComplaint,
  onChangeChiefComplaint,
  symptoms,
  onChangeSymptoms,
  vitals,
  onChangeVitals,
  observations,
  onChangeObservations,
  freehandDrawing,
  onChangeFreehandDrawing,
  assessment,
  onChangeAssessment,
  diagnoses,
  onChangeDiagnoses,
  treatmentPlan,
  onChangeTreatmentPlan,
  followUpPlan,
  onChangeFollowUpPlan,
  isReadOnly = false,
  specialty = "Cardiology / Internal Medicine",
}: DigitalExamPadProps) {
  // Symptom input builder
  const [newSymptomName, setNewSymptomName] = useState("");
  const [newSymptomDuration, setNewSymptomDuration] = useState("");
  const [newSymptomSeverity, setNewSymptomSeverity] = useState<"MILD" | "MODERATE" | "SEVERE">("MODERATE");

  // Diagnosis input builder
  const [newDxName, setNewDxName] = useState("");
  const [newDxCode, setNewDxCode] = useState("");
  const [newDxCategory, setNewDxCategory] = useState<"PRIMARY" | "SECONDARY" | "PROVISIONAL">("PRIMARY");
  const [showIcdSuggestions, setShowIcdSuggestions] = useState(false);

  // Freehand Canvas State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState<string>("#1e293b"); // Deep slate ink
  const [penSize, setPenSize] = useState<number>(2);
  const [activeTool, setActiveTool] = useState<"pen" | "highlighter" | "eraser">("pen");
  const [showCanvas, setShowCanvas] = useState(true);

  // Vitals Handler
  const handleVitalsFieldChange = (field: keyof ClinicalVitals, val: string) => {
    if (isReadOnly) return;
    const num = val.trim() === "" ? undefined : Number(val);
    const updated = { ...vitals, [field]: num };

    // Auto calculate BMI if height and weight present
    const h = field === "height_cm" ? num : vitals.height_cm;
    const w = field === "weight_kg" ? num : vitals.weight_kg;
    if (h && w && h > 40 && w > 10) {
      const heightInMeters = h / 100;
      updated.bmi = Number((w / (heightInMeters * heightInMeters)).toFixed(1));
    }

    onChangeVitals(updated);
  };

  // Symptom List Actions
  const handleAddSymptom = () => {
    if (!newSymptomName.trim() || isReadOnly) return;
    const item: ClinicalSymptom = {
      id: `SYM-${Date.now()}`,
      name: newSymptomName.trim(),
      duration: newSymptomDuration.trim() || undefined,
      severity: newSymptomSeverity,
    };
    onChangeSymptoms([...symptoms, item]);
    setNewSymptomName("");
    setNewSymptomDuration("");
  };

  const handleRemoveSymptom = (index: number) => {
    if (isReadOnly) return;
    onChangeSymptoms(symptoms.filter((_, i) => i !== index));
  };

  // Diagnosis List Actions
  const handleAddDiagnosis = () => {
    if (!newDxName.trim() || isReadOnly) return;
    const item: ClinicalDiagnosis = {
      id: `DX-${Date.now()}`,
      name: newDxName.trim(),
      icd10_code: newDxCode.trim() || undefined,
      category: newDxCategory,
      status: "CONFIRMED",
      recorded_by: "DOC-1001",
      recorded_by_name: "Attending Doctor",
      recorded_at: new Date().toISOString(),
    };
    onChangeDiagnoses([...diagnoses, item]);
    setNewDxName("");
    setNewDxCode("");
    setShowIcdSuggestions(false);
  };

  const handleSelectIcdQuick = (dx: { code: string; name: string }) => {
    setNewDxName(dx.name);
    setNewDxCode(dx.code);
    setShowIcdSuggestions(false);
  };

  const handleRemoveDiagnosis = (index: number) => {
    if (isReadOnly) return;
    onChangeDiagnoses(diagnoses.filter((_, i) => i !== index));
  };

  // ============================================================
  // FREEHAND CANVAS DRAWING ENGINE
  // ============================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Load initial drawing if available
    if (freehandDrawing) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = freehandDrawing;
    }
  }, [freehandDrawing]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isReadOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isReadOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (activeTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 14;
    } else if (activeTool === "highlighter") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "rgba(250, 204, 21, 0.4)";
      ctx.lineWidth = 16;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penSize;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onChangeFreehandDrawing(dataUrl);
  };

  const handleClearCanvas = () => {
    if (isReadOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChangeFreehandDrawing("");
  };

  return (
    <div className="space-y-5">
      {/* Specialty Banner & Mode Header */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
            <Edit3 className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight">Digital Clinical Examination Pad</h2>
              <Badge className="bg-teal-500/20 text-teal-200 border-teal-400/30 text-[10px] font-mono">
                PEN & PAPER EXPERIENCE
              </Badge>
            </div>
            <p className="text-[11px] text-teal-100/70">
              Specialty Framework: <strong className="text-white font-medium">{specialty}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCanvas(!showCanvas)}
            className="h-8 text-xs font-semibold rounded-xl bg-teal-950/60 border-teal-700 text-teal-200 hover:bg-teal-900"
          >
            <PenTool className="h-3.5 w-3.5 mr-1" />
            {showCanvas ? "Hide Sketch Pad" : "Show Sketch Pad"}
          </Button>
        </div>
      </div>

      {/* SECTION 1: CHIEF COMPLAINT & HPI */}
      <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
        <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <FileText className="h-4 w-4 text-teal-700" />
            <span>1. Chief Complaint & History of Present Illness (HPI)</span>
          </CardTitle>
          <span className="text-[10px] text-slate-400 font-mono">Clinical Subjective</span>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <Textarea
            rows={2}
            value={chiefComplaint}
            onChange={(e) => onChangeChiefComplaint(e.target.value)}
            disabled={isReadOnly}
            placeholder="Document patient's primary presenting complaint and progression of symptoms..."
            className="text-xs rounded-xl focus-visible:ring-teal-600 font-medium"
          />

          {/* Structured Symptoms Chips */}
          <div>
            <Label className="text-[11px] font-bold text-slate-700 block mb-1.5">
              Specific Presenting Symptoms ({symptoms.length})
            </Label>
            {symptoms.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-2">
                {symptoms.map((sym, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  >
                    <span className="font-semibold">{sym.name}</span>
                    {sym.duration && <span className="text-slate-500 font-mono text-[11px]">({sym.duration})</span>}
                    <Badge
                      variant="secondary"
                      className={`text-[9px] px-1.5 py-0 ${
                        sym.severity === "SEVERE"
                          ? "bg-rose-100 text-rose-800 border-rose-200"
                          : sym.severity === "MODERATE"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {sym.severity}
                    </Badge>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSymptom(idx)}
                        className="text-slate-400 hover:text-rose-600 p-0.5"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic mb-2">No symptoms structured yet.</p>
            )}

            {!isReadOnly && (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-slate-100">
                <div className="sm:col-span-5">
                  <Input
                    placeholder="Symptom name (e.g. Substernal Chest Pressure)"
                    value={newSymptomName}
                    onChange={(e) => setNewSymptomName(e.target.value)}
                    className="text-xs h-8 rounded-xl"
                  />
                </div>
                <div className="sm:col-span-3">
                  <Input
                    placeholder="Duration (e.g. 3 days)"
                    value={newSymptomDuration}
                    onChange={(e) => setNewSymptomDuration(e.target.value)}
                    className="text-xs h-8 rounded-xl"
                  />
                </div>
                <div className="sm:col-span-2">
                  <select
                    value={newSymptomSeverity}
                    onChange={(e) => setNewSymptomSeverity(e.target.value as any)}
                    className="w-full h-8 rounded-xl border border-input bg-white px-2 text-xs"
                  >
                    <option value="MILD">Mild</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="SEVERE">Severe</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Button
                    type="button"
                    onClick={handleAddSymptom}
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs font-semibold h-8 rounded-xl"
                    disabled={!newSymptomName.trim()}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: OBJECTIVE VITALS & PHYSIOLOGICAL METRICS */}
      <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
        <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-rose-600" />
            <span>2. Physiological Vitals & Objective Metrics</span>
          </CardTitle>
          <span className="text-[10px] text-slate-400 font-mono">Explicit Clinical Units</span>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <Label className="text-[11px] font-bold text-slate-700">Heart Rate (bpm)</Label>
              <Input
                type="number"
                placeholder="e.g. 72"
                value={vitals.heart_rate_bpm ?? ""}
                onChange={(e) => handleVitalsFieldChange("heart_rate_bpm", e.target.value)}
                disabled={isReadOnly}
                className="text-xs h-9 mt-1 rounded-xl font-mono font-bold bg-white"
              />
            </div>

            <div>
              <Label className="text-[11px] font-bold text-slate-700">BP Systolic (mmHg)</Label>
              <Input
                type="number"
                placeholder="e.g. 120"
                value={vitals.systolic_bp_mmhg ?? ""}
                onChange={(e) => handleVitalsFieldChange("systolic_bp_mmhg", e.target.value)}
                disabled={isReadOnly}
                className="text-xs h-9 mt-1 rounded-xl font-mono font-bold bg-white text-teal-900"
              />
            </div>

            <div>
              <Label className="text-[11px] font-bold text-slate-700">BP Diastolic (mmHg)</Label>
              <Input
                type="number"
                placeholder="e.g. 80"
                value={vitals.diastolic_bp_mmhg ?? ""}
                onChange={(e) => handleVitalsFieldChange("diastolic_bp_mmhg", e.target.value)}
                disabled={isReadOnly}
                className="text-xs h-9 mt-1 rounded-xl font-mono font-bold bg-white"
              />
            </div>

            <div>
              <Label className="text-[11px] font-bold text-slate-700">Temp (°C)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g. 37.0"
                value={vitals.temperature_celsius ?? ""}
                onChange={(e) => handleVitalsFieldChange("temperature_celsius", e.target.value)}
                disabled={isReadOnly}
                className="text-xs h-9 mt-1 rounded-xl font-mono font-bold bg-white"
              />
            </div>

            <div>
              <Label className="text-[11px] font-bold text-slate-700">SpO₂ (%)</Label>
              <Input
                type="number"
                placeholder="e.g. 98"
                value={vitals.spo2_percent ?? ""}
                onChange={(e) => handleVitalsFieldChange("spo2_percent", e.target.value)}
                disabled={isReadOnly}
                className="text-xs h-9 mt-1 rounded-xl font-mono font-bold bg-white"
              />
            </div>

            <div>
              <Label className="text-[11px] font-bold text-slate-700">Resp Rate (/min)</Label>
              <Input
                type="number"
                placeholder="e.g. 16"
                value={vitals.respiratory_rate_bpm ?? ""}
                onChange={(e) => handleVitalsFieldChange("respiratory_rate_bpm", e.target.value)}
                disabled={isReadOnly}
                className="text-xs h-9 mt-1 rounded-xl font-mono font-bold bg-white"
              />
            </div>

            <div>
              <Label className="text-[11px] font-bold text-slate-700">Weight (kg)</Label>
              <Input
                type="number"
                step="0.5"
                placeholder="e.g. 70"
                value={vitals.weight_kg ?? ""}
                onChange={(e) => handleVitalsFieldChange("weight_kg", e.target.value)}
                disabled={isReadOnly}
                className="text-xs h-9 mt-1 rounded-xl font-mono font-bold bg-white"
              />
            </div>

            <div>
              <Label className="text-[11px] font-bold text-slate-700">Height (cm)</Label>
              <Input
                type="number"
                placeholder="e.g. 175"
                value={vitals.height_cm ?? ""}
                onChange={(e) => handleVitalsFieldChange("height_cm", e.target.value)}
                disabled={isReadOnly}
                className="text-xs h-9 mt-1 rounded-xl font-mono font-bold bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/70 border border-slate-200 text-xs">
            <span className="text-slate-600 font-medium">Calculated Body Mass Index (BMI):</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-sm text-slate-900">
                {vitals.bmi ? `${vitals.bmi} kg/m²` : "—"}
              </span>
              {vitals.bmi && (
                <Badge
                  variant="outline"
                  className={`text-[10px] font-bold ${
                    vitals.bmi < 18.5
                      ? "text-blue-700 bg-blue-50"
                      : vitals.bmi <= 24.9
                      ? "text-emerald-700 bg-emerald-50"
                      : vitals.bmi <= 29.9
                      ? "text-amber-700 bg-amber-50"
                      : "text-rose-700 bg-rose-50"
                  }`}
                >
                  {vitals.bmi < 18.5
                    ? "Underweight"
                    : vitals.bmi <= 24.9
                    ? "Normal Weight"
                    : vitals.bmi <= 29.9
                    ? "Overweight"
                    : "Obese"}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3: PHYSICAL EXAMINATION & FREEHAND SKETCH PAD */}
      <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
        <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-600" />
            <span>3. General & Systemic Examination + Clinical Markings</span>
          </CardTitle>
          <span className="text-[10px] text-slate-400 font-mono">Objective Findings</span>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div>
            <Label className="text-xs font-bold text-slate-700">General Appearance & Systemic Findings</Label>
            <Textarea
              rows={2}
              value={observations}
              onChange={(e) => onChangeObservations(e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. Conscious, oriented, no pallor/icterus. CVS: S1 S2 heard, no murmurs. RS: Bilateral air entry clear..."
              className="text-xs mt-1 rounded-xl"
            />
          </div>

          {/* Freehand Clinical Drawing & Annotation Canvas */}
          {showCanvas && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <PenTool className="h-3.5 w-3.5 text-teal-700" />
                  <span className="text-xs font-bold text-slate-800">Doctor's Freehand Clinical Sketch Pad</span>
                  <span className="text-[10px] text-slate-400">(Heart diagrams, anatomical markings, rapid notes)</span>
                </div>

                {!isReadOnly && (
                  <div className="flex items-center gap-1.5">
                    {/* Tool Picker */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setActiveTool("pen")}
                        className={`p-1 rounded text-xs ${activeTool === "pen" ? "bg-white shadow-xs text-teal-800 font-bold" : "text-slate-500"}`}
                        title="Pen Tool"
                      >
                        <PenTool className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTool("highlighter")}
                        className={`p-1 rounded text-xs ${activeTool === "highlighter" ? "bg-white shadow-xs text-amber-700 font-bold" : "text-slate-500"}`}
                        title="Highlighter"
                      >
                        <Sliders className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTool("eraser")}
                        className={`p-1 rounded text-xs ${activeTool === "eraser" ? "bg-white shadow-xs text-rose-700 font-bold" : "text-slate-500"}`}
                        title="Eraser"
                      >
                        <Eraser className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Color Picker */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                      {["#1e293b", "#0f766e", "#b91c1c", "#1d4ed8"].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setPenColor(c);
                            setActiveTool("pen");
                          }}
                          style={{ backgroundColor: c }}
                          className={`h-4 w-4 rounded-full border ${penColor === c && activeTool === "pen" ? "ring-2 ring-teal-500 ring-offset-1" : "border-slate-300"}`}
                        />
                      ))}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearCanvas}
                      className="h-7 text-xs text-rose-700 hover:bg-rose-50 px-2 rounded-lg"
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Clear
                    </Button>
                  </div>
                )}
              </div>

              {/* Canvas Board */}
              <div className="relative border-2 border-dashed border-slate-300 rounded-2xl bg-amber-50/20 overflow-hidden shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={680}
                  height={200}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className={`w-full touch-none ${isReadOnly ? "cursor-default" : "cursor-crosshair"}`}
                />
                {!freehandDrawing && !isDrawing && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-300 text-xs font-mono">
                    Freehand canvas ready • Draw clinical diagrams or handwritten annotations
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 4: ASSESSMENT & CLINICAL DIAGNOSIS */}
      <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
        <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>4. Clinical Assessment & Confirmed Diagnoses</span>
          </CardTitle>
          <span className="text-[10px] text-slate-400 font-mono">Doctor Authored</span>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div>
            <Label className="text-xs font-bold text-slate-700">Clinical Impression & Differential Analysis</Label>
            <Textarea
              rows={2}
              value={assessment}
              onChange={(e) => onChangeAssessment(e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. Stage 1 Essential Hypertension with mild exertional dyspnea, rule out coronary insufficiency..."
              className="text-xs mt-1 rounded-xl"
            />
          </div>

          {/* Diagnoses List */}
          <div>
            <Label className="text-xs font-bold text-slate-700 block mb-1.5">
              Documented Diagnoses ({diagnoses.length})
            </Label>
            {diagnoses.length > 0 ? (
              <div className="space-y-1.5 mb-2">
                {diagnoses.map((dx, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{dx.name}</span>
                      {dx.icd10_code && (
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] text-teal-800 bg-teal-50 border-teal-200"
                        >
                          ICD-10: {dx.icd10_code}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-[9px]">
                        {dx.category}
                      </Badge>
                    </div>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDiagnosis(idx)}
                        className="text-slate-400 hover:text-rose-600 p-0.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic mb-2">No diagnoses added yet.</p>
            )}

            {!isReadOnly && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-6 relative">
                    <Input
                      placeholder="Diagnosis name (e.g. Essential Hypertension)"
                      value={newDxName}
                      onChange={(e) => {
                        setNewDxName(e.target.value);
                        setShowIcdSuggestions(true);
                      }}
                      className="text-xs h-8 rounded-xl"
                    />
                    {/* Quick ICD Picker Dropdown */}
                    {showIcdSuggestions && (
                      <div className="absolute z-10 left-0 right-0 top-9 bg-white rounded-xl shadow-lg border border-slate-200 p-1.5 max-h-40 overflow-y-auto space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 px-2 py-0.5 uppercase">
                          Quick ICD-10 Selection
                        </div>
                        {COMMON_ICD_QUICK_LIST.map((icd) => (
                          <button
                            key={icd.code}
                            type="button"
                            onClick={() => handleSelectIcdQuick(icd)}
                            className="w-full text-left px-2 py-1 rounded-lg hover:bg-teal-50 text-xs flex items-center justify-between"
                          >
                            <span className="font-medium text-slate-800">{icd.name}</span>
                            <span className="font-mono text-[10px] text-teal-700 bg-teal-50 px-1 rounded">
                              {icd.code}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      placeholder="ICD-10 (e.g. I10)"
                      value={newDxCode}
                      onChange={(e) => setNewDxCode(e.target.value)}
                      className="text-xs h-8 rounded-xl font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <select
                      value={newDxCategory}
                      onChange={(e) => setNewDxCategory(e.target.value as any)}
                      className="w-full h-8 rounded-xl border border-input bg-white px-2 text-xs"
                    >
                      <option value="PRIMARY">Primary</option>
                      <option value="SECONDARY">Secondary</option>
                      <option value="PROVISIONAL">Provisional</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <Button
                      type="button"
                      onClick={handleAddDiagnosis}
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs font-semibold h-8 rounded-xl"
                      disabled={!newDxName.trim()}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Dx
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SECTION 5: TREATMENT PLAN & FOLLOW-UP ADVICE */}
      <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
        <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <FileText className="h-4 w-4 text-purple-600" />
            <span>5. Treatment Plan, Lifestyle & Follow-Up Advice</span>
          </CardTitle>
          <span className="text-[10px] text-slate-400 font-mono">Patient Instructions</span>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div>
            <Label className="text-xs font-bold text-slate-700">Clinical Advice & Lifestyle Guidelines</Label>
            <Textarea
              rows={2}
              value={treatmentPlan}
              onChange={(e) => onChangeTreatmentPlan(e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. Low sodium diet, 30 min daily brisk walk, monitor blood pressure weekly, avoid strenuous exertion..."
              className="text-xs mt-1 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <Label className="text-xs font-bold text-slate-700">Recommended Follow-Up Timeframe</Label>
              <Input
                placeholder="e.g. 7 days / 2 weeks / SOS"
                value={followUpPlan.follow_up_timeframe || ""}
                onChange={(e) =>
                  onChangeFollowUpPlan({
                    ...followUpPlan,
                    required: true,
                    follow_up_timeframe: e.target.value,
                  })
                }
                disabled={isReadOnly}
                className="text-xs mt-1 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">Return Precautions / Emergency Triggers</Label>
              <Input
                placeholder="e.g. Return immediately to emergency if severe chest heaviness or palpitations occur"
                value={followUpPlan.instructions || ""}
                onChange={(e) =>
                  onChangeFollowUpPlan({
                    ...followUpPlan,
                    instructions: e.target.value,
                  })
                }
                disabled={isReadOnly}
                className="text-xs mt-1 rounded-xl"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
