import React from 'react';
import { getSessionUser } from '@/lib/auth/session';
import { getAllSiteContent } from '@/lib/cms/service';
import { PricingPageClient } from './pricing-page-client';

export const metadata = {
  title: 'Pricing & Plans · Pulseware Healthcare OS',
  description:
    'Transparent pricing for hospitals and clinics: Pulse HealthOS PMS (1,099 SAR/mo), Pulse Now WhatsApp AI (499 SAR/mo), and Pulse Speak Voice Telephony.',
};

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const user = await getSessionUser();
  const cmsContent = await getAllSiteContent();

  const portalHref = user
    ? user.role === 'SUPER_ADMIN'
      ? '/admin'
      : '/portal'
    : '/login';

  return (
    <PricingPageClient
      cmsContent={cmsContent}
      user={user}
      portalHref={portalHref}
    />
  );
}
