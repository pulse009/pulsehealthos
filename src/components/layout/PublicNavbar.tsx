'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export interface PublicNavbarProps {
  activePage?: 'home' | 'products' | 'features' | 'pricing' | 'about' | 'contact';
  user?: {
    id?: string;
    name?: string;
    role?: string;
  } | null;
  portalHref?: string;
}

export function PublicNavbar({
  activePage = 'home',
  user = null,
  portalHref = '/portal',
}: PublicNavbarProps) {
  const navItems = [
    { key: 'home', label: 'Home', href: '/' },
    { key: 'products', label: 'Products', href: '/products' },
    { key: 'features', label: 'Features', href: '/features' },
    { key: 'pricing', label: 'Pricing', href: '/pricing' },
    { key: 'about', label: 'About', href: '/about' },
    { key: 'contact', label: 'Contact', href: '/contact' },
  ];

  return (
    <header className="relative z-30 px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4">
      <div className="w-full max-w-7xl mx-auto rounded-full bg-white/95 backdrop-blur-md shadow-[0_4px_20px_rgba(13,92,86,0.06)] border border-slate-100/90 px-4 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <Image
            src="/logo.png"
            alt="Pulseware Healthcare OS"
            width={140}
            height={35}
            className="h-7 sm:h-8 w-auto object-contain"
            priority
          />
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-[13.5px] font-medium text-slate-600">
          {navItems.map((item) => {
            const isActive = activePage === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? 'text-[#0d8276] hover:text-[#0a5c53] font-semibold'
                    : 'hover:text-slate-900'
                }`}
              >
                {isActive && <span className="size-1.5 rounded-full bg-[#0d8276]" />}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {user ? (
            <Link
              href={portalHref}
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-[#0d6157] text-white text-xs sm:text-sm font-semibold shadow-md hover:bg-[#0a4e46] transition-all hover:scale-105 active:scale-95"
            >
              <span>Launch Portal</span>
              <ArrowRight className="size-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white text-slate-900 text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md border border-slate-200/90 transition-all hover:scale-105 active:scale-95"
              >
                <span>Book Demo</span>
                <ArrowRight className="size-3.5 text-[#0d6157]" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
