'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Zap } from 'lucide-react';

export function TopAnnouncementBar() {
  return (
    <div className="w-full bg-[#093e38] text-teal-100 text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2 border-b border-teal-800/40 relative z-40">
      <span className="inline-flex items-center gap-1 bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider">
        <Zap className="size-3" /> New Release
      </span>
      <span className="hidden sm:inline">Pulse Speak Autonomous Voice AI &amp; Multi-Branch Clinic Telephony is now live!</span>
      <span className="sm:hidden">Pulse Speak Voice AI is live!</span>
      <Link href="/pricing" className="underline font-semibold hover:text-white transition-colors ml-1 inline-flex items-center gap-0.5">
        View Solutions <ChevronRight className="size-3" />
      </Link>
    </div>
  );
}
