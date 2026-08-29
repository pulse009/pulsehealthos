'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  LayoutGrid,
  Building2,
  Users,
  Calendar,
  CalendarDays,
  MessagesSquare,
  Stethoscope,
  ClipboardList,
  Bot,
  MessageCircle,
  BellRing,
  BarChart2,
  BarChart3,
  UserCog,
  UserCheck,
  ScrollText,
  Menu,
  X,
  LogOut,
  Home,
  Users2,
} from 'lucide-react';
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
  { href: '/portal/teams', label: 'Teams', icon: 'users' },
  { href: '/portal/appointments', label: 'Appointments', icon: 'appointments' },
  { href: '/portal/leads', label: 'Leads', icon: 'leads' },
  { href: '/portal/conversations', label: 'Conversations', icon: 'conversations' },
  { href: '/portal/analytics', label: 'Analytics', icon: 'analytics' },
];

function isPathActive(pathname: string, href: string): boolean {
  if (href === '/portal') return pathname === '/portal';
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Dedicated Clinic Portal Sidebar:
 * - "Clinic OS" header with Teal Lotus/Flower icon
 * - Portal modules: Dashboard, Doctors, Services, Teams, Appointments, Leads, Conversations, Analytics
 */
export function ClinicPortalSidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [optimisticPath, setOptimisticPath] = useState<string | null>(null);

  const clinicItems = [
    { href: '/portal', label: 'Dashboard', icon: LayoutGrid },
    { href: '/portal/doctors', label: 'Doctors', icon: Stethoscope },
    { href: '/portal/services', label: 'Services', icon: ClipboardList },
    { href: '/portal/teams', label: 'Teams', icon: Users },
    { href: '/portal/appointments', label: 'Appointments', icon: Calendar },
    { href: '/portal/leads', label: 'Leads', icon: UserCheck },
    { href: '/portal/conversations', label: 'Conversations', icon: MessagesSquare },
    { href: '/portal/analytics', label: 'Analytics', icon: BarChart2 },
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
    <nav className="space-y-1 px-3 py-2 select-none flex flex-col" aria-label="Clinic Portal">
      {/* 1. Clinic OS Brand Header with Teal Lotus Icon */}
      <div className="px-2 pt-2 pb-5">
        <Link
          href="/portal"
          onMouseEnter={() => router.prefetch('/portal')}
          onPointerDown={() => router.prefetch('/portal')}
          className="flex items-center gap-3 text-[15px] font-bold text-slate-900 dark:text-white group"
        >
          {/* Teal Lotus Icon */}
          <svg
            className="size-6 text-teal-500 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3c-1.2 3.2-3.8 6.5-6.8 8.5 3.2 1.2 6.5 1 7.2-1.5.7 2.5 4 2.7 7.2 1.5-3-2-5.6-5.3-6.8-8.5z" />
            <path d="M12 10c-1 2.2-2.8 4.2-5 5.5 2.2 1 4.8 1 5.2-.8.4 1.8 3 1.8 5.2.8-2.2-1.3-4-3.3-5-5.5z" />
            <path d="M12 15c-.8 1.5-2 2.8-3.5 3.6 1.5.6 3.2.6 3.5-.5.3 1.1 2 1.1 3.5.5-1.5-.8-2.7-2.1-3.5-3.6z" />
          </svg>
          <span className="tracking-tight text-slate-900 dark:text-white font-black text-base">Clinic OS</span>
        </Link>
      </div>

      {/* 2. Portal Modules */}
      <div className="space-y-1.5 flex-1">
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
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all',
                active
                  ? 'bg-[#0f172a] text-white shadow-xs dark:bg-slate-800'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100 font-medium',
              )}
            >
              <Icon
                className={cn(
                  'size-4.5 shrink-0 transition-colors',
                  active ? 'text-white' : 'text-slate-400 dark:text-slate-400',
                )}
              />
              <span className="truncate">{item.label}</span>
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
}: {
  items: NavItem[];
  isClinicPortal?: boolean;
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
              {isClinicPortal ? <ClinicPortalSidebarNav /> : <SidebarNav items={items} />}
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
