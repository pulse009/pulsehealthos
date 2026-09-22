'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Zap } from 'lucide-react';
import { AnnouncementContent } from '@/lib/cms/types';
import { DEFAULT_SITE_CONTENT } from '@/lib/cms/defaults';

interface TopAnnouncementBarProps {
  content?: AnnouncementContent;
}

export function TopAnnouncementBar({ content = DEFAULT_SITE_CONTENT.announcement }: TopAnnouncementBarProps) {
  if (content.isEnabled === false) {
    return null;
  }

  return (
    <div className="w-full bg-[#093e38] text-teal-100 text-xs py-2 px-3 sm:px-4 text-center font-medium flex items-center justify-center gap-1.5 sm:gap-2 border-b border-teal-800/40 relative z-40">
      {content.badge && (
        <span className="inline-flex items-center gap-1 bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider shrink-0">
          <Zap className="size-3" /> {content.badge}
        </span>
      )}
      
      <span className="hidden sm:inline truncate max-w-2xl">
        {content.textDesktop}
      </span>
      <span className="sm:hidden truncate max-w-[200px]">
        {content.textMobile || content.textDesktop}
      </span>

      {content.linkText && (
        <Link
          href={content.linkHref || '/contact'}
          className="underline font-semibold hover:text-white transition-colors ml-1 inline-flex items-center gap-0.5 shrink-0"
        >
          <span>{content.linkText}</span>
          <ChevronRight className="size-3" />
        </Link>
      )}
    </div>
  );
}
