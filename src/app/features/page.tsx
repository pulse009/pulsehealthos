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
import { TopAnnouncementBar } from '@/components/layout/TopAnnouncementBar';
import { getSessionUser } from '@/lib/auth/session';
import { getAllSiteContent } from '@/lib/cms/service';

export const metadata = {
  title: 'Features Matrix · Pulseware Healthcare OS',
  description:
    'Explore the complete clinical capabilities of Pulseware: WhatsApp AI Fast Router, Spoken Voice Telephony, EHR, Doctor Rostering, Pharmacy, Diagnostic Labs, and Billing.',
};

export const dynamic = 'force-dynamic';

export default async function FeaturesPage() {
  const user = await getSessionUser();
  const cmsContent = await getAllSiteContent();
  const { announcement, features, footer } = cmsContent;

  const portalHref = user
    ? user.role === 'SUPER_ADMIN'
      ? '/admin'
      : '/portal'
    : '/login';

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-[#0d8276] selection:text-white relative overflow-x-hidden">
      
      {/* ─── TOP ANNOUNCEMENT BAR ─── */}
      <TopAnnouncementBar content={announcement} />

      {/* ─── 1. HERO CARD WITH UNIFIED NAVBAR ─── */}
      <div className="relative w-full px-2 sm:px-4 lg:px-6 pt-2 sm:pt-3 pb-6 sm:pb-12">
        <div className="relative w-full overflow-hidden rounded-[24px] sm:rounded-[36px] border-[3px] sm:border-[4px] border-white shadow-[0_12px_45px_rgba(13,92,86,0.08)] bg-gradient-to-b from-[#d5f1ec] via-[#edf9f6] to-[#c6ece4] pb-12 sm:pb-20">
          
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
          <div className="relative z-10 px-4 sm:px-10 pt-10 sm:pt-16 pb-6 text-center max-w-4xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1 rounded-full bg-white/90 shadow-sm border border-[#0d8276]/20 text-[#0d6157] text-[11px] sm:text-xs font-semibold tracking-wider uppercase mb-4 whitespace-nowrap shrink-0 max-w-full">
              <Cpu className="size-3.5 shrink-0" /> <span className="truncate">{features.badge}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[58px] font-semibold tracking-tight leading-[1.12] text-slate-900">
              <span className="block text-[#0d5c56]">{features.headlineFirst}</span>
              <span className="block text-slate-900 mt-1">{features.headlineSecond}</span>
            </h1>

            <p className="mt-4 sm:mt-5 text-xs sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              {features.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* ─── 2. SIX CORE PILLARS GRID ─── */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-slate-900">
            Built for High-Growth Healthcare Providers
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2.5 font-normal leading-relaxed">
            Eliminate fragmented software tools. Pulseware consolidates your front-desk, doctors, pharmacy, diagnostic lab, and finance into a single synchronized workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.categories.map((pillar, idx) => {
            const icons = [Clock, HeartPulse, Pill, Receipt, MessageSquare, ShieldCheck];
            const IconComponent = icons[idx % icons.length] || Clock;
            return (
              <div
                key={pillar.id || idx}
                className="bg-white rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 border border-slate-200/80 shadow-md hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="size-11 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center">
                      <IconComponent className="size-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/60">
                      {pillar.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight">
                      {pillar.categoryName}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed font-normal">
                      {pillar.description}
                    </p>
                  </div>

                  <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-slate-700">
                    {pillar.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <CheckCircle2 className="size-4 text-teal-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900 font-semibold">{item.title}:</strong>{' '}
                          <span className="text-slate-600 font-normal">{item.desc}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 3. ENTERPRISE GUARANTEE BANNER ─── */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-[28px] sm:rounded-[40px] bg-gradient-to-r from-[#0b544b] to-[#073832] text-white p-6 sm:p-14 text-center space-y-6 shadow-2xl">
          <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight">
            Explore the Complete Product Suite
          </h2>
          <p className="text-xs sm:text-base text-teal-100/90 max-w-xl mx-auto font-normal">
            See how Pulse HealthOS, Pulse Now, and Pulse Speak integrate together to power modern hospital excellence.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3.5">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white text-[#0b544b] text-sm font-semibold shadow-md hover:bg-slate-100 transition-all hover:scale-105 active:scale-95"
            >
              <span>View Products Suite</span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-teal-800/60 hover:bg-teal-800 text-white text-sm font-semibold border border-teal-600/50 transition-all"
            >
              <span>Schedule Live Demo</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 4. UNIFIED PUBLIC FOOTER ─── */}
      <PublicFooter content={footer} />

    </div>
  );
}
