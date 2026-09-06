import Link from 'next/link';
import {
  ArrowRight,
  Bell,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
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
  Users,
  Zap,
} from 'lucide-react';

export default function PlatformPage() {
  return (
    <div className="min-h-screen w-full bg-white text-slate-900 font-sans antialiased">
      {/* Background grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

      {/* ─── HEADER ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[56px] flex items-center justify-between">
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

          <nav className="hidden md:flex items-center gap-6 text-[13px] font-normal text-slate-600">
            <Link href="/platform" className="text-purple-600 font-medium transition-colors">Platform</Link>
            <Link href="/solutions" className="hover:text-purple-600 transition-colors">Solutions</Link>
            <Link href="/customers" className="hover:text-purple-600 transition-colors">Customers</Link>
            <Link href="/faq" className="hover:text-purple-600 transition-colors">FAQ</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login" className="px-2.5 py-1 text-xs font-normal text-slate-700 hover:text-purple-600 transition-colors rounded-[8px] bg-slate-100/80 hover:bg-slate-200/80">
              Log In
            </Link>
            <Link href="/login" className="inline-flex items-center gap-1 px-3 py-1 rounded-[8px] bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium shadow-xs transition-all hover:scale-105 active:scale-95">
              <span>Request Demo</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-[56px]">

        {/* ─── HERO ─── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-slate-200/80 bg-white/80">
          <div className="max-w-3xl mx-auto text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-[8px] bg-purple-50 border border-purple-200 text-purple-700 text-xs font-medium tracking-wider uppercase">
              The PULSEware Platform
            </div>
            <h1 className="text-4xl sm:text-5xl font-normal tracking-tight text-slate-900 leading-tight">
              One platform for every clinical operation
            </h1>
            <p className="text-base text-slate-500 font-normal leading-relaxed">
              PULSEware is a fully integrated Healthcare Operating System — from AI-powered WhatsApp bookings to pharmacy, accounting, and doctor payroll. Everything your clinic needs in a single, unified workspace.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link href="/login" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[8px] bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium shadow-md shadow-purple-500/20 transition-all hover:scale-105">
                Request Demo <ArrowRight className="size-4" />
              </Link>
              <Link href="/solutions" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-normal transition-all">
                View Solutions
              </Link>
            </div>
          </div>
        </section>

        {/* ─── CORE MODULES ─── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-slate-200/80 bg-slate-50/50">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-normal text-slate-900 tracking-tight">Core platform modules</h2>
            <p className="text-sm text-slate-500 mt-3 font-normal">Every module works together seamlessly — no integrations, no duct tape.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <MessageSquare className="size-5" />,
                color: 'bg-purple-100 text-purple-700',
                badge: 'AI-Powered',
                badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
                title: 'WhatsApp AI Booking Engine',
                desc: 'Sub-50ms response engine that handles patient bookings, language switching (Arabic & English), service selection, doctor choice, and slot confirmation — entirely on WhatsApp.',
                features: ['24/7 autonomous operation', 'Arabic & English support', 'Dynamic 3-button menus', '0.05s slot resolution'],
              },
              {
                icon: <Stethoscope className="size-5" />,
                color: 'bg-blue-100 text-blue-700',
                badge: 'Scheduling',
                badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
                title: 'Doctor Roster & Scheduler',
                desc: 'Full control over doctor availability — working hours, slot durations, buffer times, recurring breaks, holiday blocking, and multi-doctor conflict resolution.',
                features: ['Per-doctor slot duration', 'Buffer time configuration', 'Holiday & leave management', 'Real-time availability sync'],
              },
              {
                icon: <Users className="size-5" />,
                color: 'bg-indigo-100 text-indigo-700',
                badge: 'Records',
                badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                title: 'Patient Management & Portal',
                desc: 'Complete patient profiles, medical history, appointment logs, and an auto-provisioned patient portal with unique login credentials sent via WhatsApp.',
                features: ['Auto-generated patient IDs', 'Medical history tracking', 'Patient portal access', 'Visit & prescription logs'],
              },
              {
                icon: <Package className="size-5" />,
                color: 'bg-teal-100 text-teal-700',
                badge: 'Inventory',
                badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
                title: 'Pharmacy & Inventory',
                desc: 'Track medication stock, batch numbers, expiry dates, and supplier purchase orders. Automatic deductions on service completion, with low-stock alerts.',
                features: ['Batch & expiry tracking', 'Supplier PO management', 'Auto stock deduction', 'Low-stock alerts'],
              },
              {
                icon: <CreditCard className="size-5" />,
                color: 'bg-amber-100 text-amber-700',
                badge: 'Payroll',
                badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
                title: 'Doctor Compensation & Payroll',
                desc: 'Define pay structures per doctor — fixed salary, revenue percentage splits, or per-procedure fees. Monthly payroll reports auto-calculated from appointment data.',
                features: ['Salary & % revenue splits', 'Procedure fee rules', 'Monthly payroll export', 'Multi-doctor support'],
              },
              {
                icon: <Receipt className="size-5" />,
                color: 'bg-rose-100 text-rose-700',
                badge: 'Finance',
                badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
                title: 'Accounting & Invoicing',
                desc: 'Tax-compliant invoice generation, patient payment collection, supplier bills, expense tracking, and one-click day-end financial reconciliation.',
                features: ['Tax-compliant invoices', 'Supplier expense tracking', 'Day-end reconciliation', 'Real-time P&L view'],
              },
            ].map((mod) => (
              <div key={mod.title} className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4 hover:border-purple-300 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between">
                  <div className={`size-10 rounded-xl ${mod.color} flex items-center justify-center`}>{mod.icon}</div>
                  <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-semibold border ${mod.badgeColor}`}>{mod.badge}</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900">{mod.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{mod.desc}</p>
                <ul className="space-y-1.5 pt-1 border-t border-slate-100">
                  {mod.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="size-3.5 text-purple-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ─── TECHNICAL SPECS ─── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-slate-200/80 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-[8px] bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium tracking-wider uppercase">
                Built for Production
              </div>
              <h2 className="text-3xl font-normal text-slate-900 tracking-tight">
                Enterprise-grade infrastructure under the hood
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed font-normal">
                PULSEware is built on modern, battle-tested infrastructure designed to handle thousands of concurrent appointments, real-time WhatsApp routing, and multi-tenant isolation at scale.
              </p>
              <div className="space-y-4">
                {[
                  { icon: <Zap className="size-4 text-purple-600" />, title: 'Sub-50ms API Response', desc: 'Our Fast Router engine processes WhatsApp webhook events and returns responses in under 50 milliseconds.' },
                  { icon: <Lock className="size-4 text-purple-600" />, title: 'Strict Tenant Isolation', desc: 'Every clinic is a fully isolated tenant — no shared data, no cross-clinic leaks, complete audit trails.' },
                  { icon: <Server className="size-4 text-purple-600" />, title: '99.9% Uptime SLA', desc: 'Hosted on redundant cloud infrastructure with automated failover and 24/7 monitoring.' },
                  { icon: <ShieldCheck className="size-4 text-purple-600" />, title: 'End-to-End Encryption', desc: 'WhatsApp tokens, patient data, and medical records are encrypted at rest and in transit.' },
                ].map((s) => (
                  <div key={s.title} className="flex items-start gap-3">
                    <div className="size-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0 mt-0.5">{s.icon}</div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{s.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '<50ms', label: 'Booking Response Time', color: 'border-purple-200 bg-purple-50' },
                { value: '99.9%', label: 'Platform Uptime SLA', color: 'border-indigo-200 bg-indigo-50' },
                { value: '1.2M+', label: 'Appointments Processed', color: 'border-teal-200 bg-teal-50' },
                { value: '2,000+', label: 'Active Clinicians', color: 'border-amber-200 bg-amber-50' },
              ].map((s) => (
                <div key={s.label} className={`rounded-2xl border ${s.color} p-6 text-center space-y-1`}>
                  <div className="text-3xl font-normal text-slate-900">{s.value}</div>
                  <div className="text-xs text-slate-500 font-normal">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-slate-200/80 bg-slate-50/40">
          <div className="rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-950 border border-purple-500/30 p-10 sm:p-16 text-center space-y-6 text-white shadow-2xl">
            <h2 className="text-3xl sm:text-4xl font-normal tracking-tight max-w-2xl mx-auto">
              Ready to see PULSEware in action?
            </h2>
            <p className="text-sm text-slate-300 font-normal max-w-lg mx-auto">
              Book a personalised demo and we'll walk you through every module live — tailored to your clinic's workflow.
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-[8px] bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium shadow-xl shadow-purple-500/30 transition-all hover:scale-105">
              Request Demo <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

      </main>

      {/* ─── FOOTER ─── */}
      <footer className="w-full py-8 border-t border-slate-200 bg-white text-slate-500 text-xs relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-purple-600 flex items-center justify-center">
              <HeartPulse className="size-3.5 text-white" />
            </div>
            <span className="font-semibold text-slate-900">PULSEware Healthcare OS</span>
            <span>• © 2026 All Rights Reserved</span>
          </div>
          <div className="flex items-center gap-6 text-[11px]">
            <Link href="/" className="hover:text-purple-600 transition-colors">Home</Link>
            <Link href="/solutions" className="hover:text-purple-600 transition-colors">Solutions</Link>
            <Link href="/customers" className="hover:text-purple-600 transition-colors">Customers</Link>
            <Link href="/faq" className="hover:text-purple-600 transition-colors">FAQ</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
