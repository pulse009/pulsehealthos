import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { getAllSiteContent, getSiteContent, updateSiteContent } from '@/lib/cms/service';
import { SiteContentKey } from '@/lib/cms/types';
import { DEFAULT_SITE_CONTENT } from '@/lib/cms/defaults';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();

    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key') as SiteContentKey | null;

    if (key && key in DEFAULT_SITE_CONTENT) {
      const content = await getSiteContent(key);
      return NextResponse.json({ success: true, key, content });
    }

    const allContent = await getAllSiteContent();
    return NextResponse.json({ success: true, content: allContent });
  } catch (error: any) {
    if (error?.message?.includes('Unauthorized') || error?.status === 401 || error?.status === 403) {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 });
    }
    console.error('[API/admin/cms GET] Error:', error);
    return NextResponse.json({ error: 'Failed to load CMS content' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireSuperAdmin();

    const body = await req.json();
    const { key, content, resetToDefault } = body;

    if (!key || !(key in DEFAULT_SITE_CONTENT)) {
      return NextResponse.json({ error: 'Invalid or missing CMS section key' }, { status: 400 });
    }

    let payloadToSave = content;
    if (resetToDefault) {
      payloadToSave = DEFAULT_SITE_CONTENT[key as SiteContentKey];
    }

    if (!payloadToSave) {
      return NextResponse.json({ error: 'No content provided for update' }, { status: 400 });
    }

    const updated = await updateSiteContent(key as SiteContentKey, payloadToSave);

    return NextResponse.json({
      success: true,
      message: `Updated CMS section "${key}" successfully`,
      key,
      content: updated,
      updatedBy: user.name || user.email,
    });
  } catch (error: any) {
    if (error?.message?.includes('Unauthorized') || error?.status === 401 || error?.status === 403) {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 });
    }
    console.error('[API/admin/cms POST] Error:', error);
    return NextResponse.json({ error: 'Failed to save CMS content' }, { status: 500 });
  }
}
