'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Home,
  CreditCard,
  Wrench,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { cn } from '@/components/ui/primitives';
import {
  useDoctorActiveTab,
  setDoctorActiveTab,
  type DoctorTabKey,
} from '@/lib/stores/doctorTabStore';

export interface DoctorSummary {
  id: string;
  name: string;
  specialty?: string | null;
  isActive: boolean;
}

// Global in-memory cache for instant ClickUp-style previews without re-fetching
let DOCTORS_CACHE: DoctorSummary[] | null = null;
let isFetchingGlobal = false;
const listeners = new Set<(docs: DoctorSummary[]) => void>();

export function setCachedDoctors(docs: DoctorSummary[]) {
  DOCTORS_CACHE = docs;
  listeners.forEach((fn) => fn(docs));
}

export function DoctorSecondarySidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');

  // Instant shared synchronous activeTab state
  const [currentTab, setActiveTab] = useDoctorActiveTab(urlTab);

  // Instant render from in-memory cache if available
  const [doctors, setDoctors] = useState<DoctorSummary[]>(() => DOCTORS_CACHE || []);
  const [isLoading, setIsLoading] = useState(() => DOCTORS_CACHE === null);

  // Check if we are viewing a specific doctor detail page: /portal/doctors/[doctorId]
  const doctorIdMatch = pathname.match(/^\/portal\/doctors\/([^\/]+)$/);
  const currentDoctorId = doctorIdMatch && doctorIdMatch[1] !== 'create' ? doctorIdMatch[1] : null;

  useEffect(() => {
    // Subscribe to cache updates
    const updateListener = (updatedDocs: DoctorSummary[]) => {
      setDoctors(updatedDocs);
      setIsLoading(false);
    };
    listeners.add(updateListener);

    // If cache is empty, fetch once on first load only
    if (!DOCTORS_CACHE && !isFetchingGlobal) {
      isFetchingGlobal = true;
      fetch('/api/doctors')
        .then((res) => res.json())
        .then((data) => {
          if (data.ok && Array.isArray(data.doctors)) {
            DOCTORS_CACHE = data.doctors;
            setDoctors(data.doctors);
            listeners.forEach((fn) => fn(data.doctors));
          }
        })
        .catch((err) => console.error('Failed to load doctors list:', err))
        .finally(() => {
          isFetchingGlobal = false;
          setIsLoading(false);
        });
    }

    return () => {
      listeners.delete(updateListener);
    };
  }, []);

  const activeDoctor = currentDoctorId ? doctors.find((d) => d.id === currentDoctorId) : null;

  // Handle instant 0ms tab click
  const handleTabClick = (tabKey: DoctorTabKey) => {
    setActiveTab(tabKey);
  };

  return (
    <aside
      className="w-64 shrink-0 flex flex-col border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 h-full overflow-hidden select-none"
      aria-label="Secondary Navigation"
    >
      {/* 1. Header with Icon and PulseHealth Title */}
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <Home className="size-4 text-slate-800 dark:text-slate-200 stroke-[2.2]" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            PulseHealth
          </h2>
        </div>
      </div>

      {/* Single Main Scrollable Container */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-5 min-h-0">
        {/* 2. Top Highlighted Button (Clean Inline Single-Line Format) */}
        <div>
          {currentDoctorId ? (
            <Link
              href="/portal/doctors"
              className="flex items-center gap-1.5 w-full px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 text-slate-950 dark:text-white transition-all shadow-2xs whitespace-nowrap overflow-hidden"
            >
              <span className="shrink-0">← All Doctors</span>
              {activeDoctor?.name && (
                <span className="text-[11px] font-normal text-slate-500 truncate">
                  ({activeDoctor.name})
                </span>
              )}
            </Link>
          ) : pathname === '/portal' ? (
            <Link
              href="/portal"
              className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-200/90 dark:bg-slate-800 text-slate-950 dark:text-white transition-all shadow-2xs"
            >
              <span>Dashboard</span>
            </Link>
          ) : (
            <Link
              href="/portal/doctors"
              className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-200/90 dark:bg-slate-800 text-slate-950 dark:text-white transition-all shadow-2xs"
            >
              <span>All Doctors</span>
            </Link>
          )}
        </div>

        {/* 3. Doctor Configuration Section */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 pb-2 mb-1 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white">
            <CreditCard className="size-4 stroke-[2.2]" />
            <span>Doctor Configuration</span>
          </div>

          {currentDoctorId ? (
            /* Continuous 7 Tabs with Instant 0ms In-Memory Click Handlers */
            <div className="space-y-0.5">
              {/* 1. Working Schedule */}
              <button
                type="button"
                onClick={() => handleTabClick('schedule')}
                className={cn(
                  'flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer',
                  currentTab === 'schedule'
                    ? 'font-bold text-slate-950 dark:text-white bg-slate-200/80 dark:bg-slate-800 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                )}
              >
                <span>Working Schedule</span>
              </button>

              {/* 2. Appointment Types */}
              <button
                type="button"
                onClick={() => handleTabClick('appointment-types')}
                className={cn(
                  'flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer',
                  currentTab === 'appointment-types'
                    ? 'font-bold text-slate-950 dark:text-white bg-slate-200/80 dark:bg-slate-800 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                )}
              >
                <span>Appointment Types</span>
                <span className="bg-[#1e293b] text-white font-bold text-[9px] px-2 py-0.5 rounded-full">
                  Active
                </span>
              </button>

              {/* 3. Blocked Periods */}
              <button
                type="button"
                onClick={() => handleTabClick('blocked')}
                className={cn(
                  'flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer',
                  currentTab === 'blocked'
                    ? 'font-bold text-slate-950 dark:text-white bg-slate-200/80 dark:bg-slate-800 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                )}
              >
                <span>Blocked Periods</span>
              </button>

              {/* 4. Appointments */}
              <button
                type="button"
                onClick={() => handleTabClick('appointments')}
                className={cn(
                  'flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer',
                  currentTab === 'appointments'
                    ? 'font-bold text-slate-950 dark:text-white bg-slate-200/80 dark:bg-slate-800 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                )}
              >
                <span>Appointments</span>
              </button>

              {/* 5. Doctor Profile */}
              <button
                type="button"
                onClick={() => handleTabClick('overview')}
                className={cn(
                  'flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer',
                  currentTab === 'overview'
                    ? 'font-bold text-slate-950 dark:text-white bg-slate-200/80 dark:bg-slate-800 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                )}
              >
                <span>Doctor Profile</span>
              </button>

              {/* 6. Assigned Coordinator (Directly below Doctor Profile) */}
              <button
                type="button"
                onClick={() => handleTabClick('coordinator')}
                className={cn(
                  'flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer',
                  currentTab === 'coordinator'
                    ? 'font-bold text-slate-950 dark:text-white bg-slate-200/80 dark:bg-slate-800 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                )}
              >
                <span>Assigned Coordinator</span>
              </button>

              {/* 7. Payment Structure (Directly below Coordinator) */}
              <button
                type="button"
                onClick={() => handleTabClick('payment-structure')}
                className={cn(
                  'flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer',
                  currentTab === 'payment-structure'
                    ? 'font-bold text-slate-950 dark:text-white bg-slate-200/80 dark:bg-slate-800 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                )}
              >
                <span>Payment Structure</span>
              </button>
            </div>
          ) : (
            /* All Doctors List with Instant Previews */
            <div className="space-y-0.5">
              {isLoading && doctors.length === 0 ? (
                <div className="p-2 text-center text-slate-400 text-xs italic">
                  Loading doctors...
                </div>
              ) : doctors.length === 0 ? (
                <div className="p-2 text-center text-slate-400 text-xs italic">
                  No doctors registered
                </div>
              ) : (
                doctors.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/portal/doctors/${doc.id}`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors group"
                  >
                    <span className="truncate">{doc.name}</span>
                    <ChevronRight className="size-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </Link>
                ))
              )}
            </div>
          )}
        </div>

        {/* 4. Section 2: Utilities & Settings (Shown only on general views) */}
        {!currentDoctorId && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 pb-2 mb-1 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white">
              <Wrench className="size-4 stroke-[2.2]" />
              <span>Utilities &amp; Settings</span>
            </div>

            <div className="space-y-0.5">
              <Link
                href="/portal/appointments"
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                  pathname.startsWith('/portal/appointments')
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                )}
              >
                <span>Appointments Schedule</span>
              </Link>
              <Link
                href="/portal/services"
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                  pathname.startsWith('/portal/services')
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                )}
              >
                <span>Clinical Services</span>
              </Link>
              <Link
                href="/portal/patients"
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                  pathname.startsWith('/portal/patients')
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                )}
              >
                <span>Patients Directory</span>
              </Link>
            </div>
          </div>
        )}

        {/* 5. Switch Doctor Section */}
        {currentDoctorId && doctors.length > 1 && (
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Switch Doctor
            </div>
            <div className="space-y-0.5">
              {doctors
                .filter((d) => d.id !== currentDoctorId)
                .map((d) => (
                  <Link
                    key={d.id}
                    href={`/portal/doctors/${d.id}?tab=${currentTab}`}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <span className="truncate font-medium">{d.name}</span>
                    <ChevronRight className="size-3 text-slate-400 shrink-0" />
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <Link
          href="/portal/doctors/create"
          className="flex items-center justify-center gap-1.5 w-full bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer"
        >
          <Plus className="size-3.5 stroke-[2.5]" />
          <span>+ Add Doctor</span>
        </Link>
      </div>
    </aside>
  );
}
