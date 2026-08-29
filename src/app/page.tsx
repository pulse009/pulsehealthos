import React from 'react';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth/session';
import {
  Clock,
  MessageSquare,
  CheckCircle2,
  BarChart2,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getSessionUser();

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50/90 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between font-sans antialiased selection:bg-emerald-500 selection:text-white relative bg-dot-pattern">
      {/* Top Navbar with White Background */}
      <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm py-4 px-6 sm:px-12 flex items-center justify-between z-30 shrink-0">
        {/* Left Nav Links */}
        <nav className="flex items-center gap-8 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <Link href="/login" className="hover:text-emerald-600 transition-colors">
            Platform
          </Link>
          <Link href="/login" className="hover:text-emerald-600 transition-colors">
            Solutions
          </Link>
          <Link href="/login" className="hover:text-emerald-600 transition-colors">
            Pricing
          </Link>
          <Link href="/login" className="hover:text-emerald-600 transition-colors">
            Resources
          </Link>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <Link
              href={user.role === 'SUPER_ADMIN' ? '/admin' : '/portal'}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md"
            >
              Dashboard →
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-emerald-600 px-3 py-2 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-slate-400 text-xs font-bold transition-all shadow-sm bg-white dark:bg-slate-900"
              >
                Sign Up Free
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Center Canvas (100% Non-Scrollable Fit) */}
      <main className="flex-1 w-full max-w-7xl mx-auto flex items-center justify-center relative px-6 z-20 overflow-hidden">
        {/* Floating 3D Geometric Orbs scattered in background */}
        <div className="absolute top-12 left-[18%] size-3.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-float"></div>
        <div className="absolute top-20 right-[22%] size-4 rounded-md bg-purple-500 transform rotate-45 shadow-lg shadow-purple-500/50 animate-float-delayed"></div>
        <div className="absolute bottom-24 left-[20%] size-5 rounded-full border-4 border-amber-400 animate-float"></div>
        <div className="absolute bottom-16 right-[24%] size-3.5 rounded-full bg-indigo-500 animate-float-delayed"></div>

        {/* 1. TOP-LEFT FLOATING CARD: Yellow Sticky Note */}
        <div className="absolute top-6 left-4 sm:top-10 sm:left-10 hidden lg:block z-20 animate-float">
          <div className="w-52 bg-[#fde047] text-slate-900 p-4 rounded-xl shadow-2xl border border-yellow-300 transform -rotate-6 space-y-2 relative">
            <div className="flex items-center justify-between">
              <div className="size-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                <CheckCircle2 className="size-4 text-amber-900" />
              </div>
            </div>
            <div className="pt-1">
              <span className="text-sm font-extrabold block leading-snug">
                Booked:
              </span>
              <span className="text-sm font-extrabold block leading-snug">
                Appt @ 2 PM
              </span>
            </div>
          </div>
        </div>

        {/* 2. TOP-RIGHT FLOATING CARD: Appointment Tomorrow Card */}
        <div className="absolute top-6 right-4 sm:top-10 sm:right-10 hidden lg:block z-20 animate-float-delayed">
          <div className="w-64 bg-gradient-to-tr from-sky-100/90 to-purple-100/90 dark:from-slate-800/90 dark:to-purple-950/90 backdrop-blur border border-sky-200/80 dark:border-purple-800/80 rounded-2xl p-4 shadow-2xl text-left space-y-3 transform rotate-3">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-full bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700 flex items-center justify-center text-amber-600 dark:text-amber-300 shadow-md">
                <Clock className="size-5 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  Appointment:
                </h4>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  Tomorrow 10:00 AM
                </p>
              </div>
            </div>
            <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                Reminder Set
              </span>
            </div>
          </div>
        </div>

        {/* 3. CENTER HERO CONTENT */}
        <div className="max-w-2xl mx-auto text-center space-y-5 z-20">
          {/* Center 3D 4-Dot Glossy App Icon */}
          <div className="inline-flex items-center justify-center size-20 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-4 animate-float">
            <div className="grid grid-cols-2 gap-2 w-full h-full">
              <span className="bg-emerald-500 rounded-full size-3.5 shadow-sm shadow-emerald-500/50"></span>
              <span className="bg-blue-600 rounded-full size-3.5 shadow-sm shadow-blue-600/50"></span>
              <span className="bg-purple-600 rounded-full size-3.5 shadow-sm shadow-purple-600/50"></span>
              <span className="bg-amber-500 rounded-full size-3.5 shadow-sm shadow-amber-500/50"></span>
            </div>
          </div>

          {/* Main Title (Exact Image Match) */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Automate, book, and
            <br />
            care all in one place
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto font-medium leading-relaxed">
            The all-in-one platform for scheduling, workflow automation, and exceptional customer care. Boost productivity and elevate client experiences effortlessly.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95"
            >
              Get Started For Free
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-7 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-sm hover:bg-slate-50 transition-all"
            >
              Watch Demo
            </Link>
          </div>
        </div>

        {/* 4. BOTTOM-LEFT FLOATING CARD: Workflow Progress */}
        <div className="absolute bottom-6 left-4 sm:bottom-10 sm:left-10 hidden lg:block z-20 animate-float-delayed">
          <div className="w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xl text-left space-y-3 transform -rotate-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
              <div className="flex items-center gap-1.5">
                <BarChart2 className="size-4 text-emerald-500" />
                <span>Workflow Progress</span>
              </div>
              <span className="text-emerald-600">65%</span>
            </div>

            {/* Gradient Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full w-[65%] rounded-full"></div>
            </div>

            {/* 3D Vertical Bar Chart */}
            <div className="flex items-end gap-2 h-10 pt-1 justify-between px-1">
              <div className="w-4 bg-blue-500 rounded-t-md h-6"></div>
              <div className="w-4 bg-emerald-500 rounded-t-md h-8"></div>
              <div className="w-4 bg-cyan-500 rounded-t-md h-4"></div>
              <div className="w-4 bg-emerald-600 rounded-t-md h-10"></div>
              <div className="w-4 bg-indigo-500 rounded-t-md h-7"></div>
            </div>
          </div>
        </div>

        {/* 5. BOTTOM-RIGHT FLOATING CARD: WhatsApp Cloud API Integration */}
        <div className="absolute bottom-6 right-4 sm:bottom-10 sm:right-10 hidden lg:block z-20 animate-float">
          <div className="w-64 bg-gradient-to-tr from-emerald-600 via-teal-600 to-pink-500 text-white rounded-2xl p-4 shadow-2xl text-left space-y-3 transform rotate-3 border border-emerald-400/30 relative overflow-hidden">
            {/* WhatsApp Logo Circle */}
            <div className="size-11 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-md">
              <MessageSquare className="size-6 text-white stroke-[2.5]" />
            </div>

            <div>
              <h4 className="text-xs font-extrabold leading-tight">
                WhatsApp Cloud
              </h4>
              <h4 className="text-xs font-extrabold leading-tight">
                API Integration
              </h4>
            </div>

            <div className="flex items-center justify-between pt-1 text-[10px] font-bold border-t border-white/20">
              <span className="opacity-90">Chat Syncing Live</span>
              <span className="bg-emerald-400 text-slate-950 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                Active
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer spacer (shrink-0) */}
      <footer className="w-full py-2 text-center text-[10px] text-slate-400 shrink-0 z-30">
        ClinicAI Platform © 2026 Reveal Clinics Riyadh
      </footer>
    </div>
  );
}
