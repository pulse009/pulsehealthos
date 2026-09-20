'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { TopAnnouncementBar } from '@/components/layout/TopAnnouncementBar';
import {
  Activity,
  ArrowRight,
  Bot,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Cpu,
  CreditCard,
  Database,
  FileCheck,
  FileText,
  Globe2,
  Headphones,
  HeartPulse,
  HelpCircle,
  Layers,
  Lock,
  MessageSquare,
  Mic,
  Package,
  Phone,
  PhoneCall,
  Pill,
  Play,
  Plus,
  Receipt,
  RotateCcw,
  Scale,
  Server,
  ShieldAlert,
  ShieldCheck,
  Star,
  Stethoscope,
  TrendingUp,
  UserCheck,
  Users,
  Volume2,
  Zap,
} from 'lucide-react';

interface LandingPageClientProps {
  user: {
    id: string;
    name: string;
    role: string;
    clinicId?: string | null;
  } | null;
  portalHref: string;
}

export default function LandingPageClient({ user, portalHref }: LandingPageClientProps) {
  // State for Product Suite active tab
  const [activeProductTab, setActiveProductTab] = useState<'healthos' | 'now' | 'speak'>('healthos');

  // State for FAQ accordions
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // State for interactive simulator
  const [simStep, setSimStep] = useState<number>(1);

  // State for billing preview toggle
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-[#0d8276] selection:text-white relative overflow-x-hidden">
      
      {/* ─── 1. TOP ANNOUNCEMENT BAR ─── */}
      <TopAnnouncementBar />

      {/* ─── 2. HERO SHELL CONTAINER ─── */}
      <div className="relative w-full px-2 sm:px-4 lg:px-6 pt-2 sm:pt-3">
        <div className="relative w-full overflow-hidden rounded-[24px] sm:rounded-[36px] border-[3px] sm:border-[4px] border-white shadow-[0_12px_45px_rgba(13,92,86,0.08)] min-h-[640px] flex flex-col justify-between bg-gradient-to-b from-[#d5f1ec] via-[#edf9f6] to-[#c6ece4]">
          
          {/* Vertical Fluted Aesthetic Texture Overlay */}
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

          {/* Ambient Lighting Accents */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-white/50 blur-[110px] rounded-full pointer-events-none" />
          <div className="absolute -top-12 -left-12 w-96 h-96 bg-teal-200/40 blur-[90px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-96 h-96 bg-cyan-200/30 blur-[90px] rounded-full pointer-events-none" />

          {/* ─── Top Floating Pill Navigation Bar ─── */}
          <PublicNavbar activePage="home" user={user} portalHref={portalHref} />

          {/* ─── Hero Main Center Content ─── */}
          <div className="relative z-20 px-4 sm:px-8 lg:px-12 pt-12 sm:pt-16 pb-12 sm:pb-16 text-center max-w-5xl mx-auto flex flex-col items-center justify-center">
            
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 shadow-sm border border-[#0d8276]/20 text-[#0d6157] text-xs font-semibold tracking-wide mb-6">
              <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Production-Grade Healthcare Operating System</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[62px] font-semibold tracking-tight leading-[1.12] text-slate-900">
              <span className="block text-[#0d5c56]">Intelligent Clinic Management,</span>
              <span className="block text-slate-900 mt-1 sm:mt-2">Automated From Patient To Payout</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 sm:mt-6 text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto font-normal">
              Pulseware synchronizes your entire clinical operation into one seamless ecosystem: autonomous <strong>WhatsApp &amp; Voice AI booking</strong>, <strong>smart Electronic Health Records (EHR)</strong>, <strong>pharmacy batch inventory</strong>, and <strong>automated doctor commission payouts</strong> — with zero double-booking guaranteed.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4 w-full sm:w-auto justify-center">
              <a
                href="#products"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#0d6157] hover:bg-[#0a4e46] text-white text-sm font-semibold shadow-[0_4px_20px_rgba(13,97,87,0.3)] transition-all hover:scale-105 active:scale-95 group"
              >
                <span>Explore Platform Products</span>
                <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
              </a>

              <Link
                href="/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold border border-slate-200/90 shadow-sm transition-all hover:scale-105 active:scale-95"
              >
                <Calendar className="size-4 text-[#0d6157]" />
                <span>Request Custom Demo</span>
              </Link>
            </div>

            {/* Fast Stats Row Under CTA */}
            <div className="mt-10 sm:mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-6 border-t border-[#0d6157]/15 w-full max-w-4xl text-left">
              <div className="bg-white/60 backdrop-blur-xs p-3 rounded-2xl border border-white/80">
                <div className="text-xl sm:text-2xl font-bold text-[#0d5c56]">0%</div>
                <div className="text-[11px] text-slate-500 font-medium">Double-Booking Collision Rate</div>
              </div>
              <div className="bg-white/60 backdrop-blur-xs p-3 rounded-2xl border border-white/80">
                <div className="text-xl sm:text-2xl font-bold text-[#0d5c56]">&lt; 50ms</div>
                <div className="text-[11px] text-slate-500 font-medium">Live Availability Engine</div>
              </div>
              <div className="bg-white/60 backdrop-blur-xs p-3 rounded-2xl border border-white/80">
                <div className="text-xl sm:text-2xl font-bold text-[#0d5c56]">24/7</div>
                <div className="text-[11px] text-slate-500 font-medium">WhatsApp &amp; Voice Booking</div>
              </div>
              <div className="bg-white/60 backdrop-blur-xs p-3 rounded-2xl border border-white/80">
                <div className="text-xl sm:text-2xl font-bold text-[#0d5c56]">11 Roles</div>
                <div className="text-[11px] text-slate-500 font-medium">Role-Based Hospital Security</div>
              </div>
            </div>

          </div>

          {/* Bottom spacer for balanced framing */}
          <div className="h-2" />
        </div>
      </div>

      {/* ─── 3. ENTERPRISE STANDARDS & ARCHITECTURE STRIP ─── */}
      <section className="py-10 sm:py-12 border-b border-slate-200/60 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold tracking-wider uppercase mb-1.5">
                <ShieldCheck className="size-3.5 text-teal-600" />
                <span>Enterprise Standards &amp; Architecture</span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                Engineered for hospitals, polyclinics, specialized centers &amp; medical networks
              </h3>
            </div>
            <p className="text-xs text-slate-500 max-w-md lg:text-right font-normal">
              Built on mathematical PostgreSQL concurrency guarantees and strict tenant boundary isolation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            
            {/* Standard 1 */}
            <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-teal-200/90 shadow-2xs hover:shadow-xs transition-all group">
              <div className="size-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ShieldCheck className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                  PostgreSQL GiST
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  Zero Double-Booking Guarantee
                </div>
              </div>
            </div>

            {/* Standard 2 */}
            <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-teal-200/90 shadow-2xs hover:shadow-xs transition-all group">
              <div className="size-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Lock className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                  Strict Tenant Scoping
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  Cryptographic IDOR-Proof
                </div>
              </div>
            </div>

            {/* Standard 3 */}
            <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-teal-200/90 shadow-2xs hover:shadow-xs transition-all group">
              <div className="size-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Globe2 className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                  20+ Locales &amp; Timezones
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  Arabic, English &amp; IANA Math
                </div>
              </div>
            </div>

            {/* Standard 4 */}
            <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-teal-200/90 shadow-2xs hover:shadow-xs transition-all group">
              <div className="size-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Database className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                  UTC Timestamptz Trails
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  Immutable Clinical Audit Logs
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── 4. FLAGSHIP PRODUCTS SUITE (MAIN PRODUCT SHOWCASE) ─── */}
      <section id="products" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-12">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#0d6157] text-xs font-semibold uppercase tracking-wider mb-3">
            <Layers className="size-3.5" /> Product Suite
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900">
            Three Powerful Products. <br className="hidden sm:inline" />
            <span className="text-[#0d5c56]">One Unified Platform.</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            Whether you need a full Hospital Practice Management system, an autonomous WhatsApp booking bot, or an AI voice receptionist — Pulseware provides dedicated, production-ready software solutions.
          </p>

          {/* Interactive Product Selector Tabs */}
          <div className="mt-8 inline-flex p-1.5 rounded-2xl bg-slate-100 border border-slate-200 shadow-inner max-w-full overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveProductTab('healthos')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeProductTab === 'healthos'
                  ? 'bg-white text-[#0d5c56] shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HeartPulse className="size-4 text-teal-600" />
              <span>Pulse HealthOS (Full PMS)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveProductTab('now')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeProductTab === 'now'
                  ? 'bg-white text-[#0d5c56] shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="size-4 text-emerald-600" />
              <span>Pulse Now (WhatsApp AI)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveProductTab('speak')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeProductTab === 'speak'
                  ? 'bg-white text-[#0d5c56] shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Volume2 className="size-4 text-cyan-600" />
              <span>Pulse Speak (Voice AI)</span>
            </button>
          </div>
        </div>

        {/* ─── TAB 1: PULSE HEALTHOS SHOWCASE ─── */}
        {activeProductTab === 'healthos' && (
          <div className="bg-white rounded-[32px] sm:rounded-[40px] border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-10 lg:p-12 transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Left Column: Product Overview & Feature Highlights */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold border border-teal-200/60">
                  <HeartPulse className="size-3.5" /> Flagship Clinic Operating System
                </div>
                
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900">
                  Pulse HealthOS: Complete Practice &amp; Hospital Management
                </h3>
                
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                  The centralized clinical backbone for hospitals, clinics, and multi-specialty centers. HealthOS connects patient registration, clinical encounters, diagnostic lab orders, pharmacy inventory movements, and financial day-end reconciliations in real time.
                </p>

                <div className="space-y-3 pt-2">
                  {[
                    {
                      title: 'Smart Clinical EHR & E-Prescriptions',
                      desc: 'ICD-10 coding, digital prescriptions, vital charts, and history tracking with fast doctor workflows.',
                    },
                    {
                      title: 'Pharmacy Batch & Stock Inventory',
                      desc: 'Track lot numbers, expiry dates, supplier purchase orders, and automatic stock depletion on dispensing.',
                    },
                    {
                      title: 'Doctor Commission & Payouts Engine',
                      desc: 'Automated revenue splits per procedure or consultation with multi-tier commission structures.',
                    },
                    {
                      title: 'Multi-Role Staff Access & RBAC',
                      desc: 'Granular permissions for Super Admin, Doctors, Nurses, Receptionists, Pharmacists, and Lab Techs.',
                    },
                  ].map((feat, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="size-5 rounded-full bg-[#0d6157] text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="size-3 stroke-[3]" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-slate-900">{feat.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{feat.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex flex-wrap items-center gap-4">
                  <Link
                    href="/features"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0d6157] hover:bg-[#0a4e46] text-white text-xs sm:text-sm font-semibold shadow-md transition-all hover:scale-105"
                  >
                    <span>HealthOS Full Capabilities</span>
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold transition-all"
                  >
                    <span>View Pricing (1,099 SAR/mo)</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: Visual HealthOS Dashboard Mockup */}
              <div className="lg:col-span-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-5 sm:p-7 text-white shadow-2xl border border-slate-700/80 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="size-3 rounded-full bg-rose-500" />
                    <div className="size-3 rounded-full bg-amber-500" />
                    <div className="size-3 rounded-full bg-emerald-500" />
                    <span className="text-xs text-slate-400 font-mono ml-2">healthos.pulseware.internal</span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    Live Clinic OS
                  </span>
                </div>

                {/* Dashboard Metrics Strip */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
                    <div className="text-[11px] text-slate-400">Total Patients</div>
                    <div className="text-lg sm:text-xl font-bold text-white mt-1">1,482</div>
                    <div className="text-[10px] text-emerald-400">+14% this month</div>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
                    <div className="text-[11px] text-slate-400">Pharmacy Low Stock</div>
                    <div className="text-lg sm:text-xl font-bold text-amber-400 mt-1">3 Items</div>
                    <div className="text-[10px] text-slate-400">Auto PO Ready</div>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
                    <div className="text-[11px] text-slate-400">Daily Revenue</div>
                    <div className="text-lg sm:text-xl font-bold text-teal-300 mt-1">14,250 SAR</div>
                    <div className="text-[10px] text-emerald-400">Balanced</div>
                  </div>
                </div>

                {/* Active Consultation / Doctor Card */}
                <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="size-9 rounded-full bg-teal-600 flex items-center justify-center font-bold text-xs text-white">
                        DC
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">Dr. David Chen, MD</div>
                        <div className="text-[10px] text-slate-400">Chief of Orthopedics &bull; Room 204</div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 font-medium">
                      In Consultation
                    </span>
                  </div>

                  {/* Patient mini record */}
                  <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Patient: Khalid Mansoor</span>
                      <span className="text-[10px] font-mono text-teal-400">MRN: #PL-8942</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Diagnosis: Acute Lumbar Strain &bull; Prescribed: Ibuprofen 600mg + Physical Therapy Order
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                      <span>Lab Status: CBC Normal</span>
                      <span className="text-emerald-400">Rx Sent to Pharmacy</span>
                    </div>
                  </div>
                </div>

                {/* Pharmacy stock fast bar */}
                <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Pill className="size-4 text-teal-400" />
                    <span className="text-slate-300">Amoxicillin 500mg (Batch #BX-902)</span>
                  </div>
                  <span className="text-emerald-400 font-mono text-xs">482 Units In Stock</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ─── TAB 2: PULSE NOW (WHATSAPP AI AGENT) ─── */}
        {activeProductTab === 'now' && (
          <div className="bg-white rounded-[32px] sm:rounded-[40px] border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-10 lg:p-12 transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Left Column: Product Overview */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200/60">
                  <MessageSquare className="size-3.5" /> Autonomous WhatsApp Booking Engine
                </div>
                
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900">
                  Pulse Now: 24/7 AI Patient Booking &amp; Smart Fast Router
                </h3>
                
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                  Turn your clinic&apos;s WhatsApp into an autonomous, multilingual booking concierge. Powered by deep LLM reasoning combined with deterministic database scheduling guarantees, Pulse Now qualifies leads, checks doctor calendars, and locks slots instantly.
                </p>

                <div className="space-y-3 pt-2">
                  {[
                    {
                      title: 'Mathematical Zero-Double Booking Guarantee',
                      desc: 'Powered by PostgreSQL GiST exclusion constraints — impossible for two concurrent patients to book the same slot.',
                    },
                    {
                      title: 'Natural Multilingual Conversations',
                      desc: 'Fluent in English, Arabic, French, Urdu, and 20+ dialects with empathetic medical tone.',
                    },
                    {
                      title: 'Automated Idempotent Reminder Engine',
                      desc: 'Dispatches customizable 24-hour and 2-hour WhatsApp reminders to reduce no-shows below 5%.',
                    },
                    {
                      title: 'Human Coordinator Live Escalation',
                      desc: 'Seamlessly transfers complex clinical queries to your front-desk staff with complete conversation context.',
                    },
                  ].map((feat, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="size-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="size-3 stroke-[3]" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-slate-900">{feat.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{feat.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex flex-wrap items-center gap-4">
                  <Link
                    href="/features"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold shadow-md transition-all hover:scale-105"
                  >
                    <span>Explore Pulse Now Features</span>
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold transition-all"
                  >
                    <span>View Pricing (499 SAR/mo)</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: WhatsApp Interactive UI Mockup */}
              <div className="lg:col-span-6 bg-[#0c1317] rounded-3xl p-5 sm:p-6 text-slate-100 shadow-2xl border border-slate-800 max-w-md mx-auto w-full space-y-4">
                {/* WhatsApp Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-white shadow-sm">
                      <Bot className="size-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                        <span>Clinic AI Concierge</span>
                        <CheckCircle2 className="size-3.5 text-emerald-400" />
                      </div>
                      <div className="text-[11px] text-emerald-400 font-mono">Pulse Now Agent &bull; Online</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-800 px-2 py-1 rounded-md text-slate-400">Verified API</span>
                </div>

                {/* WhatsApp Messages Thread */}
                <div className="space-y-3 py-2 text-xs">
                  {/* Inbound Patient Msg */}
                  <div className="flex justify-end">
                    <div className="bg-[#005c4b] text-white p-3 rounded-2xl rounded-tr-none max-w-[85%] shadow-sm">
                      <p>Hi, I need an appointment with Dr. Sarah Johnson for cardiology tomorrow afternoon please.</p>
                      <div className="text-[9px] text-teal-200 text-right mt-1">10:42 AM &bull; ✓✓</div>
                    </div>
                  </div>

                  {/* AI Reply Msg */}
                  <div className="flex justify-start">
                    <div className="bg-[#202c33] text-slate-100 p-3.5 rounded-2xl rounded-tl-none max-w-[90%] shadow-sm space-y-2 border border-slate-700/50">
                      <p>Hello! I checked Dr. Sarah Johnson&apos;s real-time schedule for tomorrow. Here are her confirmed open slots:</p>
                      <div className="bg-[#111b21] p-2.5 rounded-xl border border-slate-700 space-y-1.5">
                        <div className="text-[11px] font-semibold text-emerald-400">Available Slots (Tomorrow):</div>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="bg-[#005c4b] text-white px-2.5 py-1 rounded-lg text-[11px] font-medium">1:30 PM</span>
                          <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg text-[11px]">3:00 PM</span>
                          <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg text-[11px]">4:15 PM</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-300">Reply &quot;1&quot; for 1:30 PM or reply with your preferred time to reserve.</p>
                      <div className="text-[9px] text-slate-400 text-right">10:42 AM</div>
                    </div>
                  </div>

                  {/* Inbound Confirm */}
                  <div className="flex justify-end">
                    <div className="bg-[#005c4b] text-white p-3 rounded-2xl rounded-tr-none max-w-[85%] shadow-sm">
                      <p>1:30 PM works great!</p>
                      <div className="text-[9px] text-teal-200 text-right mt-1">10:43 AM &bull; ✓✓</div>
                    </div>
                  </div>

                  {/* AI Booking Locked */}
                  <div className="flex justify-start">
                    <div className="bg-[#202c33] text-slate-100 p-3.5 rounded-2xl rounded-tl-none max-w-[90%] shadow-sm space-y-2 border border-emerald-500/40">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
                        <CheckCircle2 className="size-4" /> Appointment Confirmed!
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Doctor: <strong>Dr. Sarah Johnson</strong><br />
                        Date: <strong>Tomorrow at 1:30 PM</strong><br />
                        Location: <strong>Clinic Main Branch, Floor 2</strong>
                      </p>
                      <div className="text-[10px] text-slate-400 bg-[#111b21] p-2 rounded-lg font-mono">
                        Booking Ref: #BK-7729 (Locked in EHR)
                      </div>
                      <div className="text-[9px] text-slate-400 text-right">10:43 AM</div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ─── TAB 3: PULSE SPEAK (VOICE CALLER AGENT) ─── */}
        {activeProductTab === 'speak' && (
          <div className="bg-white rounded-[32px] sm:rounded-[40px] border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-10 lg:p-12 transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Left Column: Product Overview */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 text-xs font-semibold border border-cyan-200/60">
                  <Volume2 className="size-3.5" /> Autonomous Voice AI Telephony
                </div>
                
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900">
                  Pulse Speak: Autonomous Clinic Voice Receptionist
                </h3>
                
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                  Never miss a patient phone call again. Pulse Speak answers telephone calls with natural, latency-free conversational speech, answers clinical inquiries, looks up doctor availability in real time, and verbally books appointments directly into your EHR calendar.
                </p>

                <div className="space-y-3 pt-2">
                  {[
                    {
                      title: 'Direct PBX & VoIP SIP Trunk Integration',
                      desc: 'Connects directly to your hospital landline, 3CX, Asterisk, or cloud telecom provider in minutes.',
                    },
                    {
                      title: 'Human-like Voice Acoustics & Low Latency',
                      desc: 'Sub-400ms spoken speech latency with natural breathing, medical pronunciation, and warm demeanor.',
                    },
                    {
                      title: 'Handles 100+ Concurrent Phone Calls',
                      desc: 'Zero busy tones. Scale from solo clinics to 500-bed hospitals handling morning call spikes effortlessly.',
                    },
                    {
                      title: 'Spoken-to-EHR Automatic Transcription',
                      desc: 'Every call generates an audited audio transcript, patient summary, and calendar booking.',
                    },
                  ].map((feat, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="size-5 rounded-full bg-cyan-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="size-3 stroke-[3]" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-slate-900">{feat.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{feat.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex flex-wrap items-center gap-4">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-cyan-700 hover:bg-cyan-800 text-white text-xs sm:text-sm font-semibold shadow-md transition-all hover:scale-105"
                  >
                    <span>Request Pulse Speak Voice Demo</span>
                    <PhoneCall className="size-4" />
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold transition-all"
                  >
                    <span>Custom Enterprise Setup</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: Voice AI Telephony Card Mockup */}
              <div className="lg:col-span-6 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-cyan-900/50 space-y-6">
                
                {/* Call Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                      <PhoneCall className="size-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Live Inbound Ingestion</div>
                      <div className="text-xs text-cyan-400 font-mono">+966 11 400 8921 &bull; Active Call</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-cyan-400 animate-ping" />
                    01:42
                  </span>
                </div>

                {/* Sound Waveform Visualization */}
                <div className="bg-slate-900/90 rounded-2xl p-4 border border-cyan-800/40 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Speech Synthesis Engine</span>
                    <span className="text-cyan-400 font-mono">Neural Latency: 320ms</span>
                  </div>

                  {/* Animated Waveform bars */}
                  <div className="h-16 flex items-center justify-center gap-1.5 py-2">
                    {[40, 65, 80, 45, 90, 100, 75, 60, 85, 95, 50, 70, 80, 40, 90, 60, 45, 80, 65, 30].map((h, i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-gradient-to-t from-cyan-600 to-teal-300 rounded-full transition-all duration-300"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>

                  {/* Live Spoken Transcription Snippet */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                    <div className="text-slate-400 text-[11px] font-semibold">Live Verbal Audio Transcript:</div>
                    <p className="text-slate-200 italic font-mono text-[11.5px] leading-relaxed">
                      &ldquo;Certainly Mrs. Al-Mansoor, I have booked your dermatology consultation with Dr. Nora for Thursday at 11:00 AM. I have sent the confirmation SMS to this number.&rdquo;
                    </p>
                  </div>
                </div>

                {/* Telephony Status Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-[11px]">PBX Trunk</div>
                    <div className="text-white font-semibold mt-0.5">SIP: trunk-riyadh-01</div>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-[11px]">EHR Calendar Sync</div>
                    <div className="text-emerald-400 font-semibold mt-0.5">Instant Committed</div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

      </section>

      {/* ─── 5. ALL-IN-ONE OPERATING SYSTEM CORE PILLARS (DEEP CAPABILITIES) ─── */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-[#edf9f6] via-white to-[#edf9f6] border-y border-teal-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-18">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white text-[#0d6157] text-xs font-semibold shadow-xs border border-teal-200/80 mb-3">
              <Cpu className="size-3.5" /> Full Feature Matrix
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900">
              Built For Every Healthcare Workflow
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
              Eliminate disconnected single-purpose tools. Pulseware connects front-desk, doctors, pharmacy, finance, lab technicians, and patients into a single synchronized clinical OS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Card 1: WhatsApp AI Booking */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all border border-slate-200/80 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="size-12 rounded-2xl bg-teal-50 text-[#0d6157] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare className="size-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Autonomous WhatsApp Booking</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  Patients book in under 60 seconds over WhatsApp. The AI agent understands colloquial language, checks real doctor availability, and sends instant calendar invites.
                </p>
                <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-teal-600" /> Multi-lingual (Arabic, English &amp; 20+)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-teal-600" /> WhatsApp Cloud Official API
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-teal-600" /> Pre-consultation symptom triage
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 2: Electronic Health Records */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all border border-slate-200/80 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="size-12 rounded-2xl bg-teal-50 text-[#0d6157] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="size-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Clinical EHR &amp; Digital Rx</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  Fast medical charting designed for doctors. Record vitals, ICD-10 diagnoses, past clinical encounters, allergy histories, and instant e-prescriptions.
                </p>
                <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-teal-600" /> One-click prescription dispensing
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-teal-600" /> Complete longitudinal patient chart
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-teal-600" /> Fast doctor consultation templates
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 3: Pharmacy & Batch Inventory */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all border border-slate-200/80 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="size-12 rounded-2xl bg-teal-50 text-[#0d6157] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package className="size-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Pharmacy &amp; Stock Inventory</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  Full batch-level tracking with expiry alerts, automated supplier purchase orders, and immediate stock movement audit logs on every patient dispensation.
                </p>
                <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-teal-600" /> Lot &amp; Expiry date compliance
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-teal-600" /> Purchase Orders &amp; Item Requests
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-teal-600" /> Real-time Low Stock notifications
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 4: Doctor Payouts & Commission */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all border border-slate-200/80 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="size-12 rounded-2xl bg-teal-50 text-[#0d6157] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CreditCard className="size-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Doctor Payouts &amp; Commission</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  Eliminate end-of-month accounting friction. Configure custom commission percentages, fixed salary thresholds, and procedure payouts automatically.
                </p>
                <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-teal-600" /> Automated monthly doctor payroll
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-teal-600" /> Per-service revenue split rules
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-teal-600" /> Transparent payout breakdown reports
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 5: Invoicing & Day-End Closing */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all border border-slate-200/80 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="size-12 rounded-2xl bg-teal-50 text-[#0d6157] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Receipt className="size-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Billing &amp; Day-End Balancing</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  Multi-tender payment acceptance (Cash, Credit Card, Insurance, Bank Transfer) with strict cash drawer day-end closing reconciliations and tax receipts.
                </p>
                <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-teal-600" /> Daily cash drawer reconciliation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-teal-600" /> Itemized tax invoices with QR codes
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-teal-600" /> Partial payment &amp; credit ledger
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 6: Lab Orders & Diagnostic Tracking */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all border border-slate-200/80 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="size-12 rounded-2xl bg-teal-50 text-[#0d6157] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Activity className="size-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Diagnostic Labs &amp; Pathology</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  Order lab tests directly from clinical encounters. Track sample collection, in-progress analyses, external PDF result uploads, and doctor verification.
                </p>
                <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-teal-600" /> STAT / Urgent priority flags
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-teal-600" /> Sample barcode specimen tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-teal-600" /> Direct patient result dispatch
                  </li>
                </ul>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ─── 6. ARCHITECTURAL SUPERIORITY (HOW IT WORKS UNDER THE HOOD) ─── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-[32px] sm:rounded-[44px] bg-[#073631] text-white p-8 sm:p-12 lg:p-16 border border-teal-800/80 shadow-2xl relative overflow-hidden">
          
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 blur-[90px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 blur-[90px] rounded-full pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center relative z-10">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30">
                <ShieldAlert className="size-3.5" /> High-Concurreny Architectural Guarantee
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-[1.15]">
                Why Healthcare CTOs Trust Pulseware
              </h2>

              <p className="text-sm sm:text-base text-teal-100/80 leading-relaxed font-normal">
                Generic chatbots hallucinate bookings and crash during morning appointment rushes. Pulseware is built on a deterministic 4-layer booking engine where the database enforces absolute exclusivity.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3.5">
                  <div className="size-6 rounded-lg bg-teal-500/30 text-teal-300 flex items-center justify-center shrink-0 font-mono text-xs font-bold">
                    01
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">The AI is NOT the Booking Engine</h4>
                    <p className="text-xs text-teal-100/70 mt-0.5">
                      Gemini LLM cannot write to SQL. It calls strictly Zod-validated tools under tenant-scoped authorization.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="size-6 rounded-lg bg-teal-500/30 text-teal-300 flex items-center justify-center shrink-0 font-mono text-xs font-bold">
                    02
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">PostgreSQL GiST Exclusion Constraints</h4>
                    <p className="text-xs text-teal-100/70 mt-0.5">
                      Two simultaneous requests for the exact same millisecond will result in exactly one commit. The database rejects conflicts with SQLSTATE 23P01.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="size-6 rounded-lg bg-teal-500/30 text-teal-300 flex items-center justify-center shrink-0 font-mono text-xs font-bold">
                    03
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Strict Multi-Tenant Scoping</h4>
                    <p className="text-xs text-teal-100/70 mt-0.5">
                      Zero IDOR vulnerability. Every database query is cryptographically bounded to the clinic identifier.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Technical Architecture Terminal Diagram */}
            <div className="lg:col-span-6 bg-[#041c19] rounded-2xl p-5 sm:p-7 border border-teal-800/80 font-mono text-xs space-y-4 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 border-b border-teal-900/60 pb-3">
                <span className="text-teal-300 font-semibold">booking_pipeline.ex</span>
                <span className="text-[10px] text-teal-400/80">LATENCY: 42ms</span>
              </div>

              <div className="space-y-3 text-[11.5px] leading-relaxed text-teal-100/90">
                <div className="text-slate-400">// 1. Inbound Webhook Verified</div>
                <div className="text-teal-300">
                  whatsapp.inbound({`from: "+9665...", clinicId: "cl_492"`})
                </div>

                <div className="text-slate-400">// 2. Tenant Scoped Availability Resolution</div>
                <div className="text-cyan-300">
                  resolveSlots({`doctorId: "doc_sarah", date: "2026-09-21"`})
                  <br />
                  <span className="text-emerald-400">└─&gt; [10:00, 11:30, 14:00, 16:30]</span>
                </div>

                <div className="text-slate-400">// 3. Database Exclusivity Locking</div>
                <div className="bg-[#031513] p-3 rounded-lg border border-teal-900 text-teal-200 text-[11px]">
                  <span className="text-amber-300 font-bold">SQL EXCLUDE USING gist</span> (
                  <br />
                  &nbsp;&nbsp;doctorId WITH =,
                  <br />
                  &nbsp;&nbsp;tstzrange(blockStartsAt, blockEndsAt) WITH &amp;&amp;
                  <br />
                  ) WHERE (status IN (&apos;PENDING&apos;,&apos;CONFIRMED&apos;));
                </div>

                <div className="flex items-center gap-2 text-emerald-400 pt-1">
                  <CheckCircle2 className="size-4" />
                  <span>TRANSACTION COMMITTED &bull; 0 CONFLICTS</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ─── 7. PRODUCT PRICING SNAPSHOT SECTION ─── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#0d6157] text-xs font-semibold uppercase tracking-wider mb-3">
            <CreditCard className="size-3.5" /> Simple Transparent Plans
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900">
            Predictable Pricing For Every Scale
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            No hidden fees, no per-appointment booking surcharges. Choose the product package that matches your operational needs.
          </p>

          {/* Billing Switcher */}
          <div className="mt-8 inline-flex items-center p-1.5 rounded-full bg-white shadow-sm border border-slate-200/80">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
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
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
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

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          
          {/* Plan 1: Pulse Now */}
          <div className="bg-white rounded-[28px] sm:rounded-[32px] p-7 sm:p-9 shadow-md border border-slate-200/80 flex flex-col justify-between hover:shadow-xl transition-all">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
                  Pulse Now
                </h3>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold">
                  AI Booking Bot
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
                Autonomous WhatsApp AI Receptionist
              </p>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
                  {billingCycle === 'monthly' ? '499' : '399'}
                </span>
                <span className="text-sm text-slate-500 font-normal">SAR/month</span>
              </div>

              <ul className="mt-8 space-y-3.5 text-xs sm:text-sm text-slate-700 font-normal">
                <li className="flex items-center gap-3">
                  <Check className="size-4 text-teal-600 shrink-0" />
                  <span>24/7 WhatsApp AI Booking Concierge</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="size-4 text-teal-600 shrink-0" />
                  <span>Unlimited Patient Appointments</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="size-4 text-teal-600 shrink-0" />
                  <span>Zero Double-Booking Guarantee</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="size-4 text-teal-600 shrink-0" />
                  <span>Automated WhatsApp 24h &amp; 2h Reminders</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="size-4 text-teal-600 shrink-0" />
                  <span>Human Coordinator Escalation Router</span>
                </li>
              </ul>
            </div>

            <div className="mt-9">
              <Link
                href="/contact"
                className="w-full py-3.5 px-6 rounded-full border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-900 text-sm font-semibold text-center block transition-all shadow-xs"
              >
                Choose Pulse Now
              </Link>
            </div>
          </div>

          {/* Plan 2: Pulse HealthOS (Most Popular) */}
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
                Complete Hospital &amp; PMS Operating System
              </p>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="text-4xl sm:text-5xl font-semibold tracking-tight text-white">
                  {billingCycle === 'monthly' ? '1,099' : '999'}
                </span>
                <span className="text-sm text-teal-200/80 font-normal">SAR/month</span>
              </div>

              <ul className="mt-8 space-y-3.5 text-xs sm:text-sm text-teal-50 font-normal">
                <li className="flex items-center gap-3">
                  <Check className="size-4 text-teal-300 shrink-0" />
                  <span>Everything in Pulse Now Included</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="size-4 text-teal-300 shrink-0" />
                  <span>Up to 30 Clinical Users &amp; Doctors</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="size-4 text-teal-300 shrink-0" />
                  <span>Comprehensive EHR &amp; E-Prescription System</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="size-4 text-teal-300 shrink-0" />
                  <span>Pharmacy Batch Stock &amp; Inventory POs</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="size-4 text-teal-300 shrink-0" />
                  <span>Doctor Commission Payouts &amp; Payroll</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="size-4 text-teal-300 shrink-0" />
                  <span>Diagnostic Lab Orders &amp; Day-End Balancing</span>
                </li>
              </ul>
            </div>

            <div className="mt-9">
              <Link
                href="/contact"
                className="w-full py-3.5 px-6 rounded-full bg-white hover:bg-slate-100 text-[#0b544b] text-sm font-semibold text-center block transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                Get Started with HealthOS
              </Link>
            </div>
          </div>

          {/* Plan 3: Pulse Speak */}
          <div className="bg-white rounded-[28px] sm:rounded-[32px] p-7 sm:p-9 shadow-md border border-slate-200/80 flex flex-col justify-between hover:shadow-xl transition-all">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
                  Pulse Speak
                </h3>
                <span className="px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-800 text-[11px] font-semibold">
                  Voice Telephony AI
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
                Autonomous Telephony Caller Agent
              </p>

              <div className="mt-6">
                <span className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
                  Custom Setup
                </span>
              </div>

              <ul className="mt-8 space-y-3.5 text-xs sm:text-sm text-slate-700 font-normal">
                <li className="flex items-center gap-3">
                  <Check className="size-4 text-teal-600 shrink-0" />
                  <span>Autonomous Inbound Phone Call Receptionist</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="size-4 text-teal-600 shrink-0" />
                  <span>Direct PBX, 3CX &amp; SIP Trunk Connection</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="size-4 text-teal-600 shrink-0" />
                  <span>Handles 100+ Concurrent Telephone Lines</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="size-4 text-teal-600 shrink-0" />
                  <span>Direct Verbal Scheduling into HealthOS</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="size-4 text-teal-600 shrink-0" />
                  <span>Speech-to-Text Clinical Call Summaries</span>
                </li>
              </ul>
            </div>

            <div className="mt-9">
              <Link
                href="/contact"
                className="w-full py-3.5 px-6 rounded-full border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-900 text-sm font-semibold text-center block transition-all shadow-xs"
              >
                Talk to Sales
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ─── 8. FREQUENTLY ASKED QUESTIONS ACCORDION ─── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-2">
            <HelpCircle className="size-3.5" /> Support &amp; FAQ
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-sm text-slate-500 font-normal">
            Everything you need to know about Pulseware deployment, security, and migration.
          </p>
        </div>

        <div className="space-y-3.5">
          {[
            {
              q: 'How does Pulseware guarantee zero double-bookings?',
              a: 'Pulseware uses native PostgreSQL GiST exclusion constraints at the database tier. When an appointment is scheduled, PostgreSQL creates an atomic range lock on the doctor and time interval. Even under hundreds of concurrent requests, colliding bookings are mathematically impossible.',
            },
            {
              q: 'Can we integrate our existing clinic phone number with Pulse Speak and Pulse Now?',
              a: 'Yes. Pulse Now connects to your official Meta WhatsApp Business Cloud account, and Pulse Speak integrates directly via SIP trunking into your existing PBX or telephony provider. Your patients keep calling and messaging your recognized clinic phone numbers.',
            },
            {
              q: 'Does Pulse HealthOS handle pharmacy batch tracking and expiry dates?',
              a: 'Yes. Pulse HealthOS features a full inventory management module that tracks items by lot/batch number, purchase price, supplier, and expiry date. Stock is automatically depleted upon doctor or pharmacist dispensing, and low-stock alerts trigger purchase order drafts.',
            },
            {
              q: 'How does the doctor commission calculation engine work?',
              a: 'Each doctor account can be configured with a base salary and/or custom commission percentage per consultation and medical procedure. Invoices automatically split the hospital and doctor shares in real-time, producing audited monthly doctor payout statements.',
            },
            {
              q: 'Is patient data isolated and HIPAA / GDPR compliant?',
              a: 'Absolutely. Every hospital tenant operates inside strict isolation boundaries enforced at the query layer. All medical records, invoices, and messaging logs are encrypted in transit and at rest with complete timestamptz audit logging.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full px-5 sm:px-6 py-4.5 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-slate-900 hover:text-[#0d6157] transition-colors"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`size-4 text-slate-400 shrink-0 transition-transform ${
                    openFaq === idx ? 'rotate-180 text-[#0d6157]' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 font-normal">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── 9. BOTTOM CALL TO ACTION BANNER ─── */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-[32px] sm:rounded-[40px] bg-gradient-to-r from-[#0d6157] via-[#0b544b] to-[#083e37] text-white p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-tight">
              Ready to Upgrade Your Clinic to an Intelligent Operating System?
            </h2>
            <p className="text-sm sm:text-base text-teal-100/90 leading-relaxed font-normal max-w-2xl mx-auto">
              Join leading healthcare clinics and hospitals transforming patient engagement, pharmacy operations, and clinical workflows with Pulseware.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href="/contact"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-[#0d6157] text-sm font-semibold shadow-lg hover:bg-slate-100 transition-all hover:scale-105 active:scale-95"
              >
                Schedule Personalized Demo
              </Link>
              <Link
                href="/pricing"
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-teal-800/60 hover:bg-teal-800 text-white text-sm font-semibold border border-teal-600/50 transition-all"
              >
                Compare All Plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 10. ENTERPRISE FOOTER ─── */}
      <PublicFooter />

    </div>
  );
}
