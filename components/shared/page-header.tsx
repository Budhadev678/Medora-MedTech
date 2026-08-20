"use client";

import React from "react";
import { Breadcrumbs, BreadcrumbItem } from "@/components/shared/breadcrumbs";
import { Badge } from "@/components/ui/badge";

interface PageHeaderProps {
  title: string;
  description?: string;
  badgeText?: string;
  badgeVariant?: "default" | "teal" | "outline" | "success" | "warning" | "destructive";
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  badgeText,
  badgeVariant = "teal",
  breadcrumbs,
  actions,
  children,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`space-y-3 pb-2 ${className}`}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-1" />}
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
            {badgeText && (
              <Badge variant={badgeVariant as any} className="text-[10px] font-semibold">
                {badgeText}
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-auto">
            {actions}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}
