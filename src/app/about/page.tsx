import React from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Globe2,
  HeartPulse,
  Mail,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { TopAnnouncementBar } from '@/components/layout/TopAnnouncementBar';
import { getSessionUser } from '@/lib/auth/session';
import { getAllSiteContent } from '@/lib/cms/service';

export const metadata = {
  title: 'About Us · Pulseware Healthcare OS',
  description: 'Learn about Pulseware mission, vision, and the team modernizing healthcare management globally.',
};

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const user = await getSessionUser();
  const cmsContent = await getAllSiteContent();
  const { announcement, about, footer } = cmsContent;

  const portalHref = user
    ? user.role === 'SUPER_ADMIN'
      ? '/admin'
      : '/portal'
    : '/login';

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-[#0d8276] selection:text-white relative overflow-x-hidden">
      
      {/* ─── TOP ANNOUNCEMENT BAR ─── */}
      <TopAnnouncementBar content={announcement} />

      {/* ─── ABOUT HERO CARD (Meditech Theme) ─── */}
      <div className="relative w-full px-2 sm:px-4 lg:px-6 pt-2 sm:pt-3 pb-6 sm:pb-12">
        <div className="relative w-full overflow-hidden rounded-[24px] sm:rounded-[36px] border-[3px] sm:border-[4px] border-white shadow-[0_12px_45px_rgba(13,92,86,0.08)] bg-gradient-to-b from-[#d5f1ec] via-[#edf9f6] to-[#c6ece4] pb-12 sm:pb-20">
          
          {/* Vertical Fluted / Slat Texture Overlay */}
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

          {/* Unified Floating Pill Navbar */}
          <PublicNavbar activePage="about" user={user} portalHref={portalHref} />

          {/* ─── Header Copy ─── */}
          <div className="relative z-10 px-4 sm:px-10 pt-10 sm:pt-16 pb-6 text-center max-w-4xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 rounded-full bg-white/80 border border-teal-800/10 text-[#0d6157] text-[11px] sm:text-xs font-semibold tracking-wider uppercase mb-4 shadow-xs whitespace-nowrap shrink-0 max-w-full">
              <span className="truncate">{about.badge}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[58px] font-semibold tracking-tight leading-[1.12]">
              <span className="block text-[#0d5c56]">{about.headlineFirst}</span>
              <span className="block text-slate-900 mt-1">{about.headlineSecond}</span>
            </h1>

            <p className="mt-4 sm:mt-5 text-xs sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              {about.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* ─── MISSION & STATS ─── */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          
          {/* Mission Card */}
          <div className="lg:col-span-7 bg-[#eef9f6] border border-[#d2eee5] rounded-[28px] sm:rounded-[36px] p-6 sm:p-9 flex flex-col justify-between shadow-xs">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-teal-200 text-teal-800 text-[11px] sm:text-xs font-semibold uppercase tracking-wider mb-4 whitespace-nowrap shrink-0 max-w-full">
                <HeartPulse className="size-3.5 shrink-0" /> <span className="truncate">{about.missionTitle}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 mb-4">
                Pioneering Software Rigor for Healthcare Excellence
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                {about.missionText}
              </p>
            </div>

            <div className="pt-6 border-t border-teal-200/60 mt-6 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="size-5 text-[#0d6157]" />
                <span className="text-xs font-semibold text-slate-800">HIPAA &amp; GDPR Certified</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Globe2 className="size-5 text-[#0d6157]" />
                <span className="text-xs font-semibold text-slate-800">Middle East &amp; Global Cloud</span>
              </div>
            </div>
          </div>

          {/* Key Metrics Card */}
          <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-[28px] sm:rounded-[36px] p-6 sm:p-9 flex flex-col justify-between shadow-sm">
            <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 mb-4">
              Platform Reliability &amp; Scale
            </h3>

            <div className="grid grid-cols-2 gap-3.5 sm:gap-4 my-auto">
              {about.stats.map((st, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                  <div className="text-xl sm:text-2xl font-bold text-[#0d5c56]">{st.value}</div>
                  <div className="text-[11px] text-slate-500 font-medium leading-tight">{st.label}</div>
                </div>
              ))}
            </div>

            <div className="pt-4 text-center">
              <span className="text-xs text-slate-400">Audited metrics updated in real-time</span>
            </div>
          </div>

        </div>
      </section>

      {/* ─── LEADERSHIP TEAM ─── */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] sm:text-xs font-semibold uppercase tracking-wider mb-3 whitespace-nowrap shrink-0 max-w-full">
            <Users className="size-3.5 shrink-0" /> <span className="truncate">Leadership &amp; Engineering</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-slate-900">
            Guided by Clinicians &amp; Systems Engineers
          </h2>
          <p className="mt-2.5 text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
            Our multidisciplinary team bridges healthcare governance, high-concurrency database engineering, and artificial intelligence telephony.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {about.leadership.map((leader, i) => (
            <div
              key={i}
              className="bg-white rounded-[24px] sm:rounded-[32px] p-6 border border-slate-200/80 shadow-md hover:shadow-xl transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="size-12 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm mb-3">
                  {leader.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <h3 className="text-base font-semibold text-slate-900">{leader.name}</h3>
                <div className="text-xs font-medium text-[#0d6157] mt-0.5">{leader.role}</div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">{leader.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative z-10">
        <div className="rounded-[28px] sm:rounded-[40px] bg-gradient-to-b from-[#0b544b] to-[#073832] text-white p-8 sm:p-16 space-y-6 shadow-2xl">
          <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight">
            Ready to Modernize Your Healthcare Operations?
          </h2>
          <p className="text-xs sm:text-base text-teal-100/90 max-w-xl mx-auto font-normal">
            Join hundreds of forward-thinking clinics using Pulseware to deliver superior patient care and automated clinic management.
          </p>
          <div className="pt-2 flex justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-[#0b544b] text-sm font-semibold shadow-md hover:bg-slate-100 transition-all hover:scale-105 active:scale-95"
            >
              <span>Schedule a Demo</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── UNIFIED PUBLIC FOOTER ─── */}
      <PublicFooter content={footer} />

    </div>
  );
}
