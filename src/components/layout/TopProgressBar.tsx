'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // When pathname or searchParams change, route has finished loading
    setLoading(false);
    setProgress(100);
    const timer = setTimeout(() => setProgress(0), 200);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest('a');
      if (!target || !target.href) return;
      
      const currentUrl = new URL(window.location.href);
      const targetUrl = new URL(target.href, window.location.href);

      // Only trigger for same-origin navigation that changes the path
      if (
        targetUrl.origin === currentUrl.origin &&
        (targetUrl.pathname !== currentUrl.pathname || targetUrl.search !== currentUrl.search) &&
        !target.hasAttribute('download') &&
        target.target !== '_blank'
      ) {
        setLoading(true);
        setProgress(40);
        setTimeout(() => setProgress((prev) => (prev > 0 && prev < 80 ? 75 : prev)), 120);
      }
    };

    document.addEventListener('click', handleAnchorClick, { capture: true });
    return () => document.removeEventListener('click', handleAnchorClick, { capture: true });
  }, []);

  if (progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none h-0.5 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-blue-600 via-teal-400 to-blue-500 shadow-sm shadow-blue-500/50 transition-all duration-150 ease-out"
        style={{
          width: `${progress}%`,
          opacity: loading ? 1 : 0,
          transition: 'width 150ms ease-out, opacity 200ms ease-in',
        }}
      />
    </div>
  );
}
