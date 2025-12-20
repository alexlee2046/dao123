import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { inngest } from '@/inngest/client';

interface PageVisitPayload {
  contactId: string;
  pageUrl: string;
  pageTitle?: string;
  referrer?: string;
}

/**
 * POST /api/track/page-visit
 *
 * Tracks a page visit by a contact and triggers automation events.
 * Used for page_visit trigger type in automations.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as PageVisitPayload;
    const { contactId, pageUrl, pageTitle, referrer } = body;

    // Validate required fields
    if (!contactId || !pageUrl) {
      return NextResponse.json(
        { error: 'contactId and pageUrl are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get user from contact to verify ownership
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, user_id')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    const userId = contact.user_id;
    const visitedAt = new Date().toISOString();

    // Record the page visit
    const { error: insertError } = await supabase
      .from('contact_page_visits')
      .insert({
        contact_id: contactId,
        user_id: userId,
        page_url: pageUrl,
        page_title: pageTitle || null,
        referrer: referrer || null,
        visited_at: visitedAt,
      });

    if (insertError) {
      console.error('Error recording page visit:', insertError);
      // Don't fail the request, still send the event
    }

    // Send Inngest event for automation triggering
    await inngest.send({
      name: 'contact/page.visited',
      data: {
        contactId,
        pageUrl,
        pageTitle,
        userId,
        visitedAt,
        referrer,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking page visit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/track/page-visit
 *
 * Tracking pixel endpoint for embedding in pages.
 * Returns a 1x1 transparent GIF.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const contactId = searchParams.get('cid');
  const pageUrl = searchParams.get('url');
  const pageTitle = searchParams.get('title');

  if (contactId && pageUrl) {
    // Fire and forget - don't block the pixel response
    (async () => {
      try {
        const supabase = await createClient();

        const { data: contact } = await supabase
          .from('contacts')
          .select('user_id')
          .eq('id', contactId)
          .single();

        if (contact) {
          const visitedAt = new Date().toISOString();

          // Record visit
          await supabase
            .from('contact_page_visits')
            .insert({
              contact_id: contactId,
              user_id: contact.user_id,
              page_url: pageUrl,
              page_title: pageTitle || null,
              visited_at: visitedAt,
            });

          // Send event
          await inngest.send({
            name: 'contact/page.visited',
            data: {
              contactId,
              pageUrl,
              pageTitle: pageTitle || undefined,
              userId: contact.user_id,
              visitedAt,
            },
          });
        }
      } catch (error) {
        console.error('Error in page visit tracking:', error);
      }
    })();
  }

  // Return 1x1 transparent GIF
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );

  return new NextResponse(pixel, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
