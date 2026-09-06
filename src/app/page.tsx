import React from 'react';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth/session';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bell,
  Bot,
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
  UserPlus,
  Users,
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
      {/* Structural Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* ─── FIXED TOP NAVBAR ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[56px] flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="size-6 rounded-md bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 p-0.5 shadow-xs group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-white rounded-[4px] flex items-center justify-center">
                <HeartPulse className="size-3.5 text-purple-600 stroke-[2]" />
              </div>
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-900">
              PULSE<span className="text-purple-600">ware</span>
            </span>
          </Link>

          {/* Center Nav */}
          <nav className="hidden md:flex items-center gap-6 text-[13px] font-normal text-slate-600">
            <Link href="/platform" className="hover:text-purple-600 transition-colors">Platform</Link>
            <Link href="/solutions" className="flex items-center gap-1 hover:text-purple-600 transition-colors">
              <span>Solutions</span>
              <ChevronDown className="size-3 mt-0.5" />
            </Link>
            <Link href="/customers" className="hover:text-purple-600 transition-colors">Customers</Link>
            <Link href="/faq" className="hover:text-purple-600 transition-colors">FAQ</Link>
          </nav>

          {/* Right Buttons */}
          <div className="flex items-center gap-2">
            {user ? (
              <Link
                href={portalHref}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-[8px] bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium shadow-xs transition-all hover:scale-105 active:scale-95"
              >
                <span>Go to Portal</span>
                <ArrowRight className="size-3" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-2.5 py-1 text-xs font-normal text-slate-700 hover:text-purple-600 transition-colors rounded-[8px] bg-slate-100/80 hover:bg-slate-200/80"
                >
                  Log In
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-[8px] bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium shadow-xs transition-all hover:scale-105 active:scale-95"
                >
                  <span>Request Demo</span>
                  <ArrowRight className="size-3" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="relative pt-[72px] pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-slate-200/80 bg-white/70 backdrop-blur-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

          {/* LEFT: Hero Text */}
          <div className="lg:col-span-5 space-y-5 text-left pr-0 lg:pr-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-[8px] bg-cyan-50 border border-cyan-200/80 text-cyan-800 text-xs font-medium tracking-wider uppercase">
              Solutions for Private Clinics
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-normal tracking-tight text-slate-950 leading-[1.14]">
              Designed for modern{' '}
              <span className="block text-slate-950">private clinics</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-md">
              Manage appointments, patients, and daily operations in one simple, reliable system built for healthcare.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href={portalHref}
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-[8px] bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium shadow-md shadow-purple-500/20 transition-all hover:scale-105 active:scale-95"
              >
                Request Demo
              </Link>
              <a
                href="#editions"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-[8px] bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-normal transition-all"
              >
                See How It Works
              </a>
            </div>
          </div>

          {/* RIGHT: Dashboard Mockup */}
          <div className="lg:col-span-7 flex flex-col items-end">
            <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-4 sm:p-5 space-y-4 font-sans text-slate-900 relative">

              {/* Dashboard Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs shadow-xs">
                    <Sparkles className="size-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900">Dashboard Overview</h4>
                    <p className="text-[10px] text-slate-400 font-normal">Real-time hospital metrics and activity</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-normal text-slate-500">
                  <span className="hidden sm:inline">Wednesday, January 28, 2026</span>
                  <div className="relative cursor-pointer p-1">
                    <Bell className="size-3.5 text-slate-500" />
                    <span className="size-1.5 rounded-full bg-rose-500 absolute top-1 right-1 ring-2 ring-white" />
                  </div>
                  <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200">
                    <div className="size-6 rounded-full bg-purple-100 text-purple-700 font-semibold text-[10px] flex items-center justify-center">MA</div>
                    <div className="hidden sm:block text-left">
                      <span className="block text-[10px] font-medium text-slate-800 leading-tight">Medical Admin</span>
                      <span className="block text-[9px] text-slate-400 leading-tight">Administrator</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <Users className="size-3.5 text-purple-600" />
                    <span className="text-[9px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">+12%</span>
                  </div>
                  <span className="block text-[10px] text-slate-500 font-normal">Today's Patients</span>
                  <span className="block text-lg font-semibold text-slate-900 leading-tight">247</span>
                </div>
                <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <UserPlus className="size-3.5 text-indigo-600" />
                    <span className="text-[9px] font-normal text-slate-400">5 today</span>
                  </div>
                  <span className="block text-[10px] text-slate-500 font-normal">New Admissions</span>
                  <span className="block text-lg font-semibold text-slate-900 leading-tight">18</span>
                </div>
                <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <AlertCircle className="size-3.5 text-rose-500" />
                    <span className="text-[9px] font-normal text-slate-400">stable</span>
                  </div>
                  <span className="block text-[10px] text-slate-500 font-normal">Critical Cases</span>
                  <span className="block text-lg font-semibold text-slate-900 leading-tight">5</span>
                </div>
                <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-xl p-3 shadow-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <CreditCard className="size-3.5 text-purple-200" />
                    <span className="text-[9px] font-medium text-white/90 bg-white/20 px-1.5 py-0.5 rounded-md">+15%</span>
                  </div>
                  <span className="block text-[10px] text-purple-200 font-normal">Today's Revenue</span>
                  <span className="block text-lg font-semibold text-white leading-tight">$18.5K</span>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                <div className="sm:col-span-8 bg-slate-50/70 rounded-xl p-3.5 border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-semibold text-slate-900">Patient Flow</h5>
                      <p className="text-[9px] text-slate-400 font-normal">Admissions vs Discharges this week</p>
                    </div>
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[9px] font-normal">
                      <span className="px-2 py-0.5 rounded-md bg-purple-600 text-white font-medium">This Week</span>
                      <span className="px-2 py-0.5 text-slate-600">Revenue</span>
                    </div>
                  </div>
                  <div className="h-28 w-full flex items-end justify-between gap-1 pt-2 pb-1 px-1">
                    {[
                      { day: 'Mon', adm: 28, dis: 18 },
                      { day: 'Tue', adm: 32, dis: 24 },
                      { day: 'Wed', adm: 35, dis: 20 },
                      { day: 'Thu', adm: 30, dis: 26 },
                      { day: 'Fri', adm: 36, dis: 28 },
                      { day: 'Sat', adm: 22, dis: 15 },
                      { day: 'Sun', adm: 18, dis: 12 },
                    ].map((item, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <div className="w-full flex items-end justify-center gap-1 h-20">
                          <div style={{ height: `${(item.adm / 36) * 100}%` }} className="w-2.5 sm:w-3 bg-purple-600 rounded-t-sm" />
                          <div style={{ height: `${(item.dis / 36) * 100}%` }} className="w-2.5 sm:w-3 bg-indigo-300 rounded-t-sm" />
                        </div>
                        <span className="text-[8px] font-normal text-slate-400">{item.day}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-[9px] font-normal text-slate-500 pt-1 border-t border-slate-200/60">
                    <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-purple-600" /><span>Admissions</span></span>
                    <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-indigo-300" /><span>Discharges</span></span>
                  </div>
                </div>
                <div className="sm:col-span-4 bg-slate-50/70 rounded-xl p-3.5 border border-slate-100 flex flex-col justify-between space-y-2">
                  <div>
                    <h5 className="text-xs font-semibold text-slate-900">Bed Occupancy</h5>
                    <p className="text-[9px] text-slate-400 font-normal">Current capacity status</p>
                  </div>
                  <div className="relative size-20 mx-auto flex items-center justify-center">
                    <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                      <path className="text-slate-200" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-purple-600" strokeDasharray="78, 100" strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div className="absolute text-center"><span className="text-xs font-semibold text-slate-900">78%</span></div>
                  </div>
                  <div className="space-y-1 text-[9px] font-normal">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-purple-600" /><span>Occupied</span></span>
                      <span className="font-medium text-slate-900">142</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-slate-300" /><span>Available</span></span>
                      <span className="font-medium text-slate-900">38</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dept Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {[
                  { label: 'Cardiology', cur: 28, max: 35, pct: '80%', color: 'bg-purple-600' },
                  { label: 'Emergency', cur: 42, max: 45, pct: '93%', color: 'bg-indigo-600' },
                  { label: 'Surgery', cur: 35, max: 40, pct: '87%', color: 'bg-purple-600' },
                ].map((d) => (
                  <div key={d.label} className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-normal text-slate-800">{d.label}</span>
                      <span className="text-purple-600 font-medium text-[9px]">{d.cur} / {d.max}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`${d.color} h-full rounded-full`} style={{ width: d.pct }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Strip */}
            <div className="flex items-center gap-3 pt-4 pr-2">
              <div className="flex -space-x-2 overflow-hidden">
                {[
                  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1594824813583-a7b219cf1f64?w=120&auto=format&fit=crop&q=80',
                ].map((src, i) => (
                  <img key={i} className="inline-block size-7 rounded-full ring-2 ring-white object-cover" src={src} alt="Doctor" />
                ))}
              </div>
              <span className="text-xs font-normal text-slate-700">Trusted by 2,000+ clinicians worldwide</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF LOGOS ─── */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-slate-200/80 bg-slate-50/60 relative z-10">
        <p className="text-center text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-8">
          Trusted by leading clinics &amp; hospitals across the region
        </p>
        <div className="flex flex-wrap items-center justify-center gap-10 opacity-50 grayscale">
          {['Reveal Clinics', 'MedCore Group', 'AlShifa Hospital', 'PrimeCare Centers', 'HealthBridge', 'NovaMed'].map((name) => (
            <span key={name} className="text-sm font-bold text-slate-700 tracking-tight whitespace-nowrap">{name}</span>
          ))}
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-slate-200/80 bg-white relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-[8px] bg-purple-50 border border-purple-200/80 text-purple-700 text-xs font-medium tracking-wider uppercase mb-4">
            Built for Modern Healthcare
          </div>
          <h2 className="text-3xl sm:text-4xl font-normal tracking-tight text-slate-900">
            Every clinical operation in one unified workspace
          </h2>
          <p className="text-sm text-slate-500 mt-3 font-normal leading-relaxed">
            From AI-powered WhatsApp bookings to pharmacy inventory and doctor payouts — PULSEware handles it all.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <MessageSquare className="size-5" />,
              color: 'bg-purple-100 text-purple-700',
              title: 'AI WhatsApp Fast Router',
              desc: 'Instant sub-50ms responses for patient bookings, language detection (Arabic & English), 3-button pagination, and seamless human staff handoff.',
            },
            {
              icon: <Stethoscope className="size-5" />,
              color: 'bg-blue-100 text-blue-700',
              title: 'Doctor Roster & Availability',
              desc: 'Granular schedule controls, appointment slot duration, buffer times between patients, recurring breaks, and automated multi-day leave handling.',
            },
            {
              icon: <Package className="size-5" />,
              color: 'bg-indigo-100 text-indigo-700',
              title: 'Smart Pharmacy & Inventory',
              desc: 'Track stock levels, expiry dates, supplier purchase orders, and automatic deductions upon appointment service completion.',
            },
            {
              icon: <CreditCard className="size-5" />,
              color: 'bg-amber-100 text-amber-700',
              title: 'Doctor Payouts & Compensation',
              desc: 'Automated salary calculations, revenue incentive percentages, procedure commission rules, and monthly payroll export for all clinical staff.',
            },
            {
              icon: <Receipt className="size-5" />,
              color: 'bg-teal-100 text-teal-700',
              title: 'Clinic Accounting & Invoicing',
              desc: 'Tax-compliant invoices, patient payment collection, supplier expense tracking, and one-click day-end financial closings.',
            },
            {
              icon: <ShieldCheck className="size-5" />,
              color: 'bg-rose-100 text-rose-700',
              title: 'Enterprise Tenant Isolation',
              desc: 'Strict multi-tenant security architecture ensures zero cross-clinic data leaks, encrypted WhatsApp tokens, and full audit trails.',
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl bg-slate-50/70 border border-slate-200 p-6 space-y-4 hover:border-purple-300 hover:shadow-md transition-all">
              <div className={`size-10 rounded-xl ${f.color} flex items-center justify-center`}>{f.icon}</div>
              <h4 className="text-base font-semibold text-slate-900">{f.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-slate-200/80 bg-slate-50/40 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-[8px] bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-medium tracking-wider uppercase mb-4">
            Simple Onboarding
          </div>
          <h2 className="text-3xl sm:text-4xl font-normal tracking-tight text-slate-900">
            Up and running in 3 simple steps
          </h2>
          <p className="text-sm text-slate-500 mt-3 font-normal">
            No lengthy setup. No IT team required. Your clinic can go live within 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              step: '01',
              icon: <UserCheck className="size-6 text-purple-600" />,
              title: 'Configure Your Clinic',
              desc: 'Add your doctors, departments, working hours, and services. PULSEware auto-generates your booking flow.',
            },
            {
              step: '02',
              icon: <MessageSquare className="size-6 text-purple-600" />,
              title: 'Connect WhatsApp Channel',
              desc: 'Plug in your WhatsApp Business number. Our AI bot goes live instantly with full language support.',
            },
            {
              step: '03',
              icon: <TrendingUp className="size-6 text-purple-600" />,
              title: 'Grow & Automate',
              desc: 'Watch bookings, revenue, and patient satisfaction climb — all automated, all in real-time.',
            },
          ].map((s, i) => (
            <div key={s.step} className="relative flex flex-col items-center text-center group">
              {/* Connector line */}
              {i < 2 && (
                <div className="hidden md:block absolute top-10 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-slate-200 z-0" />
              )}
              <div className="relative z-10 size-20 rounded-2xl bg-white border-2 border-purple-100 flex items-center justify-center mb-5 group-hover:border-purple-400 transition-all shadow-sm">
                {s.icon}
                <span className="absolute -top-2.5 -right-2.5 size-5 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
              </div>
              <h4 className="text-base font-semibold text-slate-900 mb-2">{s.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PRODUCT EDITIONS (Solutions) ─── */}
      <section id="editions" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-slate-200/80 bg-white relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-[8px] bg-cyan-50 border border-cyan-200/80 text-cyan-700 text-xs font-medium tracking-wider uppercase mb-4">
            Tailored Product Editions
          </div>
          <h2 className="text-3xl sm:text-4xl font-normal tracking-tight text-slate-900">
            Choose the edition that fits your clinic
          </h2>
          <p className="text-sm text-slate-500 mt-3 font-normal leading-relaxed">
            Whether you need a lean automated booking engine or a full-scale hospital OS, PULSEware delivers.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Pulse Now */}
          <div className="rounded-3xl bg-white border border-slate-200 p-8 flex flex-col justify-between relative shadow-lg hover:border-purple-300 transition-all duration-300">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="size-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
                  <Zap className="size-6 stroke-[2.5]" />
                </div>
                <span className="px-3 py-1 rounded-[8px] bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-semibold uppercase tracking-wider">Express Edition</span>
              </div>
              <h4 className="text-2xl font-semibold text-slate-900 mb-2">Pulse Now</h4>
              <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                Lightweight, frictionless AI WhatsApp booking engine designed for rapid deployment and high conversion without administrative bloat.
              </p>
              <div className="space-y-3 pt-4 border-t border-slate-100 mb-8">
                {[
                  '24/7 WhatsApp AI Booking Assistant (Arabic & English)',
                  'Instant 0.05s Slot Engine with live availability',
                  'Self-service WhatsApp Rescheduling & Cancellation',
                  'Multi-Doctor Working Hours, Breaks & Time-Off management',
                  'Automated WhatsApp Reminder notifications (2h prior)',
                ].map((f) => (
                  <div key={f} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="size-4 text-cyan-600 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <Link href={portalHref} className="w-full py-3.5 rounded-[8px] bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold text-center transition-colors shadow-md block">
              Get Started with Pulse Now
            </Link>
          </div>

          {/* Pulse Health OS */}
          <div className="rounded-3xl bg-white border-2 border-purple-600 p-8 flex flex-col justify-between relative shadow-xl shadow-purple-500/10 hover:border-purple-700 transition-all duration-300">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-purple-600 text-white font-semibold text-[10px] uppercase tracking-widest shadow-md">
              Complete Clinic Enterprise OS
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="size-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                  <HeartPulse className="size-6 stroke-[2.5]" />
                </div>
                <span className="px-3 py-1 rounded-[8px] bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold uppercase tracking-wider">Full Operating System</span>
              </div>
              <h4 className="text-2xl font-semibold text-slate-900 mb-2">Pulse Health OS</h4>
              <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                The comprehensive clinic OS for visionaries. Powers full medical records, automated doctor compensation, pharmacy inventory, and accounting.
              </p>
              <div className="space-y-3 pt-4 border-t border-slate-100 mb-8">
                {[
                  'Everything included in Pulse Now +',
                  'Patient Portal with auto-generated login credentials',
                  'Doctor Payment Structures (Salary, % Revenue & Procedure Fees)',
                  'Full Pharmacy Inventory (Batches, Expiries & Purchase Orders)',
                  'Complete Accounting Suite (Invoicing, Supplier Bills & Day-End Reconciliation)',
                  'Clinic Staff & Coordinator Role-Based Permissions (RBAC)',
                ].map((f, i) => (
                  <div key={f} className={`flex items-start gap-2.5 text-xs ${i === 0 ? 'font-semibold text-purple-700' : 'text-slate-700'}`}>
                    <CheckCircle2 className={`size-4 shrink-0 mt-0.5 ${i === 0 ? 'text-purple-600' : 'text-purple-600'}`} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <Link href={portalHref} className="w-full py-3.5 rounded-[8px] bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold text-center shadow-lg shadow-purple-500/25 transition-all block">
              Deploy Pulse Health OS
            </Link>
          </div>
        </div>
      </section>


      {/* ─── KEY METRICS / SOCIAL PROOF ─── */}

      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-slate-200/80 bg-white relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { metric: '2,000+', label: 'Clinicians on Platform' },
            { metric: '1.2M+', label: 'Appointments Booked' },
            { metric: '99.9%', label: 'Uptime SLA' },
            { metric: '<50ms', label: 'Average Response Time' },
          ].map((s) => (
            <div key={s.label} className="space-y-1">
              <div className="text-3xl sm:text-4xl font-normal text-purple-600">{s.metric}</div>
              <div className="text-xs text-slate-500 font-normal">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── WHATSAPP DEMO SECTION ─── */}
      <section id="whatsapp" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-slate-200/80 bg-slate-50/30 relative z-10">
        <div className="rounded-3xl bg-slate-950 text-white border border-slate-800 p-8 sm:p-12 overflow-hidden relative shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left */}
            <div className="lg:col-span-6 space-y-5 text-left">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-[8px] bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold">
                <Bot className="size-3.5" />
                <span>Zero Latency Fast Router</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-normal text-white tracking-tight">
                WhatsApp Patient Experience Reimagined
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Patients book in seconds directly on WhatsApp. The bot handles language preferences, checks medical files, offers doctor choices, and books confirmed slots with zero human delay.
              </p>
              <div className="space-y-2.5 pt-2">
                {[
                  'Instant language selection prompt (English & Arabic)',
                  'Dynamic 3-button pagination complying with WhatsApp Cloud API',
                  'Instant cancel & reschedule options post-booking',
                ].map((b) => (
                  <div key={b} className="flex items-center gap-2 text-xs font-medium text-slate-200">
                    <div className="size-2 rounded-full bg-purple-400 shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: WhatsApp Mockup */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl space-y-3 font-sans">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-800 px-1">
                  <div className="size-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xs">PW</div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Reveal Clinics • PULSEware</h5>
                    <p className="text-[10px] text-emerald-400 font-medium">● Online • Instant Replies</p>
                  </div>
                </div>
                <div className="bg-slate-950 rounded-2xl rounded-tl-sm p-3 text-[11px] text-slate-200 space-y-2 border border-slate-800/80">
                  <p className="font-medium">Welcome to Reveal Clinics! 👋<br />Please select your preferred language:</p>
                  <div className="flex gap-1.5 pt-1">
                    <span className="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-bold text-[10px]">🇬🇧 English</span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-bold text-[10px]">🇸🇦 العربية</span>
                  </div>
                </div>
                <div className="bg-slate-950 rounded-2xl rounded-tl-sm p-3 text-[11px] text-slate-200 space-y-1.5 border border-slate-800/80">
                  <p className="font-bold text-purple-400">🎉 Appointment Confirmed! (PID-0001)</p>
                  <p className="text-[10px] text-slate-300">
                    • <b>Doctor:</b> Dr. Saud Al-Obaida<br />
                    • <b>Service:</b> Dermatology Consultation<br />
                    • <b>When:</b> Tomorrow at 10:00 AM
                  </p>
                  <div className="flex gap-1.5 pt-1">
                    <span className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 font-bold text-[9px]">🔄 Reschedule</span>
                    <span className="px-2 py-1 rounded-lg bg-rose-950/60 text-rose-300 border border-rose-800/60 font-bold text-[9px]">❌ Cancel</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS / REVIEWS ─── */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-slate-200/80 bg-white relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-[8px] bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-medium tracking-wider uppercase mb-4">
            Customer Stories
          </div>
          <h2 className="text-3xl sm:text-4xl font-normal tracking-tight text-slate-900">
            Loved by clinicians worldwide
          </h2>
          <p className="text-sm text-slate-500 mt-3 font-normal">
            Hear from the doctors and clinic managers who rely on PULSEware every day.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: 'Dr. Saud Al-Obaida',
              role: 'Medical Director, Reveal Clinics',
              avatar: 'SO',
              color: 'bg-purple-100 text-purple-700',
              stars: 5,
              quote: 'PULSEware transformed how we manage patient flow. Our WhatsApp booking volume went from 40 to 200+ daily appointments within the first month. The AI bot just works.',
            },
            {
              name: 'Dr. Layla Hassan',
              role: 'Chief of Operations, AlShifa Hospital',
              avatar: 'LH',
              color: 'bg-indigo-100 text-indigo-700',
              stars: 5,
              quote: 'The doctor compensation module alone saved us 15 hours every month on payroll. Revenue splits, procedure commissions — all automated. Absolutely game-changing.',
            },
            {
              name: 'Ahmed Al-Rashidi',
              role: 'Clinic Manager, MedCore Group',
              avatar: 'AR',
              color: 'bg-cyan-100 text-cyan-700',
              stars: 5,
              quote: 'We tried three other clinic systems before PULSEware. None matched the speed and reliability. Sub-50ms booking responses is not a marketing claim — we measured it ourselves.',
            },
            {
              name: 'Dr. Nora Khalil',
              role: 'Dermatologist, PrimeCare Centers',
              avatar: 'NK',
              color: 'bg-rose-100 text-rose-700',
              stars: 5,
              quote: 'Patients love the WhatsApp experience. They can book, reschedule and cancel without calling us. My reception staff can now focus on in-clinic care, not phone calls.',
            },
            {
              name: 'Omar Al-Farsi',
              role: 'Finance Director, HealthBridge',
              avatar: 'OF',
              color: 'bg-teal-100 text-teal-700',
              stars: 5,
              quote: 'The accounting module gives us real-time P&L visibility. Day-end reconciliation that used to take 3 hours now takes under 5 minutes. The ROI was instant.',
            },
            {
              name: 'Dr. Yasmine Saleh',
              role: 'General Practitioner, NovaMed',
              avatar: 'YS',
              color: 'bg-amber-100 text-amber-700',
              stars: 5,
              quote: 'Setup took less than a day. The onboarding team walked us through everything and our clinic was live on WhatsApp the same evening. Exceptional product and support.',
            },
          ].map((t) => (
            <div key={t.name} className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4 hover:shadow-md hover:border-purple-200 transition-all">
              {/* Stars */}
              <div className="flex items-center gap-0.5">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              {/* Quote */}
              <p className="text-xs text-slate-600 leading-relaxed italic">"{t.quote}"</p>
              {/* Author */}
              <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
                <div className={`size-8 rounded-full ${t.color} flex items-center justify-center text-xs font-bold shrink-0`}>{t.avatar}</div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">{t.name}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── INTEGRATIONS ─── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-slate-200/80 bg-slate-50/40 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-[8px] bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium tracking-wider uppercase mb-4">
            Integrations
          </div>
          <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-slate-900">
            Connects to the tools you already use
          </h2>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {[
            { name: 'WhatsApp Business', color: 'bg-green-50 border-green-200 text-green-800' },
            { name: 'Stripe Payments', color: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
            { name: 'Google Calendar', color: 'bg-blue-50 border-blue-200 text-blue-800' },
            { name: 'Twilio SMS', color: 'bg-red-50 border-red-200 text-red-800' },
            { name: 'Neon Database', color: 'bg-teal-50 border-teal-200 text-teal-800' },
            { name: 'REST API & Webhooks', color: 'bg-purple-50 border-purple-200 text-purple-800' },
          ].map((intg) => (
            <div key={intg.name} className={`px-4 py-2 rounded-[8px] border ${intg.color} text-xs font-medium`}>
              {intg.name}
            </div>
          ))}
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-slate-200/80 bg-white relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-[8px] bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium tracking-wider uppercase mb-4">
            Frequently Asked Questions
          </div>
          <h2 className="text-3xl sm:text-4xl font-normal tracking-tight text-slate-900">
            Everything you need to know
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {[
            {
              q: 'How long does it take to set up PULSEware?',
              a: 'Most clinics are fully live within 24 hours. Our onboarding team handles everything — WhatsApp connection, doctor setup, and services configuration — so you can focus on patient care.',
            },
            {
              q: 'Does the AI bot support Arabic?',
              a: 'Yes. The WhatsApp AI bot supports both English and Arabic natively. Patients are prompted to choose their language at the start of every conversation, and the entire booking flow continues in their selected language.',
            },
            {
              q: 'Is my clinic data secure and isolated?',
              a: 'Absolutely. PULSEware uses strict multi-tenant architecture with full database-level isolation between clinics. Your patient data is never shared with or accessible by other clinics on the platform.',
            },
            {
              q: 'Can I manage multiple branches from one account?',
              a: 'Yes. Our Enterprise plan supports unlimited branches and clinic locations under one unified dashboard, with individual branch-level reporting, staff permissions, and financial tracking.',
            },
            {
              q: 'What happens after the 14-day free trial?',
              a: 'After your trial, you simply choose the plan that fits your clinic and enter your payment details. No automatic charges during the trial — we require your explicit confirmation before billing.',
            },
            {
              q: 'Do you offer dedicated support?',
              a: 'Growth and Enterprise plans include 24/7 priority support via WhatsApp and email. Starter plans include email support with a 24-hour response time. Enterprise clients also get a dedicated account manager.',
            },
          ].map((item, i) => (
            <details key={i} className="group rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden">
              <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none text-sm font-medium text-slate-900 hover:text-purple-600 transition-colors">
                <span>{item.q}</span>
                <ChevronRight className="size-4 text-slate-400 group-open:rotate-90 transition-transform duration-200 shrink-0 ml-4" />
              </summary>
              <div className="px-6 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-200 pt-3">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-slate-200/80 bg-white relative z-10 text-center">
        <div className="rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-950 border border-purple-500/30 p-10 sm:p-16 space-y-6 text-white shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-[8px] bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium tracking-wider uppercase">
            Start Your Free Trial Today
          </div>
          <h2 className="text-3xl sm:text-5xl font-normal tracking-tight max-w-2xl mx-auto">
            Ready to upgrade your clinic to{' '}
            <span className="text-purple-400">PULSEware?</span>
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto font-normal">
            Join visionary medical clinics automating their bookings, rosters, inventory, and accounts with PULSEware. Free 14-day trial. No credit card required.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href={portalHref}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-[8px] bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium shadow-xl shadow-purple-500/30 transition-all hover:scale-105 active:scale-95"
            >
              <span>Request Demo</span>
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-[8px] bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-normal transition-all"
            >
              View Pricing
            </a>
          </div>
          {/* Mini trust strip */}
          <p className="text-[11px] text-slate-400 pt-2">
            ✓ 14-day free trial &nbsp;·&nbsp; ✓ No credit card required &nbsp;·&nbsp; ✓ Cancel anytime
          </p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="w-full pt-14 pb-8 border-t border-slate-200 bg-white text-slate-500 text-xs z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top footer grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-10 border-b border-slate-100">
            {/* Brand col */}
            <div className="col-span-2 md:col-span-2 space-y-3 pr-4">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white">
                  <HeartPulse className="size-3.5" />
                </div>
                <span className="text-sm font-semibold text-slate-900">PULSE<span className="text-purple-600">ware</span></span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                The complete Healthcare Operating System for modern private clinics. AI-powered, WhatsApp-native, and built for scale.
              </p>
              <p className="text-[11px] text-slate-400">© 2026 PULSEware Healthcare OS. All rights reserved.</p>
            </div>

            {/* Product */}
            <div className="space-y-3">
              <h6 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Product</h6>
              <div className="space-y-2 flex flex-col">
                <a href="#features" className="hover:text-purple-600 transition-colors">Platform</a>
                <a href="#editions" className="hover:text-purple-600 transition-colors">Solutions</a>
                <a href="#pricing" className="hover:text-purple-600 transition-colors">Pricing</a>
                <a href="#whatsapp" className="hover:text-purple-600 transition-colors">WhatsApp Bot</a>
              </div>
            </div>

            {/* Company */}
            <div className="space-y-3">
              <h6 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Company</h6>
              <div className="space-y-2 flex flex-col">
                <a href="#testimonials" className="hover:text-purple-600 transition-colors">Customers</a>
                <a href="#faq" className="hover:text-purple-600 transition-colors">FAQ</a>
                <a href="#" className="hover:text-purple-600 transition-colors">About</a>
                <a href="#" className="hover:text-purple-600 transition-colors">Blog</a>
              </div>
            </div>

            {/* Legal */}
            <div className="space-y-3">
              <h6 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Legal</h6>
              <div className="space-y-2 flex flex-col">
                <a href="#" className="hover:text-purple-600 transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-purple-600 transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-purple-600 transition-colors">Security</a>
                <Link href="/login" className="hover:text-purple-600 transition-colors">Clinic Login</Link>
              </div>
            </div>
          </div>

          {/* Bottom strip */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-slate-400">Built with ♥ for healthcare professionals everywhere.</p>
            <div className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-slate-400">All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
