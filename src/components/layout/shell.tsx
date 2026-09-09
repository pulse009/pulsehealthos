'use client';

import React, { type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MobileNavToggle,
  SidebarNav,
  ClinicPortalSidebarNav,
  SignOutButton,
  type NavItem,
} from '@/components/layout/nav';
import { DoctorSecondarySidebar } from '@/components/layout/DoctorSecondarySidebar';
import { UserProfileDropdown } from '@/components/layout/UserProfileDropdown';
import { Badge, cn } from '@/components/ui/primitives';
import { LuBell as Bell, LuChevronDown as ChevronDown } from 'react-icons/lu';
import { TopProgressBar } from '@/components/layout/TopProgressBar';

/**
 * Application shell: matches exact 2-sidebar layout structure from Clinic OS design.
 */
export function AppShell({
  navItems,
  workspaceName,
  workspaceKind,
  userName,
  userEmail,
  userRole,
  isPulseNow = false,
  homeHref,
  children,
}: {
  navItems: NavItem[];
  workspaceName: string;
  workspaceKind: 'Admin' | 'Clinic';
  userName: string;
  userEmail: string;
  userRole?: string;
  isPulseNow?: boolean;
  homeHref: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  const clinicInitials = (workspaceName || 'RS')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const isReceptionist = userRole === 'RECEPTIONIST';

  const showSecondarySidebar =
    workspaceKind === 'Clinic' &&
    !isReceptionist &&
    (pathname === '/portal' ||
      pathname.startsWith('/portal/doctors') ||
      pathname.startsWith('/portal/services') ||
      pathname.startsWith('/portal/patients') ||
      pathname.startsWith('/portal/appointments') ||
      pathname.startsWith('/portal/roles') ||
      pathname.startsWith('/portal/organization') ||
      pathname.startsWith('/portal/profile') ||
      pathname.startsWith('/portal/security') ||
      pathname.startsWith('/portal/subscription') ||
      pathname.startsWith('/portal/upgrade') ||
      (!isPulseNow && pathname.startsWith('/portal/inventory')) ||
      (!isPulseNow && pathname.startsWith('/portal/accounts')));

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans">
      <TopProgressBar />

      {/* 1. FIXED PRIMARY MAIN SIDEBAR (LEFTMOST SLIM RAIL) */}
      <aside
        className={cn(
          'surface hidden shrink-0 flex-col border-r border-[#0d8276]/15 dark:border-slate-800 lg:flex sticky top-0 h-screen z-30 overflow-hidden select-none',
          workspaceKind === 'Clinic'
            ? 'w-[72px] bg-[#f8fcfa] dark:bg-[#090d16] border-r border-[#0d8276]/15 dark:border-slate-800'
            : 'w-60 bg-white dark:bg-slate-900'
        )}
      >
        {/* Brand Header (Admin Portal Only) */}
        {workspaceKind === 'Admin' ? (
          <div className="h-[52px] flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 px-4 shrink-0">
            <Link href={homeHref} className="flex items-center gap-2 group min-w-0">
              <div className="size-7.5 rounded-lg bg-gradient-to-tr from-[#0d6157] via-[#0d8276] to-teal-400 p-0.5 shadow-xs flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                  <span className="text-[10px] font-black text-teal-300">PW</span>
                </div>
              </div>
              <div className="min-w-0">
                <span className="block truncate text-sm font-black tracking-tight text-slate-900 dark:text-white">
                  Pulse<span className="text-[#0d8276]">ware</span>
                </span>
                <Badge tone="brand" className="text-[9px] px-1.5 py-0 font-bold">
                  Admin
                </Badge>
              </div>
            </Link>
          </div>
        ) : null}

        {/* Navigation Links */}
        <div className="flex-1 overflow-hidden">
          {workspaceKind === 'Clinic' ? (
            <ClinicPortalSidebarNav userRole={userRole} isPulseNow={isPulseNow} />
          ) : (
            <SidebarNav items={navItems} />
          )}
        </div>

        {/* Sidebar Footer (Admin Portal Only) */}
        {workspaceKind === 'Admin' && (
          <div className="p-3 shrink-0 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 p-2.5 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-8 rounded-full bg-gradient-to-tr from-[#0d6157] to-[#0d8276] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {clinicInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                    {workspaceName}
                  </p>
                  <p className="truncate text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
                    {userEmail}
                  </p>
                </div>
              </div>
              <ChevronDown className="size-3.5 text-slate-400 shrink-0" />
            </div>
            <div className="mt-2 px-1">
              <SignOutButton />
            </div>
          </div>
        )}
      </aside>

      {/* 2. SECONDARY SIDEBAR (RENDERED FOR DASHBOARD & DOCTORS MODULE) */}
      {showSecondarySidebar && <DoctorSecondarySidebar userRole={userRole} isPulseNow={isPulseNow} />}

      {/* 3. MAIN CONTENT AREA WITH TOP HEADER */}
      <div className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
        {/* COMPACT TOP HEADER - Exactly aligned with secondary sidebar header */}
        <header className="h-[52px] surface sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[#0d8276]/10 dark:border-slate-800 px-4 bg-white dark:bg-slate-900 backdrop-blur-md shrink-0">
          {/* Left Section: Mobile toggle + Clinic Initials Badge + Clinic Name + Owner Email */}
          <div className="flex items-center gap-2.5 min-w-0">
            <MobileNavToggle
              items={navItems}
              isClinicPortal={workspaceKind === 'Clinic'}
              isPulseNow={isPulseNow}
            />
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Teal Rounded Square Badge */}
              <div className="size-8 rounded-xl bg-gradient-to-tr from-[#0d6157] to-[#0d8276] text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-xs shrink-0">
                {clinicInitials}
              </div>
              <div className="min-w-0">
                <span className="block truncate text-xs font-bold text-[#0d3d38] dark:text-white leading-tight">
                  {workspaceName}
                </span>
                <span className="block truncate text-[11px] text-[#0d6157]/70 dark:text-slate-400 font-normal leading-tight mt-0.5">
                  {userEmail}
                </span>
              </div>
            </div>
          </div>

          {/* Right Section: Notification Icon Circle + Profile Dropdown */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Notification Bell Button */}
            <Link
              href={workspaceKind === 'Clinic' ? '/portal/notifications' : '/admin/reminders'}
              className="size-8 rounded-full bg-slate-50/80 dark:bg-slate-800 border border-[#0d8276]/15 dark:border-slate-700 hover:bg-[#e6f6f3] hover:border-[#0d8276]/30 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center relative transition-colors shadow-2xs"
              aria-label="Notifications"
            >
              <Bell className="size-3.5 text-[#0d5c56] dark:text-slate-300" />
              <span className="size-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 absolute top-1.5 right-1.5" />
            </Link>

            {/* Profile Dropdown with Clinic Profile & Log Out */}
            <UserProfileDropdown
              workspaceName={workspaceName}
              workspaceKind={workspaceKind}
              userName={userName}
              userEmail={userEmail}
              userRole={userRole}
              clinicInitials={clinicInitials}
            />
          </div>
        </header>

        {/* FLUSH PAGE CONTENT */}
        <main className="min-w-0 min-h-0 flex-1 flex flex-col overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
