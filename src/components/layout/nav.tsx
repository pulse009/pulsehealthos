'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LuLayoutDashboard as LayoutDashboard,
  LuLayoutGrid as LayoutGrid,
  LuBuilding2 as Building2,
  LuUsers as Users,
  LuCalendar as Calendar,
  LuCalendarDays as CalendarDays,
  LuMessagesSquare as MessagesSquare,
  LuClipboardList as ClipboardList,
  LuBot as Bot,
  LuMessageCircle as MessageCircle,
  LuBellRing as BellRing,
  LuChartColumn as BarChart2,
  LuChartBar as BarChart3,
  LuUserCog as UserCog,
  LuUserCheck as UserCheck,
  LuScrollText as ScrollText,
  LuMenu as Menu,
  LuX as X,
  LuLogOut as LogOut,
  LuHouse as Home,
  LuUsers as Users2,
  LuShield as Shield,
  LuTrendingUp as TrendingUp,
  LuBoxes as Boxes,
  LuWallet as Wallet,
  LuHeartPulse as HeartPulse,
  LuPill as Pill,
  LuFlaskConical as FlaskConical,
} from 'react-icons/lu';
import { FaUserDoctor as Stethoscope } from 'react-icons/fa6';
import { cn } from '@/components/ui/primitives';

export interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
}

const ICONS = {
  dashboard: LayoutDashboard,
  clinics: Building2,
  leads: Users,
  appointments: CalendarDays,
  conversations: MessagesSquare,
  doctors: Stethoscope,
  services: ClipboardList,
  ai: Bot,
  whatsapp: MessageCircle,
  reminders: BellRing,
  analytics: BarChart3,
  users: UserCog,
  logs: ScrollText,
} as const;

export const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
  { href: '/admin/clinics', label: 'Clinics', icon: 'clinics' },
  { href: '/admin/leads', label: 'Leads', icon: 'leads' },
  { href: '/admin/appointments', label: 'Appointments', icon: 'appointments' },
  { href: '/admin/conversations', label: 'Conversations', icon: 'conversations' },
  { href: '/admin/doctors', label: 'Doctors', icon: 'doctors' },
  { href: '/admin/services', label: 'Services', icon: 'services' },
  { href: '/admin/ai', label: 'AI Configuration', icon: 'ai' },
  { href: '/admin/whatsapp', label: 'WhatsApp', icon: 'whatsapp' },
  { href: '/admin/reminders', label: 'Reminders', icon: 'reminders' },
  { href: '/admin/analytics', label: 'Analytics', icon: 'analytics' },
  { href: '/admin/users', label: 'Users', icon: 'users' },
  { href: '/admin/logs', label: 'System Logs', icon: 'logs' },
];

export const PORTAL_NAV: NavItem[] = [
  { href: '/portal', label: 'Dashboard', icon: 'dashboard' },
  { href: '/portal/doctors', label: 'Doctors', icon: 'doctors' },
  { href: '/portal/services', label: 'Services', icon: 'services' },
  { href: '/portal/patients', label: 'Patients', icon: 'users' },
  { href: '/portal/appointments', label: 'Appointments', icon: 'appointments' },
  { href: '/portal/conversations', label: 'Conversations', icon: 'conversations' },
];

function isPathActive(pathname: string, href: string): boolean {
  if (href === '/portal') return pathname === '/portal';
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Dedicated Clinic Portal Slim Icon Rail (Matching exact reference structure):
 * - Top Hospital Medical Logo + "pulsehealth" text
 * - Vertically stacked icon buttons (Dashboard, Doctors, Services, Patients, Appointments, Inbox)
 * - Bottom items: Security & Upgrade (replacing profile & sign out)
 */
export function ClinicPortalSidebarNav({
  userRole,
  isPulseNow = false,
}: {
  userRole?: string;
  isPulseNow?: boolean;
} = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [optimisticPath, setOptimisticPath] = useState<string | null>(null);

  const isDoctor = userRole === 'DOCTOR';
  const isCoordinator = userRole === 'COORDINATOR';
  const isReceptionist = userRole === 'RECEPTIONIST';
  const isNurse = userRole === 'NURSE';
  const isPharmacist = userRole === 'PHARMACIST';
  const isLabTech = userRole === 'LAB_TECHNICIAN' || userRole === 'PATHOLOGIST';
  const isManager = userRole === 'MANAGER';
  const isOwnerOrAdmin = userRole === 'CLIENT' || userRole === 'SUPER_ADMIN';

  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    async function fetchUnread() {
      try {
        const res = await fetch('/api/conversations/unread-count', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && typeof data.unreadCount === 'number') {
            setUnreadCount(data.unreadCount);
          }
        }
      } catch {}
    }

    fetchUnread();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchUnread();
      }
    }, 15000);
    const handleUpdate = () => {
      fetchUnread();
    };

    window.addEventListener('inbox-updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('inbox-updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, []);

  const inboxBadge = unreadCount > 0 ? (unreadCount > 99 ? '99+' : String(unreadCount)) : undefined;

  const clinicItems = isNurse
    ? [
        { href: '/portal/nurse', label: 'Nurse Stn', icon: HeartPulse },
        { href: '/portal/appointments', label: 'Appointments', icon: CalendarDays },
        { href: '/portal/patients', label: 'Patients', icon: Users },
        { href: '/portal/conversations', label: 'Inbox', icon: MessagesSquare, badge: inboxBadge },
      ]
    : isPharmacist
      ? [
          { href: '/portal/pharmacy', label: 'Pharmacy', icon: Pill },
          ...(!isPulseNow ? [{ href: '/portal/inventory', label: 'Inventory', icon: Boxes }] : []),
          { href: '/portal/patients', label: 'Patients', icon: Users },
          { href: '/portal/conversations', label: 'Inbox', icon: MessagesSquare, badge: inboxBadge },
        ]
      : isLabTech
        ? [
            { href: '/portal/laboratory', label: 'Laboratory', icon: FlaskConical },
            { href: '/portal/patients', label: 'Patients', icon: Users },
            { href: '/portal/conversations', label: 'Inbox', icon: MessagesSquare, badge: inboxBadge },
          ]
        : isManager
          ? [
              { href: '/portal/manager', label: 'Manager Hub', icon: Building2 },
              { href: '/portal/laboratory', label: 'Laboratory', icon: FlaskConical },
              ...(!isPulseNow ? [{ href: '/portal/inventory', label: 'Inventory', icon: Boxes }] : []),
              ...(!isPulseNow ? [{ href: '/portal/accounts', label: 'Accounts', icon: Wallet }] : []),
              { href: '/portal/patients', label: 'Patients', icon: Users },
              { href: '/portal/appointments', label: 'Appointments', icon: CalendarDays },
              { href: '/portal/conversations', label: 'Inbox', icon: MessagesSquare, badge: inboxBadge },
            ]
          : isReceptionist
            ? [
                { href: '/portal/appointments', label: 'Appointments', icon: CalendarDays },
                ...(!isPulseNow ? [{ href: '/portal/accounts/invoices', label: 'Billing', icon: Wallet }] : []),
                { href: '/portal/patients', label: 'Patients', icon: Users },
                { href: '/portal/conversations', label: 'Inbox', icon: MessagesSquare, badge: inboxBadge },
              ]
            : isDoctor
              ? [
                  { href: '/portal/consultations', label: 'Consult Desk', icon: Stethoscope },
                  { href: '/portal/laboratory', label: 'Laboratory', icon: FlaskConical },
                  { href: '/portal/appointments', label: 'Appointments', icon: CalendarDays },
                  { href: '/portal/doctors', label: 'My Profile', icon: UserCog },
                  ...(!isPulseNow ? [{ href: '/portal/accounts/doctor-payouts', label: 'My Payouts', icon: Wallet }] : []),
                  ...(!isPulseNow ? [{ href: '/portal/inventory/requests', label: 'Item Requests', icon: Boxes }] : []),
                  { href: '/portal/patients', label: 'Patients', icon: Users },
                  { href: '/portal/conversations', label: 'Inbox', icon: MessagesSquare, badge: inboxBadge },
                ]
              : [
                  { href: '/portal', label: 'Dashboard', icon: LayoutGrid },
                  { href: '/portal/consultations', label: 'Consult Desk', icon: Stethoscope },
                  { href: '/portal/doctors', label: 'Doctors', icon: Users2 },
                  ...(!isCoordinator ? [{ href: '/portal/services', label: 'Services', icon: ClipboardList }] : []),
                  ...(isOwnerOrAdmin ? [{ href: '/portal/roles', label: 'Roles', icon: UserCog }] : []),
                  ...(isOwnerOrAdmin ? [{ href: '/portal/nurse', label: 'Nurse Stn', icon: HeartPulse }] : []),
                  ...(isOwnerOrAdmin ? [{ href: '/portal/laboratory', label: 'Laboratory', icon: FlaskConical }] : []),
                  ...(isOwnerOrAdmin ? [{ href: '/portal/pharmacy', label: 'Pharmacy', icon: Pill }] : []),
                  ...(isOwnerOrAdmin ? [{ href: '/portal/manager', label: 'Operations', icon: Building2 }] : []),
                  ...(!isCoordinator && !isPulseNow ? [{ href: '/portal/inventory', label: 'Inventory', icon: Boxes }] : []),
                  ...(isOwnerOrAdmin && !isPulseNow ? [{ href: '/portal/accounts', label: 'Accounts', icon: Wallet }] : []),
                  { href: '/portal/patients', label: 'Patients', icon: Users },
                  { href: '/portal/appointments', label: 'Appointments', icon: CalendarDays },
                  { href: '/portal/conversations', label: 'Inbox', icon: MessagesSquare, badge: inboxBadge },
                ];

  const bottomItems = isOwnerOrAdmin
    ? [
        { href: '/portal/security', label: 'Security', icon: Shield },
        { href: '/portal/subscription', label: 'Upgrade', icon: TrendingUp },
      ]
    : [
        { href: '/portal/security', label: 'Security', icon: Shield },
      ];

  // Proactively prefetch all portal routes in background on mount
  useEffect(() => {
    clinicItems.forEach((item) => {
      try {
        router.prefetch(item.href);
      } catch {}
    });
  }, [router]);

  // Sync optimistic path when real pathname catches up
  useEffect(() => {
    setOptimisticPath(null);
  }, [pathname]);

  const currentActivePath = optimisticPath || pathname;

  return (
    <nav className="w-full h-full flex flex-col justify-between items-center py-3 select-none overflow-hidden" aria-label="Clinic Portal Navigation">
      {/* Scrollable Main Navigation Modules */}
      <div className="flex-1 w-full overflow-y-auto flex flex-col items-center gap-1.5 min-h-0 py-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {clinicItems.map((item) => {
          const Icon = item.icon;
          const active = isPathActive(currentActivePath, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onMouseEnter={() => router.prefetch(item.href)}
              onPointerDown={() => router.prefetch(item.href)}
              onClick={() => {
                if (pathname !== item.href) {
                  setOptimisticPath(item.href);
                }
              }}
              className="flex flex-col items-center justify-center w-full group relative cursor-pointer shrink-0"
            >
              {/* Compact Icon Container */}
              <div
                className={cn(
                  'relative size-8 rounded-[8px] flex items-center justify-center transition-all',
                  active
                    ? 'bg-[#e6f6f3] dark:bg-[#0d6157]/25 text-[#0d6157] dark:text-teal-300 shadow-2xs border border-[#0d8276]/30 dark:border-teal-500/40 font-bold'
                    : 'text-slate-600 dark:text-slate-400 group-hover:bg-[#f0f9f7] dark:group-hover:bg-slate-800/50 group-hover:text-[#0d6157] dark:group-hover:text-white',
                )}
              >
                <Icon className="size-3.5 stroke-[1.9] shrink-0" />

                {/* Badge if available */}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-bold text-[7.5px] min-w-[13px] h-[13px] px-0.5 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Compact Label underneath */}
              <span
                className={cn(
                  'text-[8px] tracking-tight font-medium mt-0.5 leading-none text-center truncate max-w-[62px]',
                  active
                    ? 'font-bold text-[#0d5c56] dark:text-teal-300'
                    : 'text-slate-500 dark:text-slate-400 group-hover:text-[#0d6157] dark:group-hover:text-slate-200',
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* 3. Bottom Stack: Security & Upgrade */}
      <div className="w-full flex flex-col items-center gap-1.5 pt-2 border-t border-slate-200/80 dark:border-slate-800 shrink-0">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = isPathActive(currentActivePath, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onMouseEnter={() => router.prefetch(item.href)}
              onPointerDown={() => router.prefetch(item.href)}
              onTouchStart={() => router.prefetch(item.href)}
              onClick={() => {
                if (pathname !== item.href) {
                  setOptimisticPath(item.href);
                }
              }}
              className="flex flex-col items-center justify-center w-full group relative cursor-pointer shrink-0"
            >
              <div
                className={cn(
                  'relative size-7.5 rounded-[8px] flex items-center justify-center transition-all',
                  active
                    ? 'bg-[#e6f6f3] dark:bg-[#0d6157]/25 text-[#0d6157] dark:text-teal-300 shadow-2xs border border-[#0d8276]/30'
                    : 'text-slate-500 dark:text-slate-400 group-hover:bg-[#f0f9f7] group-hover:text-[#0d6157]',
                )}
              >
                <Icon className="size-3.5 stroke-[1.8] shrink-0" />
              </div>
              <span className="text-[7.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 tracking-tight leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Standard flat sidebar for Admin
 */
export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [optimisticPath, setOptimisticPath] = useState<string | null>(null);

  useEffect(() => {
    items.forEach((item) => {
      try {
        router.prefetch(item.href);
      } catch {}
    });
  }, [items, router]);

  useEffect(() => {
    setOptimisticPath(null);
  }, [pathname]);

  const currentActivePath = optimisticPath || pathname;

  return (
    <nav className="space-y-1 px-3 py-2" aria-label="Primary">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active = isPathActive(currentActivePath, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            onMouseEnter={() => router.prefetch(item.href)}
            onPointerDown={() => router.prefetch(item.href)}
            onClick={() => {
              if (pathname !== item.href) {
                setOptimisticPath(item.href);
              }
            }}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs transition-all',
              active
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 font-medium',
            )}
          >
            <Icon className={cn('size-4 shrink-0', active ? 'text-white' : 'text-slate-500 dark:text-slate-400')} aria-hidden />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNavToggle({
  items,
  isClinicPortal,
  isPulseNow = false,
}: {
  items: NavItem[];
  isClinicPortal?: boolean;
  isPulseNow?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2 lg:hidden text-slate-700 dark:text-slate-300 transition-colors"
        aria-label="Open navigation"
      >
        <Menu className="size-4" aria-hidden />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
            onClick={() => setOpen(false)}
          />
          <div className="surface absolute inset-y-0 left-0 w-64 border-r border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-3.5">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Navigation</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg p-1 text-slate-500"
                aria-label="Close navigation"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2" onClick={() => setOpen(false)}>
              {isClinicPortal ? <ClinicPortalSidebarNav isPulseNow={isPulseNow} /> : <SidebarNav items={items} />}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await fetch('/api/auth/logout', { method: 'POST' });
        router.replace('/login');
        router.refresh();
      }}
      className="text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all disabled:opacity-60 cursor-pointer"
    >
      <LogOut className="size-4 shrink-0" aria-hidden />
      <span>{pending ? 'Signing out…' : 'Sign out'}</span>
    </button>
  );
}
