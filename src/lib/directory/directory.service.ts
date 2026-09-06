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
  doctorPaymentStructureSchema,
  createCoordinatorSchema,
  updateCoordinatorSchema,
  createStaffRoleSchema,
  resetStaffPasswordSchema,
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

export async function listDoctors(
  scope: TenantScope,
  clinicId?: string | null,
  coordinatorId?: string | null,
  userId?: string | null,
) {
  const whereClause: any = clinicWhere(scope, clinicId);
  if (coordinatorId) {
    whereClause.coordinatorId = coordinatorId;
  }
  if (userId) {
    whereClause.userId = userId;
  }
  return prisma.doctor.findMany({
    where: whereClause,
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
  const id = resolveClinicId(scope, clinicId);
  if (scope.kind !== 'PLATFORM' && scope.clinicId !== id) {
    throw forbidden('Cannot delete doctor for another clinic.');
  }

  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, clinicId: id },
    select: { id: true, name: true, userId: true },
  });
  if (!doctor) throw notFound('Doctor not found.');
  assertOwned(scope, { clinicId: id }, 'Doctor');

  // Appointments reference doctors with onDelete: Restrict, so a doctor with
  // history is deactivated instead of removed — deleting would orphan records
  // the clinic still needs for reporting.
  const appointments = await prisma.appointment.count({ where: { doctorId, clinicId: id } });
  if (appointments > 0) {
    throw conflict(
      'This doctor has appointments and cannot be deleted. Deactivate them instead.',
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.doctor.delete({ where: { id: doctorId } });
    if (doctor.userId) {
      const user = await tx.user.findUnique({
        where: { id: doctor.userId },
        select: { id: true, role: true },
      });
      if (user && user.role === 'DOCTOR') {
        await tx.user.delete({ where: { id: doctor.userId } });
      }
    }
  });

  await recordAudit(scope, {
    action: 'doctor.delete',
    entityType: 'Doctor',
    entityId: doctorId,
    clinicId: id,
    metadata: { name: doctor.name },
  });

  return { ok: true };
}

export async function getClinicDoctorDetail(scope: TenantScope, doctorId: string) {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: {
      clinic: { select: { id: true, name: true, timezone: true } },
      coordinator: { select: { id: true, name: true, username: true, email: true } },
      services: {
        select: {
          serviceId: true,
          service: {
            select: {
              id: true,
              name: true,
              durationMinutes: true,
              isActive: true,
              priceMinor: true,
              currency: true,
              description: true,
            },
          },
        },
      },
      schedules: { orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }] },
      breaks: { orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }] },
      timeOff: { orderBy: { startDate: 'desc' } },
      paymentStructure: {
        include: {
          otherPayments: {
            orderBy: { createdAt: 'asc' },
          },
        },
      },
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

    if (input.paymentStructure !== undefined) {
      if (input.paymentStructure === null) {
        await tx.doctorPaymentStructure.deleteMany({ where: { doctorId } });
      } else {
        const ps = await tx.doctorPaymentStructure.upsert({
          where: { doctorId },
          create: {
            clinicId,
            doctorId,
            fixedMonthlyAmount: input.paymentStructure.fixedMonthlyAmount ?? 0,
            revenueIncentivePercent: input.paymentStructure.revenueIncentivePercent ?? 0,
            procedureFeeType: input.paymentStructure.procedureFeeType ?? 'PERCENTAGE',
            procedureFeeAmount: input.paymentStructure.procedureFeeAmount ?? 0,
            procedureFeePercent: input.paymentStructure.procedureFeePercent ?? 0,
          },
          update: {
            fixedMonthlyAmount: input.paymentStructure.fixedMonthlyAmount ?? 0,
            revenueIncentivePercent: input.paymentStructure.revenueIncentivePercent ?? 0,
            procedureFeeType: input.paymentStructure.procedureFeeType ?? 'PERCENTAGE',
            procedureFeeAmount: input.paymentStructure.procedureFeeAmount ?? 0,
            procedureFeePercent: input.paymentStructure.procedureFeePercent ?? 0,
          },
        });

        if (input.paymentStructure.otherPayments !== undefined) {
          await tx.doctorOtherPayment.deleteMany({ where: { paymentStructureId: ps.id } });
          if (input.paymentStructure.otherPayments.length > 0) {
            await tx.doctorOtherPayment.createMany({
              data: input.paymentStructure.otherPayments.map((op) => ({
                paymentStructureId: ps.id,
                label: op.label.trim(),
                type: op.type,
                value: op.value,
              })),
            });
          }
        }
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

export async function getDoctorPaymentStructure(
  scope: TenantScope,
  clinicId: string,
  doctorId: string,
) {
  const resolvedId = resolveClinicId(scope, clinicId);
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, clinicId: resolvedId },
    select: { id: true, clinicId: true, name: true },
  });
  if (!doctor) throw notFound('Doctor not found.');
  assertOwned(scope, doctor, 'Doctor');

  const ps = await prisma.doctorPaymentStructure.findUnique({
    where: { doctorId },
    include: {
      otherPayments: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return ps || {
    id: '',
    clinicId: resolvedId,
    doctorId,
    fixedMonthlyAmount: 0,
    revenueIncentivePercent: 0,
    procedureFeeType: 'PERCENTAGE',
    procedureFeeAmount: 0,
    procedureFeePercent: 0,
    otherPayments: [],
  };
}

export async function saveDoctorPaymentStructure(
  scope: TenantScope,
  clinicId: string,
  doctorId: string,
  input: z.infer<typeof doctorPaymentStructureSchema>,
) {
  const resolvedId = resolveClinicId(scope, clinicId);
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, clinicId: resolvedId },
    select: { id: true, clinicId: true, name: true },
  });
  if (!doctor) throw notFound('Doctor not found.');
  assertOwned(scope, doctor, 'Doctor');

  const result = await prisma.$transaction(async (tx) => {
    const ps = await tx.doctorPaymentStructure.upsert({
      where: { doctorId },
      create: {
        clinicId: resolvedId,
        doctorId,
        fixedMonthlyAmount: input.fixedMonthlyAmount ?? 0,
        revenueIncentivePercent: input.revenueIncentivePercent ?? 0,
        procedureFeeType: input.procedureFeeType ?? 'PERCENTAGE',
        procedureFeeAmount: input.procedureFeeAmount ?? 0,
        procedureFeePercent: input.procedureFeePercent ?? 0,
      },
      update: {
        fixedMonthlyAmount: input.fixedMonthlyAmount ?? 0,
        revenueIncentivePercent: input.revenueIncentivePercent ?? 0,
        procedureFeeType: input.procedureFeeType ?? 'PERCENTAGE',
        procedureFeeAmount: input.procedureFeeAmount ?? 0,
        procedureFeePercent: input.procedureFeePercent ?? 0,
      },
    });

    if (input.otherPayments !== undefined) {
      await tx.doctorOtherPayment.deleteMany({ where: { paymentStructureId: ps.id } });
      if (input.otherPayments.length > 0) {
        await tx.doctorOtherPayment.createMany({
          data: input.otherPayments.map((op: { label: string; type: string; value: number }) => ({
            paymentStructureId: ps.id,
            label: op.label.trim(),
            type: op.type,
            value: op.value,
          })),
        });
      }
    }

    return tx.doctorPaymentStructure.findUnique({
      where: { id: ps.id },
      include: {
        otherPayments: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  });

  await recordAudit(scope, {
    action: 'doctor.payment_structure_update',
    entityType: 'DoctorPaymentStructure',
    entityId: result?.id || doctorId,
    clinicId: resolvedId,
    metadata: { doctorId, doctorName: doctor.name },
  });

  return result;
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
    where: { clinicId: id, isActive: true, role: 'COORDINATOR' },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      salary: true,
      commissionPercent: true,
      isActive: true,
      createdAt: true,
      coordinatedDoctors: {
        select: { id: true, name: true },
      },
    },
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

  // Generate a clean unique username from the coordinator's name
  let baseUsername = input.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');

  if (!baseUsername || baseUsername.length < 2) {
    baseUsername = 'coordinator';
  }

  let uniqueUsername = baseUsername;
  let attempt = 0;
  while (true) {
    const candidate = attempt === 0 ? baseUsername : `${baseUsername}${Math.floor(10 + Math.random() * 90)}`;
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username: candidate }, { username: candidate.toUpperCase() }],
      },
      select: { id: true },
    });
    if (!existing) {
      uniqueUsername = candidate;
      break;
    }
    attempt++;
    if (attempt > 20) {
      uniqueUsername = `${baseUsername}${Date.now().toString().slice(-4)}`;
      break;
    }
  }

  // Email fallback
  const userEmail = input.email || `${uniqueUsername}@clinic.internal`;

  const existingEmail = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true },
  });
  if (existingEmail) {
    throw conflict('An account with this email already exists.');
  }

  const rawPassword = input.password;
  const passwordHash = await hashPassword(rawPassword);

  const user = await prisma.user.create({
    data: {
      email: userEmail,
      username: uniqueUsername,
      name: input.name.trim(),
      passwordHash,
      role: 'COORDINATOR',
      salary: input.salary ?? 0,
      commissionPercent: input.commissionPercent ?? 0,
      clinicId: id,
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      salary: true,
      commissionPercent: true,
      clinicId: true,
      createdAt: true,
    },
  });

  await recordAudit(scope, {
    action: 'coordinator.create',
    entityType: 'User',
    entityId: user.id,
    clinicId: id,
    metadata: { name: user.name, username: user.username, email: user.email, salary: user.salary, commissionPercent: user.commissionPercent },
  });

  return user;
}

export async function updateClinicCoordinator(
  scope: TenantScope,
  clinicId: string,
  input: z.infer<typeof updateCoordinatorSchema>,
) {
  const id = resolveClinicId(scope, clinicId);
  if (scope.kind !== 'PLATFORM' && scope.clinicId !== id) {
    throw forbidden('Cannot manage staff for another clinic.');
  }

  const coordinator = await prisma.user.findFirst({
    where: { id: input.coordinatorId, clinicId: id, role: 'COORDINATOR' },
  });
  if (!coordinator) {
    throw notFound('Coordinator not found.');
  }

  const data: any = {};
  if (input.name !== undefined && input.name.trim()) data.name = input.name.trim();
  if (input.salary !== undefined) data.salary = Number(input.salary) || 0;
  if (input.commissionPercent !== undefined) data.commissionPercent = Number(input.commissionPercent) || 0;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.password && input.password.trim().length >= 6) {
    data.passwordHash = await hashPassword(input.password);
    data.sessionVersion = { increment: 1 };
  }

  const updated = await prisma.user.update({
    where: { id: input.coordinatorId },
    data,
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      salary: true,
      commissionPercent: true,
      isActive: true,
      createdAt: true,
      coordinatedDoctors: {
        select: { id: true, name: true },
      },
    },
  });

  await recordAudit(scope, {
    action: 'coordinator.update',
    entityType: 'User',
    entityId: updated.id,
    clinicId: id,
    metadata: { name: updated.name, salary: updated.salary, commissionPercent: updated.commissionPercent },
  });

  return updated;
}

export async function resetCoordinatorPassword(
  scope: TenantScope,
  clinicId: string,
  coordinatorId: string,
  newPassword: string,
) {
  const id = resolveClinicId(scope, clinicId);
  const user = await prisma.user.findFirst({
    where: { id: coordinatorId, clinicId: id },
  });
  if (!user) throw notFound('Coordinator not found.');

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: coordinatorId },
    data: {
      passwordHash,
      sessionVersion: { increment: 1 },
    },
  });

  await recordAudit(scope, {
    action: 'coordinator.reset_password',
    entityType: 'User',
    entityId: coordinatorId,
    clinicId: id,
    metadata: { name: user.name, username: user.username },
  });

  return { ok: true };
}

export async function deleteClinicCoordinator(
  scope: TenantScope,
  clinicId: string,
  coordinatorId: string,
) {
  const id = resolveClinicId(scope, clinicId);
  const user = await prisma.user.findFirst({
    where: { id: coordinatorId, clinicId: id },
  });
  if (!user) throw notFound('Coordinator not found.');

  // Unassign from any doctors
  await prisma.doctor.updateMany({
    where: { coordinatorId: coordinatorId },
    data: { coordinatorId: null },
  });

  await prisma.user.delete({
    where: { id: coordinatorId },
  });

  await recordAudit(scope, {
    action: 'coordinator.delete',
    entityType: 'User',
    entityId: coordinatorId,
    clinicId: id,
  });

  return { ok: true };
}

// --- Roles & Staff Management (Coordinators & Receptionists) -----------------

export async function listClinicStaff(scope: TenantScope, clinicId: string) {
  const id = resolveClinicId(scope, clinicId);
  return prisma.user.findMany({
    where: {
      clinicId: id,
      isActive: true,
      role: { in: ['COORDINATOR', 'RECEPTIONIST'] },
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      salary: true,
      commissionPercent: true,
      isActive: true,
      createdAt: true,
      coordinatedDoctors: {
        select: { id: true, name: true },
      },
    },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  });
}

export async function createClinicStaff(
  scope: TenantScope,
  clinicId: string,
  input: z.infer<typeof createStaffRoleSchema>,
) {
  const id = resolveClinicId(scope, clinicId);
  if (scope.kind !== 'PLATFORM' && scope.clinicId !== id) {
    throw forbidden('Cannot manage staff for another clinic.');
  }

  const role = input.role || 'COORDINATOR';

  // Determine or generate a clean unique username
  let candidateUsername = input.username?.trim().toLowerCase();
  if (!candidateUsername) {
    let base = input.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '');
    if (!base || base.length < 2) {
      base = role === 'RECEPTIONIST' ? 'reception' : 'coordinator';
    }
    candidateUsername = base;
  }

  let uniqueUsername = candidateUsername;
  let attempt = 0;
  while (true) {
    const candidate = attempt === 0 ? candidateUsername : `${candidateUsername}${Math.floor(10 + Math.random() * 90)}`;
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username: candidate }, { username: candidate.toUpperCase() }],
      },
      select: { id: true },
    });
    if (!existing) {
      uniqueUsername = candidate;
      break;
    }
    attempt++;
    if (attempt > 20) {
      uniqueUsername = `${candidateUsername}${Date.now().toString().slice(-4)}`;
      break;
    }
  }

  const userEmail = input.email?.trim().toLowerCase() || `${uniqueUsername}@clinic.internal`;

  const existingEmail = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true },
  });
  if (existingEmail) {
    throw conflict('An account with this email already exists.');
  }

  const rawPassword = input.password;
  const passwordHash = await hashPassword(rawPassword);

  const user = await prisma.user.create({
    data: {
      email: userEmail,
      username: uniqueUsername,
      name: input.name.trim(),
      passwordHash,
      role,
      salary: input.salary ?? 0,
      commissionPercent: input.commissionPercent ?? 0,
      clinicId: id,
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      salary: true,
      commissionPercent: true,
      clinicId: true,
      createdAt: true,
    },
  });

  // If coordinator and doctorId is specified, assign doctor
  if (role === 'COORDINATOR' && input.doctorId) {
    await prisma.doctor.updateMany({
      where: { id: input.doctorId, clinicId: id },
      data: { coordinatorId: user.id },
    });
  }

  await recordAudit(scope, {
    action: 'staff.create',
    entityType: 'User',
    entityId: user.id,
    clinicId: id,
    metadata: { name: user.name, username: user.username, role: user.role, email: user.email },
  });

  return user;
}

export async function resetStaffPassword(
  scope: TenantScope,
  clinicId: string,
  userId: string,
  newPassword: string,
) {
  const id = resolveClinicId(scope, clinicId);
  const user = await prisma.user.findFirst({
    where: { id: userId, clinicId: id },
  });
  if (!user) throw notFound('Staff user not found.');

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      sessionVersion: { increment: 1 },
    },
  });

  await recordAudit(scope, {
    action: 'staff.reset_password',
    entityType: 'User',
    entityId: userId,
    clinicId: id,
    metadata: { name: user.name, username: user.username, role: user.role },
  });

  return { ok: true };
}

export async function deleteClinicStaff(
  scope: TenantScope,
  clinicId: string,
  userId: string,
) {
  const id = resolveClinicId(scope, clinicId);
  const user = await prisma.user.findFirst({
    where: { id: userId, clinicId: id },
  });
  if (!user) throw notFound('Staff user not found.');

  // Unassign from any coordinated doctors
  await prisma.doctor.updateMany({
    where: { coordinatorId: userId },
    data: { coordinatorId: null },
  });

  await prisma.user.delete({
    where: { id: userId },
  });

  await recordAudit(scope, {
    action: 'staff.delete',
    entityType: 'User',
    entityId: userId,
    clinicId: id,
  });

  return { ok: true };
}
