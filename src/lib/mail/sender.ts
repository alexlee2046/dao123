'use server';

import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

// Lazy initialization for Resend client
let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

// Types
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  campaignId?: string;
  contactId?: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
  tags?: { name: string; value: string }[];
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  reason?: 'unsubscribed' | 'invalid_email' | 'send_failed' | 'rate_limited';
}

export interface BulkSendResult {
  total: number;
  sent: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}

// Default sender email
const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'Dao123 <noreply@dao123.com>';
const TRACKING_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'https://dao123.com';

/**
 * Check if an email is unsubscribed
 */
export async function isUnsubscribed(
  email: string,
  userId?: string
): Promise<boolean> {
  const supabase = await createClient();

  let query = supabase
    .from('email_unsubscribes')
    .select('id')
    .eq('email', email.toLowerCase());

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data } = await query.limit(1);
  return (data && data.length > 0) || false;
}

/**
 * Add email to unsubscribe list
 */
export async function unsubscribe(
  email: string,
  userId: string,
  contactId?: string,
  reason?: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('email_unsubscribes')
    .upsert({
      user_id: userId,
      contact_id: contactId,
      email: email.toLowerCase(),
      reason,
      created_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,email',
    });

  return !error;
}

/**
 * Inject open tracking pixel into HTML
 */
function injectOpenTracker(html: string, logId: string): string {
  const trackingPixel = `<img src="${TRACKING_DOMAIN}/api/mail/track/open?id=${logId}" width="1" height="1" style="display:none" alt="" />`;

  // Insert before </body> if exists, otherwise append
  if (html.includes('</body>')) {
    return html.replace('</body>', `${trackingPixel}</body>`);
  }
  return html + trackingPixel;
}

/**
 * Inject click tracking for all links
 */
function injectClickTracker(html: string, logId: string): string {
  // Replace all href links with tracking URLs
  const linkRegex = /href="(https?:\/\/[^"]+)"/gi;

  return html.replace(linkRegex, (match, url) => {
    // Skip tracking for unsubscribe links
    if (url.includes('unsubscribe')) {
      return match;
    }
    const encodedUrl = encodeURIComponent(url);
    const trackingUrl = `${TRACKING_DOMAIN}/api/mail/track/click?id=${logId}&url=${encodedUrl}`;
    return `href="${trackingUrl}"`;
  });
}

/**
 * Inject unsubscribe link
 */
function injectUnsubscribeLink(
  html: string,
  unsubscribeUrl: string
): string {
  const unsubscribeBlock = `
    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
      <p>You're receiving this email because you signed up or were added to our contact list.</p>
      <p><a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a> from these emails.</p>
    </div>
  `;

  // Insert before </body> if exists
  if (html.includes('</body>')) {
    return html.replace('</body>', `${unsubscribeBlock}</body>`);
  }
  return html + unsubscribeBlock;
}

/**
 * Create email log entry
 */
async function createEmailLog(data: {
  campaignId?: string;
  contactId?: string;
  messageId?: string;
  status: string;
  errorMessage?: string;
}): Promise<string | null> {
  const supabase = await createClient();

  const { data: log, error } = await supabase
    .from('email_logs')
    .insert({
      campaign_id: data.campaignId,
      contact_id: data.contactId,
      message_id: data.messageId,
      status: data.status,
      error_message: data.errorMessage,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create email log:', error);
    return null;
  }

  return log.id;
}

/**
 * Update email log entry
 */
export async function updateEmailLog(
  logId: string,
  data: {
    status?: string;
    deliveredAt?: Date;
    bouncedAt?: Date;
    errorMessage?: string;
  }
): Promise<boolean> {
  const supabase = await createClient();

  const updateData: Record<string, any> = {};
  if (data.status) updateData.status = data.status;
  if (data.deliveredAt) updateData.delivered_at = data.deliveredAt.toISOString();
  if (data.bouncedAt) updateData.bounced_at = data.bouncedAt.toISOString();
  if (data.errorMessage) updateData.error_message = data.errorMessage;

  const { error } = await supabase
    .from('email_logs')
    .update(updateData)
    .eq('id', logId);

  return !error;
}

/**
 * Log email open event
 */
export async function logOpen(logId: string): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('email_logs')
    .update({
      status: 'opened',
      opened_at: new Date().toISOString(),
    })
    .eq('id', logId);
}

/**
 * Log email click event
 */
export async function logClick(logId: string): Promise<void> {
  const supabase = await createClient();

  // Increment click count
  await supabase.rpc('increment_email_click_count', { log_id: logId });
}

/**
 * Send a single email
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendResult> {
  const {
    to,
    subject,
    html,
    from = DEFAULT_FROM,
    replyTo,
    campaignId,
    contactId,
    trackOpens = true,
    trackClicks = true,
    tags,
  } = options;

  // Normalize email to array
  const emails = Array.isArray(to) ? to : [to];

  // Check unsubscribes
  for (const email of emails) {
    if (await isUnsubscribed(email)) {
      return { success: false, reason: 'unsubscribed' };
    }
  }

  // Create log entry first to get ID for tracking
  const logId = await createEmailLog({
    campaignId,
    contactId,
    status: 'pending',
  });

  if (!logId) {
    return { success: false, error: 'Failed to create email log' };
  }

  // Process HTML with tracking
  let processedHtml = html;

  if (trackOpens) {
    processedHtml = injectOpenTracker(processedHtml, logId);
  }

  if (trackClicks) {
    processedHtml = injectClickTracker(processedHtml, logId);
  }

  // Add unsubscribe link
  const unsubscribeUrl = `${TRACKING_DOMAIN}/api/mail/unsubscribe?id=${logId}`;
  processedHtml = injectUnsubscribeLink(processedHtml, unsubscribeUrl);

  try {
    const resend = getResend();

    const result = await resend.emails.send({
      from,
      to: emails,
      subject,
      html: processedHtml,
      replyTo,
      tags: tags?.map(t => ({ name: t.name, value: t.value })),
    });

    if (result.error) {
      await updateEmailLog(logId, {
        status: 'failed',
        errorMessage: result.error.message,
      });
      return { success: false, error: result.error.message, reason: 'send_failed' };
    }

    // Update log with message ID
    await updateEmailLog(logId, { status: 'sent' });

    // Update message_id separately since it might be a new column
    const supabase = await createClient();
    await supabase
      .from('email_logs')
      .update({ message_id: result.data?.id })
      .eq('id', logId);

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await updateEmailLog(logId, {
      status: 'failed',
      errorMessage,
    });
    return { success: false, error: errorMessage, reason: 'send_failed' };
  }
}

/**
 * Send bulk emails with rate limiting
 */
export async function sendBulkEmails(
  emails: SendEmailOptions[],
  options: { rateLimit?: number; delayMs?: number } = {}
): Promise<BulkSendResult> {
  const { rateLimit = 100, delayMs = 1000 } = options;

  const results: SendResult[] = [];
  const errors: Array<{ email: string; error: string }> = [];

  // Process in batches
  for (let i = 0; i < emails.length; i += rateLimit) {
    const batch = emails.slice(i, i + rateLimit);

    const batchResults = await Promise.all(
      batch.map(async (emailOpts) => {
        const result = await sendEmail(emailOpts);
        if (!result.success) {
          const toEmail = Array.isArray(emailOpts.to) ? emailOpts.to[0] : emailOpts.to;
          errors.push({
            email: toEmail,
            error: result.error || result.reason || 'Unknown error',
          });
        }
        return result;
      })
    );

    results.push(...batchResults);

    // Delay between batches (except for last batch)
    if (i + rateLimit < emails.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  const sent = results.filter(r => r.success).length;

  return {
    total: emails.length,
    sent,
    failed: emails.length - sent,
    errors,
  };
}

/**
 * Send campaign to all contacts
 */
export async function sendCampaign(
  campaignId: string,
  contactIds: string[]
): Promise<BulkSendResult> {
  const supabase = await createClient();

  // Get campaign details
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (campaignError || !campaign) {
    return { total: 0, sent: 0, failed: 0, errors: [{ email: '', error: 'Campaign not found' }] };
  }

  // Get contacts
  const { data: contacts, error: contactsError } = await supabase
    .from('contacts')
    .select('id, email, first_name, last_name')
    .in('id', contactIds)
    .not('email', 'is', null);

  if (contactsError || !contacts) {
    return { total: 0, sent: 0, failed: 0, errors: [{ email: '', error: 'Failed to fetch contacts' }] };
  }

  // Prepare emails
  const emailOptions: SendEmailOptions[] = contacts.map(contact => ({
    to: contact.email,
    subject: campaign.subject,
    html: campaign.content_html || '',
    campaignId,
    contactId: contact.id,
    trackOpens: true,
    trackClicks: true,
    tags: [
      { name: 'campaign', value: campaignId },
    ],
  }));

  // Send all emails
  const result = await sendBulkEmails(emailOptions);

  // Update campaign stats
  await supabase
    .from('campaigns')
    .update({
      status: 'sent',
      stats: {
        sent: result.sent,
        failed: result.failed,
        opened: 0,
        clicked: 0,
      },
    })
    .eq('id', campaignId);

  return result;
}
