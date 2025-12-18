'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// =====================================================
// Types
// =====================================================

export type FieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'number'
  | 'date';

export type ContactFieldMapping =
  | 'email'
  | 'first_name'
  | 'last_name'
  | 'company_name'
  | 'phone'
  | 'position'
  | 'country'
  | 'none';

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormFieldValidation {
  pattern?: string;
  message?: string;
  min?: number;
  max?: number;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: FormFieldValidation;
  options?: FormFieldOption[];
  mapping: ContactFieldMapping;
}

export interface FormSettings {
  theme: {
    primaryColor: string;
    backgroundColor: string;
    borderRadius: number;
  };
  submitButton: {
    text: string;
    loadingText: string;
  };
  successMessage: string;
  redirectUrl?: string | null;
  notifyEmail?: string | null;
  automationId?: string | null;
}

export interface Form {
  id: string;
  user_id: string;
  site_id?: string | null;
  name: string;
  description?: string | null;
  fields: FormField[];
  settings: FormSettings;
  status: 'draft' | 'published' | 'archived';
  submission_count: number;
  created_at: string;
  updated_at: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  contact_id?: string | null;
  data: Record<string, any>;
  metadata: {
    ip?: string;
    userAgent?: string;
    referrer?: string;
    timestamp?: string;
  };
  created_at: string;
}

// =====================================================
// Default Form Configuration
// =====================================================

export const DEFAULT_FORM_FIELDS: FormField[] = [
  {
    id: 'field_name',
    type: 'text',
    label: 'Full Name',
    placeholder: 'Enter your name',
    required: true,
    mapping: 'first_name',
  },
  {
    id: 'field_email',
    type: 'email',
    label: 'Email Address',
    placeholder: 'you@example.com',
    required: true,
    validation: {
      pattern: '^[^@]+@[^@]+\\.[^@]+$',
      message: 'Please enter a valid email address',
    },
    mapping: 'email',
  },
  {
    id: 'field_company',
    type: 'text',
    label: 'Company',
    placeholder: 'Your company name',
    required: false,
    mapping: 'company_name',
  },
];

export const DEFAULT_FORM_SETTINGS: FormSettings = {
  theme: {
    primaryColor: '#3b82f6',
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  submitButton: {
    text: 'Submit',
    loadingText: 'Submitting...',
  },
  successMessage: 'Thank you! We will be in touch soon.',
  redirectUrl: null,
  notifyEmail: null,
  automationId: null,
};

// =====================================================
// Form CRUD Operations
// =====================================================

/**
 * Create a new form
 */
export async function createForm(data: {
  name: string;
  description?: string;
  site_id?: string;
  fields?: FormField[];
  settings?: Partial<FormSettings>;
}): Promise<{ success: boolean; form?: Form; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized' };

  const formData = {
    user_id: user.id,
    name: data.name,
    description: data.description || null,
    site_id: data.site_id || null,
    fields: data.fields || DEFAULT_FORM_FIELDS,
    settings: { ...DEFAULT_FORM_SETTINGS, ...data.settings },
    status: 'draft' as const,
  };

  const { data: form, error } = await supabase
    .from('forms')
    .insert(formData)
    .select()
    .single();

  if (error) {
    console.error('Error creating form:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/mail/forms');
  return { success: true, form };
}

/**
 * Get all forms for current user
 */
export async function getForms(options?: {
  status?: Form['status'];
  site_id?: string;
  limit?: number;
  offset?: number;
}): Promise<{ forms: Form[]; total: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { forms: [], total: 0 };

  let query = supabase
    .from('forms')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id);

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.site_id) {
    query = query.eq('site_id', options.site_id);
  }

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching forms:', error);
    return { forms: [], total: 0 };
  }

  return { forms: data || [], total: count || 0 };
}

/**
 * Get a single form by ID
 */
export async function getForm(id: string): Promise<Form | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching form:', error);
    return null;
  }

  return data;
}

/**
 * Get a form by ID (public - for rendering)
 */
export async function getPublicForm(id: string): Promise<{
  id: string;
  name: string;
  fields: FormField[];
  settings: FormSettings;
} | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('forms')
    .select('id, name, fields, settings')
    .eq('id', id)
    .eq('status', 'published')
    .single();

  if (error) {
    console.error('Error fetching public form:', error);
    return null;
  }

  return data;
}

/**
 * Update a form
 */
export async function updateForm(
  id: string,
  updates: Partial<Pick<Form, 'name' | 'description' | 'fields' | 'settings' | 'status'>>
): Promise<{ success: boolean; form?: Form; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized' };

  const { data, error } = await supabase
    .from('forms')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating form:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/mail/forms');
  revalidatePath(`/mail/forms/${id}`);
  return { success: true, form: data };
}

/**
 * Delete a form
 */
export async function deleteForm(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase
    .from('forms')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting form:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/mail/forms');
  return { success: true };
}

/**
 * Duplicate a form
 */
export async function duplicateForm(id: string): Promise<{ success: boolean; form?: Form; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized' };

  // Get original form
  const { data: original, error: fetchError } = await supabase
    .from('forms')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !original) {
    return { success: false, error: 'Form not found' };
  }

  // Create copy
  const { data: copy, error: insertError } = await supabase
    .from('forms')
    .insert({
      user_id: user.id,
      site_id: original.site_id,
      name: `${original.name} (Copy)`,
      description: original.description,
      fields: original.fields,
      settings: original.settings,
      status: 'draft',
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error duplicating form:', insertError);
    return { success: false, error: insertError.message };
  }

  revalidatePath('/mail/forms');
  return { success: true, form: copy };
}

// =====================================================
// Form Submission Operations
// =====================================================

/**
 * Submit a form (public - called from embedded forms)
 */
export async function submitForm(
  formId: string,
  data: Record<string, any>,
  metadata?: {
    ip?: string;
    userAgent?: string;
    referrer?: string;
  }
): Promise<{ success: boolean; submission?: FormSubmission; error?: string }> {
  const supabase = await createClient();

  // Get the form
  const { data: form, error: formError } = await supabase
    .from('forms')
    .select('*')
    .eq('id', formId)
    .eq('status', 'published')
    .single();

  if (formError || !form) {
    return { success: false, error: 'Form not found or not published' };
  }

  // Validate required fields
  const fields = form.fields as FormField[];
  for (const field of fields) {
    if (field.required && !data[field.id]) {
      return { success: false, error: `${field.label} is required` };
    }
  }

  // Create submission
  const { data: submission, error: submitError } = await supabase
    .from('form_submissions')
    .insert({
      form_id: formId,
      data,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    })
    .select()
    .single();

  if (submitError) {
    console.error('Error submitting form:', submitError);
    return { success: false, error: 'Failed to submit form' };
  }

  // Sync to contacts
  const contactId = await syncSubmissionToContact(form, data);

  if (contactId) {
    // Update submission with contact_id
    await supabase
      .from('form_submissions')
      .update({ contact_id: contactId })
      .eq('id', submission.id);

    submission.contact_id = contactId;
  }

  // TODO: Trigger automation if configured
  // if (form.settings.automationId) {
  //   await triggerAutomation(form.settings.automationId, contactId);
  // }

  return { success: true, submission };
}

/**
 * Get form submissions
 */
export async function getFormSubmissions(
  formId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<{ submissions: FormSubmission[]; total: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { submissions: [], total: 0 };

  // Verify user owns the form
  const { data: form } = await supabase
    .from('forms')
    .select('id')
    .eq('id', formId)
    .eq('user_id', user.id)
    .single();

  if (!form) return { submissions: [], total: 0 };

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const { data, count, error } = await supabase
    .from('form_submissions')
    .select('*', { count: 'exact' })
    .eq('form_id', formId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching submissions:', error);
    return { submissions: [], total: 0 };
  }

  return { submissions: data || [], total: count || 0 };
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Sync form submission data to contacts table
 */
async function syncSubmissionToContact(
  form: Form,
  data: Record<string, any>
): Promise<string | null> {
  const supabase = await createClient();
  const fields = form.fields as FormField[];

  // Extract mapped data
  const contactData: Record<string, any> = {
    source: 'form',
    tags: [`form:${form.name}`],
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

  if (!emailValue) {
    console.warn('No email field in form submission, cannot create contact');
    return null;
  }

  contactData.email = emailValue;

  // Check if contact exists
  const { data: existing } = await supabase
    .from('contacts')
    .select('id, tags')
    .eq('email', emailValue)
    .eq('user_id', form.user_id)
    .single();

  if (existing) {
    // Update existing contact
    const mergedTags = [...new Set([...(existing.tags || []), ...contactData.tags])];

    const { error } = await supabase
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
    const { data: newContact, error } = await supabase
      .from('contacts')
      .insert({
        ...contactData,
        user_id: form.user_id,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating contact:', error);
      return null;
    }

    return newContact?.id || null;
  }
}

/**
 * Generate embed code for a form
 */
export function generateFormEmbedCode(formId: string, baseUrl: string): {
  iframe: string;
  script: string;
} {
  const formUrl = `${baseUrl}/forms/embed/${formId}`;

  return {
    iframe: `<iframe src="${formUrl}" width="100%" height="500" frameborder="0" style="border: none; border-radius: 8px;"></iframe>`,
    script: `<div id="dao-form-${formId}"></div>
<script src="${baseUrl}/forms/embed.js" data-form-id="${formId}"></script>`,
  };
}
