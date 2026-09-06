import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  HeartPulse,
  MessageSquare,
  Package,
  Receipt,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  Users,
  Zap,
  XCircle,
} from 'lucide-react';

export default function SolutionsPage() {
  const features = [
    { label: '24/7 WhatsApp AI Booking Bot', starter: true, os: true },
    { label: 'Arabic & English language support', starter: true, os: true },
    { label: 'Instant 0.05s slot resolution engine', starter: true, os: true },
    { label: 'Self-service reschedule & cancellation', starter: true, os: true },
    { label: 'Automated appointment reminders (2h prior)', starter: true, os: true },
    { label: 'Multi-doctor roster & working hours', starter: true, os: true },
    { label: 'Patient Portal with auto-login credentials', starter: false, os: true },
    { label: 'Full medical records & visit history', starter: false, os: true },
    { label: 'Doctor Compensation (Salary / % Revenue / Procedure)', starter: false, os: true },
    { label: 'Pharmacy & Inventory management', starter: false, os: true },
    { label: 'Supplier purchase orders & batch tracking', starter: false, os: true },
    { label: 'Complete Accounting & Invoicing suite', starter: false, os: true },
    { label: 'Day-end financial reconciliation', starter: false, os: true },
    { label: 'Role-Based Access Control (RBAC)', starter: false, os: true },
    { label: 'Clinic staff & coordinator permissions', starter: false, os: true },
    { label: 'Enterprise multi-tenant data isolation', starter: true, os: true },
  ];

  return (
    <div className="min-h-screen w-full bg-white text-slate-900 font-sans antialiased">
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
            <Link href="/platform" className="hover:text-purple-600 transition-colors">Platform</Link>
            <Link href="/solutions" className="text-purple-600 font-medium transition-colors">Solutions</Link>
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
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-[8px] bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-medium tracking-wider uppercase">
              PULSEware Solutions
            </div>
            <h1 className="text-4xl sm:text-5xl font-normal tracking-tight text-slate-900 leading-tight">
              Choose the edition that fits your clinic
            </h1>
            <p className="text-base text-slate-500 font-normal leading-relaxed">
              Whether you're a solo practitioner or running a multi-doctor hospital, PULSEware has a solution designed for your scale and complexity.
            </p>
          </div>
        </section>

        {/* ─── TWO EDITIONS ─── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-slate-200/80 bg-slate-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Pulse Now */}
            <div className="rounded-3xl bg-white border border-slate-200 p-8 flex flex-col justify-between shadow-lg hover:border-purple-300 transition-all">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="size-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
                    <Zap className="size-6 stroke-[2.5]" />
                  </div>
                  <span className="px-3 py-1 rounded-[8px] bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-semibold uppercase tracking-wider">Express Edition</span>
                </div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-1">Pulse Now</h2>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  Lightweight AI WhatsApp booking engine. Deploy in hours, not weeks. Perfect for clinics that want smart automated bookings without the overhead of a full OS.
                </p>
                <div className="space-y-2.5 pt-4 border-t border-slate-100 mb-8">
                  {[
                    '24/7 WhatsApp AI Booking Assistant',
                    'Arabic & English language support',
                    'Instant 0.05s slot engine',
                    'Multi-doctor scheduling',
                    'Automated appointment reminders',
                    'Self-service reschedule & cancel',
                  ].map((f) => (
                    <div key={f} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <CheckCircle2 className="size-4 text-cyan-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Link href="/login" className="block w-full py-3.5 rounded-[8px] bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold text-center transition-colors shadow-md">
                Get Started with Pulse Now
              </Link>
            </div>

            {/* Pulse Health OS */}
            <div className="rounded-3xl bg-white border-2 border-purple-600 p-8 flex flex-col justify-between shadow-xl shadow-purple-500/10 relative hover:border-purple-700 transition-all">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-purple-600 text-white font-semibold text-[10px] uppercase tracking-widest shadow-md whitespace-nowrap">
                Complete Clinic Enterprise OS
              </div>
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="size-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                    <HeartPulse className="size-6 stroke-[2.5]" />
                  </div>
                  <span className="px-3 py-1 rounded-[8px] bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold uppercase tracking-wider">Full Operating System</span>
                </div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-1">Pulse Health OS</h2>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  The complete clinic operating system. From AI bookings to pharmacy, payroll, accounting, and patient portals — everything in one unified platform built for scale.
                </p>
                <div className="space-y-2.5 pt-4 border-t border-slate-100 mb-8">
                  {[
                    { text: 'Everything in Pulse Now +', bold: true },
                    { text: 'Patient Portal with auto-login credentials', bold: false },
                    { text: 'Doctor Compensation (Salary / % Revenue / Procedure Fees)', bold: false },
                    { text: 'Full Pharmacy & Inventory management', bold: false },
                    { text: 'Complete Accounting & Invoicing suite', bold: false },
                    { text: 'Role-Based Access Control (RBAC)', bold: false },
                  ].map((f) => (
                    <div key={f.text} className={`flex items-start gap-2.5 text-xs ${f.bold ? 'font-semibold text-purple-700' : 'text-slate-700'}`}>
                      <CheckCircle2 className="size-4 text-purple-600 shrink-0 mt-0.5" />
                      <span>{f.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Link href="/login" className="block w-full py-3.5 rounded-[8px] bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold text-center shadow-lg shadow-purple-500/25 transition-all">
                Deploy Pulse Health OS
              </Link>
            </div>
          </div>
        </section>

        {/* ─── COMPARISON TABLE ─── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-slate-200/80 bg-white">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-normal text-slate-900 tracking-tight">Full feature comparison</h2>
            <p className="text-sm text-slate-500 mt-3 font-normal">See exactly what's included in each edition.</p>
          </div>

          <div className="max-w-3xl mx-auto rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Table header */}
            <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200">
              <div className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Feature</div>
              <div className="px-5 py-4 text-xs font-semibold text-slate-700 text-center">Pulse Now</div>
              <div className="px-5 py-4 text-xs font-semibold text-purple-700 text-center">Pulse Health OS</div>
            </div>
            {features.map((f, i) => (
              <div key={f.label} className={`grid grid-cols-3 border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                <div className="px-5 py-3.5 text-xs text-slate-700 font-normal">{f.label}</div>
                <div className="px-5 py-3.5 flex items-center justify-center">
                  {f.starter
                    ? <CheckCircle2 className="size-4 text-cyan-500" />
                    : <XCircle className="size-4 text-slate-300" />}
                </div>
                <div className="px-5 py-3.5 flex items-center justify-center">
                  {f.os
                    ? <CheckCircle2 className="size-4 text-purple-600" />
                    : <XCircle className="size-4 text-slate-300" />}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-slate-200/80 bg-slate-50/40">
          <div className="rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-950 border border-purple-500/30 p-10 sm:p-16 text-center space-y-6 text-white shadow-2xl">
            <h2 className="text-3xl sm:text-4xl font-normal tracking-tight max-w-2xl mx-auto">
              Not sure which edition is right for you?
            </h2>
            <p className="text-sm text-slate-300 font-normal max-w-lg mx-auto">
              Book a free consultation and our team will recommend the best fit for your clinic's size, workflow, and goals.
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-[8px] bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium shadow-xl shadow-purple-500/30 transition-all hover:scale-105">
              Talk to Sales <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

      </main>

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
            <Link href="/platform" className="hover:text-purple-600 transition-colors">Platform</Link>
            <Link href="/customers" className="hover:text-purple-600 transition-colors">Customers</Link>
            <Link href="/faq" className="hover:text-purple-600 transition-colors">FAQ</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
