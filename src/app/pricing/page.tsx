'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Globe2,
  HeartPulse,
  HelpCircle,
  MessageSquare,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  return (
    <div className="min-h-screen w-full bg-white text-slate-900 font-sans antialiased selection:bg-teal-600 selection:text-white relative overflow-x-hidden">
      
      {/* ─── MAIN PRICING HERO CARD (Exact Meditech-style Layout) ─── */}
      <div className="relative w-full px-2 sm:px-4 lg:px-6 pt-2 sm:pt-3 pb-12 sm:pb-20">
        <div className="relative w-full overflow-hidden rounded-[28px] sm:rounded-[40px] border-[3px] sm:border-[5px] border-white shadow-[0_12px_40px_rgba(13,92,86,0.08)] bg-gradient-to-b from-[#d8f2ee] via-[#edf9f6] to-[#cdeee8] pb-16 sm:pb-24">
          
          {/* Vertical Fluted / Slat Texture Overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-80"
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

          {/* Soft Center Lighting */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-white/40 blur-[100px] rounded-full pointer-events-none" />

          {/* ─── Top Floating Pill Navbar ─── */}
          <div className="relative z-20 px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4">
            <div className="w-full max-w-7xl mx-auto rounded-full bg-white shadow-[0_2px_12px_rgba(13,92,86,0.05)] px-4 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between">
              
              {/* Brand Logo */}
              <Link href="/" className="flex items-center gap-2 group shrink-0">
                <div className="relative size-6 sm:size-7 flex items-center justify-center text-[#0d8276]">
                  <svg viewBox="0 0 24 24" className="size-6 sm:size-7 fill-current" xmlns="http://www.w3.org/2000/svg">
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
                <span className="text-base sm:text-lg font-semibold tracking-tight text-slate-900">
                  Pulseware
                </span>
              </Link>

              {/* Center Navigation Links */}
              <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-[13.5px] font-medium text-slate-600">
                <Link href="/" className="hover:text-slate-900 transition-colors">
                  Home
                </Link>
                <Link href="/about" className="hover:text-slate-900 transition-colors">
                  About
                </Link>
                <Link href="/features" className="hover:text-slate-900 transition-colors">
                  Features
                </Link>
                <Link href="/pricing" className="flex items-center gap-1.5 text-[#0d8276] hover:text-[#0a5c53] font-semibold transition-colors">
                  <span className="size-1.5 rounded-full bg-[#0d8276]" />
                  <span>Pricing</span>
                </Link>
                <Link href="/contact" className="hover:text-slate-900 transition-colors">
                  Contact Us
                </Link>
              </nav>

              {/* Right CTA Button */}
              <div className="flex items-center gap-2.5 shrink-0">
                <Link
                  href="/login"
                  className="hidden sm:inline-flex px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white text-slate-900 text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md border border-slate-200/80 transition-all hover:scale-105 active:scale-95"
                >
                  Request Demo
                </Link>
              </div>
            </div>
          </div>

          {/* ─── Header: Simple & Flexible Pricing ─── */}
          <div className="relative z-10 px-5 sm:px-10 pt-12 sm:pt-16 pb-8 text-center max-w-4xl mx-auto flex flex-col items-center">
            <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-semibold tracking-tight leading-[1.12]">
              <span>Simple &amp; Flexible </span>
              <span className="text-[#0d5c56]">Pricing</span>
            </h1>

            <p className="mt-4 sm:mt-5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto font-normal">
              Choose the plan that fits your hospital&apos;s size and needs. No hidden fees.
            </p>

            {/* ─── Billing Cycle Toggle (Monthly vs Annual) ─── */}
            <div className="mt-8 inline-flex items-center p-1.5 rounded-full bg-white shadow-sm border border-slate-200/80">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-[#0d6157] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-5 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  billingCycle === 'annual'
                    ? 'bg-[#0d6157] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Annual Billing</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* ─── 3 Pricing Packages Grid (Exact Image Layout) ─── */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
              
              {/* ─── Plan 1: Pulse Now (AI Chatbot) ─── */}
              <div className="bg-white rounded-[28px] sm:rounded-[32px] p-7 sm:p-9 shadow-md border border-slate-100 flex flex-col justify-between hover:shadow-xl transition-all">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
                      Pulse Now
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
                    AI Chatbot &amp; WhatsApp Patient Booking
                  </p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
                      {billingCycle === 'monthly' ? '$99' : '$79'}
                    </span>
                    <span className="text-sm text-slate-500 font-normal">/month</span>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="mt-8 space-y-3.5 text-xs sm:text-sm text-slate-700 font-normal">
                    <li className="flex items-center gap-3">
                      <div className="size-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Up to 5 users</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="size-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Patient Management</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="size-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Basic Billing &amp; Invoicing</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="size-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Appointment Scheduling</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="size-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>WhatsApp Fast Router Engine</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="size-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Email &amp; Chat Support</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-9">
                  <Link
                    href="/login"
                    className="w-full py-3.5 px-6 rounded-full border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-900 text-sm font-semibold text-center block transition-all shadow-xs"
                  >
                    Choose Plan
                  </Link>
                </div>
              </div>

              {/* ─── Plan 2: Pulse HealthOS (Complete PMS - Center Highlighted) ─── */}
              <div className="bg-[#0b544b] text-white rounded-[28px] sm:rounded-[32px] p-7 sm:p-9 shadow-2xl border border-teal-800 flex flex-col justify-between relative lg:-translate-y-2 lg:scale-[1.03] z-20">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
                      Pulse HealthOS
                    </h3>
                    <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-semibold tracking-wide">
                      Most Popular
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-teal-100/80 mt-1 font-normal">
                    Complete PMS &amp; Hospital Operations
                  </p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-semibold tracking-tight text-white">
                      {billingCycle === 'monthly' ? '$549' : '$439'}
                    </span>
                    <span className="text-sm text-teal-200/80 font-normal">/month</span>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="mt-8 space-y-3.5 text-xs sm:text-sm text-teal-50 font-normal">
                    <li className="flex items-center gap-3">
                      <div className="size-4 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Up to 30 users &amp; clinicians</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="size-4 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Comprehensive Patient Management &amp; EHR</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="size-4 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Pharmacy &amp; Smart Inventory System</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="size-4 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Doctor Payouts &amp; Commission Rules</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="size-4 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Enterprise Appointment Scheduling</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="size-4 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Priority 24/7 Dedicated Support</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="size-4 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Advanced Financial &amp; Clinical Analytics</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="size-4 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Multi-Doctor Roster &amp; Staff Management</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-9">
                  <Link
                    href="/login"
                    className="w-full py-3.5 px-6 rounded-full bg-white hover:bg-slate-100 text-[#0b544b] text-sm font-semibold text-center block transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Get started
                  </Link>
                </div>
              </div>

              {/* ─── Plan 3: Pulse Speak (Voice Caller Agent) ─── */}
              <div className="bg-white rounded-[28px] sm:rounded-[32px] p-7 sm:p-9 shadow-md border border-slate-100 flex flex-col justify-between hover:shadow-xl transition-all">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
                      Pulse Speak
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
                    Autonomous Voice Caller Agent for Clinics
                  </p>

                  <div className="mt-6">
                    <span className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
                      Let&apos;s chat!
                    </span>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="mt-8 space-y-3.5 text-xs sm:text-sm text-slate-700 font-normal">
                    <li className="flex items-center gap-3">
                      <div className="size-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Unlimited Voice Inbound &amp; Outbound Calls</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="size-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Autonomous Phone Appointment Booking</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="size-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Multi-Branch &amp; PBX Call Routing</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="size-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Direct EHR &amp; WhatsApp Calendar Sync</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="size-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Natural Arabic &amp; English Voice Accents</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="size-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 shrink-0">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                      <span>Dedicated Technical Account Manager</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-9">
                  <Link
                    href="/login"
                    className="w-full py-3.5 px-6 rounded-full border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-900 text-sm font-semibold text-center block transition-all shadow-xs"
                  >
                    Request Demo
                  </Link>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ─── GUARANTEE & TRUST SECTION ─── */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <ShieldCheck className="size-6 text-[#0d6157] mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-900">Enterprise Isolation</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every clinic operates in its own isolated database tenancy with encrypted tokens.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <Zap className="size-6 text-[#0d6157] mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-900">24-Hour Onboarding</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Connect your WhatsApp Business and go live with patient bookings within 1 day.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <Globe2 className="size-6 text-[#0d6157] mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-900">Bilingual Engine</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Native Arabic &amp; English support with sub-50ms automated response times.
            </p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-slate-200/80 bg-white py-12 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        <p>© 2026 PULSEware. The intelligent operating system for modern healthcare.</p>
      </footer>

    </div>
  );
}
