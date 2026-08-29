import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { LoginForm } from './login-form';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = { title: 'Sign in' };
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
    <div className="h-screen w-screen overflow-hidden bg-slate-50/90 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between font-sans antialiased selection:bg-emerald-500 selection:text-white relative bg-dot-pattern">
      {/* Top Navbar with Solid White Background */}
      <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm py-4 px-6 sm:px-12 flex items-center justify-between z-30 shrink-0">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="size-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-center gap-0.5 p-1.5 transition-transform group-hover:scale-105">
            <div className="grid grid-cols-2 gap-1 w-full h-full">
              <span className="bg-emerald-500 rounded-full size-2"></span>
              <span className="bg-slate-800 dark:bg-slate-200 rounded-full size-2"></span>
              <span className="bg-slate-800 dark:bg-slate-200 rounded-full size-2"></span>
              <span className="bg-slate-800 dark:bg-slate-200 rounded-full size-2"></span>
            </div>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Clinic<span className="text-emerald-600">AI</span>
          </span>
        </Link>

        {/* Right CTA Action */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Center Canvas */}
      <main className="flex-1 w-full max-w-7xl mx-auto flex items-center justify-center relative px-6 z-20 overflow-hidden">
        {/* Center Hero Login Card */}
        <div className="max-w-md w-full mx-auto text-center space-y-5 z-20">
          {/* Brand Logo above Welcome Text */}
          <div className="flex flex-col items-center gap-2">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="size-11 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl flex items-center justify-center p-2 transition-transform group-hover:scale-105">
                <div className="grid grid-cols-2 gap-1.5 w-full h-full">
                  <span className="bg-emerald-500 rounded-full size-2.5"></span>
                  <span className="bg-slate-800 dark:bg-slate-200 rounded-full size-2.5"></span>
                  <span className="bg-slate-800 dark:bg-slate-200 rounded-full size-2.5"></span>
                  <span className="bg-slate-800 dark:bg-slate-200 rounded-full size-2.5"></span>
                </div>
              </div>
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Clinic<span className="text-emerald-600">AI</span>
              </span>
            </Link>
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome back
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Sign in to manage doctor schedules, AI WhatsApp bookings & clinic care.
            </p>
          </div>

          {params.error === 'configuration' ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              The server is not fully configured. Contact your administrator.
            </div>
          ) : null}

          {/* Login Glassmorphic Form Card */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <LoginForm nextPath={params.next} />
          </div>
        </div>
      </main>

      {/* Footer spacer */}
      <footer className="w-full py-2 text-center text-[10px] text-slate-400 shrink-0 z-30">
        ClinicAI Platform © 2026 Reveal Clinics Riyadh
      </footer>
    </div>
  );
}
