import { prisma } from '@/lib/db/prisma';
import { type TenantScope, assertOwned } from '@/lib/tenancy/scope';
import { validationError, notFound } from '@/lib/errors';
import { z } from 'zod';
import {
  createInvoiceSchema,
  recordPaymentSchema,
  generateDoctorPayoutSchema,
  disburseDoctorPayoutSchema,
  createSupplierBillSchema,
  recordSupplierPaymentSchema,
  createClinicExpenseSchema,
  createDayEndClosingSchema,
} from '@/lib/validation/accounts.schemas';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveClinicId(scope: TenantScope, clinicId?: string | null): string {
  if (scope.kind === 'CLINIC') {
    return scope.clinicId;
  }
  if (!clinicId) {
    throw validationError('clinicId is required for platform operations');
  }
  return clinicId;
}

// ---------------------------------------------------------------------------
// 1. FINANCIAL DASHBOARD & OVERVIEW
// ---------------------------------------------------------------------------

export async function getFinancialMetrics(scope: TenantScope, clinicId?: string | null) {
  const resolvedClinicId = resolveClinicId(scope, clinicId);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [
    monthlyPayments,
    allTimePayments,
    monthlyExpenses,
    allTimeExpenses,
    pendingInvoices,
    pendingPayouts,
    unpaidBills,
    recentInvoices,
    recentExpenses,
    recentPayments,
  ] = await Promise.all([
    // Monthly collected payments
    prisma.paymentTransaction.aggregate({
      where: {
        clinicId: resolvedClinicId,
        paymentDate: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    }),
    // All-time collected payments
    prisma.paymentTransaction.aggregate({
      where: { clinicId: resolvedClinicId },
      _sum: { amount: true },
    }),
    // Monthly expenses
    prisma.clinicExpense.aggregate({
      where: {
        clinicId: resolvedClinicId,
        expenseDate: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    }),
    // All-time expenses
    prisma.clinicExpense.aggregate({
      where: { clinicId: resolvedClinicId },
      _sum: { amount: true },
    }),
    // Pending / partially paid patient invoices
    prisma.invoice.findMany({
      where: {
        clinicId: resolvedClinicId,
        status: { in: ['ISSUED', 'PARTIALLY_PAID'] },
      },
      select: { totalAmount: true, paidAmount: true },
    }),
    // Pending doctor commission payouts
    prisma.doctorPayout.aggregate({
      where: {
        clinicId: resolvedClinicId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
      _sum: { netPayoutAmount: true },
    }),
    // Unpaid / partially paid supplier bills
    prisma.supplierBill.findMany({
      where: {
        clinicId: resolvedClinicId,
        status: { in: ['UNPAID', 'PARTIALLY_PAID'] },
      },
      select: { totalAmount: true, paidAmount: true },
    }),
    // Recent 5 Invoices
    prisma.invoice.findMany({
      where: { clinicId: resolvedClinicId },
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        doctor: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    // Recent 5 Expenses
    prisma.clinicExpense.findMany({
      where: { clinicId: resolvedClinicId },
      orderBy: { expenseDate: 'desc' },
      take: 5,
    }),
    // Recent 5 Payments
    prisma.paymentTransaction.findMany({
      where: { clinicId: resolvedClinicId },
      include: {
        patient: { select: { id: true, name: true } },
        invoice: { select: { id: true, invoiceNumber: true } },
      },
      orderBy: { paymentDate: 'desc' },
      take: 5,
    }),
  ]);

  const monthlyRevenue = monthlyPayments._sum.amount ?? 0;
  const allTimeRevenue = allTimePayments._sum.amount ?? 0;
  const monthlyExpenseTotal = monthlyExpenses._sum.amount ?? 0;
  const allTimeExpenseTotal = allTimeExpenses._sum.amount ?? 0;

  const totalAccountsReceivable = pendingInvoices.reduce(
    (sum, inv) => sum + (inv.totalAmount - inv.paidAmount),
    0,
  );

  const totalDoctorPayables = pendingPayouts._sum.netPayoutAmount ?? 0;

  const totalSupplierPayables = unpaidBills.reduce(
    (sum, bill) => sum + (bill.totalAmount - bill.paidAmount),
    0,
  );

  const monthlyNetProfit = monthlyRevenue - monthlyExpenseTotal;

  return {
    monthlyRevenue,
    allTimeRevenue,
    monthlyExpenseTotal,
    allTimeExpenseTotal,
    totalAccountsReceivable,
    totalDoctorPayables,
    totalSupplierPayables,
    monthlyNetProfit,
    recentInvoices,
    recentExpenses,
    recentPayments,
  };
}

// ---------------------------------------------------------------------------
// 2. INVOICES & PATIENT BILLING
// ---------------------------------------------------------------------------

export async function createInvoice(
  scope: TenantScope,
  clinicId: string | null,
  input: z.infer<typeof createInvoiceSchema>,
  userId?: string,
) {
  const resolvedClinicId = resolveClinicId(scope, clinicId);

  // Generate unique invoice number: INV-YYMM-XXXX
  const today = new Date();
  const datePrefix = `INV-${today.getFullYear().toString().slice(-2)}${(today.getMonth() + 1).toString().padStart(2, '0')}`;

  const invCount = await prisma.invoice.count({
    where: { clinicId: resolvedClinicId },
  });
  const invoiceNumber = `${datePrefix}-${(invCount + 1).toString().padStart(4, '0')}`;

  // Calculate Subtotal & Total
  let subtotal = 0;
  const itemsData = input.items.map((item) => {
    const itemTotal = item.quantity * item.unitPrice;
    subtotal += itemTotal;
    return {
      serviceId: item.serviceId || undefined,
      inventoryItemId: item.inventoryItemId || undefined,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: itemTotal,
    };
  });

  const totalAmount = Math.max(0, subtotal - input.discountAmount + input.taxAmount);

  return prisma.invoice.create({
    data: {
      clinicId: resolvedClinicId,
      invoiceNumber,
      patientId: input.patientId,
      doctorId: input.doctorId || undefined,
      appointmentId: input.appointmentId || undefined,
      issueDate: input.issueDate ? new Date(input.issueDate) : new Date(),
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      status: 'ISSUED',
      subtotal,
      discountAmount: input.discountAmount,
      taxAmount: input.taxAmount,
      totalAmount,
      paidAmount: 0,
      currency: input.currency || 'SAR',
      notes: input.notes || undefined,
      createdById: userId || undefined,
      items: {
        create: itemsData,
      },
    },
    include: {
      items: {
        include: {
          service: { select: { id: true, name: true } },
          inventoryItem: { select: { id: true, name: true, sku: true, unit: true } },
        },
      },
      patient: { select: { id: true, name: true, phone: true, email: true } },
      doctor: { select: { id: true, name: true, specialty: true } },
      transactions: true,
    },
  });
}

export async function listInvoices(
  scope: TenantScope,
  clinicId?: string | null,
  filters: {
    status?: string;
    patientId?: string | null;
    doctorId?: string | null;
    search?: string | null;
  } = {},
) {
  const resolvedClinicId = resolveClinicId(scope, clinicId);

  const where: any = { clinicId: resolvedClinicId };

  if (filters.status && filters.status !== 'ALL') {
    where.status = filters.status;
  }
  if (filters.patientId) {
    where.patientId = filters.patientId;
  }
  if (filters.doctorId) {
    where.doctorId = filters.doctorId;
  }
  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { invoiceNumber: { contains: q, mode: 'insensitive' } },
      { patient: { name: { contains: q, mode: 'insensitive' } } },
      { patient: { phone: { contains: q } } },
      { doctor: { name: { contains: q, mode: 'insensitive' } } },
    ];
  }

  return prisma.invoice.findMany({
    where,
    include: {
      patient: { select: { id: true, name: true, phone: true, fileNumber: true } },
      doctor: { select: { id: true, name: true, specialty: true } },
      items: true,
      transactions: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getInvoiceDetail(scope: TenantScope, invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      patient: { select: { id: true, name: true, phone: true, email: true, fileNumber: true } },
      doctor: { select: { id: true, name: true, specialty: true } },
      appointment: { select: { id: true, appointmentNumber: true, startsAt: true } },
      items: {
        include: {
          service: { select: { id: true, name: true } },
          inventoryItem: { select: { id: true, name: true, sku: true, unit: true } },
        },
      },
      transactions: {
        include: {
          receivedBy: { select: { id: true, name: true } },
        },
        orderBy: { paymentDate: 'desc' },
      },
      createdBy: { select: { id: true, name: true } },
    },
  });

  if (!invoice) throw notFound('Invoice not found');
  assertOwned(scope, invoice);

  return invoice;
}

export async function recordInvoicePayment(
  scope: TenantScope,
  invoiceId: string,
  input: z.infer<typeof recordPaymentSchema>,
  userId?: string,
) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { transactions: true },
  });

  if (!invoice) throw notFound('Invoice not found');
  assertOwned(scope, invoice);

  if (invoice.status === 'PAID') {
    throw validationError('Invoice is already fully paid');
  }
  if (invoice.status === 'CANCELLED') {
    throw validationError('Cannot record payment for a cancelled invoice');
  }

  const remainingBalance = invoice.totalAmount - invoice.paidAmount;
  if (input.amount > remainingBalance + 0.01) {
    throw validationError(`Payment amount ($${input.amount}) exceeds remaining invoice balance ($${remainingBalance.toFixed(2)})`);
  }

  return prisma.$transaction(async (tx) => {
    // 1. Create PaymentTransaction
    const payment = await tx.paymentTransaction.create({
      data: {
        clinicId: invoice.clinicId,
        invoiceId: invoice.id,
        patientId: invoice.patientId,
        amount: input.amount,
        method: input.method,
        reference: input.reference || undefined,
        notes: input.notes || undefined,
        paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
        receivedById: userId || undefined,
      },
    });

    // 2. Update Invoice Paid Amount and Status
    const newPaidAmount = invoice.paidAmount + input.amount;
    const isFullyPaid = newPaidAmount >= invoice.totalAmount - 0.01;
    const newStatus = isFullyPaid ? 'PAID' : 'PARTIALLY_PAID';

    const updatedInvoice = await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        doctor: { select: { id: true, name: true } },
        items: true,
        transactions: true,
      },
    });

    // Automation: Dispatch digital tax receipt via WhatsApp to patient
    import('@/lib/accounts/accounts.automation').then(({ handleInvoicePaymentRecorded }) => {
      handleInvoicePaymentRecorded({
        invoiceId: invoice.id,
        amountPaid: input.amount,
        paymentMethod: input.method,
      }).catch((err) => {
        console.error('Failed to send payment receipt via WhatsApp:', err);
      });
    }).catch(() => {});

    return { payment, invoice: updatedInvoice };
  });
}

// ---------------------------------------------------------------------------
// 3. DOCTOR & COORDINATOR COMMISSION PAYOUTS
// ---------------------------------------------------------------------------

export async function calculateDoctorEarnings(
  scope: TenantScope,
  doctorId: string,
  periodStart: Date,
  periodEnd: Date,
) {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: {
      paymentStructure: {
        include: { otherPayments: true },
      },
      appointments: {
        where: {
          status: 'COMPLETED',
          startsAt: { gte: periodStart, lte: periodEnd },
        },
        include: {
          service: true,
          invoice: {
            include: { transactions: true },
          },
        },
      },
    },
  });

  if (!doctor) throw notFound('Doctor not found');
  assertOwned(scope, doctor);

  const ps = doctor.paymentStructure;
  const baseSalary = ps?.fixedMonthlyAmount || 0;

  let totalCollectedRevenue = 0;
  let procedureCommission = 0;

  for (const appt of doctor.appointments) {
    const inv = appt.invoice;
    const apptRevenue = inv ? inv.paidAmount : (appt.service.priceMinor ? appt.service.priceMinor / 100 : 0);
    totalCollectedRevenue += apptRevenue;

    if (ps) {
      if (ps.procedureFeeType === 'PERCENTAGE') {
        const pct = (ps.procedureFeePercent || 0) / 100;
        procedureCommission += apptRevenue * pct;
      } else if (ps.procedureFeeType === 'FIXED') {
        procedureCommission += ps.procedureFeeAmount || 0;
      }
    }
  }

  // Revenue incentive bonus
  const revenueIncentive = ps ? (totalCollectedRevenue * (ps.revenueIncentivePercent || 0)) / 100 : 0;
  const totalCommission = procedureCommission + revenueIncentive;
  const netEarnings = baseSalary + totalCommission;

  return {
    doctor,
    totalAppointments: doctor.appointments.length,
    totalCollectedRevenue,
    baseSalary,
    procedureCommission,
    revenueIncentive,
    totalCommission,
    netEarnings,
  };
}

export async function createDoctorPayout(
  scope: TenantScope,
  clinicId: string | null,
  input: z.infer<typeof generateDoctorPayoutSchema>,
  userId?: string,
) {
  const resolvedClinicId = resolveClinicId(scope, clinicId);

  const pStart = new Date(input.periodStart);
  const pEnd = new Date(input.periodEnd);

  const earnings = await calculateDoctorEarnings(scope, input.doctorId, pStart, pEnd);

  // Generate unique payout number: PAY-YYMM-XXXX
  const today = new Date();
  const datePrefix = `PAY-${today.getFullYear().toString().slice(-2)}${(today.getMonth() + 1).toString().padStart(2, '0')}`;

  const payoutCount = await prisma.doctorPayout.count({
    where: { clinicId: resolvedClinicId },
  });
  const payoutNumber = `${datePrefix}-${(payoutCount + 1).toString().padStart(4, '0')}`;

  const baseSalary = input.baseSalary || earnings.baseSalary;
  const commissionAmount = earnings.totalCommission;
  const deductions = input.deductions || 0;
  const netPayoutAmount = Math.max(0, baseSalary + commissionAmount - deductions);

  return prisma.doctorPayout.create({
    data: {
      clinicId: resolvedClinicId,
      doctorId: input.doctorId,
      payoutNumber,
      periodStart: pStart,
      periodEnd: pEnd,
      totalRevenue: earnings.totalCollectedRevenue,
      baseSalary,
      commissionAmount,
      deductions,
      netPayoutAmount,
      status: 'PENDING',
      notes: input.notes || undefined,
      createdById: userId || undefined,
    },
    include: {
      doctor: { select: { id: true, name: true, specialty: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
}

export async function disburseDoctorPayout(
  scope: TenantScope,
  payoutId: string,
  input: z.infer<typeof disburseDoctorPayoutSchema>,
  userId?: string,
) {
  const payout = await prisma.doctorPayout.findUnique({
    where: { id: payoutId },
  });

  if (!payout) throw notFound('Doctor payout voucher not found');
  assertOwned(scope, payout);

  if (payout.status === 'PAID') {
    throw validationError('Doctor payout is already disbursed');
  }

  return prisma.doctorPayout.update({
    where: { id: payoutId },
    data: {
      status: 'PAID',
      paidAt: new Date(),
      paymentMethod: input.paymentMethod,
      notes: input.notes || payout.notes,
    },
    include: {
      doctor: { select: { id: true, name: true, specialty: true } },
    },
  });
}

export async function listDoctorPayouts(
  scope: TenantScope,
  clinicId?: string | null,
  filters: { doctorId?: string | null; status?: string | null } = {},
) {
  const resolvedClinicId = resolveClinicId(scope, clinicId);

  const where: any = { clinicId: resolvedClinicId };
  if (filters.doctorId) where.doctorId = filters.doctorId;
  if (filters.status && filters.status !== 'ALL') where.status = filters.status;

  return prisma.doctorPayout.findMany({
    where,
    include: {
      doctor: { select: { id: true, name: true, specialty: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ---------------------------------------------------------------------------
// 4. SUPPLIER BILLS & ACCOUNTS PAYABLE
// ---------------------------------------------------------------------------

export async function createSupplierBill(
  scope: TenantScope,
  clinicId: string | null,
  input: z.infer<typeof createSupplierBillSchema>,
) {
  const resolvedClinicId = resolveClinicId(scope, clinicId);

  // Generate unique bill number: BILL-YYMM-XXXX
  const today = new Date();
  const datePrefix = `BILL-${today.getFullYear().toString().slice(-2)}${(today.getMonth() + 1).toString().padStart(2, '0')}`;

  const billCount = await prisma.supplierBill.count({
    where: { clinicId: resolvedClinicId },
  });
  const billNumber = `${datePrefix}-${(billCount + 1).toString().padStart(4, '0')}`;

  return prisma.supplierBill.create({
    data: {
      clinicId: resolvedClinicId,
      billNumber,
      supplierId: input.supplierId,
      purchaseOrderId: input.purchaseOrderId || undefined,
      billDate: input.billDate ? new Date(input.billDate) : new Date(),
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      totalAmount: input.totalAmount,
      paidAmount: 0,
      status: 'UNPAID',
      notes: input.notes || undefined,
    },
    include: {
      supplier: { select: { id: true, name: true, phone: true, email: true } },
      purchaseOrder: { select: { id: true, poNumber: true, status: true } },
      payments: true,
    },
  });
}

export async function recordSupplierPayment(
  scope: TenantScope,
  billId: string,
  input: z.infer<typeof recordSupplierPaymentSchema>,
) {
  const bill = await prisma.supplierBill.findUnique({
    where: { id: billId },
  });

  if (!bill) throw notFound('Supplier bill not found');
  assertOwned(scope, bill);

  if (bill.status === 'PAID') {
    throw validationError('Bill is already settled in full');
  }

  const remaining = bill.totalAmount - bill.paidAmount;
  if (input.amount > remaining + 0.01) {
    throw validationError(`Payment amount exceeds remaining bill balance ($${remaining.toFixed(2)})`);
  }

  return prisma.$transaction(async (tx) => {
    const payment = await tx.supplierPayment.create({
      data: {
        clinicId: bill.clinicId,
        billId: bill.id,
        amount: input.amount,
        method: input.method || 'BANK_TRANSFER',
        reference: input.reference || undefined,
        notes: input.notes || undefined,
        paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
      },
    });

    const newPaidAmount = bill.paidAmount + input.amount;
    const isFullyPaid = newPaidAmount >= bill.totalAmount - 0.01;
    const newStatus = isFullyPaid ? 'PAID' : 'PARTIALLY_PAID';

    const updatedBill = await tx.supplierBill.update({
      where: { id: bill.id },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
      include: {
        supplier: { select: { id: true, name: true } },
        purchaseOrder: { select: { id: true, poNumber: true } },
        payments: true,
      },
    });

    return { payment, bill: updatedBill };
  });
}

export async function listSupplierBills(
  scope: TenantScope,
  clinicId?: string | null,
  filters: { supplierId?: string | null; status?: string | null } = {},
) {
  const resolvedClinicId = resolveClinicId(scope, clinicId);

  const where: any = { clinicId: resolvedClinicId };
  if (filters.supplierId) where.supplierId = filters.supplierId;
  if (filters.status && filters.status !== 'ALL') where.status = filters.status;

  return prisma.supplierBill.findMany({
    where,
    include: {
      supplier: { select: { id: true, name: true, phone: true, email: true } },
      purchaseOrder: { select: { id: true, poNumber: true, status: true } },
      payments: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ---------------------------------------------------------------------------
// 5. CLINIC OPERATIONAL EXPENSES (OPEX)
// ---------------------------------------------------------------------------

export async function createClinicExpense(
  scope: TenantScope,
  clinicId: string | null,
  input: z.infer<typeof createClinicExpenseSchema>,
  userId?: string,
) {
  const resolvedClinicId = resolveClinicId(scope, clinicId);

  // Generate unique expense number: EXP-YYMM-XXXX
  const today = new Date();
  const datePrefix = `EXP-${today.getFullYear().toString().slice(-2)}${(today.getMonth() + 1).toString().padStart(2, '0')}`;

  const expCount = await prisma.clinicExpense.count({
    where: { clinicId: resolvedClinicId },
  });
  const expenseNumber = `${datePrefix}-${(expCount + 1).toString().padStart(4, '0')}`;

  return prisma.clinicExpense.create({
    data: {
      clinicId: resolvedClinicId,
      expenseNumber,
      category: input.category,
      title: input.title.trim(),
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      paidTo: input.paidTo?.trim() || undefined,
      expenseDate: input.expenseDate ? new Date(input.expenseDate) : new Date(),
      receiptUrl: input.receiptUrl?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
      createdById: userId || undefined,
    },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });
}

export async function listClinicExpenses(
  scope: TenantScope,
  clinicId?: string | null,
  filters: { category?: string | null; search?: string | null } = {},
) {
  const resolvedClinicId = resolveClinicId(scope, clinicId);

  const where: any = { clinicId: resolvedClinicId };
  if (filters.category && filters.category !== 'ALL') where.category = filters.category;
  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { expenseNumber: { contains: q, mode: 'insensitive' } },
      { title: { contains: q, mode: 'insensitive' } },
      { paidTo: { contains: q, mode: 'insensitive' } },
      { notes: { contains: q, mode: 'insensitive' } },
    ];
  }

  return prisma.clinicExpense.findMany({
    where,
    include: {
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { expenseDate: 'desc' },
  });
}

export async function deleteClinicExpense(scope: TenantScope, expenseId: string) {
  const expense = await prisma.clinicExpense.findUnique({
    where: { id: expenseId },
  });

  if (!expense) throw notFound('Expense record not found');
  assertOwned(scope, expense);

  return prisma.clinicExpense.delete({
    where: { id: expenseId },
  });
}

// ---------------------------------------------------------------------------
// 6. DAY-END CASH DRAWER CLOSING (Z-REPORT)
// ---------------------------------------------------------------------------

export async function createDayEndClosing(
  scope: TenantScope,
  clinicId: string | null,
  input: z.infer<typeof createDayEndClosingSchema>,
  userId: string,
) {
  const resolvedClinicId = resolveClinicId(scope, clinicId);

  const closingDateObj = new Date(input.closingDate);
  const startOfDay = new Date(closingDateObj.getFullYear(), closingDateObj.getMonth(), closingDateObj.getDate(), 0, 0, 0);
  const endOfDay = new Date(closingDateObj.getFullYear(), closingDateObj.getMonth(), closingDateObj.getDate(), 23, 59, 59, 999);

  // Compute actual payments received on this date
  const [cashSum, cardSum, bankSum] = await Promise.all([
    prisma.paymentTransaction.aggregate({
      where: {
        clinicId: resolvedClinicId,
        method: 'CASH',
        paymentDate: { gte: startOfDay, lte: endOfDay },
      },
      _sum: { amount: true },
    }),
    prisma.paymentTransaction.aggregate({
      where: {
        clinicId: resolvedClinicId,
        method: 'CARD',
        paymentDate: { gte: startOfDay, lte: endOfDay },
      },
      _sum: { amount: true },
    }),
    prisma.paymentTransaction.aggregate({
      where: {
        clinicId: resolvedClinicId,
        method: 'BANK_TRANSFER',
        paymentDate: { gte: startOfDay, lte: endOfDay },
      },
      _sum: { amount: true },
    }),
  ]);

  const totalCashCollected = cashSum._sum.amount ?? 0;
  const totalCard = cardSum._sum.amount ?? 0;
  const totalBank = bankSum._sum.amount ?? 0;
  const expectedCash = input.openingCash + totalCashCollected;
  const cashDifference = input.countedCash - expectedCash;
  const totalRevenue = totalCashCollected + totalCard + totalBank;

  // Generate unique closing number: CLS-YYMM-XXXX
  const today = new Date();
  const datePrefix = `CLS-${today.getFullYear().toString().slice(-2)}${(today.getMonth() + 1).toString().padStart(2, '0')}`;

  const closingCount = await prisma.dayEndClosing.count({
    where: { clinicId: resolvedClinicId },
  });
  const closingNumber = `${datePrefix}-${(closingCount + 1).toString().padStart(4, '0')}`;

  return prisma.dayEndClosing.upsert({
    where: {
      clinicId_closingDate: {
        clinicId: resolvedClinicId,
        closingDate: input.closingDate,
      },
    },
    create: {
      clinicId: resolvedClinicId,
      closingNumber,
      closingDate: input.closingDate,
      closedByUserId: userId,
      openingCash: input.openingCash,
      expectedCash,
      countedCash: input.countedCash,
      cashDifference,
      totalCardAmount: totalCard,
      totalBankAmount: totalBank,
      totalRevenue,
      status: 'SUBMITTED',
      notes: input.notes || undefined,
    },
    update: {
      countedCash: input.countedCash,
      cashDifference,
      totalCardAmount: totalCard,
      totalBankAmount: totalBank,
      totalRevenue,
      notes: input.notes || undefined,
      status: 'SUBMITTED',
    },
    include: {
      closedByUser: { select: { id: true, name: true } },
      verifiedByUser: { select: { id: true, name: true } },
    },
  });
}

export async function verifyDayEndClosing(
  scope: TenantScope,
  closingId: string,
  userId: string,
  notes?: string,
) {
  const closing = await prisma.dayEndClosing.findUnique({
    where: { id: closingId },
  });

  if (!closing) throw notFound('Day-end closing report not found');
  assertOwned(scope, closing);

  return prisma.dayEndClosing.update({
    where: { id: closingId },
    data: {
      status: 'VERIFIED',
      verifiedByUserId: userId,
      verifiedAt: new Date(),
      notes: notes || closing.notes,
    },
    include: {
      closedByUser: { select: { id: true, name: true } },
      verifiedByUser: { select: { id: true, name: true } },
    },
  });
}

export async function listDayEndClosings(scope: TenantScope, clinicId?: string | null) {
  const resolvedClinicId = resolveClinicId(scope, clinicId);

  return prisma.dayEndClosing.findMany({
    where: { clinicId: resolvedClinicId },
    include: {
      closedByUser: { select: { id: true, name: true } },
      verifiedByUser: { select: { id: true, name: true } },
    },
    orderBy: { closingDate: 'desc' },
  });
}

// ---------------------------------------------------------------------------
// 7. FINANCIAL REPORTS & PROFIT & LOSS (P&L)
// ---------------------------------------------------------------------------

export async function getProfitAndLossReport(
  scope: TenantScope,
  clinicId: string | null,
  startDateStr?: string,
  endDateStr?: string,
) {
  const resolvedClinicId = resolveClinicId(scope, clinicId);

  const startDate = startDateStr ? new Date(startDateStr) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endDate = endDateStr ? new Date(endDateStr) : new Date();

  const [
    payments,
    payouts,
    expenses,
    inventoryStockIssued,
  ] = await Promise.all([
    // Total collected revenue
    prisma.paymentTransaction.findMany({
      where: {
        clinicId: resolvedClinicId,
        paymentDate: { gte: startDate, lte: endDate },
      },
      include: {
        invoice: {
          include: {
            items: {
              include: { service: true, inventoryItem: true },
            },
          },
        },
      },
    }),
    // Doctor payouts disbursed
    prisma.doctorPayout.aggregate({
      where: {
        clinicId: resolvedClinicId,
        status: 'PAID',
        paidAt: { gte: startDate, lte: endDate },
      },
      _sum: { netPayoutAmount: true, commissionAmount: true, baseSalary: true },
    }),
    // Operating expenses grouped by category
    prisma.clinicExpense.findMany({
      where: {
        clinicId: resolvedClinicId,
        expenseDate: { gte: startDate, lte: endDate },
      },
    }),
    // Cost of goods sold (issued inventory supplies)
    prisma.inventoryStockMovement.aggregate({
      where: {
        clinicId: resolvedClinicId,
        type: 'STOCK_ISSUED',
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { unitCost: true },
    }),
  ]);

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  // Categorize expenses
  const expenseByCategory: Record<string, number> = {};
  let totalOperatingExpenses = 0;

  for (const exp of expenses) {
    expenseByCategory[exp.category] = (expenseByCategory[exp.category] || 0) + exp.amount;
    totalOperatingExpenses += exp.amount;
  }

  const doctorCommissions = payouts._sum.netPayoutAmount ?? 0;
  const estimatedCOGS = inventoryStockIssued._sum.unitCost ?? 0;

  const totalCosts = totalOperatingExpenses + doctorCommissions + estimatedCOGS;
  const netIncome = totalRevenue - totalCosts;
  const profitMarginPercent = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

  return {
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    revenue: {
      totalRevenue,
      paymentCount: payments.length,
    },
    costs: {
      totalOperatingExpenses,
      expenseByCategory,
      doctorCommissions,
      estimatedCOGS,
      totalCosts,
    },
    netIncome,
    profitMarginPercent: Math.round(profitMarginPercent * 10) / 10,
  };
}
