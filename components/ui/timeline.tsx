import * as React from "react";
import { 
  Calendar, 
  Stethoscope, 
  FileText, 
  FlaskConical, 
  FileCheck2, 
  Pill, 
  Receipt, 
  CreditCard, 
  AlertTriangle, 
  BedDouble, 
  CheckCircle2,
  Clock
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

export interface TimelineItemData {
  id: string;
  type: 
    | "appointment" 
    | "consultation" 
    | "prescription" 
    | "lab_order" 
    | "lab_report" 
    | "pharmacy_dispense" 
    | "admission" 
    | "discharge" 
    | "bill_generated" 
    | "payment" 
    | "emergency";
  title: string;
  summary: string;
  timestamp: string;
  actor?: string;
  organization?: string;
  status?: string;
  actionLabel?: string;
  onActionClick?: () => void;
}

interface TimelineProps {
  items: TimelineItemData[];
  className?: string;
  onItemSelect?: (item: TimelineItemData) => void;
}

export function Timeline({ items, className, onItemSelect }: TimelineProps) {
  const getEventIcon = (type: TimelineItemData["type"]) => {
    switch (type) {
      case "appointment":
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case "consultation":
        return <Stethoscope className="h-4 w-4 text-teal-600" />;
      case "prescription":
        return <FileText className="h-4 w-4 text-indigo-600" />;
      case "lab_order":
        return <FlaskConical className="h-4 w-4 text-amber-600" />;
      case "lab_report":
        return <FileCheck2 className="h-4 w-4 text-emerald-600" />;
      case "pharmacy_dispense":
        return <Pill className="h-4 w-4 text-teal-700" />;
      case "bill_generated":
        return <Receipt className="h-4 w-4 text-purple-600" />;
      case "payment":
        return <CreditCard className="h-4 w-4 text-green-600" />;
      case "emergency":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "admission":
      case "discharge":
        return <BedDouble className="h-4 w-4 text-sky-600" />;
      default:
        return <Clock className="h-4 w-4 text-slate-500" />;
    }
  };

  const getEventBadgeBg = (type: TimelineItemData["type"]) => {
    switch (type) {
      case "appointment":
        return "bg-blue-50 border-blue-200";
      case "consultation":
        return "bg-teal-50 border-teal-200";
      case "prescription":
        return "bg-indigo-50 border-indigo-200";
      case "lab_order":
        return "bg-amber-50 border-amber-200";
      case "lab_report":
        return "bg-emerald-50 border-emerald-200";
      case "pharmacy_dispense":
        return "bg-teal-100 border-teal-300";
      case "bill_generated":
        return "bg-purple-50 border-purple-200";
      case "payment":
        return "bg-green-50 border-green-200";
      case "emergency":
        return "bg-red-50 border-red-200";
      default:
        return "bg-slate-50 border-slate-200";
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No healthcare timeline records recorded yet.
      </div>
    );
  }

  return (
    <div className={cn("relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div 
            key={item.id || index} 
            className="relative group transition-all"
            onClick={() => onItemSelect?.(item)}
          >
            {/* Timeline Node Icon */}
            <div className={cn(
              "absolute -left-6 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border bg-white shadow-xs transition-transform group-hover:scale-110",
              getEventBadgeBg(item.type)
            )}>
              {getEventIcon(item.type)}
            </div>

            {/* Event Content Box */}
            <div className="rounded-lg border border-border bg-white p-3.5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  {item.title}
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  {formatDate(item.timestamp, true)}
                </span>
              </div>

              <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                {item.summary}
              </p>

              {(item.actor || item.organization) && (
                <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                  {item.actor && <span className="font-medium text-slate-700">{item.actor}</span>}
                  {item.actor && item.organization && <span>•</span>}
                  {item.organization && <span>{item.organization}</span>}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
