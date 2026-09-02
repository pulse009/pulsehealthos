import { z } from 'zod';

export const inventoryCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(100),
  description: z.string().trim().max(500).optional().nullable(),
});

export const supplierSchema = z.object({
  name: z.string().trim().min(1, 'Supplier name is required').max(150),
  contactPerson: z.string().trim().max(100).optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  email: z.string().trim().email('Invalid email address').optional().nullable().or(z.literal('')),
  address: z.string().trim().max(300).optional().nullable(),
  taxNumber: z.string().trim().max(50).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const inventoryItemSchema = z.object({
  name: z.string().trim().min(1, 'Item name is required').max(200),
  sku: z.string().trim().max(100).optional().nullable(),
  categoryId: z.string().uuid().optional().nullable().or(z.literal('')),
  supplierId: z.string().uuid().optional().nullable().or(z.literal('')),
  unit: z.string().trim().min(1, 'Unit is required').max(50).default('PCS'),
  description: z.string().trim().max(1000).optional().nullable(),
  minimumStock: z.coerce.number().int().min(0, 'Minimum stock cannot be negative').default(0),
  defaultCost: z.coerce.number().min(0, 'Default cost cannot be negative').default(0),
  initialStock: z.coerce.number().int().min(0, 'Initial stock cannot be negative').default(0).optional(),
  trackExpiry: z.boolean().default(false),
  trackBatch: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const updateInventoryItemSchema = inventoryItemSchema.partial();

export const stockReceivingSchema = z.object({
  itemId: z.string().uuid('Invalid item ID'),
  quantity: z.coerce.number().int().positive('Quantity must be greater than 0'),
  unitCost: z.coerce.number().min(0, 'Unit cost cannot be negative').optional(),
  supplierId: z.string().uuid().optional().nullable(),
  purchaseOrderId: z.string().uuid().optional().nullable(),
  batchNumber: z.string().trim().max(100).optional().nullable(),
  expiryDate: z.string().optional().nullable(), // ISO string or YYYY-MM-DD
  notes: z.string().trim().max(500).optional().nullable(),
});

export const stockAdjustmentSchema = z.object({
  itemId: z.string().uuid('Invalid item ID'),
  batchId: z.string().uuid().optional().nullable(),
  quantity: z.coerce.number().int().refine((val) => val !== 0, 'Quantity adjustment cannot be 0'),
  type: z.enum(['STOCK_ADJUSTMENT', 'STOCK_RETURN', 'STOCK_TRANSFER', 'STOCK_ISSUED']).default('STOCK_ADJUSTMENT'),
  notes: z.string().trim().min(1, 'Reason/notes required for adjustment').max(500),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().uuid('Supplier is required'),
  poNumber: z.string().trim().max(100).optional(),
  expectedDate: z.string().optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  items: z
    .array(
      z.object({
        itemId: z.string().uuid('Invalid item ID'),
        quantity: z.coerce.number().int().positive('Quantity must be greater than 0'),
        unitCost: z.coerce.number().min(0, 'Unit cost cannot be negative'),
      }),
    )
    .min(1, 'At least one item is required in a Purchase Order'),
});

export const updatePurchaseOrderStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'CANCELLED']),
  notes: z.string().trim().max(500).optional(),
});

export const receivePurchaseOrderSchema = z.object({
  receivedItems: z
    .array(
      z.object({
        poItemId: z.string().uuid(),
        itemId: z.string().uuid(),
        quantityToReceive: z.coerce.number().int().positive('Must receive at least 1 unit'),
        batchNumber: z.string().trim().max(100).optional().nullable(),
        expiryDate: z.string().optional().nullable(),
      }),
    )
    .min(1, 'At least one item must be received'),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const createItemRequestSchema = z.object({
  department: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  items: z
    .array(
      z.object({
        itemId: z.string().uuid('Invalid item ID'),
        quantity: z.coerce.number().int().positive('Quantity must be greater than 0'),
      }),
    )
    .min(1, 'At least one item must be requested'),
});

export const approveItemRequestSchema = z.object({
  notes: z.string().trim().max(500).optional().nullable(),
});

export const releaseItemRequestSchema = z.object({
  notes: z.string().trim().max(500).optional().nullable(),
});
