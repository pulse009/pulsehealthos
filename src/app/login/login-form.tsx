'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';

function safeRedirect(candidate: string | undefined, fallback: string): string {
  if (!candidate) return fallback;
  if (!candidate.startsWith('/') || candidate.startsWith('//')) return fallback;
  return candidate;
}

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        setError(body?.error?.message ?? 'Invalid credentials. Please check your username and password.');
        setPending(false);
        return;
      }

      router.replace(safeRedirect(nextPath, body.redirectTo ?? '/'));
      router.refresh();
    } catch {
      setError('Could not reach the server. Please check your connection.');
      setPending(false);
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={onSubmit} className="space-y-4 text-left" noValidate>

        {/* Email / Username Field */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-xs font-medium text-slate-700">
            Work Email or Staff ID
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="size-4" />
            </div>
            <input
              id="email"
              name="email"
              type="text"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@clinic.com"
              disabled={pending}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200/90 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#0d8276] focus:ring-4 focus:ring-[#0d8276]/10 transition-all disabled:opacity-50"
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
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="size-4" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={pending}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 border border-slate-200/90 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#0d8276] focus:ring-4 focus:ring-[#0d8276]/10 transition-all disabled:opacity-50"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs font-medium text-rose-700 animate-in fade-in duration-200"
          >
            {error}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={pending || !email || !password}
          className="w-full py-3 px-6 rounded-xl bg-[#0d6157] hover:bg-[#0a4e46] text-white font-medium text-sm shadow-[0_4px_16px_rgba(13,97,87,0.25)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Authenticating…</span>
            </>
          ) : (
            <>
              <span>Sign In to Workspace</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
