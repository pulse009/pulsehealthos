import React from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  FileText,
  Globe2,
  HeartPulse,
  Lock,
  MessageSquare,
  Package,
  Receipt,
  Server,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingUp,
  UserCheck,
  Zap,
} from 'lucide-react';

export const metadata = {
  title: 'Features · PULSEware',
  description: 'Explore the complete clinical capabilities of Pulseware: WhatsApp AI Fast Router, EHR, Doctor Rostering, Pharmacy, and Billing.',
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen w-full bg-white text-slate-900 font-sans antialiased selection:bg-teal-600 selection:text-white relative overflow-x-hidden">
      
      {/* ─── HERO CARD (Meditech Theme) ─── */}
      <div className="relative w-full px-2 sm:px-4 lg:px-6 pt-2 sm:pt-3 pb-8 sm:pb-12">
        <div className="relative w-full overflow-hidden rounded-[28px] sm:rounded-[40px] border-[3px] sm:border-[5px] border-white shadow-[0_12px_40px_rgba(13,92,86,0.08)] bg-gradient-to-b from-[#d8f2ee] via-[#edf9f6] to-[#cdeee8] pb-14 sm:pb-20">
          
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
                <Link href="/features" className="flex items-center gap-1.5 text-[#0d8276] hover:text-[#0a5c53] font-semibold transition-colors">
                  <span className="size-1.5 rounded-full bg-[#0d8276]" />
                  <span>Features</span>
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

          {/* ─── Header Copy ─── */}
          <div className="relative z-10 px-5 sm:px-10 pt-12 sm:pt-16 pb-6 text-center max-w-4xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/80 border border-teal-800/10 text-[#0d6157] text-xs font-semibold tracking-wider uppercase mb-4 shadow-xs">
              Platform Features
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-semibold tracking-tight leading-[1.12]">
              <span className="block text-[#0d5c56]">Every Clinical Operation,</span>
              <span className="block text-slate-900 mt-1">Unified into One Intelligent OS</span>
            </h1>

            <p className="mt-5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              From sub-50ms WhatsApp AI patient bookings to pharmacy stock tracking, doctor commission engines, and multi-tenant clinic security — Pulseware handles everything your hospital needs.
            </p>
          </div>
        </div>
      </div>

      {/* ─── 6 CORE PILLARS GRID ─── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
            Built for High-Growth Healthcare Providers
          </h2>
          <p className="text-sm text-slate-500 mt-3 font-normal leading-relaxed">
            Eliminate fragmented software tools. Pulseware consolidates your front-desk, doctors, pharmacy, and finance into a single synchronized workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[
            {
              icon: <MessageSquare className="size-6 text-teal-700" />,
              badge: 'AI Routing',
              title: 'WhatsApp Fast Router Engine',
              desc: 'Near-instant sub-50ms response times for patient booking, bilingual Arabic/English detection, 3-button pagination, and seamless human receptionist handover.',
            },
            {
              icon: <Stethoscope className="size-6 text-blue-700" />,
              badge: 'Clinical Care',
              title: 'Doctor Roster & Availability',
              desc: 'Granular schedule controls, appointment slot duration, buffer times between patients, recurring breaks, and automated multi-day leave handling.',
            },
            {
              icon: <FileText className="size-6 text-cyan-700" />,
              badge: 'EHR & Records',
              title: 'Electronic Medical Records',
              desc: 'Automated unique Patient ID (PID) files, digital SOAP notes, medical history, attached diagnostic files, and patient portal access credentials.',
            },
            {
              icon: <Package className="size-6 text-indigo-700" />,
              badge: 'Pharmacy',
              title: 'Smart Pharmacy & Inventory',
              desc: 'Track batch stock levels, expiry dates, supplier purchase orders, and automatic inventory deductions upon appointment service completion.',
            },
            {
              icon: <CreditCard className="size-6 text-amber-700" />,
              badge: 'Finance & Payroll',
              title: 'Doctor Payouts & Commissions',
              desc: 'Automated salary calculations, revenue incentive percentages, procedure commission rules, and monthly payroll export for all clinical staff.',
            },
            {
              icon: <ShieldCheck className="size-6 text-rose-700" />,
              badge: 'Security',
              title: 'Enterprise Tenant Isolation',
              desc: 'Strict multi-tenant security architecture ensures zero cross-clinic data leaks, encrypted WhatsApp tokens, and full HIPAA/GDPR audit trails.',
            },
          ].map((f) => (
            <div key={f.title} className="p-7 rounded-[28px] bg-slate-50/70 border border-slate-200/80 space-y-4 hover:border-teal-400 hover:bg-white hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div className="size-12 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-center">
                  {f.icon}
                </div>
                <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200/60">
                  {f.badge}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── VISUAL SHOWCASE (Meditech Card) ─── */}
      <section className="py-8 sm:py-12 px-2 sm:px-4 lg:px-6 max-w-[1360px] mx-auto relative z-10">
        <div className="relative overflow-hidden rounded-[32px] sm:rounded-[44px] border-[4px] sm:border-[6px] border-white shadow-[0_12px_40px_rgba(13,92,86,0.06)] bg-gradient-to-b from-[#e8f7f4] via-[#f1faf8] to-[#d8f2eb] p-6 sm:p-10 lg:p-14">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-10 border-b border-[#cde8e1]/60">
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-8 sm:pt-12">
            
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-white/40 transition-colors cursor-pointer group">
                <div className="size-6 text-slate-800 flex items-center justify-center shrink-0">
                  <FileText className="size-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight">
                  Integrated Patient Records
                </h3>
              </div>

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
                  Streamline workflows across all departments with one unified platform. Real-time sync between reception, doctors, and pharmacy.
                </p>
              </div>

              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-white/40 transition-colors cursor-pointer group">
                <div className="size-6 text-slate-800 flex items-center justify-center shrink-0">
                  <Receipt className="size-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight">
                  Inventory &amp; Billing Systems
                </h3>
              </div>

              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-white/40 transition-colors cursor-pointer group">
                <div className="size-6 text-slate-800 flex items-center justify-center shrink-0">
                  <Server className="size-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight">
                  All Your Needs In One Platform
                </h3>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="relative rounded-[28px] sm:rounded-[36px] overflow-hidden shadow-lg border-[3px] border-white min-h-[460px] sm:min-h-[520px] bg-slate-100 flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=1200&q=80"
                  alt="Doctor at computer in modern clinic"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-slate-900/10 pointer-events-none" />

                <div className="absolute top-4 sm:top-6 left-4 sm:left-6 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 shadow-xl border border-slate-100/90 w-[200px] sm:w-[230px] z-10 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                    <span>Payment Methods</span>
                    <span className="text-[10px] text-slate-400 font-normal flex items-center gap-0.5">
                      Month <ChevronDown className="size-2.5" />
                    </span>
                  </div>

                  <div className="h-28 flex items-end justify-between gap-2 pt-4 px-1 relative">
                    <div className="absolute top-0 right-7 bg-white text-slate-900 shadow-md border border-cyan-200 text-[9px] font-semibold px-1.5 py-0.5 rounded-md flex flex-col items-center">
                      <span className="text-[8px] text-slate-400 font-normal">Insurance</span>
                      <span>100k</span>
                    </div>

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

      {/* ─── FINAL CTA ─── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative z-10">
        <div className="rounded-[32px] sm:rounded-[40px] bg-gradient-to-b from-[#0b544b] to-[#073832] text-white p-10 sm:p-16 space-y-6 shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            See Pulseware in Action with Your Clinic Data
          </h2>
          <p className="text-sm sm:text-base text-teal-100/90 max-w-xl mx-auto font-normal">
            Book a 20-minute tailored walkthrough with our clinical systems team and see how your operations can be automated.
          </p>
          <div className="pt-2 flex justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-[#0b544b] text-sm font-semibold shadow-md hover:bg-slate-100 transition-all hover:scale-105 active:scale-95"
            >
              <span>Request a Live Demo</span>
              <ArrowRight className="size-4" />
            </Link>
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
