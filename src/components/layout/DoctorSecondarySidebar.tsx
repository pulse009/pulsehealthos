'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  LuHouse as Home,
  LuCreditCard as CreditCard,
  LuWrench as Wrench,
  LuChevronRight as ChevronRight,
  LuPlus as Plus,
  LuUsers as Users,
  LuBoxes as Boxes,
  LuPackage as Package,
  LuLayers as Layers,
  LuActivity as Activity,
  LuTruck as Truck,
  LuFileText as FileText,
  LuTriangleAlert as AlertTriangle,
  LuClipboardList as ClipboardList,
  LuWallet as Wallet,
  LuReceiptText as ReceiptText,
  LuDollarSign as DollarSign,
  LuChartPie as PieChart,
  LuCalendarCheck as CalendarCheck,
  LuCalendarDays as CalendarDays,
  LuBuilding2 as Building2,
  LuShield as Shield,
  LuShieldAlert as ShieldAlert,
  LuClock as Clock,
  LuTrendingUp as TrendingUp,
  LuHeartPulse as HeartPulse,
  LuPill as Pill,
} from 'react-icons/lu';
import { FaUserDoctor as Stethoscope } from 'react-icons/fa6';
import { cn } from '@/components/ui/primitives';
import { FastLink } from '@/components/ui/FastLink';
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

export function DoctorSecondarySidebar({
  userRole,
  isPulseNow = false,
}: {
  userRole?: string;
  isPulseNow?: boolean;
} = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');

  const isDoctor = userRole === 'DOCTOR';
  const isNurse = userRole === 'NURSE';
  const isCoordinator = userRole === 'COORDINATOR';
  const isManager = userRole === 'MANAGER';

  // Instant shared synchronous activeTab state
  const [currentTab, setActiveTab] = useDoctorActiveTab(urlTab);

  // Optimistic navigation states for 0ms visual latency
  const [optimisticPath, setOptimisticPath] = useState<string | null>(null);
  const [optimisticTab, setOptimisticTab] = useState<string | null>(null);

  useEffect(() => {
    setOptimisticPath(null);
    setOptimisticTab(null);
  }, [pathname, urlTab]);

  const activePath = optimisticPath || pathname;
  const activeTabParam = optimisticTab !== null ? optimisticTab : urlTab;

  const handleNavigate = (targetHref: string) => {
    const parts = targetHref.split('?');
    const pathPart = parts[0] || null;
    const queryPart = parts[1];
    setOptimisticPath(pathPart);
    if (queryPart) {
      const sp = new URLSearchParams(queryPart);
      const tab = sp.get('tab') || sp.get('status') || null;
      setOptimisticTab(tab);
    } else {
      setOptimisticTab(null);
    }
  };

  // Proactively warm up all primary portal routes in the background
  useEffect(() => {
    const warmList = [
      '/portal',
      '/portal/nurse',
      '/portal/manager',
      '/portal/doctors',
      '/portal/services',
      '/portal/patients',
      '/portal/appointments',
      '/portal/conversations',
      '/portal/roles',
      '/portal/pharmacy',
      '/portal/laboratory',
      '/portal/accounts',
      '/portal/accounts/closing',
      '/portal/accounts/invoices',
      '/portal/accounts/doctor-payouts',
      '/portal/inventory',
      '/portal/inventory/requests',
      '/portal/inventory/purchase-orders',
      '/portal/inventory/items',
      '/portal/inventory/low-stock',
      '/portal/security',
      '/portal/subscription',
      '/portal/organization',
    ];
    if (typeof window !== 'undefined') {
      const runWarm = () => {
        warmList.forEach((route) => {
          try {
            router.prefetch(route);
          } catch {}
        });
      };
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(runWarm);
      } else {
        setTimeout(runWarm, 80);
      }
    }
  }, [router]);

  // If user is DOCTOR, do not initialize from an admin DOCTORS_CACHE with multiple doctors
  const [doctors, setDoctors] = useState<DoctorSummary[]>(() => {
    if (isDoctor && DOCTORS_CACHE && DOCTORS_CACHE.length > 1) return [];
    return DOCTORS_CACHE || [];
  });
  const [isLoading, setIsLoading] = useState(() => DOCTORS_CACHE === null);

  // Check if we are viewing a specific doctor detail page: /portal/doctors/[doctorId]
  const doctorIdMatch = pathname.match(/^\/portal\/doctors\/([^\/]+)$/);
  const currentDoctorId = doctorIdMatch && doctorIdMatch[1] !== 'create' ? doctorIdMatch[1] : null;
  const effectiveDoctorId = isDoctor ? (currentDoctorId || doctors[0]?.id) : currentDoctorId;

  useEffect(() => {
    // Subscribe to cache updates
    const updateListener = (updatedDocs: DoctorSummary[]) => {
      setDoctors(updatedDocs);
      setIsLoading(false);
    };
    listeners.add(updateListener);

    // If cache is already present, avoid unnecessary duplicate network request
    if (DOCTORS_CACHE && DOCTORS_CACHE.length > 0) {
      setIsLoading(false);
      return () => {
        listeners.delete(updateListener);
      };
    }

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
        setIsLoading(false);
      });

    return () => {
      listeners.delete(updateListener);
    };
  }, []);

  const activeDoctor = effectiveDoctorId
    ? doctors.find((d) => d.id === effectiveDoctorId) || (isDoctor ? doctors[0] : null)
    : null;

  useEffect(() => {
    if ((isDoctor || isPulseNow) && currentTab === 'payment-structure') {
      setActiveTab('schedule');
    }
  }, [isDoctor, isPulseNow, currentTab, setActiveTab]);

  // Handle instant 0ms tab click
  const handleTabClick = (tabKey: DoctorTabKey) => {
    setActiveTab(tabKey);
  };

  const isAppointmentsPage = activePath.startsWith('/portal/appointments');
  const isRolesPage = activePath.startsWith('/portal/roles');
  const isManagerPage = activePath.startsWith('/portal/manager');
  const isNursePage = activePath.startsWith('/portal/nurse');
  const isPharmacyPage = activePath.startsWith('/portal/pharmacy');
  const isOrganizationPage = activePath.startsWith('/portal/organization') || activePath.startsWith('/portal/profile');
  const isSecurityPage = activePath.startsWith('/portal/security');
  const isSubscriptionPage = activePath.startsWith('/portal/subscription') || activePath.startsWith('/portal/upgrade');
  const roleTab = activeTabParam || searchParams.get('tab') || 'all';

  const isInventoryPage = activePath.startsWith('/portal/inventory');
  const isAccountsPage = activePath.startsWith('/portal/accounts');

  if (isNurse) {
    return (
      <aside
        className="w-64 shrink-0 flex flex-col border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 h-full overflow-hidden select-none"
        aria-label="Nurse Navigation"
      >
        {/* 1. Header with Icon and Pulseware Title */}
        <div className="h-[52px] px-5 border-b border-[#0d8276]/10 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-6 rounded-lg bg-gradient-to-tr from-[#0d6157] to-[#0d8276] text-white flex items-center justify-center shadow-xs">
              <svg viewBox="0 0 24 24" className="size-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="3.5" />
                <circle cx="12" cy="3" r="1.5" />
                <circle cx="12" cy="21" r="1.5" />
                <circle cx="3" cy="12" r="1.5" />
                <circle cx="21" cy="12" r="1.5" />
                <circle cx="5.636" cy="5.636" r="1.5" />
                <circle cx="18.364" cy="18.364" r="1.5" />
                <circle cx="5.636" cy="18.364" r="1.5" />
                <circle cx="18.364" cy="5.636" r="1.5" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-[#0d3d38] dark:text-white tracking-tight">
              Pulse<span className="text-[#0d8276]">ware</span>
            </h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e6f6f3] dark:bg-[#0d6157]/30 text-[#0d5c56] dark:text-teal-300 border border-[#0d8276]/20">
            Nurse Station
          </span>
        </div>

        {/* Nurse Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-4 min-h-0">
          {/* Top Station Banner */}
          <FastLink
            href="/portal/nurse"
            onNavigate={handleNavigate}
            active={activePath === '/portal/nurse' && (!activeTabParam || activeTabParam === 'triage')}
            activeClassName="bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 border border-[#0d8276]/25 font-bold"
            inactiveClassName="text-slate-700 dark:text-slate-300 hover:text-[#0d5c56] hover:bg-[#f0f9f7] dark:hover:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 font-medium"
            className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs transition-all shadow-2xs cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <HeartPulse className="size-4 text-[#0d6157] dark:text-teal-400" />
              <span>Nurse Station</span>
            </div>
          </FastLink>

          {/* Section: Clinical Nursing & Flow */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 pb-1.5 mb-1 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <Activity className="size-3 text-[#0d6157] dark:text-teal-400 stroke-[2.2]" />
              <span>Clinical Nursing &amp; Flow</span>
            </div>
            <div className="space-y-0.5">
              <FastLink
                href="/portal/nurse?tab=triage"
                onNavigate={handleNavigate}
                active={activePath === '/portal/nurse' && (activeTabParam === 'triage' || !activeTabParam)}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <div className="flex items-center gap-2">
                  <HeartPulse className="size-3.5" />
                  <span>Triage &amp; Vitals</span>
                </div>
              </FastLink>

              <FastLink
                href="/portal/nurse?tab=queue"
                onNavigate={handleNavigate}
                active={activePath === '/portal/nurse' && activeTabParam === 'queue'}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <div className="flex items-center gap-2">
                  <Users className="size-3.5" />
                  <span>Waiting Room Queue</span>
                </div>
              </FastLink>

              <FastLink
                href="/portal/appointments"
                onNavigate={handleNavigate}
                active={activePath.startsWith('/portal/appointments')}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-3.5" />
                  <span>Appointments</span>
                </div>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                  Limited
                </span>
              </FastLink>

              <FastLink
                href="/portal/patients"
                onNavigate={handleNavigate}
                active={activePath.startsWith('/portal/patients')}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <div className="flex items-center gap-2">
                  <Users className="size-3.5" />
                  <span>Patient Directory</span>
                </div>
              </FastLink>

              <FastLink
                href="/portal/nurse?tab=history"
                onNavigate={handleNavigate}
                active={activePath === '/portal/nurse' && activeTabParam === 'history'}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <div className="flex items-center gap-2">
                  <FileText className="size-3.5" />
                  <span>Basic Patient Clinical History</span>
                </div>
              </FastLink>

              <FastLink
                href="/portal/inventory/requests"
                onNavigate={handleNavigate}
                active={activePath.startsWith('/portal/inventory')}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <div className="flex items-center gap-2">
                  <Boxes className="size-3.5" />
                  <span>Medical Supplies Request</span>
                </div>
              </FastLink>
            </div>
          </div>

          {/* Section: Inbox & Profile */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 pb-1.5 mb-1 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <Wrench className="size-3 text-[#0d6157] dark:text-teal-400 stroke-[2.2]" />
              <span>Inbox &amp; Security</span>
            </div>
            <div className="space-y-0.5">
              <FastLink
                href="/portal/conversations"
                onNavigate={handleNavigate}
                active={activePath.startsWith('/portal/conversations')}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <div className="flex items-center gap-2">
                  <FileText className="size-3.5" />
                  <span>Inbox/Internal Communication</span>
                </div>
              </FastLink>

              <FastLink
                href="/portal/security"
                onNavigate={handleNavigate}
                active={activePath.startsWith('/portal/security')}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <div className="flex items-center gap-2">
                  <Shield className="size-3.5" />
                  <span>My Profile / Personal Security</span>
                </div>
              </FastLink>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  if (isManager && !currentDoctorId) {
    return (
      <aside
        className="w-64 shrink-0 flex flex-col border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 h-full overflow-hidden select-none"
        aria-label="Manager Navigation"
      >
        {/* 1. Header with Icon and Pulseware Title */}
        <div className="h-[52px] px-5 border-b border-[#0d8276]/10 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-6 rounded-lg bg-gradient-to-tr from-[#0d6157] to-[#0d8276] text-white flex items-center justify-center shadow-xs">
              <svg viewBox="0 0 24 24" className="size-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="3.5" />
                <circle cx="12" cy="3" r="1.5" />
                <circle cx="12" cy="21" r="1.5" />
                <circle cx="3" cy="12" r="1.5" />
                <circle cx="21" cy="12" r="1.5" />
                <circle cx="5.636" cy="5.636" r="1.5" />
                <circle cx="18.364" cy="18.364" r="1.5" />
                <circle cx="5.636" cy="18.364" r="1.5" />
                <circle cx="18.364" cy="5.636" r="1.5" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-[#0d3d38] dark:text-white tracking-tight">
              Pulse<span className="text-[#0d8276]">ware</span>
            </h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Manager Hub
          </span>
        </div>

        {/* Manager Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-4 min-h-0">
          {/* Top Ops Hub Banner */}
          <FastLink
            href="/portal/manager"
            onNavigate={handleNavigate}
            active={activePath === '/portal/manager'}
            activeClassName="bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 border border-[#0d8276]/25 font-bold"
            inactiveClassName="text-slate-700 dark:text-slate-300 hover:text-[#0d5c56] hover:bg-[#f0f9f7] dark:hover:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 font-medium"
            className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs transition-all shadow-2xs cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-[#0d6157] dark:text-teal-400" />
              <span>Operations Hub</span>
            </div>
          </FastLink>

          {/* Section: Operations & Clinical Governance */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 pb-1.5 mb-1 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <Building2 className="size-3 text-[#0d6157] dark:text-teal-400 stroke-[2.2]" />
              <span>Operations & Governance</span>
            </div>
            <div className="space-y-0.5">
              <FastLink
                href="/portal/manager"
                onNavigate={handleNavigate}
                active={activePath === '/portal/manager'}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <div className="flex items-center gap-2">
                  <Activity className="size-3.5" />
                  <span>Overview &amp; Roster</span>
                </div>
              </FastLink>

              <FastLink
                href="/portal/doctors"
                onNavigate={handleNavigate}
                active={activePath.startsWith('/portal/doctors')}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <div className="flex items-center gap-2">
                  <Stethoscope className="size-3.5" />
                  <span>Doctors Management</span>
                </div>
              </FastLink>

              <FastLink
                href="/portal/accounts/closing"
                onNavigate={handleNavigate}
                active={activePath.startsWith('/portal/accounts/closing')}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <div className="flex items-center gap-2">
                  <Clock className="size-3.5" />
                  <span>Cash Register Z-Reports</span>
                </div>
              </FastLink>

              <FastLink
                href="/portal/inventory/purchase-orders"
                onNavigate={handleNavigate}
                active={activePath.startsWith('/portal/inventory/purchase-orders')}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <div className="flex items-center gap-2">
                  <Package className="size-3.5" />
                  <span>Procurement &amp; PO Approvals</span>
                </div>
              </FastLink>

              <FastLink
                href="/portal/accounts"
                onNavigate={handleNavigate}
                active={activePath === '/portal/accounts'}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <div className="flex items-center gap-2">
                  <Wallet className="size-3.5" />
                  <span>Financial Ledger</span>
                </div>
              </FastLink>

              <FastLink
                href="/portal/inventory"
                onNavigate={handleNavigate}
                active={activePath === '/portal/inventory'}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <div className="flex items-center gap-2">
                  <Boxes className="size-3.5" />
                  <span>Medical Inventory</span>
                </div>
              </FastLink>
            </div>
          </div>

          {/* Section: Clinical Schedules & Patients */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 pb-1.5 mb-1 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <CalendarDays className="size-3 text-[#0d6157] dark:text-teal-400 stroke-[2.2]" />
              <span>Schedules &amp; Patients</span>
            </div>
            <div className="space-y-0.5">
              <FastLink
                href="/portal/appointments"
                onNavigate={handleNavigate}
                active={activePath.startsWith('/portal/appointments')}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-3.5" />
                  <span>Appointments Schedule</span>
                </div>
              </FastLink>

              <FastLink
                href="/portal/services"
                onNavigate={handleNavigate}
                active={activePath.startsWith('/portal/services')}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <div className="flex items-center gap-2">
                  <ClipboardList className="size-3.5" />
                  <span>Clinical Services</span>
                </div>
              </FastLink>

              <FastLink
                href="/portal/patients"
                onNavigate={handleNavigate}
                active={activePath.startsWith('/portal/patients')}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <div className="flex items-center gap-2">
                  <Users className="size-3.5" />
                  <span>Patients Directory</span>
                </div>
              </FastLink>
            </div>
          </div>

          {/* Section: Communication & Security */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 pb-1.5 mb-1 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <Wrench className="size-3 text-[#0d6157] dark:text-teal-400 stroke-[2.2]" />
              <span>Communication &amp; Settings</span>
            </div>
            <div className="space-y-0.5">
              <FastLink
                href="/portal/conversations"
                onNavigate={handleNavigate}
                active={activePath.startsWith('/portal/conversations')}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <div className="flex items-center gap-2">
                  <FileText className="size-3.5" />
                  <span>Internal Communications</span>
                </div>
              </FastLink>

              <FastLink
                href="/portal/organization"
                onNavigate={handleNavigate}
                active={isOrganizationPage}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="size-3.5" />
                  <span>Clinic Profile</span>
                </div>
              </FastLink>

              <FastLink
                href="/portal/security"
                onNavigate={handleNavigate}
                active={activePath.startsWith('/portal/security')}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-3.5" />
                  <span>Security &amp; 2FA</span>
                </div>
              </FastLink>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="w-64 shrink-0 flex flex-col border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 h-full overflow-hidden select-none"
      aria-label="Secondary Navigation"
    >
      {/* 1. Header with Icon and Pulseware Title */}
      <div className="h-[52px] px-5 border-b border-[#0d8276]/10 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="size-6 rounded-lg bg-gradient-to-tr from-[#0d6157] to-[#0d8276] text-white flex items-center justify-center shadow-xs">
            <svg viewBox="0 0 24 24" className="size-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="3.5" />
              <circle cx="12" cy="3" r="1.5" />
              <circle cx="12" cy="21" r="1.5" />
              <circle cx="3" cy="12" r="1.5" />
              <circle cx="21" cy="12" r="1.5" />
              <circle cx="5.636" cy="5.636" r="1.5" />
              <circle cx="18.364" cy="18.364" r="1.5" />
              <circle cx="5.636" cy="18.364" r="1.5" />
              <circle cx="18.364" cy="5.636" r="1.5" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-[#0d3d38] dark:text-white tracking-tight">
            Pulse<span className="text-[#0d8276]">ware</span>
          </h2>
        </div>
      </div>

      {/* Single Main Scrollable Container */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-5 min-h-0">
        {/* 2. Top Highlighted Button */}
        <div>
          {isDoctor ? (
            <div className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 border border-[#0d8276]/25 transition-all shadow-2xs">
              <div className="flex items-center gap-2 truncate">
                <Stethoscope className="size-4 text-[#0d6157] dark:text-teal-300 shrink-0" />
                <span className="truncate">{activeDoctor?.name || 'My Clinical Profile'}</span>
              </div>
            </div>
          ) : currentDoctorId ? (
            <FastLink
              href="/portal/doctors"
              onNavigate={handleNavigate}
              className="flex items-center gap-1.5 w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-[#e6f6f3] dark:bg-slate-800 dark:hover:bg-[#0d6157]/20 text-slate-700 hover:text-[#0d5c56] dark:text-slate-300 dark:hover:text-teal-300 border border-slate-200/80 dark:border-slate-700 hover:border-[#0d8276]/25 transition-all shadow-2xs whitespace-nowrap overflow-hidden cursor-pointer"
            >
              <span className="shrink-0">← All Doctors</span>
              {activeDoctor?.name && (
                <span className="text-[11px] font-medium text-[#0d6157]/80 dark:text-teal-300/80 truncate">
                  ({activeDoctor.name})
                </span>
              )}
            </FastLink>
          ) : isManagerPage ? (
            <FastLink
              href="/portal/manager"
              onNavigate={handleNavigate}
              className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 border border-[#0d8276]/25 font-bold shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-[#0d6157]" />
                <span>Operations Hub</span>
              </div>
            </FastLink>
          ) : isNursePage ? (
            <FastLink
              href="/portal/nurse"
              onNavigate={handleNavigate}
              className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 border border-[#0d8276]/25 font-bold shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <HeartPulse className="size-4 text-[#0d6157]" />
                <span>Nurse Station</span>
              </div>
            </FastLink>
          ) : isPharmacyPage ? (
            <FastLink
              href="/portal/pharmacy"
              onNavigate={handleNavigate}
              className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 border border-[#0d8276]/25 font-bold shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Pill className="size-4 text-[#0d6157]" />
                <span>Pharmacy Station</span>
              </div>
            </FastLink>
          ) : isRolesPage ? (
            <FastLink
              href="/portal/roles"
              onNavigate={handleNavigate}
              active={roleTab === 'all' || !roleTab || activePath === '/portal/roles'}
              activeClassName="bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 border border-[#0d8276]/25 font-bold"
              inactiveClassName="text-slate-700 dark:text-slate-300 hover:text-[#0d5c56] hover:bg-[#f0f9f7] dark:hover:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 font-medium"
              className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs transition-all shadow-2xs cursor-pointer"
            >
              <span>All Roles</span>
            </FastLink>
          ) : (
            <FastLink
              href="/portal/doctors"
              onNavigate={handleNavigate}
              active={activePath === '/portal/doctors' || activePath === '/portal/doctors/create' || activePath === '/portal'}
              activeClassName="bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 border border-[#0d8276]/25 font-bold"
              inactiveClassName="text-slate-700 dark:text-slate-300 hover:text-[#0d5c56] hover:bg-[#f0f9f7] dark:hover:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 font-medium"
              className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs transition-all shadow-2xs cursor-pointer"
            >
              <span>All Doctors</span>
            </FastLink>
          )}
        </div>

        {/* Dynamic Section Navigation Tabs */}
        {isManagerPage ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2 pb-2 mb-1 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-[#0d3d38] dark:text-white">
              <Building2 className="size-4 text-[#0d6157] dark:text-teal-400 stroke-[2.2]" />
              <span>Operations & Management</span>
            </div>
            <div className="space-y-0.5">
              <FastLink
                href="/portal/manager"
                onNavigate={handleNavigate}
                active={activePath === '/portal/manager'}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <span>Overview &amp; Roster</span>
              </FastLink>
              <FastLink
                href="/portal/accounts/closing"
                onNavigate={handleNavigate}
                active={activePath.startsWith('/portal/accounts/closing')}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <span>Cash Register Z-Reports</span>
              </FastLink>
              <FastLink
                href="/portal/inventory/purchase-orders"
                onNavigate={handleNavigate}
                active={activePath.startsWith('/portal/inventory/purchase-orders')}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <span>Procurement &amp; PO Approvals</span>
              </FastLink>
              <FastLink
                href="/portal/accounts"
                onNavigate={handleNavigate}
                active={activePath === '/portal/accounts'}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <span>Financial Ledger</span>
              </FastLink>
            </div>
          </div>
        ) : isNursePage ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2 pb-2 mb-1 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-[#0d3d38] dark:text-white">
              <HeartPulse className="size-4 text-[#0d6157] dark:text-teal-400 stroke-[2.2]" />
              <span>Clinical Nursing Station</span>
            </div>
            <div className="space-y-0.5">
              <FastLink
                href="/portal/nurse"
                onNavigate={handleNavigate}
                active={activePath === '/portal/nurse'}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <span>Triage &amp; Vitals Intake</span>
              </FastLink>
              <FastLink
                href="/portal/appointments"
                onNavigate={handleNavigate}
                active={activePath.startsWith('/portal/appointments')}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <span>Waiting Room Queue</span>
              </FastLink>
              <FastLink
                href="/portal/patients"
                onNavigate={handleNavigate}
                active={activePath.startsWith('/portal/patients')}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <span>Patient Directory</span>
              </FastLink>
              <FastLink
                href="/portal/inventory/requests"
                onNavigate={handleNavigate}
                active={activePath.startsWith('/portal/inventory')}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <span>Medical Supplies Request</span>
              </FastLink>
            </div>
          </div>
        ) : isPharmacyPage ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2 pb-2 mb-1 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-[#0d3d38] dark:text-white">
              <Pill className="size-4 text-[#0d6157] dark:text-teal-400 stroke-[2.2]" />
              <span>Pharmacy &amp; Dispensing</span>
            </div>
            <div className="space-y-0.5">
              <FastLink
                href="/portal/pharmacy"
                onNavigate={handleNavigate}
                active={activePath === '/portal/pharmacy'}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <span>Prescription Queue</span>
              </FastLink>
              <FastLink
                href="/portal/inventory/items"
                onNavigate={handleNavigate}
                active={activePath.startsWith('/portal/inventory/items')}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <span>Drug Catalog &amp; Stock</span>
              </FastLink>
              <FastLink
                href="/portal/inventory/low-stock"
                onNavigate={handleNavigate}
                active={activePath.startsWith('/portal/inventory/low-stock')}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <span>Low Stock Alerts</span>
              </FastLink>
              <FastLink
                href="/portal/inventory/suppliers"
                onNavigate={handleNavigate}
                active={activePath.startsWith('/portal/inventory/suppliers')}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <span>Pharma Suppliers</span>
              </FastLink>
            </div>
          </div>
        ) : isAccountsPage ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2 pb-2 mb-1 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-[#0d3d38] dark:text-white">
              <Wallet className="size-4 text-[#0d6157] dark:text-teal-400 stroke-[2.2]" />
              <span>{isDoctor ? 'My Payouts' : 'Accounts & Finance'}</span>
            </div>
            <div className="space-y-0.5">
              {isDoctor ? (
                <div className="space-y-1">
                  {/* Parent: My Payouts */}
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/20 border border-[#0d8276]/20">
                    <span>My Payouts</span>
                  </div>
                  {/* Children Tabs under My Payouts */}
                  <div className="pl-3 space-y-0.5 border-l-2 border-[#0d8276]/20 dark:border-slate-800 ml-3">
                    <FastLink
                      href="/portal/accounts/doctor-payouts"
                      onNavigate={handleNavigate}
                      active={activePath === '/portal/accounts/doctor-payouts' && (!searchParams.get('status') || searchParams.get('status') === 'ALL')}
                      activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                      inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                      className="flex items-center justify-between w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all"
                    >
                      <span>All Payouts</span>
                    </FastLink>
                    <FastLink
                      href="/portal/accounts/doctor-payouts?status=PENDING"
                      onNavigate={handleNavigate}
                      active={activePath === '/portal/accounts/doctor-payouts' && (activeTabParam === 'PENDING' || searchParams.get('status') === 'PENDING')}
                      activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                      inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                      className="flex items-center justify-between w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all"
                    >
                      <span>Pending</span>
                    </FastLink>
                    <FastLink
                      href="/portal/accounts/doctor-payouts?status=PAID"
                      onNavigate={handleNavigate}
                      active={activePath === '/portal/accounts/doctor-payouts' && (activeTabParam === 'PAID' || searchParams.get('status') === 'PAID')}
                      activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                      inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                      className="flex items-center justify-between w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all"
                    >
                      <span>Paid</span>
                    </FastLink>
                  </div>
                </div>
              ) : (
                <>
                  <FastLink
                    href="/portal/accounts"
                    onNavigate={handleNavigate}
                    active={activePath === '/portal/accounts'}
                    activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                    inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                    className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
                  >
                    <span>Financial Overview</span>
                  </FastLink>
                  <FastLink
                    href="/portal/accounts/invoices"
                    onNavigate={handleNavigate}
                    active={activePath.startsWith('/portal/accounts/invoices')}
                    activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                    inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                    className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
                  >
                    <span>Invoices &amp; Billing</span>
                  </FastLink>
                  <FastLink
                    href="/portal/accounts/doctor-payouts"
                    onNavigate={handleNavigate}
                    active={activePath.startsWith('/portal/accounts/doctor-payouts')}
                    activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                    inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                    className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
                  >
                    <span>Doctor Payouts</span>
                  </FastLink>
                  <FastLink
                    href="/portal/accounts/bills"
                    onNavigate={handleNavigate}
                    active={activePath.startsWith('/portal/accounts/bills')}
                    activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                    inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                    className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
                  >
                    <span>Supplier Bills</span>
                  </FastLink>
                  <FastLink
                    href="/portal/accounts/expenses"
                    onNavigate={handleNavigate}
                    active={activePath.startsWith('/portal/accounts/expenses')}
                    activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                    inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                    className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
                  >
                    <span>Operating Expenses</span>
                  </FastLink>
                  <FastLink
                    href="/portal/accounts/closing"
                    onNavigate={handleNavigate}
                    active={activePath.startsWith('/portal/accounts/closing')}
                    activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                    inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                    className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
                  >
                    <span>Day-End Closing</span>
                  </FastLink>
                  <FastLink
                    href="/portal/accounts/reports"
                    onNavigate={handleNavigate}
                    active={activePath.startsWith('/portal/accounts/reports')}
                    activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                    inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                    className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
                  >
                    <span>Reports &amp; P&amp;L</span>
                  </FastLink>
                </>
              )}
            </div>
          </div>
        ) : isInventoryPage ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2 pb-2 mb-1 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-[#0d3d38] dark:text-white">
              <Boxes className="size-4 text-[#0d6157] dark:text-teal-400 stroke-[2.2]" />
              <span>{userRole === 'DOCTOR' ? 'Procedure Supplies' : 'Inventory Management'}</span>
            </div>
            <div className="space-y-0.5">
              {userRole !== 'DOCTOR' && (
                <>
                  <FastLink
                    href="/portal/inventory"
                    onNavigate={handleNavigate}
                    active={activePath === '/portal/inventory'}
                    activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                    inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                    className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
                  >
                    <span>Overview Dashboard</span>
                  </FastLink>
                  <FastLink
                    href="/portal/inventory/items"
                    onNavigate={handleNavigate}
                    active={activePath.startsWith('/portal/inventory/items')}
                    activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                    inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                    className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
                  >
                    <span>Items &amp; Stock</span>
                  </FastLink>
                  <FastLink
                    href="/portal/inventory/categories"
                    onNavigate={handleNavigate}
                    active={activePath.startsWith('/portal/inventory/categories')}
                    activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                    inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                    className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
                  >
                    <span>Categories</span>
                  </FastLink>
                  <FastLink
                    href="/portal/inventory/movements"
                    onNavigate={handleNavigate}
                    active={activePath.startsWith('/portal/inventory/movements')}
                    activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                    inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                    className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
                  >
                    <span>Stock Movements</span>
                  </FastLink>
                </>
              )}
              <FastLink
                href="/portal/inventory/requests"
                onNavigate={handleNavigate}
                active={activePath.startsWith('/portal/inventory/requests')}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <span>{userRole === 'DOCTOR' ? 'My Item Requests' : 'Item Requests'}</span>
              </FastLink>
              {userRole !== 'DOCTOR' && (
                <>
                  <FastLink
                    href="/portal/inventory/suppliers"
                    onNavigate={handleNavigate}
                    active={activePath.startsWith('/portal/inventory/suppliers')}
                    activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                    inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                    className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
                  >
                    <span>Suppliers &amp; Vendors</span>
                  </FastLink>
                  <FastLink
                    href="/portal/inventory/purchase-orders"
                    onNavigate={handleNavigate}
                    active={activePath.startsWith('/portal/inventory/purchase-orders')}
                    activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                    inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                    className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
                  >
                    <span>Purchase Orders</span>
                  </FastLink>
                  <FastLink
                    href="/portal/inventory/low-stock"
                    onNavigate={handleNavigate}
                    active={activePath.startsWith('/portal/inventory/low-stock')}
                    activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                    inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                    className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
                  >
                    <span>Low Stock Alerts</span>
                  </FastLink>
                </>
              )}
            </div>
          </div>
        ) : isRolesPage ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2 pb-2 mb-1 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-[#0d3d38] dark:text-white">
              <Users className="size-4 text-[#0d6157] dark:text-teal-400 stroke-[2.2]" />
              <span>Staff Roles</span>
            </div>
            <div className="space-y-0.5">
              <FastLink
                href="/portal/roles?tab=coordinators"
                onNavigate={handleNavigate}
                active={roleTab === 'coordinators'}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <span>Medical Coordinators</span>
              </FastLink>
              <FastLink
                href="/portal/roles?tab=receptionists"
                onNavigate={handleNavigate}
                active={roleTab === 'receptionists'}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <span>Receptionists</span>
              </FastLink>
            </div>
          </div>
        ) : isAppointmentsPage ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2 pb-2 mb-1 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-[#0d3d38] dark:text-white">
              <CalendarDays className="size-4 text-[#0d6157] dark:text-teal-400 stroke-[2.2]" />
              <span>{isDoctor ? 'My Schedule Views' : 'Schedule Views'}</span>
            </div>
            <div className="space-y-0.5">
              <FastLink
                href="/portal/appointments"
                onNavigate={handleNavigate}
                active={activePath === '/portal/appointments' && !searchParams.get('status') && !activeTabParam}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <span>All Appointments</span>
              </FastLink>
              <FastLink
                href="/portal/appointments?status=CONFIRMED"
                onNavigate={handleNavigate}
                active={activeTabParam === 'CONFIRMED' || searchParams.get('status') === 'CONFIRMED'}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <span>Confirmed &amp; Active</span>
              </FastLink>
              <FastLink
                href="/portal/appointments?status=PENDING"
                onNavigate={handleNavigate}
                active={activeTabParam === 'PENDING' || searchParams.get('status') === 'PENDING'}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <span>Pending Requests</span>
              </FastLink>
              <FastLink
                href="/portal/appointments?status=COMPLETED"
                onNavigate={handleNavigate}
                active={activeTabParam === 'COMPLETED' || searchParams.get('status') === 'COMPLETED'}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <span>Completed Treatments</span>
              </FastLink>
              <FastLink
                href="/portal/appointments?status=CANCELLED"
                onNavigate={handleNavigate}
                active={activeTabParam === 'CANCELLED' || searchParams.get('status') === 'CANCELLED'}
                activeClassName="font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs"
                inactiveClassName="text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15"
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <span>Cancelled Slots</span>
              </FastLink>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-2 pb-2 mb-1 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-[#0d3d38] dark:text-white">
              <CreditCard className="size-4 text-[#0d6157] dark:text-teal-400 stroke-[2.2]" />
              <span>{isDoctor ? 'My Clinical Profile' : 'Doctor Configuration'}</span>
            </div>

          {(effectiveDoctorId || isDoctor) ? (
            /* Continuous 7 Tabs with Instant 0ms In-Memory Click Handlers */
            <div className="space-y-0.5">
              {/* 1. Working Schedule */}
              <button
                type="button"
                onClick={() => handleTabClick('schedule')}
                className={cn(
                  'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer',
                  currentTab === 'schedule'
                    ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                )}
              >
                <span>Working Schedule</span>
              </button>

              {/* 2. Appointment Types */}
              <button
                type="button"
                onClick={() => handleTabClick('appointment-types')}
                className={cn(
                  'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer',
                  currentTab === 'appointment-types'
                    ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                )}
              >
                <span>Appointment Types</span>
                <span className="bg-[#0d6157] text-white font-bold text-[9px] px-2 py-0.5 rounded-full shadow-2xs">
                  Active
                </span>
              </button>

              {/* 3. Blocked Periods */}
              <button
                type="button"
                onClick={() => handleTabClick('blocked')}
                className={cn(
                  'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer',
                  currentTab === 'blocked'
                    ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                )}
              >
                <span>Blocked Periods</span>
              </button>

              {/* 4. Appointments */}
              <button
                type="button"
                onClick={() => handleTabClick('appointments')}
                className={cn(
                  'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer',
                  currentTab === 'appointments'
                    ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                )}
              >
                <span>Appointments</span>
              </button>

              {/* 5. Doctor Profile */}
              <button
                type="button"
                onClick={() => handleTabClick('overview')}
                className={cn(
                  'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer',
                  currentTab === 'overview'
                    ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                )}
              >
                <span>Doctor Profile</span>
              </button>

              {/* 6. Assigned Coordinator (Directly below Doctor Profile) */}
              <button
                type="button"
                onClick={() => handleTabClick('coordinator')}
                className={cn(
                  'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer',
                  currentTab === 'coordinator'
                    ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                )}
              >
                <span>Assigned Coordinator</span>
              </button>

              {/* 7. Payment Structure (Directly below Coordinator - Hidden for DOCTOR role & Chatbot/PulseNow) */}
              {!isDoctor && !isPulseNow && (
                <button
                  type="button"
                  onClick={() => handleTabClick('payment-structure')}
                  className={cn(
                    'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer',
                    currentTab === 'payment-structure'
                      ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                  )}
                >
                  <span>Payment Structure</span>
                </button>
              )}
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
                  <FastLink
                    key={doc.id}
                    href={`/portal/doctors/${doc.id}`}
                    onNavigate={handleNavigate}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-[#0d5c56] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15 transition-colors group"
                  >
                    <span className="truncate">{doc.name}</span>
                    <ChevronRight className="size-3.5 text-slate-400 group-hover:text-[#0d6157] dark:group-hover:text-teal-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </FastLink>
                ))
              )}
            </div>
          )}
        </div>
        )}

        {/* 4. Section 2: Utilities & Settings (Shown on general views for non-doctors) */}
        {!currentDoctorId && !isDoctor && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 pb-2 mb-1 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-[#0d3d38] dark:text-white">
              <Wrench className="size-3.5 text-[#0d8276] stroke-[2.2]" />
              <span>Utilities &amp; Settings</span>
            </div>

            <div className="space-y-0.5">
              <FastLink
                href="/portal/appointments"
                onNavigate={handleNavigate}
                active={activePath.startsWith('/portal/appointments')}
                activeClassName="bg-[#e6f6f3] text-[#0d5c56] font-semibold border border-[#0d8276]/20"
                inactiveClassName="text-slate-700 dark:text-slate-300 hover:text-[#0d6157] hover:bg-[#f0f9f7] dark:hover:bg-slate-800/60"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors"
              >
                <span>Appointments Schedule</span>
              </FastLink>
              {!isCoordinator && (
                <FastLink
                  href="/portal/services"
                  onNavigate={handleNavigate}
                  active={activePath.startsWith('/portal/services')}
                  activeClassName="bg-[#e6f6f3] text-[#0d5c56] font-semibold border border-[#0d8276]/20"
                  inactiveClassName="text-slate-700 dark:text-slate-300 hover:text-[#0d6157] hover:bg-[#f0f9f7] dark:hover:bg-slate-800/60"
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                >
                  <span>Clinical Services</span>
                </FastLink>
              )}
              <FastLink
                href="/portal/patients"
                onNavigate={handleNavigate}
                active={activePath.startsWith('/portal/patients')}
                activeClassName="bg-[#e6f6f3] text-[#0d5c56] font-semibold border border-[#0d8276]/20"
                inactiveClassName="text-slate-700 dark:text-slate-300 hover:text-[#0d6157] hover:bg-[#f0f9f7] dark:hover:bg-slate-800/60"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors"
              >
                <span>Patients Directory</span>
              </FastLink>
              <FastLink
                href="/portal/organization"
                onNavigate={handleNavigate}
                active={isOrganizationPage}
                activeClassName="bg-[#e6f6f3] text-[#0d5c56] font-semibold border border-[#0d8276]/20"
                inactiveClassName="text-slate-700 dark:text-slate-300 hover:text-[#0d6157] hover:bg-[#f0f9f7] dark:hover:bg-slate-800/60"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors"
              >
                <span>Clinic Profile</span>
              </FastLink>
              <FastLink
                href="/portal/security"
                onNavigate={handleNavigate}
                active={isSecurityPage}
                activeClassName="bg-[#e6f6f3] text-[#0d5c56] font-semibold border border-[#0d8276]/20"
                inactiveClassName="text-slate-700 dark:text-slate-300 hover:text-[#0d6157] hover:bg-[#f0f9f7] dark:hover:bg-slate-800/60"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors"
              >
                <span>Security &amp; 2FA</span>
              </FastLink>
              <FastLink
                href="/portal/subscription"
                onNavigate={handleNavigate}
                active={isSubscriptionPage}
                activeClassName="bg-[#e6f6f3] text-[#0d5c56] font-semibold border border-[#0d8276]/20"
                inactiveClassName="text-slate-700 dark:text-slate-300 hover:text-[#0d6157] hover:bg-[#f0f9f7] dark:hover:bg-slate-800/60"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors"
              >
                <span>Upgrade &amp; Plans</span>
              </FastLink>
            </div>
          </div>
        )}

        {/* 5. Switch Doctor Section */}
        {currentDoctorId && doctors.length > 1 && (
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="px-2 py-1 text-[10px] font-bold text-[#0d5c56]/80 dark:text-teal-400 uppercase tracking-wider">
              Switch Doctor
            </div>
            <div className="space-y-0.5">
              {doctors
                .filter((d) => d.id !== currentDoctorId)
                .map((d) => (
                  <FastLink
                    key={d.id}
                    href={`/portal/doctors/${d.id}?tab=${currentTab}`}
                    onNavigate={handleNavigate}
                    className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:bg-[#e6f6f3] hover:text-[#0d5c56] dark:hover:bg-[#0d6157]/20 dark:hover:text-teal-300 transition-colors"
                  >
                    <span className="truncate font-medium">{d.name}</span>
                    <ChevronRight className="size-3 text-[#0d6157]/60 dark:text-teal-400/60 shrink-0" />
                  </FastLink>
                ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
