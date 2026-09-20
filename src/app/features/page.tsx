import React from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Bot,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
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
  UserCheck,
  Users,
  Volume2,
  Zap,
} from 'lucide-react';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { getSessionUser } from '@/lib/auth/session';

export const metadata = {
  title: 'Features Matrix · Pulseware Healthcare OS',
  description:
    'Explore the complete clinical capabilities of Pulseware: WhatsApp AI Fast Router, Spoken Voice Telephony, EHR, Doctor Rostering, Pharmacy, Diagnostic Labs, and Billing.',
};

export default async function FeaturesPage() {
  const user = await getSessionUser();
  const portalHref = user
    ? user.role === 'SUPER_ADMIN'
      ? '/admin'
      : '/portal'
    : '/login';

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-[#0d8276] selection:text-white relative overflow-x-hidden">
      
      {/* ─── 1. HERO CARD WITH UNIFIED NAVBAR ─── */}
      <div className="relative w-full px-2 sm:px-4 lg:px-6 pt-2 sm:pt-3 pb-8 sm:pb-12">
        <div className="relative w-full overflow-hidden rounded-[24px] sm:rounded-[36px] border-[3px] sm:border-[4px] border-white shadow-[0_12px_45px_rgba(13,92,86,0.08)] bg-gradient-to-b from-[#d5f1ec] via-[#edf9f6] to-[#c6ece4] pb-14 sm:pb-20">
          
          {/* Vertical Texture Overlay */}
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

          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-white/40 blur-[100px] rounded-full pointer-events-none" />

          {/* Unified Navbar */}
          <PublicNavbar activePage="features" user={user} portalHref={portalHref} />

          {/* Hero Content */}
          <div className="relative z-10 px-5 sm:px-10 pt-12 sm:pt-16 pb-6 text-center max-w-4xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/90 shadow-sm border border-[#0d8276]/20 text-[#0d6157] text-xs font-semibold tracking-wider uppercase mb-4">
              <Cpu className="size-3.5" /> Clinical Capabilities
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-semibold tracking-tight leading-[1.12] text-slate-900">
              <span className="block text-[#0d5c56]">Every Clinical Operation,</span>
              <span className="block text-slate-900 mt-1">Unified into One Intelligent OS</span>
            </h1>

            <p className="mt-5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              From sub-50ms WhatsApp AI patient bookings to pharmacy batch tracking, spoken voice telephony, doctor commission engines, and multi-tenant security — Pulseware handles everything your hospital needs.
            </p>
          </div>
        </div>
      </div>

      {/* ─── 2. SIX CORE PILLARS GRID ─── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
            Built for High-Growth Healthcare Providers
          </h2>
          <p className="text-sm text-slate-500 mt-3 font-normal leading-relaxed">
            Eliminate fragmented software tools. Pulseware consolidates your front-desk, doctors, pharmacy, diagnostic lab, and finance into a single synchronized workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[
            {
              icon: <MessageSquare className="size-6 text-teal-700" />,
              badge: 'Autonomous AI',
              title: 'WhatsApp Fast Router Engine',
              desc: 'Sub-50ms patient booking over official WhatsApp Cloud API. Checks live schedules, sends confirmations, and escalates to staff with full context.',
              points: ['Multi-lingual in 20+ languages', 'Pre-consultation symptom triage', 'Deterministic slot allocation'],
            },
            {
              icon: <Volume2 className="size-6 text-cyan-700" />,
              badge: 'Voice Telephony',
              title: 'Pulse Speak Voice Receptionist',
              desc: 'Autonomous spoken telephone receptionist that answers hospital landlines, speaks with natural nuance, and commits bookings into EHR.',
              points: ['SIP Trunk & PBX integration', 'Low-latency spoken AI (340ms)', 'Speech-to-text call transcription'],
            },
            {
              icon: <FileText className="size-6 text-teal-700" />,
              badge: 'Clinical EHR',
              title: 'Integrated Patient Records',
              desc: 'Complete longitudinal patient charts with ICD-10 diagnoses, medical history, vital monitoring, and digital prescriptions in one view.',
              points: ['Fast doctor consultation templates', 'Allergy & prescription checks', 'Secure multi-department access'],
            },
            {
              icon: <Package className="size-6 text-teal-700" />,
              badge: 'Pharmacy & Stock',
              title: 'Smart Pharmacy Inventory',
              desc: 'Track lot numbers, expiry dates, supplier purchase orders, and item requests. Real-time auto-depletion upon prescription dispensing.',
              points: ['Batch & expiry compliance', 'Automated PO generation', 'Stock movement audit trail'],
            },
            {
              icon: <CreditCard className="size-6 text-teal-700" />,
              badge: 'Finance & Payroll',
              title: 'Doctor Payouts & Commissions',
              desc: 'Customizable compensation structures with automated commission splits, procedure payouts, and monthly payroll summaries.',
              points: ['Tiered commission percentages', 'Consultation revenue splits', 'Audited monthly doctor statements'],
            },
            {
              icon: <Activity className="size-6 text-teal-700" />,
              badge: 'Diagnostics',
              title: 'Laboratory & Pathology Orders',
              desc: 'Order tests directly during consultations. Track sample collection, specimen barcodes, PDF result uploads, and doctor sign-offs.',
              points: ['STAT / Urgent priority tags', 'External PDF result ingestion', 'Patient notification on ready status'],
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-white rounded-[28px] p-7 sm:p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="size-12 rounded-2xl bg-teal-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {feature.badge}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-slate-900 tracking-tight">
                  {feature.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {feature.desc}
                </p>

                <ul className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100 font-medium">
                  {feature.points.map((pt, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-teal-600" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 3. ENTERPRISE GUARANTEE BANNER ─── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-[32px] sm:rounded-[40px] bg-gradient-to-r from-[#0b544b] to-[#073832] text-white p-8 sm:p-14 text-center space-y-6 shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Explore the Complete Product Suite
          </h2>
          <p className="text-sm sm:text-base text-teal-100/90 max-w-xl mx-auto font-normal">
            See how Pulse HealthOS, Pulse Now, and Pulse Speak integrate together to power modern hospital excellence.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-[#0b544b] text-sm font-semibold shadow-md hover:bg-slate-100 transition-all hover:scale-105 active:scale-95"
            >
              <span>View Products Suite</span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-teal-800/60 hover:bg-teal-800 text-white text-sm font-semibold border border-teal-600/50 transition-all"
            >
              <span>Schedule Live Demo</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 4. UNIFIED PUBLIC FOOTER ─── */}
      <PublicFooter />

    </div>
  );
}
