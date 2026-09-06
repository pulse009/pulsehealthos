import { describe, expect, it } from 'vitest';
import { clinicBasicsSchema } from '@/lib/validation/schemas';

describe('Pulse Health OS & Pulse Now Product Editions', () => {
  it('defaults new clinic to Pulse Health OS enabled and Pulse Now disabled', () => {
    const parsed = clinicBasicsSchema.parse({
      name: 'Alpha Dental',
      slug: 'alpha-dental',
      timezone: 'Asia/Riyadh',
      isActive: true,
    });

    expect(parsed.pulseHealthOS).toBe(true);
    expect(parsed.pulseNow).toBe(false);
  });

  it('allows activating Pulse Now (Express edition) to hide Inventory and Accounts', () => {
    const parsed = clinicBasicsSchema.parse({
      name: 'Beta Express Clinic',
      slug: 'beta-express',
      timezone: 'Asia/Riyadh',
      isActive: true,
      pulseHealthOS: false,
      pulseNow: true,
    });

    expect(parsed.pulseHealthOS).toBe(false);
    expect(parsed.pulseNow).toBe(true);
  });

  it('allows enabling both or custom combination', () => {
    const parsed = clinicBasicsSchema.parse({
      name: 'Gamma Clinic',
      slug: 'gamma-clinic',
      timezone: 'Asia/Riyadh',
      isActive: true,
      pulseHealthOS: true,
      pulseNow: true,
    });

    expect(parsed.pulseHealthOS).toBe(true);
    expect(parsed.pulseNow).toBe(true);
  });
});
