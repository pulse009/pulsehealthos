import { NextResponse } from 'next/server';
import { requireScope } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { errorResponse } from '@/lib/api/handler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const { scope } = await requireScope();
    if (scope.kind !== 'CLINIC') {
      return NextResponse.json({ ok: true, unreadCount: 0 });
    }

    const unreadCount = await prisma.message.count({
      where: {
        clinicId: scope.clinicId,
        direction: 'INBOUND',
        status: { not: 'READ' },
      },
    });

    return NextResponse.json({ ok: true, unreadCount });
  } catch (error) {
    return errorResponse(error);
  }
}
