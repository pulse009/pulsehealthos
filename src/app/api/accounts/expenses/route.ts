import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, parseJson, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import { createClinicExpenseSchema } from '@/lib/validation/accounts.schemas';
import {
  listClinicExpenses,
  createClinicExpense,
  deleteClinicExpense,
} from '@/lib/accounts/accounts.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    limitByIp(request, 'api-read', RateLimits.API_READ);
    const { user, scope } = await requireScope();
    const url = new URL(request.url);

    if (user.role === 'RECEPTIONIST') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');

    const expenses = await listClinicExpenses(scope, user.clinicId, {
      category,
      search,
    });

    return NextResponse.json({ ok: true, expenses });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { user, scope } = await requireScope();

    if (user.role !== 'CLIENT' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await parseJson(request, createClinicExpenseSchema);
    const expense = await createClinicExpense(scope, user.clinicId, body, user.id);

    return NextResponse.json({ ok: true, expense });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { user, scope } = await requireScope();
    const url = new URL(request.url);

    if (user.role !== 'CLIENT' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const expenseId = url.searchParams.get('id');
    if (!expenseId) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    await deleteClinicExpense(scope, expenseId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
