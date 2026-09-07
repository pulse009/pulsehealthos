import React from 'react';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth/session';
import {
  Activity,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  Globe2,
  HeartPulse,
  Lock,
  MessageSquare,
  Minus,
  Package,
  Plus,
  PlusCircle,
  Receipt,
  Server,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  TrendingUp,
  UserCheck,
  Zap,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getSessionUser();

  const portalHref = user
    ? user.role === 'SUPER_ADMIN'
      ? '/admin'
      : '/portal'
    : '/login';

  return (
    <div className="min-h-screen w-full bg-white text-slate-900 font-sans antialiased selection:bg-purple-600 selection:text-white relative overflow-x-hidden">



      {/* ─── HERO CARD (Full Width Layout with Pulseware) ─── */}
      <div className="relative w-full px-2 sm:px-4 lg:px-6 pt-2 sm:pt-3">
        <div className="relative w-full overflow-hidden rounded-[24px] sm:rounded-[36px] border-[3px] sm:border-[4px] border-white shadow-[0_8px_30px_rgba(13,92,86,0.06)] min-h-[520px] sm:min-h-[580px] flex flex-col justify-between bg-gradient-to-b from-[#d8f2ee] via-[#edf9f6] to-[#cdeee8]">
          
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
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-white/40 blur-[90px] rounded-full pointer-events-none" />

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
                <Link href="/" className="flex items-center gap-1.5 text-[#0d8276] hover:text-[#0a5c53] font-semibold transition-colors">
                  <span className="size-1.5 rounded-full bg-[#0d8276]" />
                  <span>Home</span>
                </Link>
                <Link href="/about" className="hover:text-slate-900 transition-colors">
                  About
                </Link>
                <Link href="/features" className="hover:text-slate-900 transition-colors">
                  Features
                </Link>
                <Link href="/pricing" className="hover:text-slate-900 transition-colors">
                  Pricing
                </Link>
                <Link href="/contact" className="hover:text-slate-900 transition-colors">
                  Contact Us
                </Link>
              </nav>

              {/* Right CTA Button */}
              <div className="flex items-center gap-2.5 shrink-0">
                {user ? (
                  <Link
                    href={portalHref}
                    className="inline-flex items-center px-4 py-1.5 sm:py-2 rounded-full bg-white text-slate-900 text-xs sm:text-sm font-semibold shadow-sm hover:shadow border border-slate-200/80 transition-all hover:scale-105 active:scale-95"
                  >
                    Go to Portal
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex items-center px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white text-slate-900 text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md border border-slate-200/80 transition-all hover:scale-105 active:scale-95"
                  >
                    Request Demo
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* ─── Hero Content (Centered with generous vertical breathing room) ─── */}
          <div className="relative z-10 px-5 sm:px-10 py-14 sm:py-20 lg:py-24 text-center max-w-4xl mx-auto flex flex-col items-center justify-center">
            <h1 className="text-3xl sm:text-5xl lg:text-[58px] font-semibold tracking-tight leading-[1.12]">
              <span className="block text-[#0d5c56]">Modernizing Healthcare,</span>
              <span className="block text-slate-900 mt-1 sm:mt-2">One Hospital at a Time</span>
            </h1>

            <p className="mt-5 sm:mt-6 text-xs sm:text-[14.5px] lg:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              Pulseware is designed to modernize hospital operations through a centralized digital platform. We bring together patient care,
            </p>

            <div className="mt-8 sm:mt-9 flex justify-center">
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-[#0d6157] hover:bg-[#0a4e46] text-white text-xs sm:text-sm font-medium shadow-[0_4px_16px_rgba(13,97,87,0.28)] transition-all hover:scale-105 active:scale-95 group"
              >
                <span>See Our Features</span>
                <ArrowRight className="size-3.5 sm:size-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>

          {/* Bottom spacer for balanced vertical framing */}
          <div className="h-2 sm:h-4" />
        </div>
      </div>

      {/* ─── SECTION 2: MISSION, VISION & MILESTONES (Exact Meditech Layout) ─── */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 sm:space-y-16 relative z-10">
        
        {/* Top 2-Column Grid: Our Mission & Our Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          
          {/* ─── Card 1: Our Mission ─── */}
          <div className="bg-[#eef9f6] border border-[#d2eee5] rounded-[32px] sm:rounded-[36px] p-6 sm:p-9 flex flex-col justify-between shadow-[0_4px_24px_rgba(13,92,86,0.04)] relative overflow-hidden">
            <div>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 mb-6">
                Our Mission
              </h2>

              {/* Floating UI Elements Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-start">
                
                {/* Total Beds Mini Card */}
                <div className="sm:col-span-5 bg-white rounded-2xl p-4 shadow-sm border border-slate-100/90 flex flex-col justify-between h-full min-h-[120px]">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <Activity className="size-4 text-teal-600" />
                    <span>Total Beds</span>
                  </div>
                  <div className="my-1">
                    <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">155</span>
                  </div>
                  <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
                    <TrendingUp className="size-3" />
                    <span>+12% vs last week</span>
                  </div>
                </div>

                {/* Doctor Slot Snippet & Ward Progress */}
                <div className="sm:col-span-7 space-y-3">
                  {/* Doctor Slot Card */}
                  <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100/90 space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                      <Clock className="size-3 text-slate-400" />
                      <span>10:00 AM &amp; 02 PM</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-xs shrink-0 shadow-sm">
                        SJ
                      </div>
                      <div className="leading-tight">
                        <div className="text-xs font-semibold text-slate-900">Dr. Sarah Johnson</div>
                        <div className="text-[10px] text-slate-500">Cardiology</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-50 text-slate-600 font-medium">
                      <span className="flex items-center gap-1 text-teal-700">
                        <CheckCircle2 className="size-3 text-teal-600" /> Available : 08
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Calendar className="size-3" /> Booked
                      </span>
                    </div>
                  </div>

                  {/* Ward Progress Snippet */}
                  <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100/90 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                      <span>General Ward A</span>
                      <span className="text-slate-400 text-[11px]">90%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full w-[90%]" />
                    </div>
                    <div className="flex items-center justify-between text-[10.5px] text-slate-500 font-medium">
                      <span>34 / 55 beds</span>
                      <span className="text-slate-400">21 available</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-8 text-base sm:text-lg font-medium text-slate-800 leading-snug">
              To simplify healthcare management with smart, reliable, and scalable technology
            </p>
          </div>

          {/* ─── Card 2: Our Vision ─── */}
          <div className="bg-[#eef9f6] border border-[#d2eee5] rounded-[32px] sm:rounded-[36px] p-6 sm:p-9 flex flex-col justify-between shadow-[0_4px_24px_rgba(13,92,86,0.04)] relative overflow-hidden">
            <div>
              {/* Floating Badges & Consultation Mockup */}
              <div className="space-y-3 mb-6">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="px-3.5 py-1.5 rounded-xl bg-white shadow-sm border border-slate-100/90 text-xs font-semibold text-slate-700">
                    08:00 AM
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl bg-white shadow-sm border border-slate-100/90 text-xs font-semibold text-slate-800 flex items-center gap-2">
                    <span className="size-2 rounded-full bg-amber-500" />
                    <span>Occupied</span>
                    <span className="text-slate-400 font-normal">Dr. Michael Chen &bull; Until 12:00 PM</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-4 px-3.5 py-2 rounded-xl bg-white shadow-sm border border-slate-100/90 text-xs font-mono text-slate-600">
                    Rx ID: RX-2026-001
                  </div>

                  {/* Patient Consultation Card */}
                  <div className="sm:col-span-8 bg-white rounded-2xl p-4 shadow-sm border border-slate-100/90 space-y-2.5">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 tracking-tight">Sarah Miller</div>
                      <div className="text-[11px] text-slate-400">Patient: (UHID-2024-1524)</div>
                    </div>
                    <div className="flex items-center gap-2.5 pt-1.5 border-t border-slate-50">
                      <div className="size-7 rounded-full bg-gradient-to-tr from-amber-400 to-rose-400 flex items-center justify-center text-white font-semibold text-xs shrink-0 shadow-sm">
                        SW
                      </div>
                      <div className="leading-tight">
                        <div className="text-xs font-semibold text-slate-800">Dr. Sarah Williams</div>
                        <div className="text-[10px] text-slate-400">Cardiology</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 mt-2">
                Our Vision
              </h2>
            </div>

            <p className="mt-8 text-base sm:text-lg font-medium text-slate-800 leading-snug">
              To empower hospitals with digital solutions that improve efficiency and patient care globally
            </p>
          </div>
        </div>

        {/* Bottom 2-Column Grid: Milestones & Journey */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-6 sm:pt-8">
          
          {/* Left: Visual Timeline Card */}
          <div className="lg:col-span-6 bg-[#eef9f6] border border-[#d2eee5] rounded-[32px] sm:rounded-[36px] p-8 sm:p-12 relative overflow-hidden shadow-[0_4px_24px_rgba(13,92,86,0.04)]">
            <div className="space-y-10 relative">
              
              {/* Timeline Connector Line */}
              <div className="absolute left-3.5 top-5 bottom-5 w-0.5 bg-gradient-to-b from-slate-200 via-teal-500 to-teal-700 pointer-events-none" />

              {/* Step 1: 2023 */}
              <div className="relative flex items-center gap-6 pl-10">
                <div className="absolute left-2.5 size-2.5 rounded-full bg-slate-300 ring-4 ring-[#eef9f6]" />
                <span className="text-3xl sm:text-4xl font-semibold text-slate-300 tracking-tight">2023</span>
              </div>

              {/* Step 2: 2024 */}
              <div className="relative pl-10 space-y-2">
                <div className="absolute left-2 size-3.5 rounded-full bg-slate-900 ring-4 ring-[#eef9f6]" />
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
                  <span className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">2024</span>
                  <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed max-w-sm">
                    Scaled operations to 50+ countries with multi-language &amp; localization support.
                  </p>
                </div>
              </div>

              {/* Step 3: 2025 - Present */}
              <div className="relative pl-10 space-y-2">
                <div className="absolute left-2 size-3.5 rounded-full bg-teal-600 ring-4 ring-[#eef9f6]" />
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
                  <span className="text-3xl sm:text-4xl font-semibold text-teal-800 tracking-tight">2025</span>
                  <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed max-w-sm">
                    Automated WhatsApp booking router, smart EHR, and autonomous clinic intelligence.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Journey Text Details */}
          <div className="lg:col-span-6 lg:pl-6 space-y-6">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200/60 text-slate-700 text-xs font-semibold tracking-wide uppercase">
              Our Journey
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900 leading-[1.15]">
              Milestones That <br className="hidden sm:block" />
              Define Us
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Pulseware is a cloud-based hospital management system that connects every department into one platform, helping hospitals operate faster and more efficiently.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-2xl sm:text-3xl font-semibold text-teal-700">50+</div>
                <div className="text-xs text-slate-500 font-medium mt-1">Countries Supported</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-2xl sm:text-3xl font-semibold text-teal-700">99.9%</div>
                <div className="text-xs text-slate-500 font-medium mt-1">Platform Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: KEY BENEFITS / WHY HOSPITALS CHOOSE PULSEWARE (Exact Meditech Layout) ─── */}
      <section className="py-8 sm:py-12 px-2 sm:px-4 lg:px-6 max-w-[1360px] mx-auto relative z-10">
        <div className="relative overflow-hidden rounded-[32px] sm:rounded-[44px] border-[4px] sm:border-[6px] border-white shadow-[0_12px_40px_rgba(13,92,86,0.06)] bg-gradient-to-b from-[#e8f7f4] via-[#f1faf8] to-[#d8f2eb] p-6 sm:p-10 lg:p-14">
          
          {/* Top Header: Badge + Headline (Left) & Get Started (Right) */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-10 sm:pb-14 border-b border-[#cde8e1]/60">
            <div className="space-y-3">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white text-slate-700 text-xs font-semibold shadow-xs border border-slate-200/70">
                Key Benefits
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900">
                Why Hospitals Choose Pulseware
              </h2>
            </div>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 rounded-full bg-[#0d6157] hover:bg-[#0a4e46] text-white text-sm font-semibold shadow-md transition-all hover:scale-105 active:scale-95 shrink-0 group w-fit"
            >
              <span>Get Started</span>
              <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* 2-Column Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-8 sm:pt-12">
            
            {/* Left Column: Feature Items / Interactive Accordion */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Item 1: Integrated Patient Records */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-white/40 transition-colors cursor-pointer group">
                <div className="size-6 text-slate-800 flex items-center justify-center shrink-0">
                  <FileText className="size-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight">
                  Integrated Patient Records
                </h3>
              </div>

              {/* Item 2: Customizable Workflows (Active/Expanded Card) */}
              <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-2">
                <div className="flex items-center gap-3 text-slate-900">
                  <div className="size-6 text-slate-900 flex items-center justify-center shrink-0">
                    <HeartPulse className="size-5 fill-slate-900 text-slate-900" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight">
                    Customizable Workflows
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal pl-9">
                  Streamline workflows across all departments with one unified platform. Streamline workflows across all departments.
                </p>
              </div>

              {/* Item 3: Inventory & Billing Systems */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-white/40 transition-colors cursor-pointer group">
                <div className="size-6 text-slate-800 flex items-center justify-center shrink-0">
                  <Receipt className="size-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight">
                  Inventory &amp; Billing Systems
                </h3>
              </div>

              {/* Item 4: All Your Needs In One Platform */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-white/40 transition-colors cursor-pointer group">
                <div className="size-6 text-slate-800 flex items-center justify-center shrink-0">
                  <Server className="size-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight">
                  All Your Needs In One Platform
                </h3>
              </div>

              {/* Item 5: Integration Capabilities */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-white/40 transition-colors cursor-pointer group">
                <div className="size-6 text-slate-800 flex items-center justify-center shrink-0">
                  <Zap className="size-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight">
                  Integration Capabilities
                </h3>
              </div>
            </div>

            {/* Right Column: Doctor Visual Showcase with Floating Overlays */}
            <div className="lg:col-span-7">
              <div className="relative rounded-[28px] sm:rounded-[36px] overflow-hidden shadow-lg border-[3px] border-white min-h-[460px] sm:min-h-[520px] bg-slate-100 flex items-center justify-center">
                
                {/* Background Image of Clinician/Doctor in Scrubs at PC */}
                <img
                  src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=1200&q=80"
                  alt="Doctor at computer in modern clinic"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />

                {/* Subtle dark gradient for contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-slate-900/10 pointer-events-none" />

                {/* ─── Floating Overlay Top Left: Payment Methods Card ─── */}
                <div className="absolute top-4 sm:top-6 left-4 sm:left-6 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 shadow-xl border border-slate-100/90 w-[200px] sm:w-[230px] z-10 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                    <span>Payment Methods</span>
                    <span className="text-[10px] text-slate-400 font-normal flex items-center gap-0.5">
                      Month <ChevronDown className="size-2.5" />
                    </span>
                  </div>

                  {/* Bar Chart Mockup */}
                  <div className="h-28 flex items-end justify-between gap-2 pt-4 px-1 relative">
                    
                    {/* Floating cyan 100k tooltip on Insurance bar */}
                    <div className="absolute top-0 right-7 bg-white text-slate-900 shadow-md border border-cyan-200 text-[9px] font-semibold px-1.5 py-0.5 rounded-md flex flex-col items-center">
                      <span className="text-[8px] text-slate-400 font-normal">Insurance</span>
                      <span>100k</span>
                    </div>

                    {/* Bars */}
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <div className="w-full bg-slate-100 rounded-t-md h-14" />
                      <span className="text-[8px] text-slate-400">Cash</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <div className="w-full bg-slate-100 rounded-t-md h-20" />
                      <span className="text-[8px] text-slate-400">Card</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <div className="w-full bg-cyan-400 rounded-t-md h-24 shadow-sm" />
                      <span className="text-[8px] font-semibold text-cyan-700">Insurance</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <div className="w-full bg-slate-100 rounded-t-md h-16" />
                      <span className="text-[8px] text-slate-400">UPI</span>
                    </div>
                  </div>
                </div>

                {/* ─── Floating Overlay Bottom Right: Total Beds Card ─── */}
                <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 shadow-xl border border-slate-100/90 min-w-[150px] sm:min-w-[170px] z-10 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <Activity className="size-3.5 text-teal-600" />
                    <span>Total Beds</span>
                  </div>
                  <div className="text-2xl font-semibold tracking-tight text-slate-900">
                    155
                  </div>
                  <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                    <TrendingUp className="size-3" />
                    <span>+12% vs last week</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER (Pulseware Theme) ─── */}
      <div className="relative w-full px-2 sm:px-4 lg:px-6 pb-3 mt-4">
        <div className="relative w-full overflow-hidden rounded-[24px] sm:rounded-[36px] border-[3px] sm:border-[4px] border-white shadow-[0_8px_30px_rgba(13,92,86,0.08)] bg-gradient-to-b from-[#d8f2ee] via-[#edf9f6] to-[#cdeee8]">

          {/* Vertical Fluted / Slat Texture Overlay */}
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

          {/* Soft Center Glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-white/30 blur-[80px] rounded-full pointer-events-none" />

          <footer className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-12 sm:py-16">

            {/* Top grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-10 pb-10 border-b border-[#0d6157]/15">

              {/* Brand col */}
              <div className="col-span-2 md:col-span-2 space-y-4 pr-6">
                {/* Logo */}
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-gradient-to-tr from-[#0d6157] to-[#0d8276] flex items-center justify-center text-white shadow-md">
                    <HeartPulse className="size-4" />
                  </div>
                  <span className="text-base font-semibold text-[#0d5c56] tracking-tight">
                    Pulse<span className="text-[#0d8276]">ware</span>
                  </span>
                </div>
                <p className="text-[13px] text-[#0d6157]/70 leading-relaxed max-w-[280px]">
                  The complete Healthcare Operating System for modern clinics — AI-powered, WhatsApp-native, and built for scale.
                </p>
                {/* Social / contact chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link href="/contact" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 border border-[#0d8276]/20 text-[11px] font-medium text-[#0d6157] hover:bg-white hover:border-[#0d8276]/50 transition-all shadow-sm">
                    <MessageSquare className="size-3" /> Contact Us
                  </Link>
                  <Link href="/pricing" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 border border-[#0d8276]/20 text-[11px] font-medium text-[#0d6157] hover:bg-white hover:border-[#0d8276]/50 transition-all shadow-sm">
                    <Sparkles className="size-3" /> View Pricing
                  </Link>
                </div>
                <p className="text-[11px] text-[#0d6157]/50 pt-1">© 2026 Pulseware Healthcare OS. All rights reserved.</p>
              </div>

              {/* Product */}
              <div className="space-y-3">
                <h6 className="text-[11px] font-semibold text-[#0d5c56] uppercase tracking-widest">Product</h6>
                <div className="space-y-2.5 flex flex-col">
                  {[
                    { label: 'Features', href: '/features' },
                    { label: 'Pricing', href: '/pricing' },
                    { label: 'Pulse Now', href: '/pricing' },
                    { label: 'Pulse HealthOS', href: '/pricing' },
                    { label: 'Pulse Speak', href: '/pricing' },
                  ].map((l) => (
                    <Link key={l.label} href={l.href} className="text-[12px] text-[#0d6157]/65 hover:text-[#0d6157] transition-colors font-normal">
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Company */}
              <div className="space-y-3">
                <h6 className="text-[11px] font-semibold text-[#0d5c56] uppercase tracking-widest">Company</h6>
                <div className="space-y-2.5 flex flex-col">
                  {[
                    { label: 'About Us', href: '/about' },
                    { label: 'Contact', href: '/contact' },
                    { label: 'Clinic Login', href: '/login' },
                  ].map((l) => (
                    <Link key={l.label} href={l.href} className="text-[12px] text-[#0d6157]/65 hover:text-[#0d6157] transition-colors font-normal">
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Legal */}
              <div className="space-y-3">
                <h6 className="text-[11px] font-semibold text-[#0d5c56] uppercase tracking-widest">Legal</h6>
                <div className="space-y-2.5 flex flex-col">
                  {[
                    { label: 'Privacy Policy', href: '#' },
                    { label: 'Terms of Service', href: '#' },
                    { label: 'Security', href: '#' },
                  ].map((l) => (
                    <Link key={l.label} href={l.href} className="text-[12px] text-[#0d6157]/65 hover:text-[#0d6157] transition-colors font-normal">
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom strip */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-[11px] text-[#0d6157]/50">Built with ♥ for healthcare professionals everywhere.</p>
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] text-[#0d6157]/50">All systems operational</span>
              </div>
            </div>

          </footer>
        </div>
      </div>
    </div>
  );
}
