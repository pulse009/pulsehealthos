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
import { Badge, cn } from '@/components/ui/primitives';
import { Bell, ChevronDown } from 'lucide-react';
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
  homeHref,
  children,
}: {
  navItems: NavItem[];
  workspaceName: string;
  workspaceKind: 'Admin' | 'Clinic';
  userName: string;
  userEmail: string;
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

  const showSecondarySidebar =
    workspaceKind === 'Clinic' &&
    (pathname === '/portal' ||
      pathname.startsWith('/portal/doctors') ||
      pathname.startsWith('/portal/services') ||
      pathname.startsWith('/portal/patients') ||
      pathname.startsWith('/portal/appointments'));

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans">
      <TopProgressBar />

      {/* 1. FIXED PRIMARY MAIN SIDEBAR (LEFTMOST SLIM RAIL) */}
      <aside
        className={cn(
          'surface hidden shrink-0 flex-col border-r border-slate-200/90 dark:border-slate-800 lg:flex sticky top-0 h-screen z-30 overflow-hidden select-none',
          workspaceKind === 'Clinic'
            ? 'w-[72px] bg-[#E6E7EB] dark:bg-[#090d16] border-r border-slate-300/80 dark:border-slate-800'
            : 'w-60 bg-white dark:bg-slate-900'
        )}
      >
        {/* Brand Header (Admin Portal Only) */}
        {workspaceKind === 'Admin' ? (
          <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 shrink-0">
            <Link href={homeHref} className="flex items-center gap-2 group min-w-0">
              <div className="size-7.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-center p-1 shrink-0">
                <div className="grid grid-cols-2 gap-0.5 w-full h-full">
                  <span className="bg-blue-600 rounded-full size-1.5"></span>
                  <span className="bg-slate-800 dark:bg-slate-200 rounded-full size-1.5"></span>
                  <span className="bg-slate-800 dark:bg-slate-200 rounded-full size-1.5"></span>
                  <span className="bg-slate-800 dark:bg-slate-200 rounded-full size-1.5"></span>
                </div>
              </div>
              <div className="min-w-0">
                <span className="block truncate text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                  Clinic<span className="text-blue-600">AI</span>
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
            <ClinicPortalSidebarNav />
          ) : (
            <SidebarNav items={navItems} />
          )}
        </div>

        {/* Sidebar Footer (Admin Portal Only) */}
        {workspaceKind === 'Admin' && (
          <div className="p-3 shrink-0 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 p-2.5 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-8 rounded-full bg-[#0f172a] dark:bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
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
      {showSecondarySidebar && <DoctorSecondarySidebar />}

      {/* 3. MAIN CONTENT AREA WITH TOP HEADER */}
      <div className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
        {/* COMPACT TOP HEADER */}
        <header className="surface sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-6 py-3 bg-white dark:bg-slate-900 backdrop-blur-md shrink-0">
          {/* Left Section: Mobile toggle + Clinic Initials Badge + Clinic Name + Owner Email */}
          <div className="flex items-center gap-3 min-w-0">
            <MobileNavToggle
              items={navItems}
              isClinicPortal={workspaceKind === 'Clinic'}
            />
            <div className="flex items-center gap-3 min-w-0">
              {/* Dark Rounded Square Badge */}
              <div className="size-9 rounded-xl bg-[#0f172a] dark:bg-slate-800 text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-xs shrink-0">
                {clinicInitials}
              </div>
              <div className="min-w-0">
                <span className="block truncate text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  {workspaceName}
                </span>
                <span className="block truncate text-xs text-slate-400 dark:text-slate-500 font-normal leading-tight mt-0.5">
                  {userEmail}
                </span>
              </div>
            </div>
          </div>

          {/* Right Section: Notification Icon Circle + Profile Circle */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Notification Bell Button */}
            <Link
              href={workspaceKind === 'Clinic' ? '/portal/notifications' : '/admin/reminders'}
              className="size-9 rounded-full bg-slate-50/80 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center relative transition-colors shadow-2xs"
              aria-label="Notifications"
            >
              <Bell className="size-4 text-slate-600 dark:text-slate-300" />
              <span className="size-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 absolute top-2 right-2" />
            </Link>

            {/* Profile Circle */}
            <div
              title={`${userName} (${userEmail})`}
              className="size-9 rounded-full bg-[#0f172a] dark:bg-slate-800 text-white font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer select-none"
            >
              {clinicInitials}
            </div>
          </div>
        </header>

        {/* FLUSH PAGE CONTENT */}
        <main className="min-w-0 min-h-0 flex-1 flex flex-col overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
