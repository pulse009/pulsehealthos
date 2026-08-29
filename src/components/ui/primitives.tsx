import type { ReactNode, HTMLAttributes, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Presentational primitives.
 *
 * Server components by default — none of these hold state, so they add nothing
 * to the client bundle. Anything interactive lives in its own `'use client'`
 * file instead of being bolted on here.
 */

export const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs));

// --- Layout ---------------------------------------------------------------

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('surface card-shadow rounded-xl border', className)}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 border-b px-5 py-4', className)}>
      <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold">{title}</h2>
        {description ? <p className="text-muted mt-0.5 text-xs">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />;
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="text-muted mt-1 text-sm">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

// --- Buttons --------------------------------------------------------------

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-brand-600)] text-white hover:bg-[var(--color-brand-700)] disabled:bg-[var(--color-brand-400)]',
  secondary: 'surface border hover:surface-muted',
  ghost: 'hover:surface-muted border border-transparent',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-70',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
      {...props}
    />
  );
}

// --- Form controls --------------------------------------------------------

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-xs font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : hint ? (
        <p className="text-subtle text-xs">{hint}</p>
      ) : null}
    </div>
  );
}

const CONTROL_BASE =
  'w-full rounded-lg border bg-[var(--surface)] px-3 py-2 text-sm placeholder:text-[var(--text-subtle)] disabled:opacity-60';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL_BASE, 'h-9', className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROL_BASE, 'min-h-24 resize-y', className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(CONTROL_BASE, 'h-9', className)} {...props}>
      {children}
    </select>
  );
}

export function Checkbox({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={cn('flex cursor-pointer items-center gap-2 text-sm', className)}>
      <input type="checkbox" className="size-4 rounded border" {...props} />
      <span>{label}</span>
    </label>
  );
}

// --- Data display ---------------------------------------------------------

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-[var(--surface-muted)] text-[var(--text-muted)] border-[var(--border)]',
  success:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900',
  warning:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900',
  danger:
    'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900',
  info: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-900',
  brand:
    'bg-[var(--color-brand-50)] text-[var(--color-brand-700)] border-[var(--color-brand-200)] dark:bg-[var(--color-brand-900)]/40 dark:text-[var(--color-brand-200)] dark:border-[var(--color-brand-700)]',
};

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Status → tone mapping, shared so a status never renders two different ways. */
export function statusTone(status: string): BadgeTone {
  switch (status) {
    case 'CONFIRMED':
    case 'COMPLETED':
    case 'BOOKED':
    case 'QUALIFIED':
      return 'success';
    case 'PENDING':
    case 'CONTACTED':
    case 'RESCHEDULED':
      return 'warning';
    case 'CANCELLED':
    case 'NO_SHOW':
    case 'LOST':
    case 'ESCALATED':
    case 'FAILED':
      return 'danger';
    case 'NEW':
    case 'ACTIVE':
      return 'info';
    default:
      return 'neutral';
  }
}

/** Enum-ish value rendered for humans: NO_SHOW → "No show". */
export function humanise(value: string): string {
  const lower = value.toLowerCase().replace(/_/g, ' ');
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'default' | 'positive' | 'negative';
}) {
  return (
    <Card className="p-4">
      <p className="text-muted text-xs font-medium">{label}</p>
      <p
        className={cn(
          'mt-1.5 text-2xl font-semibold tabular-nums tracking-tight',
          tone === 'positive' && 'text-emerald-600 dark:text-emerald-400',
          tone === 'negative' && 'text-red-600 dark:text-red-400',
        )}
      >
        {value}
      </p>
      {hint ? <p className="text-subtle mt-1 text-xs">{hint}</p> : null}
    </Card>
  );
}

// --- Tables ---------------------------------------------------------------

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  // The wrapper, not the page, owns horizontal overflow.
  return (
    <div className="scroll-x">
      <table className={cn('w-full min-w-[640px] text-sm', className)}>{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'text-muted border-b px-4 py-2.5 text-left text-xs font-medium whitespace-nowrap',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn('border-b px-4 py-3 align-middle', className)}>{children}</td>;
}

// --- States ---------------------------------------------------------------

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="text-sm font-medium">{title}</p>
      {description ? <p className="text-muted mx-auto mt-1 max-w-sm text-sm">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 dark:border-red-900 dark:bg-red-950/40">
      <p className="text-sm font-medium text-red-800 dark:text-red-200">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-red-700 dark:text-red-300">{description}</p>
      ) : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('surface-muted animate-pulse rounded-md', className)} />;
}

// --- Pagination -----------------------------------------------------------

export function Pagination({
  page,
  pageCount,
  total,
  basePath,
  searchParams = {},
}: {
  page: number;
  pageCount: number;
  total: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
}) {
  if (pageCount <= 1) {
    return (
      <div className="text-muted flex items-center justify-between px-4 py-3 text-xs">
        <span>
          {total} {total === 1 ? 'result' : 'results'}
        </span>
      </div>
    );
  }

  const href = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    params.set('page', String(target));
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 text-xs">
      <span className="text-muted">
        Page {page} of {pageCount} · {total} results
      </span>
      <div className="flex gap-2">
        <a
          href={page > 1 ? href(page - 1) : undefined}
          aria-disabled={page <= 1}
          className={cn(
            'rounded-md border px-3 py-1.5',
            page <= 1 ? 'pointer-events-none opacity-40' : 'hover:surface-muted',
          )}
        >
          Previous
        </a>
        <a
          href={page < pageCount ? href(page + 1) : undefined}
          aria-disabled={page >= pageCount}
          className={cn(
            'rounded-md border px-3 py-1.5',
            page >= pageCount ? 'pointer-events-none opacity-40' : 'hover:surface-muted',
          )}
        >
          Next
        </a>
      </div>
    </div>
  );
}
