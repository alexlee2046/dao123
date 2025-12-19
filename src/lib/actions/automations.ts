'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { AutomationStep, TriggerType } from '@/lib/automation/engine';

// Types
export interface Automation {
  id: string;
  user_id: string;
  name: string;
  trigger_type: TriggerType;
  trigger_config: Record<string, any>;
  steps: AutomationStep[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutomationEnrollment {
  id: string;
  automation_id: string;
  contact_id: string;
  current_step_index: number;
  status: 'active' | 'completed' | 'stopped' | 'error';
  next_action_at: string | null;
  error_message: string | null;
  trigger_data: Record<string, any>;
  enrolled_at: string;
  completed_at: string | null;
  contacts?: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export interface AutomationWithStats extends Automation {
  enrollment_count: number;
  active_count: number;
  completed_count: number;
}

export interface CreateAutomationInput {
  name: string;
  trigger_type: TriggerType;
  trigger_config?: Record<string, any>;
  steps?: AutomationStep[];
  is_active?: boolean;
}

export interface UpdateAutomationInput {
  name?: string;
  trigger_type?: TriggerType;
  trigger_config?: Record<string, any>;
  steps?: AutomationStep[];
  is_active?: boolean;
}

// ============================================
// Automation CRUD
// ============================================

/**
 * Get all automations for current user
 */
export async function getAutomations(): Promise<AutomationWithStats[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  // Get automations
  const { data: automations, error } = await supabase
    .from('automations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching automations:', error);
    throw new Error(error.message);
  }

  // Get enrollment stats for each automation
  const automationsWithStats: AutomationWithStats[] = [];

  for (const automation of automations || []) {
    const { data: enrollments } = await supabase
      .from('automation_enrollments')
      .select('status')
      .eq('automation_id', automation.id);

    const stats = {
      enrollment_count: enrollments?.length || 0,
      active_count: enrollments?.filter(e => e.status === 'active').length || 0,
      completed_count: enrollments?.filter(e => e.status === 'completed').length || 0,
    };

    automationsWithStats.push({
      ...automation,
      ...stats,
    });
  }

  return automationsWithStats;
}

/**
 * Get a single automation by ID
 */
export async function getAutomation(id: string): Promise<Automation | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('automations')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }

  return data as Automation;
}

/**
 * Create a new automation
 */
export async function createAutomation(input: CreateAutomationInput): Promise<Automation> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('automations')
    .insert({
      user_id: user.id,
      name: input.name,
      trigger_type: input.trigger_type,
      trigger_config: input.trigger_config || {},
      steps: input.steps || [],
      is_active: input.is_active ?? false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating automation:', error);
    throw new Error(error.message);
  }

  revalidatePath('/mail/automations');
  return data as Automation;
}

/**
 * Update an automation
 */
export async function updateAutomation(
  id: string,
  input: UpdateAutomationInput
): Promise<Automation> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.trigger_type !== undefined) updateData.trigger_type = input.trigger_type;
  if (input.trigger_config !== undefined) updateData.trigger_config = input.trigger_config;
  if (input.steps !== undefined) updateData.steps = input.steps;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;

  const { data, error } = await supabase
    .from('automations')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating automation:', error);
    throw new Error(error.message);
  }

  revalidatePath('/mail/automations');
  revalidatePath(`/mail/automations/${id}`);
  return data as Automation;
}

/**
 * Delete an automation
 */
export async function deleteAutomation(id: string): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { error } = await supabase
    .from('automations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting automation:', error);
    throw new Error(error.message);
  }

  revalidatePath('/mail/automations');
}

/**
 * Toggle automation active status
 */
export async function toggleAutomationStatus(id: string): Promise<Automation> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  // Get current status
  const { data: current, error: fetchError } = await supabase
    .from('automations')
    .select('is_active')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !current) {
    throw new Error('Automation not found');
  }

  // Toggle
  const { data, error } = await supabase
    .from('automations')
    .update({
      is_active: !current.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/mail/automations');
  return data as Automation;
}

/**
 * Duplicate an automation
 */
export async function duplicateAutomation(id: string): Promise<Automation> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  // Get original
  const { data: original, error: fetchError } = await supabase
    .from('automations')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !original) {
    throw new Error('Automation not found');
  }

  // Create copy
  const { data, error } = await supabase
    .from('automations')
    .insert({
      user_id: user.id,
      name: `${original.name} (Copy)`,
      trigger_type: original.trigger_type,
      trigger_config: original.trigger_config,
      steps: original.steps,
      is_active: false, // Always start as inactive
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/mail/automations');
  return data as Automation;
}

// ============================================
// Enrollment Management
// ============================================

/**
 * Get enrollments for an automation
 */
export async function getAutomationEnrollments(
  automationId: string,
  options?: {
    status?: 'active' | 'completed' | 'stopped' | 'error';
    limit?: number;
    offset?: number;
  }
): Promise<{ enrollments: AutomationEnrollment[]; total: number }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  // Verify automation ownership
  const { data: automation } = await supabase
    .from('automations')
    .select('id')
    .eq('id', automationId)
    .eq('user_id', user.id)
    .single();

  if (!automation) {
    throw new Error('Automation not found');
  }

  // Build query
  let query = supabase
    .from('automation_enrollments')
    .select(`
      *,
      contacts (
        id,
        email,
        first_name,
        last_name
      )
    `, { count: 'exact' })
    .eq('automation_id', automationId)
    .order('enrolled_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    enrollments: data as AutomationEnrollment[],
    total: count || 0,
  };
}

/**
 * Stop an enrollment
 */
export async function stopEnrollment(enrollmentId: string): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  // Verify ownership through automation
  const { data: enrollment } = await supabase
    .from('automation_enrollments')
    .select(`
      id,
      automation_id,
      automations!inner (
        user_id
      )
    `)
    .eq('id', enrollmentId)
    .single();

  if (!enrollment || (enrollment as any).automations.user_id !== user.id) {
    throw new Error('Enrollment not found');
  }

  const { error } = await supabase
    .from('automation_enrollments')
    .update({
      status: 'stopped',
      next_action_at: null,
    })
    .eq('id', enrollmentId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/mail/automations/${enrollment.automation_id}`);
}

// ============================================
// Step Logs
// ============================================

export interface AutomationStepLog {
  id: string;
  enrollment_id: string;
  step_index: number;
  step_type: string;
  status: 'pending' | 'completed' | 'failed' | 'skipped';
  result: Record<string, any> | null;
  error_message: string | null;
  executed_at: string;
}

/**
 * Get step logs for an enrollment
 */
export async function getEnrollmentStepLogs(
  enrollmentId: string
): Promise<AutomationStepLog[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  // Verify ownership through automation
  const { data: enrollment } = await supabase
    .from('automation_enrollments')
    .select(`
      id,
      automations!inner (
        user_id
      )
    `)
    .eq('id', enrollmentId)
    .single();

  if (!enrollment || (enrollment as any).automations.user_id !== user.id) {
    throw new Error('Enrollment not found');
  }

  const { data, error } = await supabase
    .from('automation_step_logs')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .order('step_index', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as AutomationStepLog[];
}

/**
 * Get all enrollments for current user (across all automations)
 */
export async function getAllEnrollments(
  options?: {
    status?: 'active' | 'completed' | 'stopped' | 'error';
    limit?: number;
    offset?: number;
  }
): Promise<{ enrollments: (AutomationEnrollment & { automation_name: string })[]; total: number }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  // Build query with automation join
  let query = supabase
    .from('automation_enrollments')
    .select(`
      *,
      contacts (
        id,
        email,
        first_name,
        last_name
      ),
      automations!inner (
        id,
        name,
        user_id,
        steps
      )
    `, { count: 'exact' })
    .eq('automations.user_id', user.id)
    .order('enrolled_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  // Transform data to include automation name
  const transformedData = (data || []).map((item: any) => ({
    ...item,
    automation_name: item.automations?.name || 'Unknown',
    automation_steps: item.automations?.steps || [],
    automations: undefined,
  }));

  return {
    enrollments: transformedData,
    total: count || 0,
  };
}

// ============================================
// Stats
// ============================================

/**
 * Get automation stats
 */
export async function getAutomationStats(): Promise<{
  total: number;
  active: number;
  totalEnrollments: number;
  completedEnrollments: number;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { total: 0, active: 0, totalEnrollments: 0, completedEnrollments: 0 };
  }

  // Get automation counts
  const { data: automations } = await supabase
    .from('automations')
    .select('id, is_active')
    .eq('user_id', user.id);

  if (!automations || automations.length === 0) {
    return { total: 0, active: 0, totalEnrollments: 0, completedEnrollments: 0 };
  }

  const automationIds = automations.map(a => a.id);

  // Get enrollment counts
  const { data: enrollments } = await supabase
    .from('automation_enrollments')
    .select('status')
    .in('automation_id', automationIds);

  return {
    total: automations.length,
    active: automations.filter(a => a.is_active).length,
    totalEnrollments: enrollments?.length || 0,
    completedEnrollments: enrollments?.filter(e => e.status === 'completed').length || 0,
  };
}
