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
  Sparkles,
  ShieldAlert
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { OrganizationSwitcher } from "@/components/shared/organization-switcher";
import { NotificationPanel } from "@/components/shared/notification-panel";
import { UserMenu } from "@/components/shared/user-menu";
import { resolveWorkspace, WorkspaceDefinition } from "@/lib/workspaces";
import { NavItem } from "@/lib/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProfessionalShellProps {
  children: React.ReactNode;
}

export function ProfessionalShell({ children }: ProfessionalShellProps) {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const workspace: WorkspaceDefinition | null = resolveWorkspace(user, role);

  // If no valid workspace could be resolved, show a safe account configuration screen
  if (!workspace) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Workspace Setup Pending</h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your account (<strong>{user?.fullName || "User"}</strong>) is authenticated, but your MEDORA operational workspace has not been assigned yet.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Button size="sm" onClick={() => logout()} variant="outline" className="text-xs font-semibold">
              <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign Out
            </Button>
            <Link href="/">
              <Button size="sm" className="text-xs font-semibold bg-teal-700 hover:bg-teal-800">
                Return to Gateway
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems: NavItem[] = workspace.navItems;
  const roleTitle = workspace.displayName;

  const renderNavLinks = (isMobile = false) => {
    return (
      <div className="space-y-1 py-2">
        {navItems.map((item) => {
          const isActive = item.exact 
            ? pathname === item.href 
            : pathname === item.href || (item.href !== workspace.landingRoute && pathname.startsWith(item.href));
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

          {/* Platform Identity */}
          <Link href={workspace.landingRoute} className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs group-hover:bg-teal-700 transition-colors">
              <Activity className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight text-slate-900">
                  MEDORA
                </span>
                <Badge variant="outline" className="text-[9px] font-bold text-teal-800 bg-teal-50 border-teal-200 py-0">
                  {workspace.badgeText}
                </Badge>
              </div>
              <span className="text-[10px] text-slate-500 font-medium block truncate max-w-[200px]">
                {roleTitle}
              </span>
            </div>
          </Link>
        </div>

        {/* TopBar Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          <OrganizationSwitcher />
          <NotificationPanel />
          <UserMenu />
        </div>
      </header>

      {/* 2. Workspace Body (Collapsible Sidebar + Main Content) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Collapsible Sidebar */}
        <aside
          className={cn(
            "hidden md:flex flex-col border-r border-slate-200 bg-white transition-all duration-200 z-20 select-none",
            collapsed ? "w-16" : "w-64"
          )}
        >
          {/* Workspace Title & Collapse Trigger */}
          <div className="flex h-12 items-center justify-between px-3.5 border-b border-slate-100">
            {!collapsed && (
              <span className="text-xs font-bold text-slate-900 truncate">
                {roleTitle}
              </span>
            )}
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                "rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors",
                collapsed && "mx-auto"
              )}
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-none">
            {renderNavLinks(false)}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-100">
            {!collapsed ? (
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-mono">{user?.identifier || "USER"}</span>
                <span className="text-teal-700 font-semibold">{workspace.badgeText}</span>
              </div>
            ) : (
              <div className="text-center font-mono text-[9px] text-slate-400">
                {user?.identifier?.slice(0, 3)}
              </div>
            )}
          </div>
        </aside>

        {/* Mobile / Tablet Drawer */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs animate-in fade-in-50" 
              onClick={() => setMobileDrawerOpen(false)} 
            />
            <div className="relative flex w-72 max-w-[85vw] flex-1 flex-col bg-white p-4 shadow-2xl animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    {roleTitle}
                  </span>
                  <span className="text-[10px] text-teal-700 font-mono">
                    {user?.identifier}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-2">
                {renderNavLinks(true)}
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => logout()}
                  className="flex items-center gap-2 w-full p-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Operational Content Container */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
