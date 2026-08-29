import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { env } from '@/env';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { getClinicDetail } from '@/lib/clinics/clinic.service';
import { AppError } from '@/lib/errors';
import { ClinicConfigTabsView } from './clinic-config-tabs-view';

export const metadata: Metadata = { title: 'Clinic configuration' };
export const dynamic = 'force-dynamic';

const COMMON_TIMEZONES = [
  'UTC',
  'Europe/London',
  'Europe/Dublin',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Istanbul',
  'Africa/Cairo',
  'Africa/Lagos',
  'Africa/Johannesburg',
  'Asia/Riyadh',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Dhaka',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'America/Toronto',
];

export default async function ClinicDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { scope } = await requireSuperAdmin();
  const { id } = await params;
  const { tab } = await searchParams;

  let clinic: Awaited<ReturnType<typeof getClinicDetail>>;
  try {
    clinic = await getClinicDetail(scope, id);
  } catch (error) {
    if (error instanceof AppError && error.code === 'NOT_FOUND') notFound();
    throw error;
  }

  const timezones = COMMON_TIMEZONES.includes(clinic.timezone)
    ? COMMON_TIMEZONES
    : [clinic.timezone, ...COMMON_TIMEZONES];

  const webhookUrl = `${env.APP_URL}/api/webhooks/whatsapp`;

  return (
    <ClinicConfigTabsView
      clinic={clinic}
      timezones={timezones}
      webhookUrl={webhookUrl}
      initialTab={tab ?? 'profile'}
    />
  );
}
