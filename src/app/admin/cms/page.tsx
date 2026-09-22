import type { Metadata } from 'next';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { getAllSiteContent } from '@/lib/cms/service';
import { CmsAdminClient } from './cms-admin-client';

export const metadata: Metadata = {
  title: 'Website Dynamic CMS · Master Admin',
  description: 'Manage dynamic marketing copy, pricing, features, phone numbers, and announcements for public pages.',
};

export const dynamic = 'force-dynamic';

export default async function AdminCmsPage() {
  const { user } = await requireSuperAdmin();
  const initialContent = await getAllSiteContent();

  return (
    <div className="space-y-6">
      <CmsAdminClient
        initialContent={initialContent}
        adminName={user.name || user.email}
      />
    </div>
  );
}
