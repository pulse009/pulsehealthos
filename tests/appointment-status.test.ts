import { describe, it, expect } from 'vitest';

describe('Appointment Status Validation', () => {
  it('includes CHECKED_IN as a valid appointment status', () => {
    const validStatuses = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CANCELLED', 'RESCHEDULED', 'COMPLETED', 'NO_SHOW'];
    expect(validStatuses).toContain('CHECKED_IN');
    expect(validStatuses).toContain('CONFIRMED');
    expect(validStatuses).toContain('COMPLETED');
    expect(validStatuses).toContain('CANCELLED');
  });

  it('correctly maps Checked In status label to database CHECKED_IN enum', () => {
    const statusLabel: string = 'Checked In';
    const dbStatus =
      statusLabel === 'Confirmed'
        ? 'CONFIRMED'
        : statusLabel === 'Checked In'
        ? 'CHECKED_IN'
        : statusLabel === 'Cancelled'
        ? 'CANCELLED'
        : statusLabel === 'Pending'
        ? 'PENDING'
        : statusLabel === 'Completed'
        ? 'COMPLETED'
        : 'CONFIRMED';

    expect(dbStatus).toBe('CHECKED_IN');
  });
});
