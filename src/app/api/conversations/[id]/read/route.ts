import { NextResponse } from 'next/server';
import { requireScope } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { errorResponse } from '@/lib/api/handler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const { scope } = await requireScope();
    const { id } = await context.params;

    const whereClause = scope.kind === 'CLINIC' ? { conversationId: id, clinicId: scope.clinicId } : { conversationId: id };

    const body = await request.json().catch(() => ({}));
    const isUnread = Boolean(body.unread);

    if (isUnread) {
      // Mark the most recent inbound message as unread (DELIVERED)
      const lastInbound = await prisma.message.findFirst({
        where: { ...whereClause, direction: 'INBOUND' },
        orderBy: { createdAt: 'desc' },
      });
      if (lastInbound) {
        await prisma.message.update({
          where: { id: lastInbound.id },
          data: { status: 'DELIVERED' },
        });
      }
    } else {
      // Mark all inbound messages in this conversation as READ
      await prisma.message.updateMany({
        where: {
          ...whereClause,
          direction: 'INBOUND',
          status: { not: 'READ' },
        },
        data: {
          status: 'READ',
        },
      });
    }

    return NextResponse.json({ ok: true, isUnread });
  } catch (error) {
    return errorResponse(error);
  }
}
