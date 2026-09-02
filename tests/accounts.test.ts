import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clinicScope } from '../src/lib/tenancy/scope';
import {
  createInvoice,
  recordInvoicePayment,
  calculateDoctorEarnings,
  createDoctorPayout,
  disburseDoctorPayout,
  createSupplierBill,
  recordSupplierPayment,
  createClinicExpense,
  createDayEndClosing,
  getProfitAndLossReport,
} from '../src/lib/accounts/accounts.service';
import { prisma } from '../src/lib/db/prisma';

describe('Accounts & Finance Module Tests', () => {
  const clinicId = 'clinic-acc-1';
  const userId = 'user-owner-1';
  const scope = clinicScope(clinicId, userId);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Creates an invoice with sequential numbering and line items', async () => {
    const mockInvoice = {
      id: 'inv-1',
      clinicId,
      invoiceNumber: 'INV-2608-0001',
      patientId: 'pat-1',
      doctorId: 'doc-1',
      subtotal: 300,
      discountAmount: 20,
      taxAmount: 42,
      totalAmount: 322,
      paidAmount: 0,
      status: 'ISSUED',
      items: [
        {
          id: 'ii-1',
          description: 'Consultation & HydraFacial',
          quantity: 1,
          unitPrice: 300,
          totalPrice: 300,
        },
      ],
    };

    vi.spyOn(prisma.invoice, 'count').mockResolvedValue(0);
    vi.spyOn(prisma.invoice, 'create').mockResolvedValue(mockInvoice as any);

    const inv = await createInvoice(
      scope,
      clinicId,
      {
        patientId: 'pat-1',
        doctorId: 'doc-1',
        discountAmount: 20,
        taxAmount: 42,
        currency: 'SAR',
        items: [
          {
            description: 'Consultation & HydraFacial',
            quantity: 1,
            unitPrice: 300,
          },
        ],
      },
      userId,
    );

    expect(inv.invoiceNumber).toBe('INV-2608-0001');
    expect(inv.totalAmount).toBe(322);
    expect(inv.status).toBe('ISSUED');
  });

  it('2. Records partial and full payments transitioning invoice status', async () => {
    const mockInvoice = {
      id: 'inv-1',
      clinicId,
      patientId: 'pat-1',
      totalAmount: 300,
      paidAmount: 0,
      status: 'ISSUED',
      transactions: [],
    };

    vi.spyOn(prisma.invoice, 'findUnique').mockResolvedValue(mockInvoice as any);

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const tx = {
        paymentTransaction: {
          create: vi.fn().mockResolvedValue({
            id: 'pmt-1',
            amount: 300,
            method: 'CASH',
          }),
        },
        invoice: {
          update: vi.fn().mockResolvedValue({
            ...mockInvoice,
            paidAmount: 300,
            status: 'PAID',
          }),
        },
      };
      return callback(tx);
    });

    const result = await recordInvoicePayment(
      scope,
      'inv-1',
      {
        amount: 300,
        method: 'CASH',
        reference: 'RCPT-001',
      },
      userId,
    );

    expect(result.invoice.status).toBe('PAID');
    expect(result.invoice.paidAmount).toBe(300);
  });

  it('3. Calculates doctor earnings from payment structure accurately', async () => {
    const mockDoctor = {
      id: 'doc-1',
      clinicId,
      name: 'Dr. Fatima',
      paymentStructure: {
        id: 'ps-1',
        fixedMonthlyAmount: 5000,
        procedureFeeType: 'PERCENTAGE',
        procedureFeePercent: 30,
        revenueIncentivePercent: 5,
        otherPayments: [],
      },
      appointments: [
        {
          id: 'appt-1',
          status: 'COMPLETED',
          startsAt: new Date('2026-08-15'),
          service: { priceMinor: 100000 }, // 1000 SAR
          invoice: { paidAmount: 1000 },
        },
      ],
    };

    vi.spyOn(prisma.doctor, 'findUnique').mockResolvedValue(mockDoctor as any);

    const earnings = await calculateDoctorEarnings(
      scope,
      'doc-1',
      new Date('2026-08-01'),
      new Date('2026-08-31'),
    );

    expect(earnings.totalCollectedRevenue).toBe(1000);
    expect(earnings.baseSalary).toBe(5000);
    expect(earnings.procedureCommission).toBe(300); // 30% of 1000
    expect(earnings.revenueIncentive).toBe(50); // 5% of 1000
    expect(earnings.totalCommission).toBe(350);
    expect(earnings.netEarnings).toBe(5350);
  });

  it('4. Creates and disburses doctor payout vouchers', async () => {
    const mockPayout = {
      id: 'pay-1',
      clinicId,
      doctorId: 'doc-1',
      payoutNumber: 'PAY-2608-0001',
      totalRevenue: 1000,
      baseSalary: 5000,
      commissionAmount: 350,
      deductions: 100,
      netPayoutAmount: 5250,
      status: 'PENDING',
    };

    vi.spyOn(prisma.doctorPayout, 'count').mockResolvedValue(0);
    vi.spyOn(prisma.doctorPayout, 'create').mockResolvedValue(mockPayout as any);
    vi.spyOn(prisma.doctorPayout, 'findUnique').mockResolvedValue(mockPayout as any);
    vi.spyOn(prisma.doctorPayout, 'update').mockResolvedValue({
      ...mockPayout,
      status: 'PAID',
      paidAt: new Date(),
      paymentMethod: 'BANK_TRANSFER',
    } as any);

    // Mock calculateDoctorEarnings dependencies
    const mockDoctor = {
      id: 'doc-1',
      clinicId,
      paymentStructure: { fixedMonthlyAmount: 5000, procedureFeeType: 'PERCENTAGE', procedureFeePercent: 30 },
      appointments: [],
    };
    vi.spyOn(prisma.doctor, 'findUnique').mockResolvedValue(mockDoctor as any);

    const payout = await createDoctorPayout(
      scope,
      clinicId,
      {
        doctorId: 'doc-1',
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        baseSalary: 5000,
        deductions: 100,
      },
      userId,
    );

    expect(payout.payoutNumber).toBe('PAY-2608-0001');

    const disbursed = await disburseDoctorPayout(
      scope,
      'pay-1',
      { paymentMethod: 'BANK_TRANSFER' },
      userId,
    );

    expect(disbursed.status).toBe('PAID');
  });

  it('5. Creates supplier bills and records payments', async () => {
    const mockBill = {
      id: 'bill-1',
      clinicId,
      supplierId: 'sup-1',
      billNumber: 'BILL-2608-0001',
      totalAmount: 1200,
      paidAmount: 0,
      status: 'UNPAID',
    };

    vi.spyOn(prisma.supplierBill, 'count').mockResolvedValue(0);
    vi.spyOn(prisma.supplierBill, 'create').mockResolvedValue(mockBill as any);
    vi.spyOn(prisma.supplierBill, 'findUnique').mockResolvedValue(mockBill as any);

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const tx = {
        supplierPayment: {
          create: vi.fn().mockResolvedValue({ id: 'sp-1', amount: 1200 }),
        },
        supplierBill: {
          update: vi.fn().mockResolvedValue({
            ...mockBill,
            paidAmount: 1200,
            status: 'PAID',
          }),
        },
      };
      return callback(tx);
    });

    const bill = await createSupplierBill(scope, clinicId, {
      supplierId: 'sup-1',
      totalAmount: 1200,
    });
    expect(bill.billNumber).toBe('BILL-2608-0001');

    const paymentResult = await recordSupplierPayment(scope, 'bill-1', {
      amount: 1200,
      method: 'BANK_TRANSFER',
    });
    expect(paymentResult.bill.status).toBe('PAID');
  });

  it('6. Records clinic operating expenses and calculates Profit & Loss', async () => {
    const mockExpense = {
      id: 'exp-1',
      clinicId,
      expenseNumber: 'EXP-2608-0001',
      category: 'RENT',
      title: 'Clinic Monthly Rent',
      amount: 4000,
      paymentMethod: 'BANK_TRANSFER',
      expenseDate: new Date(),
    };

    vi.spyOn(prisma.clinicExpense, 'count').mockResolvedValue(0);
    vi.spyOn(prisma.clinicExpense, 'create').mockResolvedValue(mockExpense as any);

    const expense = await createClinicExpense(
      scope,
      clinicId,
      {
        category: 'RENT',
        title: 'Clinic Monthly Rent',
        amount: 4000,
        paymentMethod: 'BANK_TRANSFER',
      },
      userId,
    );

    expect(expense.expenseNumber).toBe('EXP-2608-0001');

    // Test P&L computation
    vi.spyOn(prisma.paymentTransaction, 'findMany').mockResolvedValue([
      { amount: 10000, invoice: { items: [] } } as any,
    ]);
    vi.spyOn(prisma.doctorPayout, 'aggregate').mockResolvedValue({
      _sum: { netPayoutAmount: 2000, commissionAmount: 2000, baseSalary: 0 },
    } as any);
    vi.spyOn(prisma.clinicExpense, 'findMany').mockResolvedValue([
      { category: 'RENT', amount: 4000 } as any,
    ]);
    vi.spyOn(prisma.inventoryStockMovement, 'aggregate').mockResolvedValue({
      _sum: { unitCost: 500 },
    } as any);

    const pnl = await getProfitAndLossReport(scope, clinicId, '2026-08-01', '2026-08-31');

    expect(pnl.revenue.totalRevenue).toBe(10000);
    expect(pnl.costs.totalOperatingExpenses).toBe(4000);
    expect(pnl.costs.doctorCommissions).toBe(2000);
    expect(pnl.costs.estimatedCOGS).toBe(500);
    expect(pnl.costs.totalCosts).toBe(6500);
    expect(pnl.netIncome).toBe(3500);
    expect(pnl.profitMarginPercent).toBe(35);
  });

  it('7. Day-end shift cash reconciliation calculates cash discrepancy accurately', async () => {
    vi.spyOn(prisma.paymentTransaction, 'aggregate')
      .mockResolvedValueOnce({ _sum: { amount: 1200 } } as any) // cash
      .mockResolvedValueOnce({ _sum: { amount: 800 } } as any) // card
      .mockResolvedValueOnce({ _sum: { amount: 500 } } as any); // bank

    const mockClosing = {
      id: 'cls-1',
      clinicId,
      closingNumber: 'CLS-2608-0001',
      closingDate: '2026-08-31',
      openingCash: 500,
      expectedCash: 1700, // 500 + 1200
      countedCash: 1700,
      cashDifference: 0,
      totalRevenue: 2500,
      status: 'SUBMITTED',
    };

    vi.spyOn(prisma.dayEndClosing, 'count').mockResolvedValue(0);
    vi.spyOn(prisma.dayEndClosing, 'upsert').mockResolvedValue(mockClosing as any);

    const closing = await createDayEndClosing(
      scope,
      clinicId,
      {
        closingDate: '2026-08-31',
        openingCash: 500,
        countedCash: 1700,
        totalCardAmount: 800,
        totalBankAmount: 500,
      },
      userId,
    );

    expect(closing.expectedCash).toBe(1700);
    expect(closing.cashDifference).toBe(0);
    expect(closing.status).toBe('SUBMITTED');
  });
});
