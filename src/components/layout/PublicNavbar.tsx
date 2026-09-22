'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Menu, X } from 'lucide-react';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            className="h-6 sm:h-8 w-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop Navigation Links */}
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
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {user ? (
            <Link
              href={portalHref}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full bg-[#0d6157] text-white text-xs sm:text-sm font-semibold shadow-md hover:bg-[#0a4e46] transition-all hover:scale-105 active:scale-95"
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
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white text-slate-900 text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md border border-slate-200/90 transition-all hover:scale-105 active:scale-95"
              >
                <span>Book Demo</span>
                <ArrowRight className="size-3.5 text-[#0d6157]" />
              </Link>
            </>
          )}

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden size-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 max-w-7xl mx-auto rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200 shadow-xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => {
              const isActive = activePage === item.key;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-[#0d6157] font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <span className="size-2 rounded-full bg-[#0d8276]" />}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {!user && (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center text-xs font-semibold text-slate-700 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                Sign In to Clinic Portal
              </Link>
            )}
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 text-center text-xs font-semibold text-white rounded-full bg-[#0d6157] hover:bg-[#0a4e46] shadow-md transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Book Demo &amp; Contact</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
