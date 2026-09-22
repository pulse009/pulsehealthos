import { describe, it, expect, vi } from 'vitest';
import { getSiteContent, getAllSiteContent } from '@/lib/cms/service';
import { DEFAULT_SITE_CONTENT } from '@/lib/cms/defaults';

describe('CMS Site Content Service', () => {
  it('returns default announcement content when no database record exists', async () => {
    const announcement = await getSiteContent('announcement');
    expect(announcement).toBeDefined();
    expect(announcement.isEnabled).toBe(true);
    expect(announcement.linkHref).toBe('/contact');
  });

  it('returns correct contact phone number +966 556322688 and WhatsApp URL', async () => {
    const contact = await getSiteContent('contact');
    expect(contact.phone).toBe('+966 556322688');
    expect(contact.whatsappUrl).toContain('966556322688');
  });

  it('returns all site content with complete sections', async () => {
    const all = await getAllSiteContent();
    expect(all.hero).toBeDefined();
    expect(all.products).toBeDefined();
    expect(all.features).toBeDefined();
    expect(all.pricing).toBeDefined();
    expect(all.about).toBeDefined();
    expect(all.contact).toBeDefined();
    expect(all.footer).toBeDefined();
    expect(all.hero.stats.length).toBeGreaterThanOrEqual(4);
    expect(all.products.products.length).toBe(3);
  });
});
