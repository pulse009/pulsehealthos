'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CreditCard, MessageSquare } from 'lucide-react';
import { FooterContent } from '@/lib/cms/types';
import { DEFAULT_SITE_CONTENT } from '@/lib/cms/defaults';

interface PublicFooterProps {
  content?: FooterContent;
}

export function PublicFooter({ content = DEFAULT_SITE_CONTENT.footer }: PublicFooterProps) {
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

        <footer className="relative z-10 max-w-7xl mx-auto px-5 sm:px-10 lg:px-14 py-10 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 sm:gap-10 pb-8 sm:pb-10 border-b border-[#0d6157]/15">
            
            {/* Brand Info */}
            <div className="col-span-1 sm:col-span-2 md:col-span-2 space-y-4 pr-0 sm:pr-6">
              <Link href="/" className="inline-block">
                <Image
                  src="/logo.png"
                  alt="Pulseware"
                  width={140}
                  height={35}
                  className="h-6 sm:h-8 w-auto object-contain"
                />
              </Link>
              <p className="text-xs sm:text-[13px] text-[#0d6157]/80 leading-relaxed max-w-sm">
                {content.tagline}
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
              <p className="text-[11px] text-[#0d6157]/50 pt-1">{content.copyright}</p>
            </div>

            {/* Products Column */}
            <div className="space-y-3">
              <h6 className="text-[11px] font-semibold text-[#0d5c56] uppercase tracking-widest">Platform Products</h6>
              <div className="space-y-2.5 flex flex-col">
                {content.productLinks.map((link, idx) => (
                  <Link
                    key={idx}
                    href={link.href}
                    className="text-[12px] text-[#0d6157]/70 hover:text-[#0d6157] transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Company Column */}
            <div className="space-y-3">
              <h6 className="text-[11px] font-semibold text-[#0d5c56] uppercase tracking-widest">Company</h6>
              <div className="space-y-2.5 flex flex-col">
                {content.companyLinks.map((link, idx) => (
                  <Link
                    key={idx}
                    href={link.href}
                    className="text-[12px] text-[#0d6157]/70 hover:text-[#0d6157] transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Security & Reliability */}
            <div className="space-y-3">
              <h6 className="text-[11px] font-semibold text-[#0d5c56] uppercase tracking-widest">Trust &amp; Architecture</h6>
              <div className="space-y-2.5 flex flex-col">
                {content.trustBadges.map((badge, idx) => (
                  <span key={idx} className="text-[12px] text-[#0d6157]/70">
                    {badge}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <p className="text-[11px] text-[#0d6157]/60">Built for doctors, pharmacists, clinic administrators, and patients worldwide.</p>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-medium text-[#0d6157]/70">{content.statusText}</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
