'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LuBuilding2 as Building2,
  LuLogOut as LogOut,
  LuShield as Shield,
  LuTrendingUp as TrendingUp,
} from 'react-icons/lu';
import { Badge, cn } from '@/components/ui/primitives';

export function UserProfileDropdown({
  workspaceName,
  workspaceKind,
  userName,
  userEmail,
  userRole,
  clinicInitials,
}: {
  workspaceName: string;
  workspaceKind: 'Admin' | 'Clinic';
  userName: string;
  userEmail: string;
  userRole?: string;
  clinicInitials: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on ESC
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.replace('/login');
      router.refresh();
    } catch (err) {
      console.error('Failed to log out:', err);
      setIsLoggingOut(false);
    }
  };

  const profileHref = workspaceKind === 'Clinic' ? '/portal/organization' : '/admin/clinics';

  const roleLabel =
    userRole === 'CLIENT'
      ? 'Clinic Owner'
      : userRole === 'SUPER_ADMIN'
      ? 'Platform Admin'
      : userRole === 'DOCTOR'
      ? 'Medical Doctor'
      : userRole === 'COORDINATOR'
      ? 'Medical Coordinator'
      : userRole === 'RECEPTIONIST'
      ? 'Receptionist'
      : userRole || 'Member';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Avatar Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'size-8 rounded-full bg-gradient-to-tr from-[#0d6157] to-[#0d8276] text-white font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer select-none transition-all ring-2 hover:ring-[#0d8276]/50 focus:outline-none focus:ring-[#0d8276]',
          isOpen ? 'ring-[#0d8276] scale-105' : 'ring-[#0d8276]/20'
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        {clinicInitials}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-100"
          role="menu"
        >
          {/* User Info Header */}
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-full bg-gradient-to-tr from-[#0d6157] to-[#0d8276] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                {clinicInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {userName || workspaceName}
                </p>
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                  {userEmail}
                </p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <Badge tone="brand" className="text-[10px] px-2 py-0.5 font-semibold bg-[#e6f6f3] text-[#0d5c56] dark:bg-[#0d6157]/20 dark:text-teal-300 border border-[#0d8276]/20">
                {roleLabel}
              </Badge>
            </div>
          </div>

          {/* Menu Options */}
          <div className="p-1 space-y-0.5">
            {/* Clinic Profile Option */}
            <Link
              href={profileHref}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#e6f6f3] hover:text-[#0d5c56] dark:hover:bg-slate-800 dark:hover:text-teal-300 transition-colors group cursor-pointer"
              role="menuitem"
            >
              <Building2 className="size-4 text-[#0d8276] group-hover:scale-110 transition-transform shrink-0" />
              <div className="flex flex-col text-left min-w-0">
                <span className="leading-tight">Clinic Profile</span>
                <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500 leading-tight">
                  View clinic details (read-only)
                </span>
              </div>
            </Link>

            {/* Security & 2FA Option */}
            <Link
              href="/portal/security"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#e6f6f3] hover:text-[#0d5c56] dark:hover:bg-slate-800 dark:hover:text-teal-300 transition-colors group cursor-pointer"
              role="menuitem"
            >
              <Shield className="size-4 text-[#0d8276] group-hover:scale-110 transition-transform shrink-0" />
              <div className="flex flex-col text-left min-w-0">
                <span className="leading-tight">Security &amp; 2FA</span>
                <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500 leading-tight">
                  Password, 2FA &amp; sessions
                </span>
              </div>
            </Link>

            {/* Upgrade & Plans Option */}
            <Link
              href="/portal/subscription"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#e6f6f3] hover:text-[#0d5c56] dark:hover:bg-slate-800 dark:hover:text-teal-300 transition-colors group cursor-pointer"
              role="menuitem"
            >
              <TrendingUp className="size-4 text-[#0d8276] group-hover:scale-110 transition-transform shrink-0" />
              <div className="flex flex-col text-left min-w-0">
                <span className="leading-tight">Upgrade &amp; Plans</span>
                <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500 leading-tight">
                  Pricing, tiers &amp; AI quota
                </span>
              </div>
            </Link>

            {/* Log Out Option */}
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors group cursor-pointer disabled:opacity-50 text-left"
              role="menuitem"
            >
              <LogOut className="size-4 text-rose-500 group-hover:scale-110 transition-transform shrink-0" />
              <div className="flex flex-col text-left min-w-0">
                <span className="leading-tight">{isLoggingOut ? 'Signing out…' : 'Log Out'}</span>
                <span className="text-[10px] font-normal text-rose-400/80 leading-tight">
                  Sign out of this session
                </span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
