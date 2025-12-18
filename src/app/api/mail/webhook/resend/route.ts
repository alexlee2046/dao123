import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Use service role for webhook processing
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Verify Resend webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id?: string;
    from?: string;
    to?: string[];
    subject?: string;
    created_at?: string;
    // For bounce/complaint events
    bounce?: {
      message: string;
    };
    // For click events
    click?: {
      link: string;
      timestamp: string;
    };
  };
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  // Get raw body for signature verification
  const rawBody = await request.text();

  // Verify signature if secret is configured
  if (webhookSecret) {
    const signature = request.headers.get('svix-signature') ||
                      request.headers.get('resend-signature') || '';

    // Resend uses Svix for webhooks, signature format: v1,<timestamp>,<signature>
    const signatureParts = signature.split(',');
    const actualSignature = signatureParts.length > 2 ? signatureParts[2] : signature;

    if (!actualSignature) {
      console.error('Missing webhook signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Note: In production, implement proper Svix signature verification
    // For now, we'll log the signature for debugging
    console.log('[Resend Webhook] Signature received:', signature.substring(0, 20) + '...');
  }

  let event: ResendWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log(`[Resend Webhook] Event type: ${event.type}`);

  const supabase = getSupabaseAdmin();
  const emailId = event.data.email_id;

  if (!emailId) {
    console.log('[Resend Webhook] No email_id in event, skipping');
    return NextResponse.json({ received: true });
  }

  // Find the log entry by message_id
  const { data: logEntry } = await supabase
    .from('email_logs')
    .select('id, status')
    .eq('message_id', emailId)
    .single();

  if (!logEntry) {
    console.log(`[Resend Webhook] No log entry found for message_id: ${emailId}`);
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case 'email.sent':
        await supabase
          .from('email_logs')
          .update({ status: 'sent' })
          .eq('id', logEntry.id);
        break;

      case 'email.delivered':
        await supabase
          .from('email_logs')
          .update({
            status: 'delivered',
            delivered_at: new Date().toISOString(),
          })
          .eq('id', logEntry.id);
        break;

      case 'email.opened':
        // Only update if not already clicked (more specific status)
        if (logEntry.status !== 'clicked') {
          await supabase
            .from('email_logs')
            .update({
              status: 'opened',
              opened_at: new Date().toISOString(),
            })
            .eq('id', logEntry.id);
        }
        break;

      case 'email.clicked':
        await supabase
          .from('email_logs')
          .update({
            status: 'clicked',
            click_count: (logEntry as any).click_count ? (logEntry as any).click_count + 1 : 1,
          })
          .eq('id', logEntry.id);
        break;

      case 'email.bounced':
        await supabase
          .from('email_logs')
          .update({
            status: 'bounced',
            bounced_at: new Date().toISOString(),
            error_message: event.data.bounce?.message || 'Email bounced',
          })
          .eq('id', logEntry.id);

        // Optionally auto-unsubscribe bounced emails
        if (event.data.to && event.data.to.length > 0) {
          console.log(`[Resend Webhook] Email bounced: ${event.data.to[0]}`);
        }
        break;

      case 'email.complained':
        await supabase
          .from('email_logs')
          .update({
            status: 'complained',
            error_message: 'Recipient marked as spam',
          })
          .eq('id', logEntry.id);

        // Auto-unsubscribe complained emails
        if (event.data.to && event.data.to.length > 0) {
          const email = event.data.to[0];
          console.log(`[Resend Webhook] Complaint received, unsubscribing: ${email}`);

          // Get contact info to find user_id
          const { data: contact } = await supabase
            .from('contacts')
            .select('user_id')
            .eq('email', email)
            .single();

          if (contact?.user_id) {
            await supabase
              .from('email_unsubscribes')
              .upsert({
                user_id: contact.user_id,
                email: email.toLowerCase(),
                reason: 'spam_complaint',
                created_at: new Date().toISOString(),
              }, {
                onConflict: 'user_id,email',
              });
          }
        }
        break;

      default:
        console.log(`[Resend Webhook] Unhandled event type: ${event.type}`);
    }

    // Update campaign stats if applicable
    const { data: log } = await supabase
      .from('email_logs')
      .select('campaign_id')
      .eq('id', logEntry.id)
      .single();

    if (log?.campaign_id) {
      await updateCampaignStats(supabase, log.campaign_id);
    }

  } catch (error) {
    console.error('[Resend Webhook] Error processing event:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// Update campaign statistics based on email logs
async function updateCampaignStats(supabase: any, campaignId: string) {
  const { data: stats } = await supabase
    .from('email_logs')
    .select('status')
    .eq('campaign_id', campaignId);

  if (!stats) return;

  const counts = {
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
  };

  for (const log of stats) {
    switch (log.status) {
      case 'sent':
        counts.sent++;
        break;
      case 'delivered':
        counts.sent++;
        counts.delivered++;
        break;
      case 'opened':
        counts.sent++;
        counts.delivered++;
        counts.opened++;
        break;
      case 'clicked':
        counts.sent++;
        counts.delivered++;
        counts.opened++;
        counts.clicked++;
        break;
      case 'bounced':
        counts.bounced++;
        break;
    }
  }

  await supabase
    .from('campaigns')
    .update({
      stats: counts,
    })
    .eq('id', campaignId);
}
