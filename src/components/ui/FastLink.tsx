'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/components/ui/primitives';

export interface FastLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  active?: boolean;
  activeClassName?: string;
  inactiveClassName?: string;
  onNavigate?: (href: string) => void;
  children: React.ReactNode;
}

/**
 * FastLink: ClickUp / Linear / Jira grade instant navigation link.
 * - Enforces Next.js App Router full RSC route prefetching (`prefetch={true}`).
 * - Triggers instant prefetch on mouse hover, pointer enter, touch start, and pointer down.
 * - Supports zero-latency optimistic active state callbacks on pointer down.
 */
export const FastLink = React.forwardRef<HTMLAnchorElement, FastLinkProps>(function FastLink(
  {
    href,
    active,
    activeClassName,
    inactiveClassName,
    className,
    onNavigate,
    onClick,
    onMouseEnter,
    onPointerEnter,
    onPointerDown,
    onTouchStart,
    children,
    ...props
  },
  ref
) {
  const router = useRouter();

  const handlePrefetch = useCallback(() => {
    if (href && typeof href === 'string' && !href.startsWith('http') && !href.startsWith('#')) {
      try {
        router.prefetch(href);
      } catch {}
    }
  }, [href, router]);

  return (
    <Link
      ref={ref}
      href={href}
      prefetch={true}
      onMouseEnter={(e) => {
        handlePrefetch();
        if (onMouseEnter) onMouseEnter(e);
      }}
      onPointerEnter={(e) => {
        handlePrefetch();
        if (onPointerEnter) onPointerEnter(e);
      }}
      onTouchStart={(e) => {
        handlePrefetch();
        if (onTouchStart) onTouchStart(e);
      }}
      onPointerDown={(e) => {
        handlePrefetch();
        if (onNavigate) onNavigate(href);
        if (onPointerDown) onPointerDown(e);
      }}
      onClick={(e) => {
        if (onNavigate) onNavigate(href);
        if (onClick) onClick(e);
      }}
      className={cn(className, active ? activeClassName : inactiveClassName)}
      {...props}
    >
      {children}
    </Link>
  );
});
