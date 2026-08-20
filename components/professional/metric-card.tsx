"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeVariant?: "default" | "teal" | "outline" | "success" | "warning" | "destructive";
  className?: string;
}

export function MetricCard({
  label,
  value,
  subtext,
  icon,
  badge,
  badgeVariant = "teal",
  className = "",
}: MetricCardProps) {
  return (
    <Card className={`bg-white border-slate-200 shadow-2xs ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 block truncate">
            {label}
          </span>
          {icon && (
            <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
              {icon}
            </div>
          )}
        </div>

        <div className="flex items-baseline justify-between mt-2">
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            {value}
          </span>
          {badge && (
            <Badge variant={badgeVariant as any} className="text-[10px] py-0">
              {badge}
            </Badge>
          )}
        </div>

        {subtext && (
          <span className="text-[11px] text-slate-500 block mt-1 leading-tight">
            {subtext}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
