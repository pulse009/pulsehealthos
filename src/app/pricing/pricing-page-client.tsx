'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Globe2,
  HelpCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { TopAnnouncementBar } from '@/components/layout/TopAnnouncementBar';
import { AllSiteContent } from '@/lib/cms/types';
import { DEFAULT_SITE_CONTENT } from '@/lib/cms/defaults';

interface PricingPageClientProps {
  cmsContent?: AllSiteContent;
  user?: {
    id?: string;
    name?: string;
    role?: string;
  } | null;
  portalHref?: string;
}

export function PricingPageClient({
  cmsContent = DEFAULT_SITE_CONTENT,
  user = null,
  portalHref = '/portal',
}: PricingPageClientProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const { announcement, pricing, footer } = cmsContent;

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-[#0d8276] selection:text-white relative overflow-x-hidden">
      
      {/* ─── TOP ANNOUNCEMENT BAR ─── */}
      <TopAnnouncementBar content={announcement} />

      {/* ─── HERO CARD (Meditech Theme) ─── */}
      <div className="relative w-full px-2 sm:px-4 lg:px-6 pt-2 sm:pt-3 pb-6 sm:pb-12">
        <div className="relative w-full overflow-hidden rounded-[24px] sm:rounded-[36px] border-[3px] sm:border-[4px] border-white shadow-[0_12px_45px_rgba(13,92,86,0.08)] bg-gradient-to-b from-[#d5f1ec] via-[#edf9f6] to-[#c6ece4] pb-12 sm:pb-20">
          
          {/* Vertical Fluted / Slat Texture Overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-75"
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                rgba(255, 255, 255, 0.3) 0px,
                rgba(255, 255, 255, 0) 36px,
                rgba(13, 92, 86, 0.025) 72px,
                rgba(255, 255, 255, 0.6) 72px,
                rgba(255, 255, 255, 0.6) 73px,
                rgba(13, 92, 86, 0.05) 73px,
                rgba(13, 92, 86, 0.05) 74px
              )`,
            }}
          />

          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-white/40 blur-[100px] rounded-full pointer-events-none" />

          {/* Unified Floating Pill Navbar */}
          <PublicNavbar activePage="pricing" user={user} portalHref={portalHref} />

          {/* ─── Header: Simple & Flexible Pricing ─── */}
          <div className="relative z-10 px-4 sm:px-10 pt-10 sm:pt-16 pb-6 sm:pb-8 text-center max-w-4xl mx-auto flex flex-col items-center">
            <h1 className="text-3xl sm:text-5xl lg:text-[58px] font-semibold tracking-tight leading-[1.12]">
              <span>{pricing.headlineFirst} </span>
              <span className="text-[#0d5c56]">{pricing.headlineSecond}</span>
            </h1>

            <p className="mt-3.5 sm:mt-5 text-xs sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto font-normal">
              {pricing.subtitle}
            </p>

            {/* ─── Billing Cycle Toggle (Monthly vs Annual) ─── */}
            <div className="mt-6 sm:mt-8 inline-flex items-center p-1 sm:p-1.5 rounded-full bg-white shadow-sm border border-slate-200/80 whitespace-nowrap shrink-0">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                  billingCycle === 'monthly'
                    ? 'bg-[#0d6157] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="hidden sm:inline whitespace-nowrap">Monthly Billing</span>
                <span className="inline sm:hidden whitespace-nowrap">Monthly</span>
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
                  billingCycle === 'annual'
                    ? 'bg-[#0d6157] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="hidden sm:inline whitespace-nowrap">Annual Billing</span>
                <span className="inline sm:hidden whitespace-nowrap">Annual</span>
                {pricing.discountBadge && (
                  <span className="text-[9.5px] sm:text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 leading-tight">
                    {pricing.discountBadge}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ─── 3 Pricing Packages Grid ─── */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
              
              {pricing.plans.map((plan) => {
                const isHealthOs = plan.id === 'healthos' || plan.isPopular;
                const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
                const isNumericPrice = !isNaN(Number(price.replace(/,/g, '')));

                if (isHealthOs) {
                  return (
                    <div
                      key={plan.id}
                      className="bg-[#0b544b] text-white rounded-[24px] sm:rounded-[32px] p-6 sm:p-9 shadow-2xl border border-teal-800 flex flex-col justify-between relative lg:-translate-y-2 lg:scale-[1.03] z-20"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
                            {plan.name}
                          </h3>
                          <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-semibold tracking-wide">
                            Most Popular
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-teal-100/80 mt-1 font-normal">
                          {plan.subtitle}
                        </p>

                        <div className="mt-6 flex items-baseline gap-1.5">
                          <span className="text-4xl sm:text-5xl font-semibold tracking-tight text-white">
                            {price}
                          </span>
                          {isNumericPrice && <span className="text-sm text-teal-200/80 font-normal">SAR/month</span>}
                        </div>

                        {/* Feature Checklist */}
                        <ul className="mt-8 space-y-3.5 text-xs sm:text-sm text-teal-50 font-normal">
                          {plan.features.map((feat, idx) => (
                            <li key={idx} className="flex items-center gap-3">
                              <div className="size-4 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                                <Check className="size-2.5 stroke-[3]" />
                              </div>
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-8 sm:mt-9">
                        <Link
                          href={plan.ctaHref || '/contact'}
                          className="w-full py-3.5 px-6 rounded-full bg-white hover:bg-slate-100 text-[#0b544b] text-sm font-semibold text-center block transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                        >
                          {plan.ctaText || 'Get started'}
                        </Link>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={plan.id}
                    className="bg-white rounded-[24px] sm:rounded-[32px] p-6 sm:p-9 shadow-md border border-slate-100 flex flex-col justify-between hover:shadow-xl transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
                          {plan.name}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
                        {plan.subtitle}
                      </p>

                      <div className="mt-6 flex items-baseline gap-1.5">
                        <span className="text-3xl sm:text-5xl font-semibold tracking-tight text-slate-900">
                          {price}
                        </span>
                        {isNumericPrice && <span className="text-sm text-slate-500 font-normal">SAR/month</span>}
                      </div>

                      {/* Feature Checklist */}
                      <ul className="mt-8 space-y-3.5 text-xs sm:text-sm text-slate-700 font-normal">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-3">
                            <div className="size-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 shrink-0">
                              <Check className="size-2.5 stroke-[3]" />
                            </div>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-8 sm:mt-9">
                      <Link
                        href={plan.ctaHref || '/contact'}
                        className="w-full py-3.5 px-6 rounded-full border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-900 text-sm font-semibold text-center block transition-all shadow-xs"
                      >
                        {plan.ctaText || 'Choose Plan'}
                      </Link>
                    </div>
                  </div>
                );
              })}

            </div>
          </div>

        </div>
      </div>

      {/* ─── GUARANTEE & TRUST SECTION ─── */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <ShieldCheck className="size-6 text-[#0d6157] mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-900">Enterprise Isolation</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              Every clinic operates in its own isolated database tenancy with encrypted tokens.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <Zap className="size-6 text-[#0d6157] mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-900">24-Hour Onboarding</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              Connect your WhatsApp Business and go live with patient bookings within 1 day.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <Globe2 className="size-6 text-[#0d6157] mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-900">Bilingual Engine</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              Native Arabic &amp; English support with sub-50ms automated response times.
            </p>
          </div>
        </div>
      </section>

      {/* ─── UNIFIED PUBLIC FOOTER ─── */}
      <PublicFooter content={footer} />

    </div>
  );
}
