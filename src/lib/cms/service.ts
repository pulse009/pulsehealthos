import { prisma } from '@/lib/db/prisma';
import { AllSiteContent, SiteContentKey } from './types';
import { DEFAULT_SITE_CONTENT } from './defaults';

/**
 * Fetch dynamic content for a specific key with infallible fallback.
 */
export async function getSiteContent<K extends SiteContentKey>(
  key: K
): Promise<AllSiteContent[K]> {
  try {
    const record = await prisma.siteContent.findUnique({
      where: { key },
    });

    if (record && record.content) {
      // Merge with default to ensure no missing keys if schema was extended
      const parsed = record.content as unknown as AllSiteContent[K];
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return {
          ...(DEFAULT_SITE_CONTENT[key] as object),
          ...parsed,
        } as AllSiteContent[K];
      }
      return parsed;
    }
  } catch (error) {
    console.warn(`[CMS] Failed to fetch content for key "${key}", falling back to defaults:`, error);
  }

  return DEFAULT_SITE_CONTENT[key];
}

/**
 * Fetch all dynamic site content with fallback for all keys.
 */
export async function getAllSiteContent(): Promise<AllSiteContent> {
  const result: AllSiteContent = { ...DEFAULT_SITE_CONTENT };

  try {
    const records = await prisma.siteContent.findMany();
    for (const record of records) {
      const k = record.key as SiteContentKey;
      if (k in DEFAULT_SITE_CONTENT && record.content) {
        const parsed = record.content as unknown as AllSiteContent[typeof k];
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          (result as any)[k] = {
            ...(DEFAULT_SITE_CONTENT[k] as object),
            ...parsed,
          };
        } else {
          (result as any)[k] = parsed;
        }
      }
    }
  } catch (error) {
    console.warn('[CMS] Failed to fetch all site content, returning full defaults:', error);
  }

  return result;
}

/**
 * Update dynamic content for a specific key (Super Admin only).
 */
export async function updateSiteContent<K extends SiteContentKey>(
  key: K,
  content: AllSiteContent[K]
): Promise<AllSiteContent[K]> {
  const updated = await prisma.siteContent.upsert({
    where: { key },
    update: {
      content: content as any,
    },
    create: {
      key,
      content: content as any,
    },
  });

  return updated.content as unknown as AllSiteContent[K];
}
