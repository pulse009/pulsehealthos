import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { sendAndRecordOutbound } from '@/lib/conversations/conversation.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    limitByIp(request, 'api-read', RateLimits.API_READ);
    const { scope } = await requireScope();
    const { id } = await context.params;

    const whereClause = scope.kind === 'CLINIC' ? { id, clinicId: scope.clinicId } : { id };
    const conversation = await prisma.conversation.findUnique({
      where: whereClause,
      include: {
        patient: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50,
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, conversation });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { scope } = await requireScope();
    const { id } = await context.params;
    const body = await request.json();

    const whereClause = scope.kind === 'CLINIC' ? { id, clinicId: scope.clinicId } : { id };

    const updateData: any = {};
    if (body.status) {
      updateData.status = body.status;
      if (body.status === 'ESCALATED') {
        updateData.escalatedAt = new Date();
        updateData.aiEnabled = false;
        if (body.escalationReason) updateData.escalationReason = body.escalationReason;
      }
    }
    if (typeof body.aiEnabled === 'boolean') {
      updateData.aiEnabled = body.aiEnabled;
    }

    const conversation = await prisma.conversation.update({
      where: whereClause,
      data: updateData,
    });

    return NextResponse.json({ ok: true, conversation });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { scope } = await requireScope();
    const { id } = await context.params;
    const body = await request.json();

    const whereClause = scope.kind === 'CLINIC' ? { id, clinicId: scope.clinicId } : { id };
    const conversation = await prisma.conversation.findUnique({
      where: whereClause,
      select: { id: true, clinicId: true, patient: { select: { phone: true } } },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (!body.message?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const result = await sendAndRecordOutbound({
      clinicId: conversation.clinicId,
      conversationId: conversation.id,
      sender: 'HUMAN',
      body: body.message.trim(),
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { scope } = await requireScope();
    const { id } = await context.params;

    const whereClause = scope.kind === 'CLINIC' ? { id, clinicId: scope.clinicId } : { id };
    await prisma.conversation.delete({
      where: whereClause,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
