'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button, Card } from '@/components/ui/primitives';

/**
 * Global error boundary.
 *
 * Deliberately shows nothing about the underlying failure — Next.js strips
 * server error messages in production, and echoing them in development would
 * train us to expect detail that will not be there. The digest is the handle an
 * operator uses to find the real entry in the system log.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled UI error', { digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="max-w-md p-6 text-center">
        <h1 className="text-base font-semibold">Something went wrong</h1>
        <p className="text-muted mt-2 text-sm">
          The page could not be loaded. This has been logged; if it keeps happening, contact your
          platform administrator.
        </p>
        {error.digest ? (
          <p className="text-subtle mt-3 font-mono text-xs">Reference: {error.digest}</p>
        ) : null}
        <div className="mt-5 flex justify-center gap-2">
          <Button onClick={reset}>Try again</Button>
          <Link href="/">
            <Button variant="secondary">Go home</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
