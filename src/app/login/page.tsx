import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { LoginForm } from './login-form';
import {
  ArrowLeft,
  ShieldCheck,
  Star,
} from 'lucide-react';

export const metadata: Metadata = { title: 'Sign In · Pulseware' };
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
    <div className="h-screen w-full overflow-hidden bg-white font-sans antialiased selection:bg-teal-600 selection:text-white p-2 sm:p-3 lg:p-4 flex flex-col">
      {/* ─── Main Viewport Card ─── */}
      <div className="relative h-full w-full overflow-hidden rounded-[24px] sm:rounded-[36px] border-[3px] sm:border-[4px] border-white shadow-[0_12px_40px_rgba(13,92,86,0.07)] bg-gradient-to-b from-[#d8f2ee] via-[#edf9f6] to-[#cdeee8] flex flex-col justify-between">

        {/* Fluted texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-75"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              rgba(255,255,255,0.25) 0px,
              rgba(255,255,255,0) 36px,
              rgba(13,92,86,0.02) 72px,
              rgba(255,255,255,0.6) 72px,
              rgba(255,255,255,0.6) 73px,
              rgba(13,92,86,0.04) 73px,
              rgba(13,92,86,0.04) 74px
            )`,
          }}
        />

        {/* Soft center ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[550px] bg-white/45 blur-[110px] rounded-full pointer-events-none" />

        {/* ─── Top Utility Strip ─── */}
        <div className="relative z-20 px-6 sm:px-10 lg:px-14 pt-5 sm:pt-7 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative size-7 sm:size-8 flex items-center justify-center text-[#0d8276] group-hover:scale-105 transition-transform duration-200">
              <svg viewBox="0 0 24 24" className="size-7 fill-current" xmlns="http://www.w3.org/2000/svg">
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
            <span className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900">
              Pulseware
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200/60 shadow-xs transition-all hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to website</span>
          </Link>
        </div>

        {/* ─── Center Hero Content ─── */}
        <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 px-6 sm:px-10 lg:px-14 items-center gap-8 lg:gap-12 py-4">

          {/* Left Brand Panel — Clean & High-Impact */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-6 pr-6 xl:pr-12">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-[#0d8276]/20 text-[#0d6157] text-[11px] font-semibold tracking-wide uppercase shadow-2xs">
                Clinical Intelligence Platform
              </div>
              <h1 className="text-4xl xl:text-5xl font-semibold tracking-tight text-slate-900 leading-[1.14]">
                The modern operating system for healthcare leaders.
              </h1>
              <p className="text-sm sm:text-[15px] text-slate-600 leading-relaxed max-w-lg font-normal">
                Seamlessly unify AI WhatsApp consultations, doctor scheduling, multi-clinic records, and revenue operations into one continuous workflow.
              </p>
            </div>

            {/* Minimalist Client Quote Card */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/80 shadow-[0_4px_20px_rgba(13,92,86,0.06)] p-5 space-y-3 max-w-md">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-3.5 fill-[#0d8276] text-[#0d8276]" />
                ))}
              </div>
              <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed italic">
                &ldquo;Pulseware eliminated 80% of our patient scheduling overhead in the first month. Our doctors and patients both love the speed.&rdquo;
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100/80">
                <div>
                  <div className="text-xs font-semibold text-slate-900">Dr. Saud Al-Obaida</div>
                  <div className="text-[10px] text-slate-500">Medical Director, Reveal Clinics</div>
                </div>
                <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Verified Partner
                </div>
              </div>
            </div>
          </div>

          {/* Right Auth Card */}
          <div className="lg:col-span-6 flex items-center justify-center lg:justify-end">
            <div className="w-full max-w-md space-y-4">
              
              {/* Card Container */}
              <div className="bg-white/95 backdrop-blur-md rounded-[24px] border border-white shadow-[0_12px_40px_rgba(13,92,86,0.12)] p-7 sm:p-9 space-y-6">
                
                {/* Header */}
                <div className="space-y-1.5 text-left">
                  <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
                    Welcome back
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-normal">
                    Enter your clinic credentials to access your workspace.
                  </p>
                </div>

                {/* Configuration error alert */}
                {params.error === 'configuration' ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-800">
                    The server is not fully configured. Contact your system administrator.
                  </div>
                ) : null}

                {/* Login Form */}
                <LoginForm nextPath={params.next} />

                {/* Card Sub-links */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Need an enterprise account?</span>
                  <Link
                    href="/contact"
                    className="font-semibold text-[#0d6157] hover:text-[#09433c] transition-colors"
                  >
                    Contact sales →
                  </Link>
                </div>
              </div>

              {/* Security note */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="size-3.5 text-[#0d8276]" />
                <span>Enterprise grade security &bull; 256-bit encrypted session</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Bottom Status Strip ─── */}
        <div className="relative z-10 px-6 sm:px-10 lg:px-14 py-3.5 border-t border-[#0d8276]/10 flex items-center justify-between text-[11px] text-slate-500">
          <p>© 2026 Pulseware Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
            <div className="hidden sm:flex items-center gap-1.5 text-slate-600">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>All Systems Operational</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
