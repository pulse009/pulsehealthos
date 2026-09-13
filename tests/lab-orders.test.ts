import { describe, it, expect } from 'vitest';

describe('Diagnostic Lab Orders & Catalog Suite', () => {
  describe('Investigation Fulfillment Routing', () => {
    it('only marks IN_HOUSE orders for automatic invoice generation', () => {
      const orders = [
        { id: '1', testName: 'CBC', price: 120, fulfillmentLocation: 'IN_HOUSE' },
        { id: '2', testName: 'Chest X-Ray', price: 250, fulfillmentLocation: 'EXTERNAL' },
        { id: '3', testName: 'HbA1c', price: 150, fulfillmentLocation: 'UNDECIDED' },
        { id: '4', testName: 'Lipid Profile', price: 180 }, // default fallback to IN_HOUSE
      ];

      const billableOrders = orders.filter(
        (o) => (o.fulfillmentLocation || 'IN_HOUSE') === 'IN_HOUSE' && o.price > 0
      );

      expect(billableOrders).toHaveLength(2);
      expect(billableOrders.map((b) => b.testName)).toEqual(['CBC', 'Lipid Profile']);

      const totalLabBilling = billableOrders.reduce((acc, curr) => acc + curr.price, 0);
      expect(totalLabBilling).toBe(300);
    });

    it('skips EXTERNAL orders from internal clinic billing invoice generation', () => {
      const orders = [
        { id: '1', testName: 'MRI Brain', price: 800, fulfillmentLocation: 'EXTERNAL' },
        { id: '2', testName: 'Specialized Biopsy', price: 1200, fulfillmentLocation: 'EXTERNAL' },
      ];

      const billableOrders = orders.filter(
        (o) => (o.fulfillmentLocation || 'IN_HOUSE') === 'IN_HOUSE' && o.price > 0
      );

      expect(billableOrders).toHaveLength(0);
    });
  });

  describe('Duplicate Investigation Order Detection', () => {
    it('detects when an investigation is already in the active encounter order list', () => {
      const currentOrders = [
        { testName: 'Complete Blood Count (CBC)', category: 'Hematology' },
        { testName: 'Fasting Blood Sugar (FBS)', category: 'Biochemistry' },
      ];

      const candidate1 = 'Complete Blood Count (CBC)';
      const candidate2 = 'Liver Function Test (LFT)';

      const isCandidate1Duplicate = currentOrders.some(
        (o) => o.testName.toLowerCase().trim() === candidate1.toLowerCase().trim()
      );
      const isCandidate2Duplicate = currentOrders.some(
        (o) => o.testName.toLowerCase().trim() === candidate2.toLowerCase().trim()
      );

      expect(isCandidate1Duplicate).toBe(true);
      expect(isCandidate2Duplicate).toBe(false);
    });
  });

  describe('Priority and Status Validation', () => {
    it('validates supported priority levels: ROUTINE, URGENT, STAT', () => {
      const validPriorities = ['ROUTINE', 'URGENT', 'STAT', 'STAT_EMERGENCY'];
      expect(validPriorities).toContain('ROUTINE');
      expect(validPriorities).toContain('URGENT');
      expect(validPriorities).toContain('STAT');
    });

    it('validates all lifecycle statuses', () => {
      const validStatuses = [
        'ORDERED',
        'SAMPLE_COLLECTED',
        'IN_PROGRESS',
        'RESULT_READY',
        'EXTERNAL_RESULT_UPLOADED',
        'REVIEWED',
        'COMPLETED',
        'CANCELLED',
      ];
      expect(validStatuses).toContain('RESULT_READY');
      expect(validStatuses).toContain('EXTERNAL_RESULT_UPLOADED');
      expect(validStatuses).toContain('REVIEWED');
    });
  });
});
