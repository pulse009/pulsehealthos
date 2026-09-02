import { z } from 'zod';

export const invoiceItemInputSchema = z.object({
  serviceId: z.string().uuid().optional().nullable(),
  inventoryItemId: z.string().uuid().optional().nullable(),
  description: z.string().min(1, 'Item description is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
});

export const createInvoiceSchema = z.object({
  patientId: z.string().uuid('Valid patient ID is required'),
  doctorId: z.string().uuid().optional().nullable(),
  appointmentId: z.string().uuid().optional().nullable(),
  issueDate: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  discountAmount: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  currency: z.string().default('SAR'),
  notes: z.string().optional().nullable(),
  items: z.array(invoiceItemInputSchema).min(1, 'Invoice must contain at least one line item'),
});

export const updateInvoiceSchema = z.object({
  dueDate: z.string().optional().nullable(),
  discountAmount: z.number().min(0).optional(),
  taxAmount: z.number().min(0).optional(),
  notes: z.string().optional().nullable(),
  status: z
    .enum(['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'REFUNDED'])
    .optional(),
});

export const recordPaymentSchema = z.object({
  amount: z.number().positive('Payment amount must be greater than 0'),
  method: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'INSURANCE', 'ONLINE']).default('CASH'),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  paymentDate: z.string().optional(),
});

export const generateDoctorPayoutSchema = z.object({
  doctorId: z.string().uuid('Valid doctor ID is required'),
  periodStart: z.string().min(1, 'Period start date is required'),
  periodEnd: z.string().min(1, 'Period end date is required'),
  baseSalary: z.number().min(0).default(0),
  deductions: z.number().min(0).default(0),
  notes: z.string().optional().nullable(),
});

export const disburseDoctorPayoutSchema = z.object({
  paymentMethod: z.string().min(1, 'Payment method is required').default('BANK_TRANSFER'),
  notes: z.string().optional().nullable(),
});

export const createSupplierBillSchema = z.object({
  supplierId: z.string().uuid('Valid supplier ID is required'),
  purchaseOrderId: z.string().uuid().optional().nullable(),
  billDate: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  totalAmount: z.number().positive('Bill total amount must be positive'),
  notes: z.string().optional().nullable(),
});

export const recordSupplierPaymentSchema = z.object({
  amount: z.number().positive('Payment amount must be positive'),
  method: z.string().default('BANK_TRANSFER'),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  paymentDate: z.string().optional(),
});

export const createClinicExpenseSchema = z.object({
  category: z
    .enum([
      'RENT',
      'UTILITIES',
      'SALARIES',
      'MARKETING',
      'MAINTENANCE',
      'MEDICAL_SUPPLIES',
      'OFFICE_SUPPLIES',
      'OTHER',
    ])
    .default('OTHER'),
  title: z.string().min(1, 'Expense title is required'),
  amount: z.number().positive('Expense amount must be positive'),
  paymentMethod: z
    .enum(['CASH', 'CARD', 'BANK_TRANSFER', 'INSURANCE', 'ONLINE'])
    .default('BANK_TRANSFER'),
  paidTo: z.string().optional().nullable(),
  expenseDate: z.string().optional(),
  receiptUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const createDayEndClosingSchema = z.object({
  closingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  openingCash: z.number().min(0).default(0),
  countedCash: z.number().min(0, 'Counted cash cannot be negative'),
  totalCardAmount: z.number().min(0).default(0),
  totalBankAmount: z.number().min(0).default(0),
  notes: z.string().optional().nullable(),
});

export const verifyDayEndClosingSchema = z.object({
  notes: z.string().optional().nullable(),
});
