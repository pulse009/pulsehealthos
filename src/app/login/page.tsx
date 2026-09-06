import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { LoginForm } from './login-form';
import {
  ArrowRight,
  CheckCircle2,
  HeartPulse,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';

export const metadata: Metadata = { title: 'Sign In · PULSEware' };
export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect(user.role === 'SUPER_ADMIN' ? '/admin' : '/portal');

  const params = await searchParams;

  return (
    <div className="min-h-screen w-full bg-white text-slate-900 font-sans antialiased selection:bg-purple-600 selection:text-white relative overflow-x-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* ─── HEADER (same as landing page) ─── */}
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

          {/* Right */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-2.5 py-1 text-xs font-normal text-slate-700 hover:text-purple-600 transition-colors rounded-[8px] bg-slate-100/80 hover:bg-slate-200/80"
            >
              ← Back to Home
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-[8px] bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium shadow-xs transition-all hover:scale-105 active:scale-95"
            >
              <span>Sign In</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main className="relative z-10 pt-[56px] min-h-screen flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-x border-slate-200/80">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-56px)]">

            {/* ─── LEFT: Branding & Features Panel ─── */}
            <div className="hidden lg:flex flex-col justify-center py-16 pr-16 space-y-10 border-r border-slate-200/80">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-[8px] bg-purple-50 border border-purple-200 text-purple-700 text-xs font-medium tracking-wider uppercase w-fit">
                <Sparkles className="size-3" />
                PULSEware Healthcare OS
              </div>

              {/* Headline */}
              <div className="space-y-3">
                <h1 className="text-4xl font-normal tracking-tight text-slate-900 leading-tight">
                  Your clinic's complete operating system
                </h1>
                <p className="text-sm text-slate-500 font-normal leading-relaxed">
                  Sign in to manage doctor rosters, AI WhatsApp bookings, pharmacy inventory, doctor payroll, and clinic accounts — all in one place.
                </p>
              </div>

              {/* Feature list */}
              <div className="space-y-4">
                {[
                  { icon: <Zap className="size-4 text-purple-600" />, title: 'AI WhatsApp Booking', desc: 'Sub-50ms automated bookings in Arabic & English' },
                  { icon: <Users className="size-4 text-purple-600" />, title: 'Doctor & Staff Management', desc: 'Rosters, schedules, and role-based permissions' },
                  { icon: <ShieldCheck className="size-4 text-purple-600" />, title: 'Enterprise Security', desc: 'Multi-tenant isolation, encrypted data, full audit trails' },
                ].map((f) => (
                  <div key={f.title} className="flex items-start gap-3">
                    <div className="size-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                      {f.icon}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{f.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mini dashboard mockup */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="size-5 rounded-md bg-purple-600 flex items-center justify-center">
                      <Sparkles className="size-3 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800">Live Overview</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Today</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Patients", value: "247", change: "+12%", up: true },
                    { label: "Bookings", value: "89", change: "+8%", up: true },
                    { label: "Revenue", value: "$18.5K", change: "+15%", up: true },
                  ].map((m) => (
                    <div key={m.label} className="bg-slate-50 rounded-xl p-2.5 space-y-0.5 border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-normal block">{m.label}</span>
                      <span className="text-sm font-semibold text-slate-900 block">{m.value}</span>
                      <span className="text-[9px] font-medium text-emerald-600 block">{m.change}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  All systems operational
                </div>
              </div>

              {/* Trust line */}
              <p className="text-xs text-slate-400 font-normal">
                Trusted by <span className="font-semibold text-slate-600">2,000+ clinicians</span> across leading hospitals & clinics.
              </p>
            </div>

            {/* ─── RIGHT: Login Form Panel ─── */}
            <div className="flex flex-col justify-center py-16 lg:pl-16">
              <div className="w-full max-w-sm mx-auto lg:mx-0 space-y-7">

                {/* Form header */}
                <div className="space-y-1.5">
                  {/* Mobile logo */}
                  <div className="flex items-center gap-2 mb-5 lg:hidden">
                    <div className="size-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center">
                      <HeartPulse className="size-4 text-white" />
                    </div>
                    <span className="text-base font-semibold text-slate-900">
                      PULSE<span className="text-purple-600">ware</span>
                    </span>
                  </div>

                  <h2 className="text-2xl font-normal tracking-tight text-slate-900">Welcome back</h2>
                  <p className="text-xs text-slate-500 font-normal">
                    Sign in to your clinic portal to continue.
                  </p>
                </div>

                {/* Configuration error */}
                {params.error === 'configuration' ? (
                  <div className="rounded-[8px] border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800">
                    The server is not fully configured. Contact your system administrator.
                  </div>
                ) : null}

                {/* Form card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                  <LoginForm nextPath={params.next} />
                </div>

                {/* Security strip */}
                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-normal">
                  <ShieldCheck className="size-3.5 text-purple-500" />
                  <span>End-to-end encrypted · Multi-tenant isolated</span>
                </div>

                {/* Features (mobile only) */}
                <div className="lg:hidden space-y-2 pt-2 border-t border-slate-100">
                  {[
                    'AI WhatsApp bookings in Arabic & English',
                    'Doctor roster & compensation management',
                    'Pharmacy, accounting & invoicing',
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-slate-500">
                      <CheckCircle2 className="size-3.5 text-purple-500 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="w-full py-6 border-t border-slate-200 bg-white text-slate-400 text-xs relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="size-5 rounded-md bg-purple-600 flex items-center justify-center">
              <HeartPulse className="size-3 text-white" />
            </div>
            <span className="font-medium text-slate-500">PULSEware Healthcare OS</span>
            <span>· © 2026 All Rights Reserved</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/platform" className="hover:text-purple-600 transition-colors">Platform</Link>
            <Link href="/solutions" className="hover:text-purple-600 transition-colors">Solutions</Link>
            <Link href="/faq" className="hover:text-purple-600 transition-colors">FAQ</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
