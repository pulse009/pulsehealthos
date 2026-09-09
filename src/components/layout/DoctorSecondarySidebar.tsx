'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  LuTrendingUp as TrendingUp,
} from 'react-icons/lu';
import { FaUserDoctor as Stethoscope } from 'react-icons/fa6';
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
  const isCoordinator = userRole === 'COORDINATOR';

  // Instant shared synchronous activeTab state
  const [currentTab, setActiveTab] = useDoctorActiveTab(urlTab);

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

  const isAppointmentsPage = pathname.startsWith('/portal/appointments');
  const isRolesPage = pathname.startsWith('/portal/roles');
  const isOrganizationPage = pathname.startsWith('/portal/organization') || pathname.startsWith('/portal/profile');
  const isSecurityPage = pathname.startsWith('/portal/security');
  const isSubscriptionPage = pathname.startsWith('/portal/subscription') || pathname.startsWith('/portal/upgrade');
  const roleTab = searchParams.get('tab') || 'all';

  const isInventoryPage = pathname.startsWith('/portal/inventory');
  const isAccountsPage = pathname.startsWith('/portal/accounts');

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
            <Link
              href="/portal/doctors"
              className="flex items-center gap-1.5 w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-[#e6f6f3] dark:bg-slate-800 dark:hover:bg-[#0d6157]/20 text-slate-700 hover:text-[#0d5c56] dark:text-slate-300 dark:hover:text-teal-300 border border-slate-200/80 dark:border-slate-700 hover:border-[#0d8276]/25 transition-all shadow-2xs whitespace-nowrap overflow-hidden cursor-pointer"
            >
              <span className="shrink-0">← All Doctors</span>
              {activeDoctor?.name && (
                <span className="text-[11px] font-medium text-[#0d6157]/80 dark:text-teal-300/80 truncate">
                  ({activeDoctor.name})
                </span>
              )}
            </Link>
          ) : (
            <Link
              href="/portal/doctors"
              className={cn(
                'flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs transition-all shadow-2xs cursor-pointer',
                pathname === '/portal/doctors' || pathname === '/portal/doctors/create' || pathname === '/portal'
                  ? 'bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 border border-[#0d8276]/25 font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:text-[#0d5c56] hover:bg-[#f0f9f7] dark:hover:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 font-medium'
              )}
            >
              <span>All Doctors</span>
            </Link>
          )}
        </div>

        {/* 3. Accounts Tabs */}
        {isAccountsPage ? (
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
                    <Link
                      href="/portal/accounts/doctor-payouts"
                      className={cn(
                        'flex items-center justify-between w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all',
                        pathname === '/portal/accounts/doctor-payouts' && (!searchParams.get('status') || searchParams.get('status') === 'ALL')
                          ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                      )}
                    >
                      <span>All Payouts</span>
                    </Link>
                    <Link
                      href="/portal/accounts/doctor-payouts?status=PENDING"
                      className={cn(
                        'flex items-center justify-between w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all',
                        pathname === '/portal/accounts/doctor-payouts' && searchParams.get('status') === 'PENDING'
                          ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                      )}
                    >
                      <span>Pending</span>
                    </Link>
                    <Link
                      href="/portal/accounts/doctor-payouts?status=PAID"
                      className={cn(
                        'flex items-center justify-between w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all',
                        pathname === '/portal/accounts/doctor-payouts' && searchParams.get('status') === 'PAID'
                          ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                      )}
                    >
                      <span>Paid</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <Link
                    href="/portal/accounts"
                    className={cn(
                      'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all',
                      pathname === '/portal/accounts'
                        ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                    )}
                  >
                    <span>Financial Overview</span>
                  </Link>
                  <Link
                    href="/portal/accounts/invoices"
                    className={cn(
                      'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all',
                      pathname.startsWith('/portal/accounts/invoices')
                        ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                    )}
                  >
                    <span>Invoices &amp; Billing</span>
                  </Link>
                  <Link
                    href="/portal/accounts/doctor-payouts"
                    className={cn(
                      'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all',
                      pathname.startsWith('/portal/accounts/doctor-payouts')
                        ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                    )}
                  >
                    <span>Doctor Payouts</span>
                  </Link>
                  <Link
                    href="/portal/accounts/bills"
                    className={cn(
                      'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all',
                      pathname.startsWith('/portal/accounts/bills')
                        ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                    )}
                  >
                    <span>Supplier Bills</span>
                  </Link>
                  <Link
                    href="/portal/accounts/expenses"
                    className={cn(
                      'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all',
                      pathname.startsWith('/portal/accounts/expenses')
                        ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                    )}
                  >
                    <span>Operating Expenses</span>
                  </Link>
                  <Link
                    href="/portal/accounts/closing"
                    className={cn(
                      'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all',
                      pathname.startsWith('/portal/accounts/closing')
                        ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                    )}
                  >
                    <span>Day-End Closing</span>
                  </Link>
                  <Link
                    href="/portal/accounts/reports"
                    className={cn(
                      'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all',
                      pathname.startsWith('/portal/accounts/reports')
                        ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                    )}
                  >
                    <span>Reports &amp; P&amp;L</span>
                  </Link>
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
                  <Link
                    href="/portal/inventory"
                    className={cn(
                      'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all',
                      pathname === '/portal/inventory'
                        ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                    )}
                  >
                    <span>Overview Dashboard</span>
                  </Link>
                  <Link
                    href="/portal/inventory/items"
                    className={cn(
                      'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all',
                      pathname.startsWith('/portal/inventory/items')
                        ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                    )}
                  >
                    <span>Items &amp; Stock</span>
                  </Link>
                  <Link
                    href="/portal/inventory/categories"
                    className={cn(
                      'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all',
                      pathname.startsWith('/portal/inventory/categories')
                        ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                    )}
                  >
                    <span>Categories</span>
                  </Link>
                  <Link
                    href="/portal/inventory/movements"
                    className={cn(
                      'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all',
                      pathname.startsWith('/portal/inventory/movements')
                        ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                    )}
                  >
                    <span>Stock Movements</span>
                  </Link>
                </>
              )}
              <Link
                href="/portal/inventory/requests"
                className={cn(
                  'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all',
                  pathname.startsWith('/portal/inventory/requests')
                    ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                )}
              >
                <span>{userRole === 'DOCTOR' ? 'My Item Requests' : 'Item Requests'}</span>
              </Link>
              {userRole !== 'DOCTOR' && (
                <>
                  <Link
                    href="/portal/inventory/suppliers"
                    className={cn(
                      'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all',
                      pathname.startsWith('/portal/inventory/suppliers')
                        ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                    )}
                  >
                    <span>Suppliers &amp; Vendors</span>
                  </Link>
                  <Link
                    href="/portal/inventory/purchase-orders"
                    className={cn(
                      'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all',
                      pathname.startsWith('/portal/inventory/purchase-orders')
                        ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                    )}
                  >
                    <span>Purchase Orders</span>
                  </Link>
                  <Link
                    href="/portal/inventory/low-stock"
                    className={cn(
                      'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all',
                      pathname.startsWith('/portal/inventory/low-stock')
                        ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                    )}
                  >
                    <span>Low Stock Alerts</span>
                  </Link>
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
              <Link
                href="/portal/roles?tab=all"
                className={cn(
                  'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all',
                  roleTab === 'all'
                    ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                )}
              >
                <span>All Roles</span>
              </Link>
              <Link
                href="/portal/roles?tab=coordinators"
                className={cn(
                  'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all',
                  roleTab === 'coordinators'
                    ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                )}
              >
                <span>Medical Coordinators</span>
              </Link>
              <Link
                href="/portal/roles?tab=receptionists"
                className={cn(
                  'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all',
                  roleTab === 'receptionists'
                    ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                )}
              >
                <span>Receptionists</span>
              </Link>
            </div>
          </div>
        ) : isAppointmentsPage ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2 pb-2 mb-1 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-[#0d3d38] dark:text-white">
              <CalendarDays className="size-4 text-[#0d6157] dark:text-teal-400 stroke-[2.2]" />
              <span>{isDoctor ? 'My Schedule Views' : 'Schedule Views'}</span>
            </div>
            <div className="space-y-0.5">
              <Link
                href="/portal/appointments"
                className={cn(
                  'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all',
                  pathname === '/portal/appointments' && !searchParams.get('status')
                    ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                )}
              >
                <span>All Appointments</span>
              </Link>
              <Link
                href="/portal/appointments?status=CONFIRMED"
                className={cn(
                  'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all',
                  searchParams.get('status') === 'CONFIRMED'
                    ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                )}
              >
                <span>Confirmed &amp; Active</span>
              </Link>
              <Link
                href="/portal/appointments?status=PENDING"
                className={cn(
                  'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all',
                  searchParams.get('status') === 'PENDING'
                    ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                )}
              >
                <span>Pending Requests</span>
              </Link>
              <Link
                href="/portal/appointments?status=COMPLETED"
                className={cn(
                  'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all',
                  searchParams.get('status') === 'COMPLETED'
                    ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                )}
              >
                <span>Completed Treatments</span>
              </Link>
              <Link
                href="/portal/appointments?status=CANCELLED"
                className={cn(
                  'flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all',
                  searchParams.get('status') === 'CANCELLED'
                    ? 'font-bold text-[#0d5c56] dark:text-teal-300 bg-[#e6f6f3] dark:bg-[#0d6157]/25 border border-[#0d8276]/20 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-[#0d6157] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15'
                )}
              >
                <span>Cancelled Slots</span>
              </Link>
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
                  <Link
                    key={doc.id}
                    href={`/portal/doctors/${doc.id}`}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-[#0d5c56] dark:hover:text-teal-300 hover:bg-[#f0f9f7] dark:hover:bg-[#0d6157]/15 transition-colors group"
                  >
                    <span className="truncate">{doc.name}</span>
                    <ChevronRight className="size-3.5 text-slate-400 group-hover:text-[#0d6157] dark:group-hover:text-teal-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </Link>
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
              <Link
                href="/portal/appointments"
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors',
                  pathname.startsWith('/portal/appointments')
                    ? 'bg-[#e6f6f3] text-[#0d5c56] font-semibold border border-[#0d8276]/20'
                    : 'text-slate-700 dark:text-slate-300 hover:text-[#0d6157] hover:bg-[#f0f9f7] dark:hover:bg-slate-800/60'
                )}
              >
                <span>Appointments Schedule</span>
              </Link>
              {!isCoordinator && (
                <Link
                  href="/portal/services"
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors',
                    pathname.startsWith('/portal/services')
                      ? 'bg-[#e6f6f3] text-[#0d5c56] font-semibold border border-[#0d8276]/20'
                      : 'text-slate-700 dark:text-slate-300 hover:text-[#0d6157] hover:bg-[#f0f9f7] dark:hover:bg-slate-800/60'
                  )}
                >
                  <span>Clinical Services</span>
                </Link>
              )}
              <Link
                href="/portal/patients"
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors',
                  pathname.startsWith('/portal/patients')
                    ? 'bg-[#e6f6f3] text-[#0d5c56] font-semibold border border-[#0d8276]/20'
                    : 'text-slate-700 dark:text-slate-300 hover:text-[#0d6157] hover:bg-[#f0f9f7] dark:hover:bg-slate-800/60'
                )}
              >
                <span>Patients Directory</span>
              </Link>
              {!isCoordinator && (
                <Link
                  href="/portal/roles"
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors',
                    pathname.startsWith('/portal/roles')
                      ? 'bg-[#e6f6f3] text-[#0d5c56] font-semibold border border-[#0d8276]/20'
                      : 'text-slate-700 dark:text-slate-300 hover:text-[#0d6157] hover:bg-[#f0f9f7] dark:hover:bg-slate-800/60'
                  )}
                >
                  <span>Roles &amp; Staff</span>
                </Link>
              )}
              {!isCoordinator && !isPulseNow && (
                <Link
                  href="/portal/inventory"
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors',
                    pathname.startsWith('/portal/inventory')
                      ? 'bg-[#e6f6f3] text-[#0d5c56] font-semibold border border-[#0d8276]/20'
                      : 'text-slate-700 dark:text-slate-300 hover:text-[#0d6157] hover:bg-[#f0f9f7] dark:hover:bg-slate-800/60'
                  )}
                >
                  <span>Inventory &amp; Stock</span>
                </Link>
              )}
              <Link
                href="/portal/organization"
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors',
                  isOrganizationPage
                    ? 'bg-[#e6f6f3] text-[#0d5c56] font-semibold border border-[#0d8276]/20'
                    : 'text-slate-700 dark:text-slate-300 hover:text-[#0d6157] hover:bg-[#f0f9f7] dark:hover:bg-slate-800/60'
                )}
              >
                <span>Clinic Profile</span>
              </Link>
              <Link
                href="/portal/security"
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors',
                  isSecurityPage
                    ? 'bg-[#e6f6f3] text-[#0d5c56] font-semibold border border-[#0d8276]/20'
                    : 'text-slate-700 dark:text-slate-300 hover:text-[#0d6157] hover:bg-[#f0f9f7] dark:hover:bg-slate-800/60'
                )}
              >
                <span>Security &amp; 2FA</span>
              </Link>
              <Link
                href="/portal/subscription"
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors',
                  isSubscriptionPage
                    ? 'bg-[#e6f6f3] text-[#0d5c56] font-semibold border border-[#0d8276]/20'
                    : 'text-slate-700 dark:text-slate-300 hover:text-[#0d6157] hover:bg-[#f0f9f7] dark:hover:bg-slate-800/60'
                )}
              >
                <span>Upgrade &amp; Plans</span>
              </Link>
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
                  <Link
                    key={d.id}
                    href={`/portal/doctors/${d.id}?tab=${currentTab}`}
                    className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:bg-[#e6f6f3] hover:text-[#0d5c56] dark:hover:bg-[#0d6157]/20 dark:hover:text-teal-300 transition-colors"
                  >
                    <span className="truncate font-medium">{d.name}</span>
                    <ChevronRight className="size-3 text-[#0d6157]/60 dark:text-teal-400/60 shrink-0" />
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
