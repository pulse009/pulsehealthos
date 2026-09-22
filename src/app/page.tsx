import React from 'react';
import { getSessionUser } from '@/lib/auth/session';
import { getAllSiteContent } from '@/lib/cms/service';
import LandingPageClient from '@/components/landing/LandingPageClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pulseware · The Intelligent Healthcare Operating System',
  description:
    'Comprehensive Healthcare OS: Autonomous WhatsApp & Voice AI Patient Booking, Smart EHR, Pharmacy Inventory, Diagnostic Lab Orders, and Doctor Payouts with zero double-booking guarantee.',
};

export default async function HomePage() {
  const user = await getSessionUser();
  const cmsContent = await getAllSiteContent();

  const portalHref = user
    ? user.role === 'SUPER_ADMIN'
      ? '/admin'
      : '/portal'
    : '/login';

  return (
    <LandingPageClient
      user={user}
      portalHref={portalHref}
      cmsContent={cmsContent}
    />
  );
}

