import * as React from "react";
import Link from "next/link";
import { FolderOpen, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  phase?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  secondaryText?: string;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  phase,
  actionLabel,
  onAction,
  actionHref,
  secondaryText,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-xs",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 mb-3 shadow-2xs">
        {icon || <FolderOpen className="h-6 w-6 text-slate-400" />}
      </div>

      <div className="flex items-center gap-2 mb-1">
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
        {phase && (
          <Badge variant="teal" className="text-[10px] py-0">
            {phase}
          </Badge>
        )}
      </div>

      <p className="max-w-md text-xs text-slate-500 mb-4 leading-relaxed">
        {description}
      </p>

      {secondaryText && (
        <span className="text-[11px] text-slate-400 font-mono mb-4 block">
          {secondaryText}
        </span>
      )}

      {actionHref && (
        <Link href={actionHref}>
          <Button size="sm" className="text-xs font-semibold gap-1.5 h-8">
            {actionLabel || "Return to Dashboard"} <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      )}

      {actionLabel && onAction && !actionHref && (
        <Button size="sm" onClick={onAction} className="text-xs font-semibold h-8">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
