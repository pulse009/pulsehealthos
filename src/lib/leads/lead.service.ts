import 'server-only';
import type { z } from 'zod';
import type { Prisma as PrismaTypes } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { notFound } from '@/lib/errors';
import { recordAudit } from '@/lib/audit';
import { assertOwned, clinicWhere, type TenantScope } from '@/lib/tenancy/scope';
import type { leadListSchema, leadUpdateSchema, appointmentListSchema } from '@/lib/validation/schemas';
import { startOfLocalDay, endOfLocalDay } from '@/lib/time/timezone';

/**
 * Leads, patients and appointment listings.
 *
 * Read paths are shared between the admin panel and the client portal — the
 * only difference is the scope handed in, so there is no second, laxer query
 * path for the portal to drift onto.
 */

export async function listLeads(scope: TenantScope, query: z.infer<typeof leadListSchema>) {
  const where: PrismaTypes.LeadWhereInput = {
    ...clinicWhere(scope, query.clinicId),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          patient: {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { lastContactAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: {
        id: true,
        status: true,
        source: true,
        notes: true,
        tags: true,
        firstContactAt: true,
        lastContactAt: true,
        clinic: { select: { id: true, name: true, timezone: true } },
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            appointments: {
              orderBy: { startsAt: 'asc' },
              where: { status: { in: ['PENDING', 'CONFIRMED'] } },
              take: 1,
              select: { id: true, startsAt: true, timezone: true, status: true },
            },
          },
        },
        _count: { select: { appointments: true } },
      },
    }),
    prisma.lead.count({ where }),
  ]);

  return {
    items,
    total,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: Math.ceil(total / query.pageSize),
  };
}

export async function getLead(scope: TenantScope, leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      clinicId: true,
      status: true,
      source: true,
      notes: true,
      tags: true,
      lostReason: true,
      firstContactAt: true,
      lastContactAt: true,
      qualifiedAt: true,
      bookedAt: true,
      clinic: { select: { id: true, name: true, timezone: true } },
      patient: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          fileNumber: true,
          notes: true,
          tags: true,
          conversations: {
            orderBy: { lastMessageAt: 'desc' },
            take: 5,
            select: {
              id: true,
              status: true,
              lastMessageAt: true,
              lastMessagePreview: true,
              messages: {
                orderBy: { createdAt: 'asc' },
                take: 30,
                select: {
                  id: true,
                  sender: true,
                  direction: true,
                  body: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      },
      appointments: {
        orderBy: { startsAt: 'desc' },
        take: 20,
        select: {
          id: true,
          appointmentNumber: true,
          startsAt: true,
          status: true,
          timezone: true,
          doctor: { select: { name: true } },
          service: { select: { name: true } },
        },
      },
    },
  });
  if (!lead) throw notFound('Lead not found.');
  assertOwned(scope, lead, 'Lead');
  return lead;
}

/**
 * Update funnel metadata.
 *
 * Deliberately available to CLIENT scope as well as admin: annotating one's own
 * leads is reporting hygiene, not platform configuration. Tenant isolation is
 * still enforced by `assertOwned`.
 */
export async function updateLead(
  scope: TenantScope,
  leadId: string,
  input: z.infer<typeof leadUpdateSchema>,
) {
  const existing = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, clinicId: true, status: true },
  });
  if (!existing) throw notFound('Lead not found.');
  assertOwned(scope, existing, 'Lead');

  const now = new Date();
  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      ...(input.status ? { status: input.status } : {}),
      ...(input.status === 'QUALIFIED' ? { qualifiedAt: now } : {}),
      ...(input.status === 'LOST' ? { lostAt: now, lostReason: input.lostReason ?? null } : {}),
      ...(input.notes !== undefined ? { notes: input.notes ?? null } : {}),
      ...(input.tags ? { tags: input.tags } : {}),
    },
  });

  await recordAudit(scope, {
    action: 'lead.update',
    entityType: 'Lead',
    entityId: leadId,
    clinicId: existing.clinicId,
    metadata: { from: existing.status, to: lead.status },
  });
  return lead;
}

export async function listAppointments(
  scope: TenantScope,
  query: z.infer<typeof appointmentListSchema>,
) {
  const base = clinicWhere(scope, query.clinicId);

  // Date filters are interpreted in the clinic's timezone when a single clinic
  // is in scope; a platform-wide query has no single local day, so it uses UTC.
  let timezone = 'UTC';
  if (base.clinicId) {
    const clinic = await prisma.clinic.findUnique({
      where: { id: base.clinicId },
      select: { timezone: true },
    });
    timezone = clinic?.timezone ?? 'UTC';
  }

  const where: PrismaTypes.AppointmentWhereInput = {
    ...base,
    ...(query.status ? { status: query.status } : {}),
    ...(query.doctorId ? { doctorId: query.doctorId } : {}),
    ...(query.from || query.to
      ? {
          startsAt: {
            ...(query.from ? { gte: startOfLocalDay(query.from, timezone) } : {}),
            ...(query.to ? { lt: endOfLocalDay(query.to, timezone) } : {}),
          },
        }
      : {}),
    ...(query.search
      ? {
          patient: {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search } },
            ],
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      orderBy: { startsAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: {
        id: true,
        appointmentNumber: true,
        startsAt: true,
        endsAt: true,
        status: true,
        source: true,
        timezone: true,
        notes: true,
        createdAt: true,
        clinic: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
        patient: { select: { id: true, name: true, phone: true, fileNumber: true } },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  return {
    items,
    total,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: Math.ceil(total / query.pageSize),
  };
}

export async function listPatients(scope: TenantScope, clinicId?: string | null, search?: string) {
  return prisma.patient.findMany({
    where: {
      ...clinicWhere(scope, clinicId),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      createdAt: true,
      lead: { select: { status: true } },
      _count: { select: { appointments: true } },
    },
  });
}
