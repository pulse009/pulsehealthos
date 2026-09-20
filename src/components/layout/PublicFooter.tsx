'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CreditCard, MessageSquare } from 'lucide-react';

export function PublicFooter() {
  return (
    <div className="relative w-full px-2 sm:px-4 lg:px-6 pb-3 mt-8">
      <div className="relative w-full overflow-hidden rounded-[24px] sm:rounded-[36px] border-[3px] sm:border-[4px] border-white shadow-[0_8px_30px_rgba(13,92,86,0.08)] bg-gradient-to-b from-[#d8f2ee] via-[#edf9f6] to-[#cdeee8]">
        
        {/* Texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-70"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.25) 0px,
              rgba(255, 255, 255, 0) 36px,
              rgba(13, 92, 86, 0.025) 72px,
              rgba(255, 255, 255, 0.6) 72px,
              rgba(255, 255, 255, 0.6) 73px,
              rgba(13, 92, 86, 0.05) 73px,
              rgba(13, 92, 86, 0.05) 74px
            )`,
          }}
        />

        <footer className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-12 sm:py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 pb-10 border-b border-[#0d6157]/15">
            
            {/* Brand Info */}
            <div className="col-span-2 md:col-span-2 space-y-4 pr-6">
              <Link href="/" className="inline-block">
                <Image
                  src="/logo.png"
                  alt="Pulseware"
                  width={140}
                  height={35}
                  className="h-7 sm:h-8 w-auto object-contain"
                />
              </Link>
              <p className="text-[13px] text-[#0d6157]/80 leading-relaxed max-w-[300px]">
                The complete Healthcare Operating System for modern clinics — autonomous AI booking, clinical EHR, pharmacy inventory, and doctor payouts.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-[#0d8276]/20 text-[11px] font-medium text-[#0d6157] hover:bg-white transition-all shadow-xs"
                >
                  <MessageSquare className="size-3" /> Contact Sales
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-[#0d8276]/20 text-[11px] font-medium text-[#0d6157] hover:bg-white transition-all shadow-xs"
                >
                  <CreditCard className="size-3" /> Pricing Matrix
                </Link>
              </div>
              <p className="text-[11px] text-[#0d6157]/50 pt-1">© 2026 Pulseware Healthcare OS. All rights reserved.</p>
            </div>

            {/* Products */}
            <div className="space-y-3">
              <h6 className="text-[11px] font-semibold text-[#0d5c56] uppercase tracking-widest">Platform Products</h6>
              <div className="space-y-2.5 flex flex-col">
                <Link href="/products" className="text-[12px] text-[#0d6157]/70 hover:text-[#0d6157] transition-colors">
                  Pulse HealthOS (PMS)
                </Link>
                <Link href="/products" className="text-[12px] text-[#0d6157]/70 hover:text-[#0d6157] transition-colors">
                  Pulse Now (WhatsApp AI)
                </Link>
                <Link href="/products" className="text-[12px] text-[#0d6157]/70 hover:text-[#0d6157] transition-colors">
                  Pulse Speak (Voice AI)
                </Link>
                <Link href="/features" className="text-[12px] text-[#0d6157]/70 hover:text-[#0d6157] transition-colors">
                  Clinical Features Matrix
                </Link>
              </div>
            </div>

            {/* Company */}
            <div className="space-y-3">
              <h6 className="text-[11px] font-semibold text-[#0d5c56] uppercase tracking-widest">Company</h6>
              <div className="space-y-2.5 flex flex-col">
                <Link href="/about" className="text-[12px] text-[#0d6157]/70 hover:text-[#0d6157] transition-colors">
                  About Pulseware
                </Link>
                <Link href="/pricing" className="text-[12px] text-[#0d6157]/70 hover:text-[#0d6157] transition-colors">
                  Pricing &amp; Plans
                </Link>
                <Link href="/contact" className="text-[12px] text-[#0d6157]/70 hover:text-[#0d6157] transition-colors">
                  Request Demo
                </Link>
                <Link href="/login" className="text-[12px] text-[#0d6157]/70 hover:text-[#0d6157] transition-colors">
                  Hospital Staff Login
                </Link>
              </div>
            </div>

            {/* Security & Reliability */}
            <div className="space-y-3">
              <h6 className="text-[11px] font-semibold text-[#0d5c56] uppercase tracking-widest">Trust &amp; Architecture</h6>
              <div className="space-y-2.5 flex flex-col">
                <span className="text-[12px] text-[#0d6157]/70">GiST Concurrency Engine</span>
                <span className="text-[12px] text-[#0d6157]/70">Strict Multi-Tenant Isolation</span>
                <span className="text-[12px] text-[#0d6157]/70">WhatsApp Cloud Official API</span>
                <span className="text-[12px] text-[#0d6157]/70">256-Bit Encrypted Data</span>
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-[#0d6157]/60">Built for doctors, pharmacists, clinic administrators, and patients worldwide.</p>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-medium text-[#0d6157]/70">All Services Operational &bull; 99.99% Uptime</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
