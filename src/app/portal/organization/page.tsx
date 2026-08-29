import type { Metadata } from 'next';
import { requireClientUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { Building2, MapPin, Phone, Clock, Globe, ShieldCheck, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Organization Profile' };
export const dynamic = 'force-dynamic';

export default async function OrganizationPage() {
  const { clinicId } = await requireClientUser();

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId! },
    include: {
      hours: { orderBy: { weekday: 'asc' } },
      doctors: { where: { isActive: true } },
      services: { where: { isActive: true } },
    },
  });

  if (!clinic) return null;

  const weekdayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Building2 className="size-6 text-blue-600" />
            Organization Profile
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your clinic identity, operating hours, and location information.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={clinic.isActive ? 'success' : 'warning'} className="px-3 py-1 text-xs font-semibold">
            {clinic.isActive ? 'Active Organization' : 'Inactive'}
          </Badge>
        </div>
      </div>

      {/* Grid Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="surface rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="size-5 text-blue-600" />
            Clinic Details
          </h2>

          <div className="space-y-4 text-sm">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Clinic Name</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 text-base">{clinic.name}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Timezone</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                <Globe className="size-4 text-slate-400" />
                {clinic.timezone}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Currency</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">SAR</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Active Staff & Services</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {clinic.doctors.length} Doctors • {clinic.services.length} Services
              </span>
            </div>
          </div>
        </div>

        {/* Contact & Location */}
        <div className="surface rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="size-5 text-blue-600" />
            Contact & Location
          </h2>

          <div className="space-y-4 text-sm">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Address</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 block mt-0.5">
                {clinic.addressLine || 'Main Clinic Road'}, {clinic.city}, {clinic.country}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Phone Number</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                <Phone className="size-4 text-slate-400" />
                {clinic.phone || 'Not configured'}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">WhatsApp Booking Number</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                <Mail className="size-4 text-slate-400" />
                {clinic.whatsappNumber || clinic.phone || 'Not configured'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Operating Hours */}
      <div className="surface rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="size-5 text-blue-600" />
          Operating Hours
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
          {clinic.hours.map((h) => (
            <div
              key={h.id}
              className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs"
            >
              <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">
                {weekdayNames[h.weekday]}
              </span>
              {h.isClosed ? (
                <span className="text-rose-500 font-semibold">Closed</span>
              ) : (
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  {Math.floor(h.startMinute / 60)}:{(h.startMinute % 60).toString().padStart(2, '0')} –{' '}
                  {Math.floor(h.endMinute / 60)}:{(h.endMinute % 60).toString().padStart(2, '0')}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
