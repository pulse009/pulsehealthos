import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { conflict, forbidden, notFound, validationError } from '@/lib/errors';
import { assertOwned, clinicWhere, resolveClinicId, type TenantScope } from '@/lib/tenancy/scope';
import type { StockMovementType, PurchaseOrderStatus, ItemRequestStatus } from '@prisma/client';
import type {
  inventoryCategorySchema,
  supplierSchema,
  inventoryItemSchema,
  updateInventoryItemSchema,
  stockReceivingSchema,
  stockAdjustmentSchema,
  createPurchaseOrderSchema,
  receivePurchaseOrderSchema,
  createItemRequestSchema,
} from '@/lib/validation/inventory.schemas';
import type { z } from 'zod';

// ===========================================================================
// Metrics & Overview
// ===========================================================================

export async function getInventoryMetrics(scope: TenantScope, clinicId?: string | null) {
  const resolvedClinicId = resolveClinicId(scope, clinicId);

  const [items, pendingRequests, pendingPOs, recentMovements] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: { clinicId: resolvedClinicId, isActive: true },
      select: {
        id: true,
        name: true,
        sku: true,
        unit: true,
        currentStock: true,
        minimumStock: true,
        defaultCost: true,
        trackExpiry: true,
        category: { select: { name: true } },
      },
    }),
    prisma.itemRequest.count({
      where: { clinicId: resolvedClinicId, status: 'PENDING' },
    }),
    prisma.purchaseOrder.count({
      where: {
        clinicId: resolvedClinicId,
        status: { in: ['DRAFT', 'SENT', 'PARTIALLY_RECEIVED'] },
      },
    }),
    prisma.inventoryStockMovement.findMany({
      where: { clinicId: resolvedClinicId },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        item: { select: { id: true, name: true, sku: true, unit: true } },
        createdBy: { select: { id: true, name: true } },
      },
    }),
  ]);

  let totalItems = items.length;
  let totalStockQuantity = 0;
  let totalInventoryValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  const lowStockItems: typeof items = [];

  for (const item of items) {
    totalStockQuantity += item.currentStock;
    totalInventoryValue += item.currentStock * (item.defaultCost ?? 0);

    if (item.currentStock <= 0) {
      outOfStockCount++;
      lowStockItems.push(item);
    } else if (item.currentStock <= item.minimumStock) {
      lowStockCount++;
      lowStockItems.push(item);
    }
  }

  // Expiring soon check (batches within 60 days)
  const sixtyDaysFromNow = new Date();
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

  const expiringBatchesCount = await prisma.inventoryBatch.count({
    where: {
      clinicId: resolvedClinicId,
      quantity: { gt: 0 },
      expiryDate: { lte: sixtyDaysFromNow },
    },
  });

  return {
    totalItems,
    totalStockQuantity,
    totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
    lowStockCount,
    outOfStockCount,
    expiringBatchesCount,
    pendingRequests,
    pendingPOs,
    lowStockItems: lowStockItems.slice(0, 10),
    recentMovements,
  };
}

// ===========================================================================
// Categories
// ===========================================================================

export async function listInventoryCategories(scope: TenantScope, clinicId?: string | null) {
  const resolvedClinicId = resolveClinicId(scope, clinicId);
  return prisma.inventoryCategory.findMany({
    where: { clinicId: resolvedClinicId },
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { items: true } },
    },
  });
}

export async function createInventoryCategory(
  scope: TenantScope,
  clinicId: string | null | undefined,
  input: z.infer<typeof inventoryCategorySchema>,
) {
  const resolvedClinicId = resolveClinicId(scope, clinicId);

  const existing = await prisma.inventoryCategory.findFirst({
    where: { clinicId: resolvedClinicId, name: { equals: input.name, mode: 'insensitive' } },
  });
  if (existing) {
    throw conflict(`A category named "${input.name}" already exists in this clinic.`);
  }

  return prisma.inventoryCategory.create({
    data: {
      clinicId: resolvedClinicId,
      name: input.name,
      description: input.description,
    },
  });
}

export async function deleteInventoryCategory(scope: TenantScope, categoryId: string) {
  const category = await prisma.inventoryCategory.findUnique({
    where: { id: categoryId },
  });
  if (!category) throw notFound('Category not found.');
  assertOwned(scope, category);

  return prisma.inventoryCategory.delete({
    where: { id: categoryId },
  });
}

// ===========================================================================
// Suppliers
// ===========================================================================

export async function listSuppliers(scope: TenantScope, clinicId?: string | null) {
  const resolvedClinicId = resolveClinicId(scope, clinicId);
  return prisma.supplier.findMany({
    where: { clinicId: resolvedClinicId },
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    include: {
      _count: { select: { items: true, purchaseOrders: true } },
    },
  });
}

export async function createSupplier(
  scope: TenantScope,
  clinicId: string | null | undefined,
  input: z.infer<typeof supplierSchema>,
) {
  const resolvedClinicId = resolveClinicId(scope, clinicId);

  return prisma.supplier.create({
    data: {
      clinicId: resolvedClinicId,
      name: input.name,
      contactPerson: input.contactPerson,
      phone: input.phone,
      email: input.email || null,
      address: input.address,
      taxNumber: input.taxNumber,
      notes: input.notes,
      isActive: input.isActive,
    },
  });
}

export async function updateSupplier(
  scope: TenantScope,
  supplierId: string,
  input: Partial<z.infer<typeof supplierSchema>>,
) {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
  });
  if (!supplier) throw notFound('Supplier not found.');
  assertOwned(scope, supplier);

  return prisma.supplier.update({
    where: { id: supplierId },
    data: {
      name: input.name,
      contactPerson: input.contactPerson,
      phone: input.phone,
      email: input.email === '' ? null : input.email,
      address: input.address,
      taxNumber: input.taxNumber,
      notes: input.notes,
      isActive: input.isActive,
    },
  });
}

export async function deleteSupplier(scope: TenantScope, supplierId: string) {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    include: { _count: { select: { items: true, purchaseOrders: true } } },
  });
  if (!supplier) throw notFound('Supplier not found.');
  assertOwned(scope, supplier);

  if (supplier._count.purchaseOrders > 0) {
    return prisma.supplier.update({
      where: { id: supplierId },
      data: { isActive: false },
    });
  }

  return prisma.supplier.delete({
    where: { id: supplierId },
  });
}

// ===========================================================================
// Inventory Items
// ===========================================================================

export async function listInventoryItems(
  scope: TenantScope,
  clinicId?: string | null,
  filters?: {
    categoryId?: string | null;
    supplierId?: string | null;
    status?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'ALL' | null;
    search?: string | null;
    isActive?: boolean | null;
  },
) {
  const resolvedClinicId = resolveClinicId(scope, clinicId);
  const where: any = { clinicId: resolvedClinicId };

  if (filters?.categoryId) where.categoryId = filters.categoryId;
  if (filters?.supplierId) where.supplierId = filters.supplierId;
  if (filters?.isActive !== undefined && filters.isActive !== null) {
    where.isActive = filters.isActive;
  }

  if (filters?.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { sku: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }

  const items = await prisma.inventoryItem.findMany({
    where,
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    include: {
      category: { select: { id: true, name: true } },
      supplier: { select: { id: true, name: true, phone: true } },
      _count: { select: { movements: true, batches: true } },
    },
  });

  if (!filters?.status || filters.status === 'ALL') {
    return items;
  }

  return items.filter((item) => {
    if (filters.status === 'OUT_OF_STOCK') return item.currentStock <= 0;
    if (filters.status === 'LOW_STOCK') return item.currentStock > 0 && item.currentStock <= item.minimumStock;
    if (filters.status === 'IN_STOCK') return item.currentStock > item.minimumStock;
    return true;
  });
}

export async function getInventoryItemDetail(scope: TenantScope, itemId: string) {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: itemId },
    include: {
      category: true,
      supplier: true,
      batches: {
        orderBy: { expiryDate: 'asc' },
      },
      movements: {
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: {
          createdBy: { select: { id: true, name: true } },
        },
      },
      poItems: {
        orderBy: { purchaseOrder: { orderDate: 'desc' } },
        take: 10,
        include: {
          purchaseOrder: {
            select: {
              id: true,
              poNumber: true,
              orderDate: true,
              status: true,
              supplier: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!item) throw notFound('Inventory item not found.');
  assertOwned(scope, item);

  return item;
}

export async function createInventoryItem(
  scope: TenantScope,
  clinicId: string | null | undefined,
  input: z.infer<typeof inventoryItemSchema>,
  userId?: string,
) {
  const resolvedClinicId = resolveClinicId(scope, clinicId);

  // SKU uniqueness check within clinic
  if (input.sku?.trim()) {
    const existing = await prisma.inventoryItem.findUnique({
      where: {
        clinicId_sku: {
          clinicId: resolvedClinicId,
          sku: input.sku.trim(),
        },
      },
    });
    if (existing) {
      throw conflict(`An item with SKU "${input.sku}" already exists in this clinic.`);
    }
  }

  const initialStock = input.initialStock ?? 0;

  return prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.create({
      data: {
        clinicId: resolvedClinicId,
        name: input.name.trim(),
        sku: input.sku?.trim() || null,
        categoryId: input.categoryId || null,
        supplierId: input.supplierId || null,
        unit: input.unit.trim().toUpperCase(),
        description: input.description,
        currentStock: initialStock,
        minimumStock: input.minimumStock ?? 0,
        defaultCost: input.defaultCost ?? 0,
        trackExpiry: input.trackExpiry,
        trackBatch: input.trackBatch,
        isActive: input.isActive,
      },
      include: {
        category: true,
        supplier: true,
      },
    });

    // Record initial stock movement if stock > 0
    if (initialStock > 0) {
      await tx.inventoryStockMovement.create({
        data: {
          clinicId: resolvedClinicId,
          itemId: item.id,
          type: 'STOCK_RECEIVED',
          quantity: initialStock,
          previousStock: 0,
          newStock: initialStock,
          unitCost: input.defaultCost ?? 0,
          referenceType: 'INITIAL_STOCK',
          notes: 'Initial opening stock upon item creation',
          createdById: userId || null,
        },
      });
    }

    return item;
  });
}

export async function updateInventoryItem(
  scope: TenantScope,
  itemId: string,
  input: z.infer<typeof updateInventoryItemSchema>,
  userId?: string,
) {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: itemId },
  });
  if (!item) throw notFound('Inventory item not found.');
  assertOwned(scope, item);

  if (input.sku?.trim() && input.sku.trim() !== item.sku) {
    const existing = await prisma.inventoryItem.findUnique({
      where: {
        clinicId_sku: {
          clinicId: item.clinicId,
          sku: input.sku.trim(),
        },
      },
    });
    if (existing && existing.id !== itemId) {
      throw conflict(`An item with SKU "${input.sku}" already exists in this clinic.`);
    }
  }

  return prisma.inventoryItem.update({
    where: { id: itemId },
    data: {
      name: input.name?.trim(),
      sku: input.sku === '' ? null : input.sku?.trim(),
      categoryId: input.categoryId === '' ? null : input.categoryId,
      supplierId: input.supplierId === '' ? null : input.supplierId,
      unit: input.unit?.trim().toUpperCase(),
      description: input.description,
      minimumStock: input.minimumStock,
      defaultCost: input.defaultCost,
      trackExpiry: input.trackExpiry,
      trackBatch: input.trackBatch,
      isActive: input.isActive,
    },
    include: {
      category: true,
      supplier: true,
    },
  });
}

export async function deleteInventoryItem(scope: TenantScope, itemId: string) {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: itemId },
    include: { _count: { select: { movements: true, poItems: true } } },
  });
  if (!item) throw notFound('Inventory item not found.');
  assertOwned(scope, item);

  if (item._count.movements > 0 || item._count.poItems > 0) {
    return prisma.inventoryItem.update({
      where: { id: itemId },
      data: { isActive: false },
    });
  }

  return prisma.inventoryItem.delete({
    where: { id: itemId },
  });
}

// ===========================================================================
// Stock Operations (Receiving, Adjustments, Movements)
// ===========================================================================

export async function receiveStock(
  scope: TenantScope,
  clinicId: string | null | undefined,
  input: z.infer<typeof stockReceivingSchema>,
  userId?: string,
) {
  const resolvedClinicId = resolveClinicId(scope, clinicId);

  return prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findUnique({
      where: { id: input.itemId },
    });
    if (!item) throw notFound('Item not found.');
    if (item.clinicId !== resolvedClinicId) throw forbidden('Access denied to item.');

    const previousStock = item.currentStock;
    const newStock = previousStock + input.quantity;

    // Update item stock
    await tx.inventoryItem.update({
      where: { id: input.itemId },
      data: { currentStock: newStock },
    });

    let batchId: string | null = null;
    if (input.batchNumber?.trim()) {
      const expiry = input.expiryDate ? new Date(input.expiryDate) : null;
      const batch = await tx.inventoryBatch.create({
        data: {
          clinicId: resolvedClinicId,
          itemId: input.itemId,
          batchNumber: input.batchNumber.trim(),
          expiryDate: expiry,
          quantity: input.quantity,
          unitCost: input.unitCost ?? item.defaultCost ?? 0,
        },
      });
      batchId = batch.id;
    }

    // Record immutable movement
    const movement = await tx.inventoryStockMovement.create({
      data: {
        clinicId: resolvedClinicId,
        itemId: input.itemId,
        batchId,
        type: 'STOCK_RECEIVED',
        quantity: input.quantity,
        previousStock,
        newStock,
        unitCost: input.unitCost ?? item.defaultCost ?? 0,
        referenceType: input.purchaseOrderId ? 'PURCHASE_ORDER' : 'MANUAL_RECEIVE',
        referenceId: input.purchaseOrderId || null,
        notes: input.notes,
        createdById: userId || null,
      },
    });

    return { movement, newStock };
  });
}

export async function adjustStock(
  scope: TenantScope,
  clinicId: string | null | undefined,
  input: z.infer<typeof stockAdjustmentSchema>,
  userId?: string,
) {
  const resolvedClinicId = resolveClinicId(scope, clinicId);

  return prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findUnique({
      where: { id: input.itemId },
    });
    if (!item) throw notFound('Item not found.');
    if (item.clinicId !== resolvedClinicId) throw forbidden('Access denied to item.');

    const previousStock = item.currentStock;
    const newStock = previousStock + input.quantity;

    if (newStock < 0) {
      throw validationError(
        `Cannot deduct ${Math.abs(input.quantity)} units. Current available stock is only ${previousStock}.`,
      );
    }

    await tx.inventoryItem.update({
      where: { id: input.itemId },
      data: { currentStock: newStock },
    });

    const movement = await tx.inventoryStockMovement.create({
      data: {
        clinicId: resolvedClinicId,
        itemId: input.itemId,
        batchId: input.batchId || null,
        type: (input.type as StockMovementType) || 'STOCK_ADJUSTMENT',
        quantity: input.quantity,
        previousStock,
        newStock,
        unitCost: item.defaultCost ?? 0,
        referenceType: 'MANUAL_ADJUSTMENT',
        notes: input.notes,
        createdById: userId || null,
      },
    });

    return { movement, newStock };
  });
}

export async function listStockMovements(
  scope: TenantScope,
  clinicId?: string | null,
  filters?: {
    itemId?: string | null;
    type?: StockMovementType | null;
    limit?: number;
  },
) {
  const resolvedClinicId = resolveClinicId(scope, clinicId);
  const where: any = { clinicId: resolvedClinicId };

  if (filters?.itemId) where.itemId = filters.itemId;
  if (filters?.type) where.type = filters.type;

  return prisma.inventoryStockMovement.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters?.limit || 100,
    include: {
      item: { select: { id: true, name: true, sku: true, unit: true } },
      batch: { select: { id: true, batchNumber: true, expiryDate: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
}

// ===========================================================================
// Purchase Orders
// ===========================================================================

export async function listPurchaseOrders(
  scope: TenantScope,
  clinicId?: string | null,
  filters?: {
    supplierId?: string | null;
    status?: PurchaseOrderStatus | 'ALL' | null;
  },
) {
  const resolvedClinicId = resolveClinicId(scope, clinicId);
  const where: any = { clinicId: resolvedClinicId };

  if (filters?.supplierId) where.supplierId = filters.supplierId;
  if (filters?.status && filters.status !== 'ALL') where.status = filters.status;

  return prisma.purchaseOrder.findMany({
    where,
    orderBy: { orderDate: 'desc' },
    include: {
      supplier: { select: { id: true, name: true, phone: true } },
      createdBy: { select: { id: true, name: true } },
      items: {
        include: {
          item: { select: { id: true, name: true, sku: true, unit: true } },
        },
      },
    },
  });
}

export async function getPurchaseOrderDetail(scope: TenantScope, poId: string) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: {
      supplier: true,
      createdBy: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          item: { select: { id: true, name: true, sku: true, unit: true, currentStock: true } },
        },
      },
    },
  });

  if (!po) throw notFound('Purchase order not found.');
  assertOwned(scope, po);

  return po;
}

export async function createPurchaseOrder(
  scope: TenantScope,
  clinicId: string | null | undefined,
  input: z.infer<typeof createPurchaseOrderSchema>,
  userId?: string,
) {
  const resolvedClinicId = resolveClinicId(scope, clinicId);

  // Generate unique PO Number: PO-YYMM-XXXX
  const today = new Date();
  const datePrefix = `PO-${today.getFullYear().toString().slice(-2)}${(today.getMonth() + 1).toString().padStart(2, '0')}`;
  const poCount = await prisma.purchaseOrder.count({
    where: { clinicId: resolvedClinicId },
  });
  const poNumber = input.poNumber?.trim() || `${datePrefix}-${(poCount + 1).toString().padStart(4, '0')}`;

  let totalAmount = 0;
  const itemsData = input.items.map((item) => {
    const itemTotal = item.quantity * item.unitCost;
    totalAmount += itemTotal;
    return {
      itemId: item.itemId,
      quantity: item.quantity,
      unitCost: item.unitCost,
      totalCost: itemTotal,
    };
  });

  return prisma.purchaseOrder.create({
    data: {
      clinicId: resolvedClinicId,
      supplierId: input.supplierId,
      poNumber,
      expectedDate: input.expectedDate ? new Date(input.expectedDate) : null,
      notes: input.notes,
      totalAmount,
      createdById: userId || null,
      items: {
        create: itemsData,
      },
    },
    include: {
      supplier: true,
      items: { include: { item: true } },
    },
  });
}

export async function updatePurchaseOrderStatus(
  scope: TenantScope,
  poId: string,
  status: 'DRAFT' | 'SENT' | 'CANCELLED',
  notes?: string,
) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
  });
  if (!po) throw notFound('Purchase order not found.');
  assertOwned(scope, po);

  if (po.status === 'RECEIVED' || po.status === 'PARTIALLY_RECEIVED') {
    throw validationError('Cannot change status of a received or partially received purchase order.');
  }

  return prisma.purchaseOrder.update({
    where: { id: poId },
    data: {
      status,
      notes: notes ? `${po.notes ? po.notes + '\n' : ''}${notes}` : po.notes,
    },
    include: {
      supplier: { select: { id: true, name: true, phone: true } },
      createdBy: { select: { id: true, name: true } },
      items: {
        include: {
          item: { select: { id: true, name: true, sku: true, unit: true, currentStock: true } },
        },
      },
    },
  });
}

export async function receivePurchaseOrderGoods(
  scope: TenantScope,
  poId: string,
  input: z.infer<typeof receivePurchaseOrderSchema>,
  userId?: string,
) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: { items: true },
  });
  if (!po) throw notFound('Purchase order not found.');
  assertOwned(scope, po);

  if (po.status === 'CANCELLED') {
    throw validationError('Cannot receive goods on a cancelled purchase order.');
  }

  return prisma.$transaction(async (tx) => {
    for (const recItem of input.receivedItems) {
      const poItem = po.items.find((i) => i.id === recItem.poItemId);
      if (!poItem) continue;

      const remainingToReceive = poItem.quantity - poItem.receivedQuantity;
      if (recItem.quantityToReceive > remainingToReceive) {
        throw validationError(
          `Cannot receive ${recItem.quantityToReceive} units. Only ${remainingToReceive} units remaining for this item.`,
        );
      }

      // 1. Update PO item receivedQuantity
      const newReceivedQty = poItem.receivedQuantity + recItem.quantityToReceive;
      await tx.purchaseOrderItem.update({
        where: { id: poItem.id },
        data: { receivedQuantity: newReceivedQty },
      });

      // 2. Fetch inventory item and update currentStock
      const item = await tx.inventoryItem.findUnique({
        where: { id: recItem.itemId },
      });
      if (!item) continue;

      const previousStock = item.currentStock;
      const newStock = previousStock + recItem.quantityToReceive;

      await tx.inventoryItem.update({
        where: { id: recItem.itemId },
        data: { currentStock: newStock },
      });

      // 3. Create batch if specified
      let batchId: string | null = null;
      if (recItem.batchNumber?.trim()) {
        const batch = await tx.inventoryBatch.create({
          data: {
            clinicId: po.clinicId,
            itemId: recItem.itemId,
            batchNumber: recItem.batchNumber.trim(),
            expiryDate: recItem.expiryDate ? new Date(recItem.expiryDate) : null,
            quantity: recItem.quantityToReceive,
            unitCost: poItem.unitCost,
          },
        });
        batchId = batch.id;
      }

      // 4. Create Stock Movement
      await tx.inventoryStockMovement.create({
        data: {
          clinicId: po.clinicId,
          itemId: recItem.itemId,
          batchId,
          type: 'STOCK_RECEIVED',
          quantity: recItem.quantityToReceive,
          previousStock,
          newStock,
          unitCost: poItem.unitCost,
          referenceType: 'PURCHASE_ORDER',
          referenceId: po.poNumber,
          notes: `Goods received against PO #${po.poNumber}`,
          createdById: userId || null,
        },
      });
    }

    // 5. Check if PO is completely or partially received
    const updatedPoItems = await tx.purchaseOrderItem.findMany({
      where: { purchaseOrderId: poId },
    });

    const isFullyReceived = updatedPoItems.every((i) => i.receivedQuantity >= i.quantity);
    const hasAnyReceived = updatedPoItems.some((i) => i.receivedQuantity > 0);

    const newPoStatus: PurchaseOrderStatus = isFullyReceived
      ? 'RECEIVED'
      : hasAnyReceived
        ? 'PARTIALLY_RECEIVED'
        : po.status;

    const updatedPo = await tx.purchaseOrder.update({
      where: { id: poId },
      data: { status: newPoStatus },
      include: {
        supplier: { select: { id: true, name: true, phone: true } },
        createdBy: { select: { id: true, name: true } },
        items: {
          include: {
            item: { select: { id: true, name: true, sku: true, unit: true, currentStock: true } },
          },
        },
      },
    });

    if (newPoStatus === 'RECEIVED') {
      import('@/lib/accounts/accounts.automation').then(({ handlePurchaseOrderGoodsReceived }) => {
        handlePurchaseOrderGoodsReceived(poId).catch((err) => {
          console.error('Failed to auto-create supplier bill on PO receipt:', err);
        });
      }).catch(() => {});
    }

    return updatedPo;
  });
}

// ===========================================================================
// Item Requests (Doctor/Coordinator -> Approval -> Release with Stock Deduction)
// ===========================================================================

export async function listItemRequests(
  scope: TenantScope,
  clinicId?: string | null,
  filters?: {
    status?: ItemRequestStatus | 'ALL' | null;
    requestedById?: string | null;
  },
) {
  const resolvedClinicId = resolveClinicId(scope, clinicId);
  const where: any = { clinicId: resolvedClinicId };

  if (filters?.status && filters.status !== 'ALL') where.status = filters.status;
  if (filters?.requestedById) where.requestedById = filters.requestedById;

  return prisma.itemRequest.findMany({
    where,
    orderBy: { requestDate: 'desc' },
    include: {
      requestedBy: { select: { id: true, name: true, role: true } },
      approvedBy: { select: { id: true, name: true } },
      releasedBy: { select: { id: true, name: true } },
      items: {
        include: {
          item: { select: { id: true, name: true, sku: true, unit: true, currentStock: true } },
        },
      },
    },
  });
}

export async function getItemRequestDetail(scope: TenantScope, requestId: string) {
  const req = await prisma.itemRequest.findUnique({
    where: { id: requestId },
    include: {
      requestedBy: { select: { id: true, name: true, email: true, role: true } },
      approvedBy: { select: { id: true, name: true } },
      releasedBy: { select: { id: true, name: true } },
      items: {
        include: {
          item: { select: { id: true, name: true, sku: true, unit: true, currentStock: true, minimumStock: true } },
        },
      },
    },
  });

  if (!req) throw notFound('Item request not found.');
  assertOwned(scope, req);

  return req;
}

export async function createItemRequest(
  scope: TenantScope,
  clinicId: string | null | undefined,
  input: z.infer<typeof createItemRequestSchema>,
  userId: string,
) {
  const resolvedClinicId = resolveClinicId(scope, clinicId);

  // Generate Request Number: IR-YYMM-XXXX
  const today = new Date();
  const datePrefix = `IR-${today.getFullYear().toString().slice(-2)}${(today.getMonth() + 1).toString().padStart(2, '0')}`;
  const count = await prisma.itemRequest.count({
    where: { clinicId: resolvedClinicId },
  });
  const requestNumber = `${datePrefix}-${(count + 1).toString().padStart(4, '0')}`;

  return prisma.itemRequest.create({
    data: {
      clinicId: resolvedClinicId,
      requestNumber,
      requestedById: userId,
      department: input.department,
      notes: input.notes,
      items: {
        create: input.items.map((i) => ({
          itemId: i.itemId,
          requestedQuantity: i.quantity,
        })),
      },
    },
    include: {
      requestedBy: true,
      items: { include: { item: true } },
    },
  });
}

export async function approveItemRequest(
  scope: TenantScope,
  requestId: string,
  userId: string,
  notes?: string,
) {
  const req = await prisma.itemRequest.findUnique({
    where: { id: requestId },
  });
  if (!req) throw notFound('Item request not found.');
  assertOwned(scope, req);

  if (req.status !== 'PENDING') {
    throw validationError(`Cannot approve a request with status ${req.status}.`);
  }

  return prisma.itemRequest.update({
    where: { id: requestId },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedById: userId,
      notes: notes ? `${req.notes ? req.notes + '\n' : ''}[Approved]: ${notes}` : req.notes,
    },
  });
}

export async function rejectItemRequest(
  scope: TenantScope,
  requestId: string,
  userId: string,
  rejectionReason: string,
) {
  const req = await prisma.itemRequest.findUnique({
    where: { id: requestId },
  });
  if (!req) throw notFound('Item request not found.');
  assertOwned(scope, req);

  if (req.status !== 'PENDING' && req.status !== 'APPROVED') {
    throw validationError(`Cannot reject a request with status ${req.status}.`);
  }

  return prisma.itemRequest.update({
    where: { id: requestId },
    data: {
      status: 'REJECTED',
      rejectionReason,
    },
  });
}

export async function releaseItemRequest(
  scope: TenantScope,
  requestId: string,
  userId: string,
  notes?: string,
) {
  const req = await prisma.itemRequest.findUnique({
    where: { id: requestId },
    include: {
      items: { include: { item: true } },
    },
  });
  if (!req) throw notFound('Item request not found.');
  assertOwned(scope, req);

  if (req.status !== 'APPROVED') {
    throw validationError('Only APPROVED requests can be released for stock issuance.');
  }

  // ATOMIC TRANSACTION: Check stock, deduct inventory, record movements, update request to RELEASED
  return prisma.$transaction(async (tx) => {
    // 1. Stock validation check
    for (const reqItem of req.items) {
      const currentStock = reqItem.item.currentStock;
      if (currentStock < reqItem.requestedQuantity) {
        throw validationError(
          `Insufficient stock for "${reqItem.item.name}". Available: ${currentStock}, Requested: ${reqItem.requestedQuantity}.`,
        );
      }
    }

    // 2. Deduct stock and log movements
    for (const reqItem of req.items) {
      const previousStock = reqItem.item.currentStock;
      const newStock = previousStock - reqItem.requestedQuantity;

      // Update item stock
      await tx.inventoryItem.update({
        where: { id: reqItem.itemId },
        data: { currentStock: newStock },
      });

      // Update item request item releasedQuantity
      await tx.itemRequestItem.update({
        where: { id: reqItem.id },
        data: { releasedQuantity: reqItem.requestedQuantity },
      });

      // Create Stock Movement record (STOCK_ISSUED)
      await tx.inventoryStockMovement.create({
        data: {
          clinicId: req.clinicId,
          itemId: reqItem.itemId,
          type: 'STOCK_ISSUED',
          quantity: -reqItem.requestedQuantity,
          previousStock,
          newStock,
          unitCost: reqItem.item.defaultCost ?? 0,
          referenceType: 'ITEM_REQUEST',
          referenceId: req.requestNumber,
          notes: `Stock issued against Request #${req.requestNumber}`,
          createdById: userId,
        },
      });
    }

    // 3. Update Request status to RELEASED
    return tx.itemRequest.update({
      where: { id: requestId },
      data: {
        status: 'RELEASED',
        releasedAt: new Date(),
        releasedById: userId,
        notes: notes ? `${req.notes ? req.notes + '\n' : ''}[Released]: ${notes}` : req.notes,
      },
      include: {
        items: { include: { item: true } },
      },
    });
  });
}
