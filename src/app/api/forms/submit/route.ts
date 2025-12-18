import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

// Lazy initialization for Supabase admin client
let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabaseAdmin;
}

interface SubmitFormRequest {
  formId: string;
  data: Record<string, any>;
  metadata?: {
    referrer?: string;
    url?: string;
  };
}

// Rate limiting map (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0]?.trim() || 'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body: SubmitFormRequest = await request.json();
    const { formId, data, metadata } = body;

    // Validate request
    if (!formId || !data) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the form (check if published)
    const { data: form, error: formError } = await getSupabaseAdmin()
      .from('forms')
      .select('*')
      .eq('id', formId)
      .eq('status', 'published')
      .single();

    if (formError || !form) {
      // For inline forms (formId = 'new', 'contact', 'newsletter'), create a default submission
      if (['new', 'contact', 'newsletter', 'inline'].includes(formId)) {
        return handleInlineFormSubmission(data, metadata, ip, headersList);
      }
      return NextResponse.json(
        { success: false, error: 'Form not found or not published' },
        { status: 404 }
      );
    }

    // Validate required fields
    const fields = form.fields as any[];
    for (const field of fields) {
      if (field.required && !data[field.id]) {
        return NextResponse.json(
          { success: false, error: `${field.label} is required` },
          { status: 400 }
        );
      }
    }

    // Create submission
    const { data: submission, error: submitError } = await getSupabaseAdmin()
      .from('form_submissions')
      .insert({
        form_id: formId,
        data,
        metadata: {
          ip,
          userAgent: headersList.get('user-agent') || '',
          referrer: metadata?.referrer || headersList.get('referer') || '',
          url: metadata?.url || '',
          timestamp: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (submitError) {
      console.error('Error creating submission:', submitError);
      return NextResponse.json(
        { success: false, error: 'Failed to submit form' },
        { status: 500 }
      );
    }

    // Sync to contacts
    const contactId = await syncToContact(form, data);

    if (contactId) {
      // Update submission with contact_id
      await getSupabaseAdmin()
        .from('form_submissions')
        .update({ contact_id: contactId })
        .eq('id', submission.id);
    }

    // TODO: Trigger automation if configured
    // if (form.settings?.automationId) {
    //   await triggerAutomation(form.settings.automationId, contactId);
    // }

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      contactId,
    });
  } catch (error) {
    console.error('Form submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle inline form submissions (forms without a stored form definition)
 */
async function handleInlineFormSubmission(
  data: Record<string, any>,
  metadata: { referrer?: string; url?: string } | undefined,
  ip: string,
  headersList: Headers
) {
  // Extract email from common field names
  const emailValue =
    data.field_email ||
    data.email ||
    Object.values(data).find((v) => typeof v === 'string' && v.includes('@'));

  if (!emailValue || typeof emailValue !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Email is required' },
      { status: 400 }
    );
  }

  // For inline forms, we can't create a form_submission without a form
  // Instead, we directly create/update the contact

  // Try to find a user to associate with (based on referrer domain or default)
  // In production, you'd want to associate with the site owner
  // For now, we'll skip user association for inline forms

  return NextResponse.json({
    success: true,
    message: 'Inline form submission received',
    note: 'For full tracking, please create a form in the dashboard',
  });
}

/**
 * Sync form submission to contacts table
 */
async function syncToContact(
  form: any,
  data: Record<string, any>
): Promise<string | null> {
  const fields = form.fields as any[];

  // Extract mapped data
  const contactData: Record<string, any> = {
    source: 'form',
    tags: [`form:${form.name}`],
    user_id: form.user_id,
  };

  let emailValue: string | null = null;

  for (const field of fields) {
    const value = data[field.id];
    if (value && field.mapping && field.mapping !== 'none') {
      if (field.mapping === 'email') {
        emailValue = value;
      }
      contactData[field.mapping] = value;
    }
  }

  // Also check common field names
  if (!emailValue) {
    emailValue = data.field_email || data.email;
  }

  if (!emailValue) {
    console.warn('No email field in form submission, cannot create contact');
    return null;
  }

  contactData.email = emailValue;

  // Handle name field - split if needed
  const nameValue = data.field_name || data.name;
  if (nameValue && !contactData.first_name) {
    const parts = nameValue.trim().split(/\s+/);
    contactData.first_name = parts[0];
    if (parts.length > 1) {
      contactData.last_name = parts.slice(1).join(' ');
    }
  }

  // Handle company field
  if (!contactData.company_name) {
    contactData.company_name = data.field_company || data.company;
  }

  // Check if contact exists
  const { data: existing } = await getSupabaseAdmin()
    .from('contacts')
    .select('id, tags')
    .eq('email', emailValue)
    .eq('user_id', form.user_id)
    .single();

  if (existing) {
    // Update existing contact
    const mergedTags = [...new Set([...(existing.tags || []), ...contactData.tags])];

    const { error } = await getSupabaseAdmin()
      .from('contacts')
      .update({
        ...contactData,
        tags: mergedTags,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) {
      console.error('Error updating contact:', error);
      return null;
    }

    return existing.id;
  } else {
    // Create new contact
    const { data: newContact, error } = await getSupabaseAdmin()
      .from('contacts')
      .insert(contactData)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating contact:', error);
      return null;
    }

    return newContact?.id || null;
  }
}
