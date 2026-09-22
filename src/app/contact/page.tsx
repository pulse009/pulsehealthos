import React from 'react';
import { getSessionUser } from '@/lib/auth/session';
import { getAllSiteContent } from '@/lib/cms/service';
import { ContactPageClient } from './contact-page-client';

export const metadata = {
  title: 'Contact Us · Pulseware Healthcare OS',
  description:
    'Connect with the Pulseware clinical team: Schedule a live demo, inquire about pricing, or connect with our 24/7 clinical hotline.',
};

export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  const user = await getSessionUser();
  const cmsContent = await getAllSiteContent();

  const portalHref = user
    ? user.role === 'SUPER_ADMIN'
      ? '/admin'
      : '/portal'
    : '/login';

  return (
    <ContactPageClient
      cmsContent={cmsContent}
      user={user}
      portalHref={portalHref}
    />
  );
}
