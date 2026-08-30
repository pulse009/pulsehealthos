import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, withErrorHandling } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Search patients by fileNumber, phone, or name within the clinic scope.
 */
export const GET = withErrorHandling(async (request: Request) => {
  limitByIp(request, 'api-read', RateLimits.API_READ);
  const { scope } = await requireScope();

  if (scope.kind !== 'CLINIC') {
    return NextResponse.json({ error: 'Clinic scope required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const fileNumberStr = searchParams.get('fileNumber');
  const phone = searchParams.get('phone');
  const query = searchParams.get('query')?.trim();

  // 1. Single lookup by fileNumber
  if (fileNumberStr) {
    const cleanNum = fileNumberStr.trim().replace(/^(?:FR-?|PA-?|#)/i, '');
    const fileNumber = parseInt(cleanNum, 10);
    if (!isNaN(fileNumber)) {
      const patient = await prisma.patient.findFirst({
        where: {
          clinicId: scope.clinicId,
          fileNumber,
        },
        include: {
          user: {
            select: { username: true, email: true },
          },
          _count: {
            select: { appointments: true },
          },
        },
      });

      if (!patient) {
        return NextResponse.json({ patient: null }, { status: 404 });
      }

      return NextResponse.json({
        patient: {
          id: patient.id,
          fileNumber: patient.fileNumber,
          name: patient.name,
          phone: patient.phone,
          title: patient.title,
          gender: patient.gender,
          nationality: patient.nationality,
          email: patient.email,
          username: patient.user?.username || (patient.fileNumber ? `PA-${patient.fileNumber}` : null),
          appointmentsCount: patient._count.appointments,
        },
      });
    }
  }

  // 2. Single lookup by phone
  if (phone) {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const patient = await prisma.patient.findFirst({
      where: {
        clinicId: scope.clinicId,
        phone: { contains: cleanPhone },
      },
      include: {
        user: { select: { username: true, email: true } },
        _count: { select: { appointments: true } },
      },
    });

    if (!patient) {
      return NextResponse.json({ patient: null }, { status: 404 });
    }

    return NextResponse.json({
      patient: {
        id: patient.id,
        fileNumber: patient.fileNumber,
        name: patient.name,
        phone: patient.phone,
        title: patient.title,
        gender: patient.gender,
        nationality: patient.nationality,
        email: patient.email,
        username: patient.user?.username || (patient.fileNumber ? `PA-${patient.fileNumber}` : null),
        appointmentsCount: patient._count.appointments,
      },
    });
  }

  // 3. General search
  const whereFilter: any = { clinicId: scope.clinicId };
  if (query) {
    const isNum = !isNaN(parseInt(query, 10));
    whereFilter.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { phone: { contains: query } },
      ...(isNum ? [{ fileNumber: parseInt(query, 10) }] : []),
    ];
  }

  const patients = await prisma.patient.findMany({
    where: whereFilter,
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { username: true } },
      _count: { select: { appointments: true } },
    },
  });

  return NextResponse.json({
    patients: patients.map((p) => ({
      id: p.id,
      fileNumber: p.fileNumber,
      name: p.name,
      phone: p.phone,
      title: p.title,
      gender: p.gender,
      nationality: p.nationality,
      email: p.email,
      username: p.user?.username || (p.fileNumber ? `PA-${p.fileNumber}` : null),
      appointmentsCount: p._count.appointments,
    })),
  });
});
