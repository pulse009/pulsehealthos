import 'server-only';
import type { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { conflict, forbidden, notFound } from '@/lib/errors';
import { recordAudit } from '@/lib/audit';
import { hashPassword } from '@/lib/auth/password';
import { assertOwned, assertPlatformScope, clinicWhere, resolveClinicId, type TenantScope } from '@/lib/tenancy/scope';
import type {
  doctorSchema,
  clinicDoctorOperationalSchema,
  createCoordinatorSchema,
  doctorTimeOffSchema,
  serviceSchema,
} from '@/lib/validation/schemas';

/**
 * Doctors and services.
 *
 * Both are configuration, so writes are SUPER_ADMIN-only; reads are scoped so a
 * CLIENT can still see their own clinic's roster in the portal.
 *
 * The doctor↔service join is rewritten wholesale on save rather than diffed —
 * simpler to reason about, and the row counts involved are small.
 */

// --- Doctors ---------------------------------------------------------------

export async function listDoctors(scope: TenantScope, clinicId?: string | null) {
  return prisma.doctor.findMany({
    where: clinicWhere(scope, clinicId),
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      specialty: true,
      imageUrl: true,
      isActive: true,
      appointmentMinutes: true,
      bufferMinutes: true,
      clinic: { select: { id: true, name: true, timezone: true } },
      services: { select: { service: { select: { id: true, name: true } } } },
      schedules: { select: { weekday: true, startMinute: true, endMinute: true } },
      _count: { select: { appointments: true } },
    },
  });
}

export async function getDoctor(scope: TenantScope, doctorId: string) {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: {
      services: { select: { serviceId: true } },
      schedules: { orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }] },
      breaks: { orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }] },
      timeOff: { orderBy: { startDate: 'asc' } },
    },
  });
  if (!doctor) throw notFound('Doctor not found.');
  if (scope.kind !== 'PLATFORM' && doctor.clinicId !== scope.clinicId) {
    throw notFound('Doctor not found.');
  }
  return doctor;
}

export async function saveDoctor(
  scope: TenantScope,
  clinicId: string,
  input: z.infer<typeof doctorSchema>,
  doctorId?: string,
) {
  const id = resolveClinicId(scope, clinicId);
  if (scope.kind !== 'PLATFORM' && scope.clinicId !== id) {
    throw forbidden('Cannot manage doctors for another clinic.');
  }

  // Reject service ids belonging to another clinic before writing anything.
  if (input.serviceIds.length > 0) {
    const owned = await prisma.service.count({
      where: { id: { in: input.serviceIds }, clinicId: id },
    });
    if (owned !== input.serviceIds.length) {
      throw notFound('One or more selected services do not belong to this clinic.');
    }
  }

  const base = {
    name: input.name,
    specialty: input.specialty ?? null,
    description: input.description ?? null,
    imageUrl: input.imageUrl || null,
    isActive: input.isActive,
    appointmentMinutes: input.appointmentMinutes ?? null,
    bufferMinutes: input.bufferMinutes ?? null,
    coordinatorId: input.coordinatorId ?? null,
  };

  const doctor = await prisma.$transaction(async (tx) => {
    const row = doctorId
      ? await tx.doctor.update({ where: { id: doctorId }, data: base })
      : await tx.doctor.create({ data: { clinicId: id, ...base } });

    await tx.doctorService.deleteMany({ where: { doctorId: row.id } });
    if (input.serviceIds.length > 0) {
      await tx.doctorService.createMany({
        data: input.serviceIds.map((serviceId) => ({
          doctorId: row.id,
          serviceId,
          clinicId: id,
        })),
      });
    }

    await tx.doctorSchedule.deleteMany({ where: { doctorId: row.id } });
    if (input.schedules.length > 0) {
      await tx.doctorSchedule.createMany({
        data: input.schedules.map((s) => ({
          doctorId: row.id,
          clinicId: id,
          weekday: s.weekday,
          startMinute: s.startMinute,
          endMinute: s.endMinute,
        })),
      });
    }

    await tx.doctorBreak.deleteMany({ where: { doctorId: row.id } });
    if (input.breaks.length > 0) {
      await tx.doctorBreak.createMany({
        data: input.breaks.map((b) => ({
          doctorId: row.id,
          clinicId: id,
          weekday: b.weekday,
          startMinute: b.startMinute,
          endMinute: b.endMinute,
          label: b.label ?? null,
        })),
      });
    }

    return row;
  });

  if (input.email) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true, clinicId: true },
    });
    if (!existing) {
      const passwordHash = await hashPassword(input.password || 'Doctor123!');
      await prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          passwordHash,
          role: 'CLIENT',
          clinicId: id,
          isActive: true,
        },
      });
    }
  }

  await recordAudit(scope, {
    action: doctorId ? 'doctor.update' : 'doctor.create',
    entityType: 'Doctor',
    entityId: doctor.id,
    clinicId: id,
    metadata: { name: input.name, services: input.serviceIds.length },
  });
  return doctor;
}

export async function deleteDoctor(scope: TenantScope, clinicId: string, doctorId: string) {
  assertPlatformScope(scope, 'manage doctors');

  // Appointments reference doctors with onDelete: Restrict, so a doctor with
  // history is deactivated instead of removed — deleting would orphan records
  // the clinic still needs for reporting.
  const appointments = await prisma.appointment.count({ where: { doctorId, clinicId } });
  if (appointments > 0) {
    throw conflict(
      'This doctor has appointments and cannot be deleted. Deactivate them instead.',
    );
  }

  await prisma.doctor.deleteMany({ where: { id: doctorId, clinicId } });
  await recordAudit(scope, {
    action: 'doctor.delete',
    entityType: 'Doctor',
    entityId: doctorId,
    clinicId,
  });
}

export async function getClinicDoctorDetail(scope: TenantScope, doctorId: string) {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: {
      clinic: { select: { id: true, name: true, timezone: true } },
      coordinator: { select: { id: true, name: true, email: true } },
      services: {
        select: {
          serviceId: true,
          service: { select: { id: true, name: true, durationMinutes: true, isActive: true } },
        },
      },
      schedules: { orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }] },
      breaks: { orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }] },
      timeOff: { orderBy: { startDate: 'desc' } },
      appointments: {
        orderBy: { startsAt: 'desc' },
        take: 50,
        select: {
          id: true,
          appointmentNumber: true,
          startsAt: true,
          status: true,
          timezone: true,
          service: { select: { name: true } },
          patient: { select: { id: true, name: true, phone: true, fileNumber: true } },
        },
      },
      _count: { select: { appointments: true } },
    },
  });
  if (!doctor) throw notFound('Doctor not found.');
  assertOwned(scope, doctor, 'Doctor');
  return doctor;
}

export async function updateClinicDoctorOperational(
  scope: TenantScope,
  clinicId: string,
  doctorId: string,
  input: z.infer<typeof clinicDoctorOperationalSchema>,
) {
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, clinicId },
    select: { id: true, clinicId: true, name: true },
  });
  if (!doctor) throw notFound('Doctor not found.');
  assertOwned(scope, doctor, 'Doctor');

  const updateData: any = {};
  if (input.name) updateData.name = input.name;
  if (input.specialty !== undefined) updateData.specialty = input.specialty;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.imageUrl !== undefined) updateData.imageUrl = input.imageUrl;
  if (typeof input.isActive === 'boolean') updateData.isActive = input.isActive;
  if (input.appointmentMinutes !== undefined) updateData.appointmentMinutes = input.appointmentMinutes;
  if (input.bufferMinutes !== undefined) updateData.bufferMinutes = input.bufferMinutes;
  if (input.coordinatorId !== undefined) updateData.coordinatorId = input.coordinatorId;

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.doctor.update({
      where: { id: doctorId },
      data: updateData,
    });

    if (input.serviceIds !== undefined) {
      await tx.doctorService.deleteMany({ where: { doctorId } });
      if (input.serviceIds.length > 0) {
        await tx.doctorService.createMany({
          data: input.serviceIds.map((serviceId) => ({
            doctorId,
            serviceId,
            clinicId,
          })),
        });
      }
    }

    if (input.schedules !== undefined) {
      await tx.doctorSchedule.deleteMany({ where: { doctorId } });
      if (input.schedules.length > 0) {
        await tx.doctorSchedule.createMany({
          data: input.schedules.map((s) => ({
            doctorId,
            clinicId,
            weekday: s.weekday,
            startMinute: s.startMinute,
            endMinute: s.endMinute,
          })),
        });
      }
    }

    if (input.breaks !== undefined) {
      await tx.doctorBreak.deleteMany({ where: { doctorId } });
      if (input.breaks.length > 0) {
        await tx.doctorBreak.createMany({
          data: input.breaks.map((b) => ({
            doctorId,
            clinicId,
            weekday: b.weekday,
            startMinute: b.startMinute,
            endMinute: b.endMinute,
            label: b.label ?? null,
          })),
        });
      }
    }

    return row;
  });

  await recordAudit(scope, {
    action: 'doctor.operational_update',
    entityType: 'Doctor',
    entityId: doctor.id,
    clinicId,
    metadata: { name: doctor.name, isActive: input.isActive },
  });

  return updated;
}

export async function addDoctorTimeOff(
  scope: TenantScope,
  clinicId: string,
  doctorId: string,
  input: z.infer<typeof doctorTimeOffSchema>,
) {
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, clinicId },
    select: { id: true, clinicId: true },
  });
  if (!doctor) throw notFound('Doctor not found.');
  assertOwned(scope, doctor, 'Doctor');

  const timeOff = await prisma.doctorTimeOff.create({
    data: {
      doctorId,
      clinicId,
      reason: input.reason ?? null,
      startDate: input.startDate,
      endDate: input.endDate,
      startMinute: input.startMinute ?? null,
      endMinute: input.endMinute ?? null,
    },
  });
  await recordAudit(scope, {
    action: 'doctor.timeoff.create',
    entityType: 'DoctorTimeOff',
    entityId: timeOff.id,
    clinicId,
    metadata: { doctorId, startDate: input.startDate, endDate: input.endDate },
  });
  return timeOff;
}

export async function deleteDoctorTimeOff(
  scope: TenantScope,
  clinicId: string,
  timeOffId: string,
) {
  const timeOff = await prisma.doctorTimeOff.findFirst({
    where: { id: timeOffId, clinicId },
    select: { id: true, clinicId: true, doctorId: true },
  });
  if (!timeOff) throw notFound('Blocked period not found.');
  assertOwned(scope, timeOff, 'DoctorTimeOff');

  await prisma.doctorTimeOff.deleteMany({ where: { id: timeOffId, clinicId } });
  await recordAudit(scope, {
    action: 'doctor.timeoff.delete',
    entityType: 'DoctorTimeOff',
    entityId: timeOffId,
    clinicId,
  });
}

// --- Services --------------------------------------------------------------

export async function listServices(scope: TenantScope, clinicId?: string | null) {
  return prisma.service.findMany({
    where: clinicWhere(scope, clinicId),
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      description: true,
      durationMinutes: true,
      bufferMinutes: true,
      priceMinor: true,
      currency: true,
      isActive: true,
      clinic: { select: { id: true, name: true } },
      doctors: { select: { doctor: { select: { id: true, name: true } } } },
      _count: { select: { appointments: true } },
    },
  });
}

export async function saveService(
  scope: TenantScope,
  clinicId: string,
  input: z.infer<typeof serviceSchema>,
  serviceId?: string,
) {
  const id = resolveClinicId(scope, clinicId);
  if (scope.kind !== 'PLATFORM' && scope.clinicId !== id) {
    throw forbidden('Cannot manage services for another clinic.');
  }

  if (input.doctorIds.length > 0) {
    const owned = await prisma.doctor.count({
      where: { id: { in: input.doctorIds }, clinicId: id },
    });
    if (owned !== input.doctorIds.length) {
      throw notFound('One or more selected doctors do not belong to this clinic.');
    }
  }

  const clash = await prisma.service.findFirst({
    where: { clinicId: id, name: input.name, ...(serviceId ? { NOT: { id: serviceId } } : {}) },
    select: { id: true },
  });
  if (clash) throw conflict('A service with that name already exists at this clinic.');

  const base = {
    name: input.name,
    description: input.description ?? null,
    durationMinutes: input.durationMinutes,
    bufferMinutes: input.bufferMinutes ?? null,
    // Money is persisted in minor units to keep arithmetic exact.
    priceMinor:
      input.price === null || input.price === undefined ? null : Math.round(input.price * 100),
    currency: input.currency ?? 'USD',
    isActive: input.isActive,
  };

  const service = await prisma.$transaction(async (tx) => {
    const row = serviceId
      ? await tx.service.update({ where: { id: serviceId }, data: base })
      : await tx.service.create({ data: { clinicId: id, ...base } });

    await tx.doctorService.deleteMany({ where: { serviceId: row.id } });
    if (input.doctorIds.length > 0) {
      await tx.doctorService.createMany({
        data: input.doctorIds.map((doctorId) => ({ doctorId, serviceId: row.id, clinicId: id })),
      });
    }
    return row;
  });

  await recordAudit(scope, {
    action: serviceId ? 'service.update' : 'service.create',
    entityType: 'Service',
    entityId: service.id,
    clinicId: id,
    metadata: { name: input.name, durationMinutes: input.durationMinutes },
  });
  return service;
}

export async function deleteService(scope: TenantScope, clinicId: string, serviceId: string) {
  const id = resolveClinicId(scope, clinicId);
  if (scope.kind !== 'PLATFORM' && scope.clinicId !== id) {
    throw forbidden('Cannot manage services for another clinic.');
  }

  const appointments = await prisma.appointment.count({ where: { serviceId, clinicId: id } });
  if (appointments > 0) {
    throw conflict(
      'This service has appointments and cannot be deleted. Deactivate it instead.',
    );
  }
  await prisma.service.deleteMany({ where: { id: serviceId, clinicId: id } });
  await recordAudit(scope, {
    action: 'service.delete',
    entityType: 'Service',
    entityId: serviceId,
    clinicId: id,
  });
}

// --- Coordinators & Clinic Staff -------------------------------------------

export async function listClinicCoordinators(scope: TenantScope, clinicId: string) {
  const id = resolveClinicId(scope, clinicId);
  return prisma.user.findMany({
    where: { clinicId: id, isActive: true },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: 'asc' },
  });
}

export async function createClinicCoordinator(
  scope: TenantScope,
  clinicId: string,
  input: z.infer<typeof createCoordinatorSchema>,
) {
  const id = resolveClinicId(scope, clinicId);
  if (scope.kind !== 'PLATFORM' && scope.clinicId !== id) {
    throw forbidden('Cannot manage staff for another clinic.');
  }

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) throw conflict('An account with that email already exists.');

  const rawPassword = input.password && input.password.length >= 8 ? input.password : 'ClinicStaff123!';
  const passwordHash = await hashPassword(rawPassword);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
      role: 'CLIENT',
      clinicId: id,
    },
    select: { id: true, name: true, email: true, role: true, clinicId: true },
  });

  await recordAudit(scope, {
    action: 'coordinator.create',
    entityType: 'User',
    entityId: user.id,
    clinicId: id,
    metadata: { name: user.name, email: user.email },
  });

  return user;
}
