import { revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'
import { STRAPI_TAG } from '@/lib/strapi'

/**
 * Strapi webhook target. Strapi calls this on every publish/update (see cms/scripts/seed.js),
 * with `Authorization: Bearer <REVALIDATE_SECRET>`; all cached Strapi reads are then marked stale.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ revalidated: false, message: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as { event?: string; model?: string } | null
  // Leads don't affect rendered pages; skip them.
  if (body?.model === 'contact-submission') {
    return Response.json({ revalidated: false, message: 'Ignored model' })
  }

  revalidateTag(STRAPI_TAG, 'max')
  return Response.json({ revalidated: true, event: body?.event, model: body?.model, now: Date.now() })
}
