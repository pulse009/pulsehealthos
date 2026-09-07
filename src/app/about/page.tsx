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
  Sparkles,
  Stethoscope,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';

export const metadata = {
  title: 'About Us · PULSEware',
  description: 'Learn about Pulseware mission, vision, and the team modernizing healthcare management globally.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen w-full bg-white text-slate-900 font-sans antialiased selection:bg-teal-600 selection:text-white relative overflow-x-hidden">
      
      {/* ─── ABOUT HERO CARD (Meditech Theme) ─── */}
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
                <Link href="/about" className="flex items-center gap-1.5 text-[#0d8276] hover:text-[#0a5c53] font-semibold transition-colors">
                  <span className="size-1.5 rounded-full bg-[#0d8276]" />
                  <span>About</span>
                </Link>
                <Link href="/features" className="hover:text-slate-900 transition-colors">
                  Features
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
              Who We Are
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-semibold tracking-tight leading-[1.12]">
              <span className="block text-[#0d5c56]">Pioneering the Next Generation</span>
              <span className="block text-slate-900 mt-1">of Healthcare Technology</span>
            </h1>

            <p className="mt-5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              Pulseware is an enterprise clinical operating system built to unify patient care, autonomous WhatsApp AI scheduling, pharmacy inventory, and doctor operations across modern clinics and hospital networks.
            </p>
          </div>
        </div>
      </div>

      {/* ─── MISSION & VISION CARDS ─── */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          
          {/* Card 1: Our Mission */}
          <div className="bg-[#eef9f6] border border-[#d2eee5] rounded-[32px] sm:rounded-[36px] p-6 sm:p-9 flex flex-col justify-between shadow-[0_4px_24px_rgba(13,92,86,0.04)]">
            <div>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 mb-6">
                Our Mission
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-start">
                <div className="sm:col-span-5 bg-white rounded-2xl p-4 shadow-sm border border-slate-100/90 flex flex-col justify-between h-full min-h-[120px]">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <Activity className="size-4 text-teal-600" />
                    <span>Total Beds</span>
                  </div>
                  <div className="my-1">
                    <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">155</span>
                  </div>
                  <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
                    <TrendingUp className="size-3" />
                    <span>+12% vs last week</span>
                  </div>
                </div>

                <div className="sm:col-span-7 space-y-3">
                  <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100/90 space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                      <Clock className="size-3 text-slate-400" />
                      <span>10:00 AM &amp; 02 PM</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-xs shrink-0 shadow-sm">
                        SJ
                      </div>
                      <div className="leading-tight">
                        <div className="text-xs font-semibold text-slate-900">Dr. Sarah Johnson</div>
                        <div className="text-[10px] text-slate-500">Cardiology</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-50 text-slate-600 font-medium">
                      <span className="flex items-center gap-1 text-teal-700">
                        <CheckCircle2 className="size-3 text-teal-600" /> Available : 08
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Calendar className="size-3" /> Booked
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100/90 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                      <span>General Ward A</span>
                      <span className="text-slate-400 text-[11px]">90%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full w-[90%]" />
                    </div>
                    <div className="flex items-center justify-between text-[10.5px] text-slate-500 font-medium">
                      <span>34 / 55 beds</span>
                      <span className="text-slate-400">21 available</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-8 text-base sm:text-lg font-medium text-slate-800 leading-snug">
              To simplify healthcare management with smart, reliable, and scalable technology.
            </p>
          </div>

          {/* Card 2: Our Vision */}
          <div className="bg-[#eef9f6] border border-[#d2eee5] rounded-[32px] sm:rounded-[36px] p-6 sm:p-9 flex flex-col justify-between shadow-[0_4px_24px_rgba(13,92,86,0.04)]">
            <div>
              <div className="space-y-3 mb-6">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="px-3.5 py-1.5 rounded-xl bg-white shadow-sm border border-slate-100/90 text-xs font-semibold text-slate-700">
                    08:00 AM
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl bg-white shadow-sm border border-slate-100/90 text-xs font-semibold text-slate-800 flex items-center gap-2">
                    <span className="size-2 rounded-full bg-amber-500" />
                    <span>Occupied</span>
                    <span className="text-slate-400 font-normal">Dr. Michael Chen &bull; Until 12:00 PM</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-4 px-3.5 py-2 rounded-xl bg-white shadow-sm border border-slate-100/90 text-xs font-mono text-slate-600">
                    Rx ID: RX-2026-001
                  </div>

                  <div className="sm:col-span-8 bg-white rounded-2xl p-4 shadow-sm border border-slate-100/90 space-y-2.5">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 tracking-tight">Sarah Miller</div>
                      <div className="text-[11px] text-slate-400">Patient: (UHID-2024-1524)</div>
                    </div>
                    <div className="flex items-center gap-2.5 pt-1.5 border-t border-slate-50">
                      <div className="size-7 rounded-full bg-gradient-to-tr from-amber-400 to-rose-400 flex items-center justify-center text-white font-semibold text-xs shrink-0 shadow-sm">
                        SW
                      </div>
                      <div className="leading-tight">
                        <div className="text-xs font-semibold text-slate-800">Dr. Sarah Williams</div>
                        <div className="text-[10px] text-slate-400">Cardiology</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 mt-2">
                Our Vision
              </h2>
            </div>

            <p className="mt-8 text-base sm:text-lg font-medium text-slate-800 leading-snug">
              To empower hospitals with digital solutions that improve efficiency and patient care globally.
            </p>
          </div>
        </div>
      </section>

      {/* ─── MILESTONES & JOURNEY ─── */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-6 bg-[#eef9f6] border border-[#d2eee5] rounded-[32px] sm:rounded-[36px] p-8 sm:p-12 relative overflow-hidden shadow-[0_4px_24px_rgba(13,92,86,0.04)]">
            <div className="space-y-10 relative">
              <div className="absolute left-3.5 top-5 bottom-5 w-0.5 bg-gradient-to-b from-slate-200 via-teal-500 to-teal-700 pointer-events-none" />

              <div className="relative flex items-center gap-6 pl-10">
                <div className="absolute left-2.5 size-2.5 rounded-full bg-slate-300 ring-4 ring-[#eef9f6]" />
                <span className="text-3xl sm:text-4xl font-semibold text-slate-300 tracking-tight">2023</span>
              </div>

              <div className="relative pl-10 space-y-2">
                <div className="absolute left-2 size-3.5 rounded-full bg-slate-900 ring-4 ring-[#eef9f6]" />
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
                  <span className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">2024</span>
                  <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed max-w-sm">
                    Scaled operations to 50+ countries with multi-language &amp; localization support.
                  </p>
                </div>
              </div>

              <div className="relative pl-10 space-y-2">
                <div className="absolute left-2 size-3.5 rounded-full bg-teal-600 ring-4 ring-[#eef9f6]" />
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
                  <span className="text-3xl sm:text-4xl font-semibold text-teal-800 tracking-tight">2025</span>
                  <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed max-w-sm">
                    Automated WhatsApp booking router, smart EHR, and autonomous clinic intelligence.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 lg:pl-6 space-y-6">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200/60 text-slate-700 text-xs font-semibold tracking-wide uppercase">
              Our Journey
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900 leading-[1.15]">
              Milestones That <br className="hidden sm:block" />
              Define Us
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Pulseware was founded by clinicians and healthcare technologists who experienced firsthand the friction of legacy hospital software. Today, we power modern clinical workflows across Saudi Arabia, the GCC, the UK, and beyond.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-2xl sm:text-3xl font-semibold text-teal-700">50+</div>
                <div className="text-xs text-slate-500 font-medium mt-1">Countries Supported</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-2xl sm:text-3xl font-semibold text-teal-700">99.9%</div>
                <div className="text-xs text-slate-500 font-medium mt-1">Platform Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LEADERSHIP & ADVISORY ─── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold tracking-wide uppercase mb-4">
            Our Medical &amp; Tech Leadership
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
            Guided by Clinicians &amp; Systems Engineers
          </h2>
          <p className="text-sm text-slate-500 mt-3 font-normal leading-relaxed">
            Our multidisciplinary team combines deep healthcare experience with world-class cloud engineering.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              name: 'Dr. Sarah Williams',
              role: 'Chief Medical Officer',
              desc: 'Consultant Dermatologist with 15+ years leading clinical digital transformations.',
              avatar: 'SW',
              color: 'from-teal-500 to-cyan-500',
            },
            {
              name: 'Dr. Haitham Al-Gzlan',
              role: 'Head of Clinical AI',
              desc: 'Specialist physician pioneering automated triage and WhatsApp conversational routing.',
              avatar: 'HA',
              color: 'from-emerald-500 to-teal-600',
            },
            {
              name: 'Dr. Michael Chen',
              role: 'VP of Hospital Operations',
              desc: 'Former clinical director managing multi-branch hospital scheduling and pharmacy systems.',
              avatar: 'MC',
              color: 'from-cyan-600 to-blue-600',
            },
            {
              name: 'Sara Ahmed',
              role: 'Head of Patient Experience',
              desc: 'Dedicated to patient communication, bilingual localization, and clinic retention.',
              avatar: 'SA',
              color: 'from-purple-500 to-indigo-600',
            },
          ].map((leader) => (
            <div key={leader.name} className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-all">
              <div className={`size-12 rounded-2xl bg-gradient-to-tr ${leader.color} flex items-center justify-center text-white font-bold text-base shadow-sm`}>
                {leader.avatar}
              </div>
              <div>
                <h4 className="text-base font-semibold text-slate-900">{leader.name}</h4>
                <div className="text-xs font-medium text-[#0d6157] mt-0.5">{leader.role}</div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">{leader.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative z-10">
        <div className="rounded-[32px] sm:rounded-[40px] bg-gradient-to-b from-[#0b544b] to-[#073832] text-white p-10 sm:p-16 space-y-6 shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Ready to Modernize Your Healthcare Operations?
          </h2>
          <p className="text-sm sm:text-base text-teal-100/90 max-w-xl mx-auto font-normal">
            Join hundreds of forward-thinking clinics using Pulseware to deliver superior patient care and automated clinic management.
          </p>
          <div className="pt-2 flex justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-[#0b544b] text-sm font-semibold shadow-md hover:bg-slate-100 transition-all hover:scale-105 active:scale-95"
            >
              <span>Schedule a Demo</span>
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
