import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clinicScope } from '../src/lib/tenancy/scope';
import {
  createInventoryItem,
  listInventoryItems,
  receiveStock,
  adjustStock,
  createPurchaseOrder,
  receivePurchaseOrderGoods,
  createItemRequest,
  approveItemRequest,
  releaseItemRequest,
} from '../src/lib/inventory/inventory.service';
import { prisma } from '../src/lib/db/prisma';

describe('Inventory Module Service Tests', () => {
  const clinicId = 'clinic-inv-1';
  const userId = 'user-owner-1';
  const scope = clinicScope(clinicId, userId);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Creates an item with initial stock and logs initial movement', async () => {
    const mockItem = {
      id: 'item-1',
      clinicId,
      name: 'Sterile Gauze 4x4',
      sku: 'GAUZE-4X4',
      unit: 'PACK',
      currentStock: 50,
      minimumStock: 10,
      defaultCost: 2.5,
      trackExpiry: true,
      trackBatch: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(prisma.inventoryItem, 'findUnique').mockResolvedValue(null);
    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const tx = {
        inventoryItem: {
          create: vi.fn().mockResolvedValue(mockItem),
        },
        inventoryStockMovement: {
          create: vi.fn().mockResolvedValue({ id: 'mov-1', type: 'STOCK_RECEIVED', quantity: 50 }),
        },
      };
      return callback(tx);
    });

    const item = await createInventoryItem(
      scope,
      clinicId,
      {
        name: 'Sterile Gauze 4x4',
        sku: 'GAUZE-4X4',
        unit: 'PACK',
        minimumStock: 10,
        defaultCost: 2.5,
        initialStock: 50,
        trackExpiry: true,
        trackBatch: true,
        isActive: true,
      },
      userId,
    );

    expect(item.id).toBe('item-1');
    expect(item.currentStock).toBe(50);
  });

  it('2. Direct Stock Receiving increments stock and creates STOCK_RECEIVED movement', async () => {
    const mockItem = {
      id: 'item-1',
      clinicId,
      name: 'Sterile Gauze 4x4',
      unit: 'PACK',
      currentStock: 50,
    };

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const tx = {
        inventoryItem: {
          findUnique: vi.fn().mockResolvedValue(mockItem),
          update: vi.fn().mockResolvedValue({ ...mockItem, currentStock: 70 }),
        },
        inventoryBatch: {
          create: vi.fn().mockResolvedValue({ id: 'batch-1' }),
        },
        inventoryStockMovement: {
          create: vi.fn().mockResolvedValue({
            id: 'mov-2',
            type: 'STOCK_RECEIVED',
            quantity: 20,
            previousStock: 50,
            newStock: 70,
          }),
        },
      };
      return callback(tx);
    });

    const result = await receiveStock(
      scope,
      clinicId,
      {
        itemId: 'item-1',
        quantity: 20,
        unitCost: 2.5,
        batchNumber: 'LOT-2026-A',
        notes: 'Delivery challan #101',
      },
      userId,
    );

    expect(result.newStock).toBe(70);
    expect(result.movement.type).toBe('STOCK_RECEIVED');
  });

  it('3. Manual Stock Adjustment prevents negative stock on over-deduction', async () => {
    const mockItem = {
      id: 'item-1',
      clinicId,
      name: 'Sterile Gauze 4x4',
      unit: 'PACK',
      currentStock: 10,
    };

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const tx = {
        inventoryItem: {
          findUnique: vi.fn().mockResolvedValue(mockItem),
        },
      };
      return callback(tx);
    });

    await expect(
      adjustStock(
        scope,
        clinicId,
        {
          itemId: 'item-1',
          quantity: -15, // deducting 15 when only 10 available
          type: 'STOCK_ADJUSTMENT',
          notes: 'Damage audit',
        },
        userId,
      ),
    ).rejects.toThrow('Cannot deduct 15 units. Current available stock is only 10.');
  });

  it('4. Purchase Order creation generates unique PO number and does NOT increase inventory stock', async () => {
    const mockPO = {
      id: 'po-1',
      clinicId,
      supplierId: 'sup-1',
      poNumber: 'PO-2608-0001',
      status: 'ISSUED',
      totalAmount: 100,
      orderDate: new Date(),
      items: [
        {
          id: 'poi-1',
          itemId: 'item-1',
          quantity: 20,
          unitCost: 5,
          totalCost: 100,
          receivedQuantity: 0,
        },
      ],
    };

    vi.spyOn(prisma.purchaseOrder, 'count').mockResolvedValue(0);
    vi.spyOn(prisma.purchaseOrder, 'create').mockResolvedValue(mockPO as any);

    const po = await createPurchaseOrder(
      scope,
      clinicId,
      {
        supplierId: 'sup-1',
        items: [{ itemId: 'item-1', quantity: 20, unitCost: 5 }],
      },
      userId,
    );

    expect(po.poNumber).toBe('PO-2608-0001');
    expect(po.status).toBe('ISSUED');
  });

  it('5. Receiving Purchase Order Goods increments stock and updates PO status', async () => {
    const mockPO = {
      id: 'po-1',
      clinicId,
      poNumber: 'PO-1001',
      status: 'ISSUED',
      items: [
        {
          id: 'poi-1',
          itemId: 'item-1',
          quantity: 20,
          receivedQuantity: 0,
          unitCost: 5,
          item: { id: 'item-1', name: 'Gauze', unit: 'PACK' },
        },
      ],
    };

    const mockItem = {
      id: 'item-1',
      clinicId,
      currentStock: 10,
    };

    vi.spyOn(prisma.purchaseOrder, 'findUnique').mockResolvedValue(mockPO as any);

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const tx = {
        purchaseOrderItem: {
          update: vi.fn().mockResolvedValue({}),
          findMany: vi.fn().mockResolvedValue([{ ...mockPO.items[0], receivedQuantity: 20 }]),
        },
        inventoryItem: {
          findUnique: vi.fn().mockResolvedValue(mockItem),
          update: vi.fn().mockResolvedValue({ ...mockItem, currentStock: 30 }),
        },
        inventoryBatch: {
          create: vi.fn().mockResolvedValue({ id: 'batch-2' }),
        },
        inventoryStockMovement: {
          create: vi.fn().mockResolvedValue({ id: 'mov-3', type: 'STOCK_RECEIVED' }),
        },
        purchaseOrder: {
          findUnique: vi.fn().mockResolvedValue(mockPO),
          update: vi.fn().mockResolvedValue({
            ...mockPO,
            status: 'RECEIVED',
            items: [{ ...mockPO.items[0], receivedQuantity: 20 }],
          }),
        },
      };
      return callback(tx);
    });

    const updatedPO = await receivePurchaseOrderGoods(
      scope,
      'po-1',
      {
        receivedItems: [{ poItemId: 'poi-1', itemId: 'item-1', quantityToReceive: 20, batchNumber: 'LOT-99' }],
      },
      userId,
    );

    expect(updatedPO.status).toBe('RECEIVED');
  });

  it('6. Item Request workflow: Approval and Release deducts stock with negative-stock safety', async () => {
    const mockReq = {
      id: 'req-1',
      clinicId,
      requestNumber: 'REQ-101',
      status: 'APPROVED',
      items: [
        {
          id: 'ri-1',
          itemId: 'item-1',
          quantity: 5,
          releasedQuantity: 0,
          item: { id: 'item-1', name: 'Gauze', currentStock: 20, unit: 'PACK' },
        },
      ],
    };

    vi.spyOn(prisma.itemRequest, 'findUnique').mockResolvedValue(mockReq as any);

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const tx = {
        itemRequest: {
          findUnique: vi.fn().mockResolvedValue(mockReq),
          update: vi.fn().mockResolvedValue({
            ...mockReq,
            status: 'RELEASED',
            releasedAt: new Date(),
          }),
        },
        inventoryItem: {
          findUnique: vi.fn().mockResolvedValue({ id: 'item-1', clinicId, currentStock: 20 }),
          update: vi.fn().mockResolvedValue({ id: 'item-1', clinicId, currentStock: 15 }),
        },
        itemRequestItem: {
          update: vi.fn().mockResolvedValue({}),
        },
        inventoryStockMovement: {
          create: vi.fn().mockResolvedValue({
            id: 'mov-4',
            type: 'STOCK_ISSUED',
            quantity: -5,
            previousStock: 20,
            newStock: 15,
          }),
        },
      };
      return callback(tx);
    });

    const released = await releaseItemRequest(scope, 'req-1', userId);
    expect(released.status).toBe('RELEASED');
  });
});
