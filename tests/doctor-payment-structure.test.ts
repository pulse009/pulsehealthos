import { describe, expect, it } from 'vitest';
import {
  doctorPaymentStructureSchema,
  doctorOtherPaymentSchema,
  clinicDoctorOperationalSchema,
} from '@/lib/validation/schemas';

describe('Doctor Payment Structure & Compensation Scheme', () => {
  it('validates a complete payment structure with fixed salary, incentive, procedure percent, and allowances', () => {
    const rawInput = {
      fixedMonthlyAmount: 18000,
      revenueIncentivePercent: 12,
      procedureFeeType: 'PERCENTAGE',
      procedureFeePercent: 20,
      procedureFeeAmount: 0,
      otherPayments: [
        {
          label: 'On-call allowance',
          type: 'AMOUNT',
          value: 1500,
        },
        {
          label: 'Specialty retainer',
          type: 'PERCENTAGE',
          value: 5,
        },
      ],
    };

    const parsed = doctorPaymentStructureSchema.parse(rawInput);
    expect(parsed.fixedMonthlyAmount).toBe(18000);
    expect(parsed.revenueIncentivePercent).toBe(12);
    expect(parsed.procedureFeeType).toBe('PERCENTAGE');
    expect(parsed.procedureFeePercent).toBe(20);
    expect(parsed.otherPayments?.length).toBe(2);
    expect(parsed.otherPayments?.[0]?.label).toBe('On-call allowance');
    expect(parsed.otherPayments?.[0]?.value).toBe(1500);
  });

  it('supports commission-only doctors with 0 fixed monthly salary', () => {
    const rawInput = {
      fixedMonthlyAmount: 0,
      revenueIncentivePercent: 25,
      procedureFeeType: 'FIXED',
      procedureFeeAmount: 350,
      procedureFeePercent: 0,
      otherPayments: [],
    };

    const parsed = doctorPaymentStructureSchema.parse(rawInput);
    expect(parsed.fixedMonthlyAmount).toBe(0);
    expect(parsed.revenueIncentivePercent).toBe(25);
    expect(parsed.procedureFeeType).toBe('FIXED');
    expect(parsed.procedureFeeAmount).toBe(350);
  });

  it('rejects negative salary or percentage greater than 100', () => {
    const invalidNegative = {
      fixedMonthlyAmount: -500,
      revenueIncentivePercent: 10,
    };
    expect(() => doctorPaymentStructureSchema.parse(invalidNegative)).toThrow();

    const invalidPercent = {
      fixedMonthlyAmount: 10000,
      revenueIncentivePercent: 150,
    };
    expect(() => doctorPaymentStructureSchema.parse(invalidPercent)).toThrow();
  });

  it('validates other payment items and requires non-empty label', () => {
    const validOther = {
      label: 'Housing allowance',
      type: 'AMOUNT',
      value: 2000,
    };
    expect(doctorOtherPaymentSchema.parse(validOther).label).toBe('Housing allowance');

    const emptyLabel = {
      label: '   ',
      type: 'AMOUNT',
      value: 2000,
    };
    expect(() => doctorOtherPaymentSchema.parse(emptyLabel)).toThrow();
  });

  it('integrates cleanly into clinicDoctorOperationalSchema', () => {
    const operationalInput = {
      name: 'Dr. Nadia Fares',
      isActive: true,
      appointmentMinutes: 30,
      paymentStructure: {
        fixedMonthlyAmount: 22000,
        revenueIncentivePercent: 15,
        procedureFeeType: 'PERCENTAGE',
        procedureFeePercent: 25,
        otherPayments: [
          {
            label: 'On-call allowance',
            type: 'AMOUNT',
            value: 1500,
          },
        ],
      },
    };

    const parsed = clinicDoctorOperationalSchema.parse(operationalInput);
    expect(parsed.name).toBe('Dr. Nadia Fares');
    expect(parsed.paymentStructure?.fixedMonthlyAmount).toBe(22000);
    expect(parsed.paymentStructure?.procedureFeePercent).toBe(25);
    expect(parsed.paymentStructure?.otherPayments?.[0]?.label).toBe('On-call allowance');
  });
});
