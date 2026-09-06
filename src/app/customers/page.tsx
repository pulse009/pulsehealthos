import Link from 'next/link';
import {
  ArrowRight,
  HeartPulse,
  Star,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

export default function CustomersPage() {
  const testimonials = [
    {
      name: 'Dr. Saud Al-Obaida',
      role: 'Medical Director',
      clinic: 'Reveal Clinics',
      avatar: 'SO',
      color: 'bg-purple-100 text-purple-700',
      stars: 5,
      quote: 'PULSEware transformed how we manage patient flow. Our WhatsApp booking volume went from 40 to 200+ daily appointments within the first month. The AI bot just works — zero maintenance required.',
      metric: '+400%',
      metricLabel: 'Booking Volume',
    },
    {
      name: 'Dr. Layla Hassan',
      role: 'Chief of Operations',
      clinic: 'AlShifa Hospital',
      avatar: 'LH',
      color: 'bg-indigo-100 text-indigo-700',
      stars: 5,
      quote: 'The doctor compensation module alone saved us 15 hours every month on payroll. Revenue splits, procedure commissions — all automated perfectly. Absolutely game-changing for our finance team.',
      metric: '15hrs',
      metricLabel: 'Saved Per Month',
    },
    {
      name: 'Ahmed Al-Rashidi',
      role: 'Clinic Manager',
      clinic: 'MedCore Group',
      avatar: 'AR',
      color: 'bg-cyan-100 text-cyan-700',
      stars: 5,
      quote: 'We tried three other clinic systems before PULSEware. None matched the speed and reliability. Sub-50ms booking responses is not a marketing claim — we measured it ourselves in production.',
      metric: '<50ms',
      metricLabel: 'Response Time',
    },
    {
      name: 'Dr. Nora Khalil',
      role: 'Dermatologist',
      clinic: 'PrimeCare Centers',
      avatar: 'NK',
      color: 'bg-rose-100 text-rose-700',
      stars: 5,
      quote: 'Patients love the WhatsApp experience. They book, reschedule, and cancel without calling us. My reception staff now focus entirely on in-clinic care, not answering phones all day.',
      metric: '90%',
      metricLabel: 'Reduction in Calls',
    },
    {
      name: 'Omar Al-Farsi',
      role: 'Finance Director',
      clinic: 'HealthBridge',
      avatar: 'OF',
      color: 'bg-teal-100 text-teal-700',
      stars: 5,
      quote: 'The accounting module gives us real-time P&L visibility across all branches. Day-end reconciliation that used to take 3 hours now takes under 5 minutes. The ROI on PULSEware was instant.',
      metric: '97%',
      metricLabel: 'Faster Reconciliation',
    },
    {
      name: 'Dr. Yasmine Saleh',
      role: 'General Practitioner',
      clinic: 'NovaMed',
      avatar: 'YS',
      color: 'bg-amber-100 text-amber-700',
      stars: 5,
      quote: 'Setup took less than a day. The onboarding team walked us through everything and our clinic was live on WhatsApp the same evening. Exceptional product, exceptional support team.',
      metric: '<1 day',
      metricLabel: 'Time to Go Live',
    },
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
            <Link href="/solutions" className="hover:text-purple-600 transition-colors">Solutions</Link>
            <Link href="/customers" className="text-purple-600 font-medium transition-colors">Customers</Link>
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
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-[8px] bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium tracking-wider uppercase">
              Customer Stories
            </div>
            <h1 className="text-4xl sm:text-5xl font-normal tracking-tight text-slate-900 leading-tight">
              Loved by clinicians worldwide
            </h1>
            <p className="text-base text-slate-500 font-normal leading-relaxed">
              Thousands of doctors, clinic managers, and healthcare administrators trust PULSEware to run their daily operations.
            </p>
          </div>
        </section>

        {/* ─── METRICS STRIP ─── */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-slate-200/80 bg-slate-50/60">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '2,000+', label: 'Active Clinicians' },
              { value: '1.2M+', label: 'Appointments Booked' },
              { value: '98%', label: 'Customer Satisfaction' },
              { value: '<1 day', label: 'Average Onboarding Time' },
            ].map((s) => (
              <div key={s.label} className="space-y-1">
                <div className="text-3xl sm:text-4xl font-normal text-purple-600">{s.value}</div>
                <div className="text-xs text-slate-500 font-normal">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── LOGO STRIP ─── */}
        <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-slate-200/80 bg-white">
          <p className="text-center text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-8">
            Trusted by leading clinics &amp; hospitals across the region
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 opacity-50 grayscale">
            {['Reveal Clinics', 'MedCore Group', 'AlShifa Hospital', 'PrimeCare Centers', 'HealthBridge', 'NovaMed'].map((name) => (
              <span key={name} className="text-sm font-bold text-slate-700 tracking-tight whitespace-nowrap">{name}</span>
            ))}
          </div>
        </section>

        {/* ─── TESTIMONIALS GRID ─── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-slate-200/80 bg-slate-50/40">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-normal text-slate-900 tracking-tight">What our customers say</h2>
            <p className="text-sm text-slate-500 mt-3 font-normal">Real quotes from real healthcare professionals.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4 hover:shadow-md hover:border-purple-200 transition-all flex flex-col">
                {/* Stars */}
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                {/* Quote */}
                <p className="text-xs text-slate-600 leading-relaxed italic flex-1">"{t.quote}"</p>
                {/* Metric */}
                <div className="px-3 py-2 rounded-[8px] bg-purple-50 border border-purple-100 flex items-center gap-3">
                  <span className="text-xl font-normal text-purple-600">{t.metric}</span>
                  <span className="text-[10px] text-purple-700 font-medium">{t.metricLabel}</span>
                </div>
                {/* Author */}
                <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
                  <div className={`size-8 rounded-full ${t.color} flex items-center justify-center text-xs font-bold shrink-0`}>{t.avatar}</div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">{t.name}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{t.role} · {t.clinic}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-slate-200/80 bg-white">
          <div className="rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-950 border border-purple-500/30 p-10 sm:p-16 text-center space-y-6 text-white shadow-2xl">
            <h2 className="text-3xl sm:text-4xl font-normal tracking-tight max-w-2xl mx-auto">
              Join thousands of clinicians on PULSEware
            </h2>
            <p className="text-sm text-slate-300 font-normal max-w-lg mx-auto">
              Start your free 14-day trial today. No credit card required. Go live in under 24 hours.
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-[8px] bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium shadow-xl shadow-purple-500/30 transition-all hover:scale-105">
              Request Demo <ArrowRight className="size-4" />
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
            <Link href="/solutions" className="hover:text-purple-600 transition-colors">Solutions</Link>
            <Link href="/faq" className="hover:text-purple-600 transition-colors">FAQ</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
