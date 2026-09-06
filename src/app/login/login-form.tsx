'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Lock, Mail } from 'lucide-react';

function safeRedirect(candidate: string | undefined, fallback: string): string {
  if (!candidate) return fallback;
  if (!candidate.startsWith('/') || candidate.startsWith('//')) return fallback;
  return candidate;
}

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json();

      if (!response.ok) {
        setError(body?.error?.message ?? 'Sign in failed. Please check your credentials.');
        setPending(false);
        return;
      }

      router.replace(safeRedirect(nextPath, body.redirectTo ?? '/'));
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      setPending(false);
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={onSubmit} className="space-y-4 text-left" noValidate>

        {/* Email / Username Field */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-xs font-medium text-slate-700">
            Username, Staff ID or Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Mail className="size-4 text-slate-400" />
            </div>
            <input
              id="email"
              name="email"
              type="text"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@revealclinic.com"
              disabled={pending}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-[8px] text-sm font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50 disabled:bg-slate-50"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-xs font-medium text-slate-700">
              Password
            </label>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock className="size-4 text-slate-400" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={pending}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-[8px] text-sm font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50 disabled:bg-slate-50"
            />
          </div>
        </div>

        {/* Error message */}
        {error ? (
          <div
            role="alert"
            className="rounded-[8px] border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700"
          >
            {error}
          </div>
        ) : null}

        {/* Submit button */}
        <button
          type="submit"
          disabled={pending || !email || !password}
          className="w-full py-2.5 px-6 rounded-[8px] bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm shadow-sm shadow-purple-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-1"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Signing in…</span>
            </>
          ) : (
            <>
              <span>Sign in to Dashboard</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
