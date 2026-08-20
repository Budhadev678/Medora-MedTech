"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Activity, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  Building2,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { OrganizationSwitcher } from "@/components/shared/organization-switcher";
import { NotificationPanel } from "@/components/shared/notification-panel";
import { UserMenu } from "@/components/shared/user-menu";
import { getNavigationForRole, NavItem } from "@/lib/navigation";
import { ROLE_LABELS, type UserRole } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProfessionalShellProps {
  children: React.ReactNode;
}

export function ProfessionalShell({ children }: ProfessionalShellProps) {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const effectiveRole: UserRole = role || "doctor";
  const navItems: NavItem[] = getNavigationForRole(effectiveRole);
  const roleTitle = ROLE_LABELS[effectiveRole] || "Professional Workspace";

  const renderNavLinks = (isMobile = false) => {
    return (
      <div className="space-y-1 py-2">
        {navItems.map((item) => {
          const isActive = item.exact 
            ? pathname === item.href 
            : pathname === item.href || (item.href !== `/${effectiveRole}` && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && setMobileDrawerOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-all group relative",
                isActive
                  ? "bg-teal-50 text-teal-900 font-bold border-l-3 border-teal-600 shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
              title={collapsed && !isMobile ? item.label : undefined}
            >
              <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-teal-700" : "text-slate-500 group-hover:text-slate-700")} />
              
              {(!collapsed || isMobile) && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate">{item.label}</span>
                  {item.comingSoon && (
                    <Badge variant="outline" className="text-[9px] py-0 px-1 text-slate-400 border-slate-200 ml-1">
                      {item.phase || "Soon"}
                    </Badge>
                  )}
                  {item.badge && !item.comingSoon && (
                    <Badge variant="teal" className="text-[9px] py-0 px-1 ml-1">
                      {item.badge}
                    </Badge>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-foreground flex flex-col font-sans">
      {/* 1. Universal Top Navigation Bar */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 md:hidden"
            aria-label="Open Navigation Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo & Brand Identity */}
          <Link href={`/${effectiveRole === "hospital_admin" ? "hospital" : effectiveRole}`} className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white shadow-xs transition-transform group-hover:scale-105">
              <Activity className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-slate-900">
                  MEDORA
                </span>
                <span className="rounded bg-teal-50 px-1.5 py-0.2 text-[9px] font-bold text-teal-800 uppercase font-mono">
                  {user?.identifier || "PRO"}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 tracking-tight block -mt-0.5">
                {roleTitle}
              </span>
            </div>
          </Link>

          {/* Organization & Facility Practice Switcher */}
          <div className="ml-2 sm:ml-4">
            <OrganizationSwitcher />
          </div>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          <NotificationPanel />
          <UserMenu />
        </div>
      </header>

      {/* 2. Main Workspace Layout (Sidebar + Content) */}
      <div className="flex-1 flex w-full">
        {/* Desktop / Tablet Collapsible Sidebar */}
        <aside
          className={cn(
            "hidden md:flex flex-col border-r border-slate-200 bg-white transition-all duration-200 z-20",
            collapsed ? "w-16" : "w-60 lg:w-64"
          )}
        >
          {/* Sidebar Section Header */}
          <div className="flex items-center justify-between p-3.5 border-b border-slate-100">
            {!collapsed && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                Workspace Menu
              </span>
            )}
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 mx-auto"
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* Nav Items List */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {renderNavLinks(false)}
          </div>

          {/* Sidebar Footer Controls */}
          <div className="p-3 border-t border-slate-100 space-y-1">
            <Link
              href={`/${effectiveRole === "hospital_admin" ? "hospital" : effectiveRole}/settings`}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors",
                collapsed ? "justify-center" : ""
              )}
              title={collapsed ? "Settings" : undefined}
            >
              <Settings className="h-4 w-4 text-slate-400 flex-shrink-0" />
              {!collapsed && <span>Settings</span>}
            </Link>

            <button
              type="button"
              onClick={() => logout()}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors",
                collapsed ? "justify-center" : ""
              )}
              title={collapsed ? "Sign Out" : undefined}
            >
              <LogOut className="h-4 w-4 text-red-500 flex-shrink-0" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </div>
        </aside>

        {/* 3. Main Workspace Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* 4. Mobile Drawer for Tablets/Phones */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/40 backdrop-blur-xs animate-in fade-in-50 duration-150">
          <div className="fixed inset-0" onClick={() => setMobileDrawerOpen(false)} />
          
          <div className="relative z-50 w-72 max-w-[85vw] h-full bg-white p-4 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded bg-teal-600 text-white">
                  <Activity className="h-4 w-4" />
                </div>
                <span className="font-bold text-sm text-slate-900">MEDORA</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              {renderNavLinks(true)}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-50 text-red-700 text-xs font-bold"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
