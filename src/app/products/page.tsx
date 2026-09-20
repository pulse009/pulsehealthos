import React from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Bot,
  Calendar,
  Check,
  CheckCircle2,
  Cpu,
  CreditCard,
  Database,
  FileText,
  Globe2,
  HeartPulse,
  Layers,
  Lock,
  MessageSquare,
  Package,
  PhoneCall,
  Pill,
  Receipt,
  Server,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  Volume2,
  Zap,
} from 'lucide-react';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { TopAnnouncementBar } from '@/components/layout/TopAnnouncementBar';
import { getSessionUser } from '@/lib/auth/session';

export const metadata = {
  title: 'Products Suite · Pulseware Healthcare OS',
  description:
    'Explore the Pulseware product lineup: Pulse HealthOS (PMS & EHR), Pulse Now (WhatsApp AI Booking), and Pulse Speak (Autonomous Voice Telephony Receptionist).',
};

export default async function ProductsPage() {
  const user = await getSessionUser();
  const portalHref = user
    ? user.role === 'SUPER_ADMIN'
      ? '/admin'
      : '/portal'
    : '/login';

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-[#0d8276] selection:text-white relative overflow-x-hidden">
      
      {/* ─── TOP ANNOUNCEMENT BAR ─── */}
      <TopAnnouncementBar />

      {/* ─── 1. HERO CONTAINER WITH UNIFIED NAVBAR ─── */}
      <div className="relative w-full px-2 sm:px-4 lg:px-6 pt-2 sm:pt-3">
        <div className="relative w-full overflow-hidden rounded-[24px] sm:rounded-[36px] border-[3px] sm:border-[4px] border-white shadow-[0_12px_45px_rgba(13,92,86,0.08)] bg-gradient-to-b from-[#d5f1ec] via-[#edf9f6] to-[#c6ece4] pb-14 sm:pb-20">
          
          {/* Vertical Texture */}
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

          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[450px] bg-white/50 blur-[110px] rounded-full pointer-events-none" />

          {/* Reusable Public Navbar */}
          <PublicNavbar activePage="products" user={user} portalHref={portalHref} />

          {/* Hero Header Content */}
          <div className="relative z-20 px-4 sm:px-8 pt-12 sm:pt-16 pb-6 text-center max-w-4xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/90 shadow-sm border border-[#0d8276]/20 text-[#0d6157] text-xs font-semibold uppercase tracking-wider mb-4">
              <Layers className="size-3.5" /> Product Architecture
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[56px] font-semibold tracking-tight leading-[1.15] text-slate-900">
              <span className="block text-[#0d5c56]">Three Dedicated Products,</span>
              <span className="block text-slate-900 mt-1">One Connected Healthcare OS</span>
            </h1>

            <p className="mt-5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              Explore Pulseware&apos;s modular software ecosystem. Choose the standalone autonomous booking agents or deploy the full clinical hospital management suite.
            </p>
          </div>

        </div>
      </div>

      {/* ─── 2. PRODUCT 1: PULSE HEALTHOS ─── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-[32px] sm:rounded-[40px] border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-10 lg:p-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold border border-teal-200/60">
                <HeartPulse className="size-3.5" /> Practice Management System (PMS)
              </div>

              <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-slate-900">
                Pulse HealthOS
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                The centralized operational core for hospitals, clinics, and multi-specialty centers. HealthOS connects every clinical workflow: patient chart records, doctor consultations, electronic prescriptions, pharmacy inventory stock movements, diagnostic laboratory tests, and automated financial reconciliations.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  'Smart EHR & Longitudinal Medical Records',
                  'Pharmacy Batch & Expiry Date Management',
                  'Doctor Payout & Commission Engine',
                  'Multi-Tier Role-Based Access (11 Roles)',
                  'Itemized Invoices with QR & Tax Splits',
                  'Diagnostic Lab Order & PDF Result Uploads',
                ].map((feat, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <CheckCircle2 className="size-4 text-teal-600 shrink-0 mt-0.5" />
                    <span className="font-semibold text-slate-800">{feat}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-3">
                <Link
                  href="/features"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0d6157] hover:bg-[#0a4e46] text-white text-xs sm:text-sm font-semibold shadow-md transition-all hover:scale-105"
                >
                  <span>Explore HealthOS Features</span>
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold transition-all"
                >
                  <span>View Pricing Plans</span>
                </Link>
              </div>
            </div>

            {/* HealthOS Mockup Graphic */}
            <div className="lg:col-span-6 bg-slate-900 rounded-3xl p-6 text-white shadow-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono text-teal-400">HealthOS Clinical Core v2.4</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                  Active Instance
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
                  <div className="text-[11px] text-slate-400">Active Consultations</div>
                  <div className="text-xl font-bold text-white mt-1">28 In-Progress</div>
                  <div className="text-[10px] text-teal-400">12 Doctors on Roster</div>
                </div>
                <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
                  <div className="text-[11px] text-slate-400">Pharmacy Inventory</div>
                  <div className="text-xl font-bold text-white mt-1">1,894 SKUs</div>
                  <div className="text-[10px] text-emerald-400">100% In-Stock Sync</div>
                </div>
              </div>

              <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Prescription &amp; Billing Reconciliation</span>
                  <span className="text-emerald-400 font-mono">Status: Settled</span>
                </div>
                <p className="text-[11.5px] text-slate-300 leading-relaxed font-normal">
                  Patient Khalid Mansoor (UHID-2026-902) &bull; Dr. David Chen (Orthopedics) &bull; Automatic stock deduction for 2 items committed to ledger.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── 3. PRODUCT 2: PULSE NOW ─── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-gradient-to-b from-[#edf9f6] via-white to-[#edf9f6] rounded-[40px] border border-teal-100">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center p-6 sm:p-10">
          
          {/* Left Column: UI Mockup */}
          <div className="lg:col-span-6 order-2 lg:order-1 bg-[#0c1317] rounded-3xl p-6 text-white shadow-2xl border border-slate-800 space-y-4 max-w-md mx-auto w-full">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-white">
                  <Bot className="size-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">WhatsApp Fast Router</div>
                  <div className="text-[10px] text-emerald-400 font-mono">Sub-50ms Availability</div>
                </div>
              </div>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">Official Cloud API</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="bg-[#005c4b] p-3 rounded-xl rounded-tr-none text-white ml-auto max-w-[85%]">
                Can I schedule a dental cleaning for Saturday morning?
              </div>
              <div className="bg-[#202c33] p-3 rounded-xl rounded-tl-none text-slate-100 mr-auto max-w-[90%] space-y-1.5 border border-slate-700">
                <p>Sure! Dr. Nora Al-Otaibi has two confirmed slots this Saturday:</p>
                <div className="flex gap-2">
                  <span className="bg-[#005c4b] px-2.5 py-1 rounded text-[11px] font-semibold">9:30 AM</span>
                  <span className="bg-slate-800 px-2.5 py-1 rounded text-[11px]">11:15 AM</span>
                </div>
              </div>
              <div className="bg-[#202c33] p-3 rounded-xl text-emerald-400 font-semibold border border-emerald-500/40 text-[11px] flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5" /> Booked and synchronized to HealthOS Calendar
              </div>
            </div>
          </div>

          {/* Right Column: Copy & Details */}
          <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200/60">
              <MessageSquare className="size-3.5" /> Autonomous WhatsApp Concierge
            </div>

            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-slate-900">
              Pulse Now
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              An intelligent, multilingual WhatsApp conversational booking agent that operates 24 hours a day, 7 days a week. Patients ask questions, check real doctor availability, and reserve appointments with zero double-booking collisions.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                'Instant WhatsApp Cloud Official API',
                '20+ Languages (Arabic, English, French & more)',
                'Zero-Double Booking Exclusion Constraints',
                'Automated 24-Hour & 2-Hour Reminders',
                'Pre-consultation Medical Questionnaire',
                'Instant Human Receptionist Escalation',
              ].map((feat, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200/70 text-xs">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="font-semibold text-slate-800">{feat}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold shadow-md transition-all hover:scale-105"
              >
                <span>Get Pulse Now (499 SAR/mo)</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ─── 4. PRODUCT 3: PULSE SPEAK ─── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-[32px] sm:rounded-[40px] border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-10 lg:p-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 text-xs font-semibold border border-cyan-200/60">
                <Volume2 className="size-3.5" /> Autonomous Voice AI Telephony
              </div>

              <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-slate-900">
                Pulse Speak
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                An autonomous spoken voice AI receptionist that answers hospital landlines, speaks with human-like latency and medical nuance, checks doctor calendars, and commits bookings directly into your hospital schedule.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  'Direct Hospital PBX, 3CX & SIP Trunk Sync',
                  'Sub-400ms Spoken Neural Audio Latency',
                  'Handles 100+ Concurrent Telephone Calls',
                  'Speech-to-Text Clinical Transcription',
                  'Verbal Appointment Booking & SMS Dispatch',
                  'Smart Department & Doctor Call Forwarding',
                ].map((feat, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <CheckCircle2 className="size-4 text-cyan-600 shrink-0 mt-0.5" />
                    <span className="font-semibold text-slate-800">{feat}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-cyan-700 hover:bg-cyan-800 text-white text-xs sm:text-sm font-semibold shadow-md transition-all hover:scale-105"
                >
                  <span>Request Pulse Speak Voice Demo</span>
                  <PhoneCall className="size-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold transition-all"
                >
                  <span>Custom Telephony Setup</span>
                </Link>
              </div>
            </div>

            {/* Voice AI Graphic */}
            <div className="lg:col-span-6 bg-gradient-to-br from-slate-950 to-cyan-950 rounded-3xl p-6 text-white shadow-2xl border border-cyan-900/40 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <PhoneCall className="size-4 text-cyan-400 animate-pulse" />
                  <span className="text-xs font-mono text-cyan-300">Live Voice Agent Telephony</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Latency: 340ms</span>
              </div>

              <div className="bg-slate-900/90 rounded-2xl p-4 border border-cyan-800/30 space-y-3">
                <div className="text-[11px] text-slate-400">Voice Inbound Audio Stream</div>
                <div className="h-12 flex items-center justify-center gap-1 py-1">
                  {[30, 55, 80, 40, 95, 100, 70, 50, 85, 90, 45, 60, 75, 40, 85, 60].map((h, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-gradient-to-t from-cyan-600 to-teal-300 rounded-full"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 font-mono italic">
                  &ldquo;I have reserved your appointment with Dr. Nora for tomorrow at 10:00 AM.&rdquo;
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── 5. PRODUCT COMPARISON MATRIX ─── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
            Compare Product Capabilities
          </h2>
          <p className="mt-3 text-sm text-slate-500 font-normal">
            Choose the exact combination of software modules needed for your healthcare organization.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75">
                <th className="p-4 sm:p-5 font-semibold text-slate-900">Capability / Module</th>
                <th className="p-4 sm:p-5 font-semibold text-[#0d5c56] text-center">Pulse HealthOS</th>
                <th className="p-4 sm:p-5 font-semibold text-emerald-700 text-center">Pulse Now</th>
                <th className="p-4 sm:p-5 font-semibold text-cyan-700 text-center">Pulse Speak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {[
                { name: 'WhatsApp Conversational AI Booking', healthos: true, now: true, speak: false },
                { name: 'Spoken Voice AI Telephony & PBX', healthos: false, now: false, speak: true },
                { name: 'EHR & Digital Clinical Prescriptions', healthos: true, now: false, speak: false },
                { name: 'Pharmacy Stock & Batch Expiry Tracking', healthos: true, now: false, speak: false },
                { name: 'Doctor Commission Calculation & Payouts', healthos: true, now: false, speak: false },
                { name: 'Zero-Double Booking GiST Constraint', healthos: true, now: true, speak: true },
                { name: 'Diagnostic Lab Order Workflow', healthos: true, now: false, speak: false },
                { name: 'Automated 24h & 2h WhatsApp Reminders', healthos: true, now: true, speak: true },
                { name: 'Multi-Tenant Encrypted Isolation', healthos: true, now: true, speak: true },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 sm:p-5 font-medium text-slate-900">{row.name}</td>
                  <td className="p-4 sm:p-5 text-center">
                    {row.healthos ? (
                      <Check className="size-4 text-teal-600 mx-auto stroke-[2.5]" />
                    ) : (
                      <span className="text-slate-300">&mdash;</span>
                    )}
                  </td>
                  <td className="p-4 sm:p-5 text-center">
                    {row.now ? (
                      <Check className="size-4 text-emerald-600 mx-auto stroke-[2.5]" />
                    ) : (
                      <span className="text-slate-300">&mdash;</span>
                    )}
                  </td>
                  <td className="p-4 sm:p-5 text-center">
                    {row.speak ? (
                      <Check className="size-4 text-cyan-600 mx-auto stroke-[2.5]" />
                    ) : (
                      <span className="text-slate-300">&mdash;</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── 6. UNIFIED PUBLIC FOOTER ─── */}
      <PublicFooter />

    </div>
  );
}
