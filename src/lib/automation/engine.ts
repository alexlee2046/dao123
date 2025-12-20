'use server';

/**
 * @deprecated This module is deprecated.
 *
 * Automation execution is now handled by Inngest.
 * See: /src/inngest/functions/automation.ts
 *
 * This file is kept for reference only and should be removed
 * once migration is fully verified.
 *
 * Migration date: 2025-12-20
 * TODO: Remove this file after end-to-end testing is complete
 */

import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/mail/sender';

// Types
export type StepType = 'send_email' | 'wait' | 'add_tag' | 'remove_tag' | 'condition' | 'split';
export type TriggerType =
  | 'form_submission'
  | 'contact_created'
  | 'tag_added'
  | 'manual'
  | 'page_visit'    // Phase 2: 页面访问触发
  | 'scheduled';    // Phase 2: 定时触发
export type EnrollmentStatus = 'active' | 'completed' | 'stopped' | 'error';
export type ConditionType = 'email_opened' | 'email_clicked' | 'tag_exists' | 'field_equals';

export interface AutomationStep {
  id: string;
  type: StepType;
  config: SendEmailConfig | WaitConfig | TagConfig | ConditionConfig | SplitConfig;
  order: number;
}

export interface SendEmailConfig {
  templateId?: string;
  subject?: string;
  content?: string; // Inline HTML content if no template
}

export interface WaitConfig {
  duration: number;
  unit: 'minutes' | 'hours' | 'days';
}

export interface TagConfig {
  tag: string;
}

export interface ConditionConfig {
  conditionType: ConditionType;
  params: {
    emailStepId?: string;   // For email_opened/email_clicked: which email step to check
    tag?: string;           // For tag_exists
    field?: string;         // For field_equals
    value?: string;         // For field_equals
    waitDays?: number;      // How long to wait before checking (default: 1)
  };
  trueBranch: AutomationStep[];   // Steps to execute if condition is true
  falseBranch: AutomationStep[];  // Steps to execute if condition is false
}

export interface SplitConfig {
  variants: Array<{
    id: string;
    name: string;
    percentage: number;  // 0-100, should sum to 100
    steps: AutomationStep[];
  }>;
}

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
  status: EnrollmentStatus;
  next_action_at: string | null;
  error_message: string | null;
  trigger_data: Record<string, any>;
  enrolled_at: string;
  completed_at: string | null;
  branch_path?: string[];      // Track branch decisions: ["step_1:true", "step_3:false"]
  variant_id?: string;         // For A/B split tracking
}

// ============================================
// Enrollment Management
// ============================================

/**
 * Trigger an automation for a contact
 */
export async function triggerAutomation(
  automationId: string,
  contactId: string,
  triggerData?: Record<string, any>
): Promise<{ success: boolean; enrollmentId?: string; error?: string }> {
  const supabase = await createClient();

  // Get automation
  const { data: automation, error: automationError } = await supabase
    .from('automations')
    .select('*')
    .eq('id', automationId)
    .single();

  if (automationError || !automation) {
    return { success: false, error: 'Automation not found' };
  }

  if (!automation.is_active) {
    return { success: false, error: 'Automation is not active' };
  }

  const steps = automation.steps as AutomationStep[];
  if (!steps || steps.length === 0) {
    return { success: false, error: 'Automation has no steps' };
  }

  // Check if contact is already enrolled and active
  const { data: existing } = await supabase
    .from('automation_enrollments')
    .select('id, status')
    .eq('automation_id', automationId)
    .eq('contact_id', contactId)
    .single();

  if (existing && existing.status === 'active') {
    return { success: false, error: 'Contact is already enrolled in this automation' };
  }

  // Create or update enrollment
  const enrollmentData = {
    automation_id: automationId,
    contact_id: contactId,
    current_step_index: 0,
    status: 'active' as EnrollmentStatus,
    next_action_at: new Date().toISOString(), // Execute first step immediately
    trigger_data: triggerData || {},
    enrolled_at: new Date().toISOString(),
    completed_at: null,
    error_message: null,
  };

  let enrollmentId: string;

  if (existing) {
    // Re-enroll (reset the enrollment)
    const { error: updateError } = await supabase
      .from('automation_enrollments')
      .update(enrollmentData)
      .eq('id', existing.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }
    enrollmentId = existing.id;
  } else {
    // Create new enrollment
    const { data: newEnrollment, error: insertError } = await supabase
      .from('automation_enrollments')
      .insert(enrollmentData)
      .select('id')
      .single();

    if (insertError || !newEnrollment) {
      return { success: false, error: insertError?.message || 'Failed to create enrollment' };
    }
    enrollmentId = newEnrollment.id;
  }

  // Execute first step immediately
  await executeNextStep(enrollmentId);

  return { success: true, enrollmentId };
}

/**
 * Stop an enrollment
 */
export async function stopEnrollment(enrollmentId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('automation_enrollments')
    .update({
      status: 'stopped',
      next_action_at: null,
    })
    .eq('id', enrollmentId);

  return !error;
}

/**
 * Get enrollment by ID
 */
export async function getEnrollment(enrollmentId: string): Promise<AutomationEnrollment | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('automation_enrollments')
    .select('*')
    .eq('id', enrollmentId)
    .single();

  if (error) return null;
  return data as AutomationEnrollment;
}

// ============================================
// Step Execution
// ============================================

/**
 * Execute the next step for an enrollment
 */
export async function executeNextStep(enrollmentId: string): Promise<void> {
  const supabase = await createClient();

  // Get enrollment with automation details
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('automation_enrollments')
    .select(`
      *,
      automations (
        id,
        user_id,
        steps
      )
    `)
    .eq('id', enrollmentId)
    .single();

  if (enrollmentError || !enrollment) {
    console.error('[Automation] Enrollment not found:', enrollmentId);
    return;
  }

  if (enrollment.status !== 'active') {
    console.log('[Automation] Enrollment not active:', enrollment.status);
    return;
  }

  const automation = enrollment.automations as any;
  const steps = (automation?.steps || []) as AutomationStep[];

  // Check if we've completed all steps
  if (enrollment.current_step_index >= steps.length) {
    await supabase
      .from('automation_enrollments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        next_action_at: null,
      })
      .eq('id', enrollmentId);

    console.log('[Automation] Enrollment completed:', enrollmentId);
    return;
  }

  const currentStep = steps[enrollment.current_step_index];

  if (!currentStep) {
    console.error('[Automation] Step not found at index:', enrollment.current_step_index);
    return;
  }

  console.log(`[Automation] Executing step ${enrollment.current_step_index}: ${currentStep.type}`);

  try {
    // Execute the step
    const result = await executeStep(
      currentStep,
      enrollment.contact_id,
      automation.user_id,
      enrollment.trigger_data,
      enrollmentId
    );

    // Log the step execution
    await supabase
      .from('automation_step_logs')
      .insert({
        enrollment_id: enrollmentId,
        step_index: enrollment.current_step_index,
        step_type: currentStep.type,
        status: 'executed',
        result,
        executed_at: new Date().toISOString(),
      });

    // Calculate next step timing
    const nextStepIndex = enrollment.current_step_index + 1;

    if (nextStepIndex >= steps.length) {
      // Automation complete
      await supabase
        .from('automation_enrollments')
        .update({
          current_step_index: nextStepIndex,
          status: 'completed',
          completed_at: new Date().toISOString(),
          next_action_at: null,
        })
        .eq('id', enrollmentId);
    } else {
      // Calculate when to execute next step
      const nextStep = steps[nextStepIndex];
      const nextActionAt = calculateNextActionTime(nextStep);

      await supabase
        .from('automation_enrollments')
        .update({
          current_step_index: nextStepIndex,
          next_action_at: nextActionAt.toISOString(),
        })
        .eq('id', enrollmentId);

      // If next step is immediate (wait step was just executed), continue
      if (nextActionAt <= new Date()) {
        await executeNextStep(enrollmentId);
      }
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Automation] Step execution failed:', errorMessage);

    // Log the error
    await supabase
      .from('automation_step_logs')
      .insert({
        enrollment_id: enrollmentId,
        step_index: enrollment.current_step_index,
        step_type: currentStep.type,
        status: 'error',
        error_message: errorMessage,
        executed_at: new Date().toISOString(),
      });

    // Mark enrollment as error
    await supabase
      .from('automation_enrollments')
      .update({
        status: 'error',
        error_message: errorMessage,
        next_action_at: null,
      })
      .eq('id', enrollmentId);
  }
}

/**
 * Execute a single automation step
 */
async function executeStep(
  step: AutomationStep,
  contactId: string,
  userId: string,
  triggerData: Record<string, any>,
  enrollmentId?: string
): Promise<any> {
  const supabase = await createClient();

  switch (step.type) {
    case 'send_email': {
      const config = step.config as SendEmailConfig;

      // Get contact email
      const { data: contact } = await supabase
        .from('contacts')
        .select('email, first_name, last_name')
        .eq('id', contactId)
        .single();

      if (!contact?.email) {
        throw new Error('Contact has no email address');
      }

      let subject = config.subject || 'Message from Dao123';
      let html = config.content || '';

      // If template ID is provided, fetch template
      if (config.templateId) {
        const { data: template } = await supabase
          .from('templates')
          .select('name, content_html')
          .eq('id', config.templateId)
          .single();

        if (template) {
          subject = config.subject || template.name;
          html = template.content_html || '';
        }
      }

      // Simple variable replacement
      html = html
        .replace(/\{\{first_name\}\}/g, contact.first_name || '')
        .replace(/\{\{last_name\}\}/g, contact.last_name || '')
        .replace(/\{\{email\}\}/g, contact.email);

      const result = await sendEmail({
        to: contact.email,
        subject,
        html,
        contactId,
        trackOpens: true,
        trackClicks: true,
      });

      return { sent: result.success, messageId: result.messageId };
    }

    case 'wait': {
      // Wait steps don't execute anything, they just affect timing
      const config = step.config as WaitConfig;
      return { waited: true, duration: config.duration, unit: config.unit };
    }

    case 'add_tag': {
      const config = step.config as TagConfig;
      const tag = config.tag;

      // Get current tags
      const { data: contact } = await supabase
        .from('contacts')
        .select('tags')
        .eq('id', contactId)
        .single();

      const currentTags = contact?.tags || [];

      if (!currentTags.includes(tag)) {
        await supabase
          .from('contacts')
          .update({
            tags: [...currentTags, tag],
            updated_at: new Date().toISOString(),
          })
          .eq('id', contactId);
      }

      return { added_tag: tag };
    }

    case 'remove_tag': {
      const config = step.config as TagConfig;
      const tag = config.tag;

      // Get current tags
      const { data: contact } = await supabase
        .from('contacts')
        .select('tags')
        .eq('id', contactId)
        .single();

      const currentTags = contact?.tags || [];
      const newTags = currentTags.filter((t: string) => t !== tag);

      await supabase
        .from('contacts')
        .update({
          tags: newTags,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contactId);

      return { removed_tag: tag };
    }

    case 'condition': {
      const config = step.config as ConditionConfig;

      if (!enrollmentId) {
        throw new Error('Enrollment ID required for condition steps');
      }

      // Evaluate the condition
      const conditionResult = await evaluateCondition(config, contactId, enrollmentId);

      // Update branch path in enrollment
      const { data: currentEnrollment } = await supabase
        .from('automation_enrollments')
        .select('branch_path')
        .eq('id', enrollmentId)
        .single();

      const currentPath = currentEnrollment?.branch_path || [];
      await supabase
        .from('automation_enrollments')
        .update({
          branch_path: [...currentPath, `${step.id}:${conditionResult}`],
        })
        .eq('id', enrollmentId);

      // Execute the appropriate branch
      const branch = conditionResult ? config.trueBranch : config.falseBranch;

      if (branch && branch.length > 0) {
        const branchResult = await executeBranch(branch, contactId, userId, triggerData, enrollmentId);
        return {
          condition: config.conditionType,
          result: conditionResult,
          branchExecuted: conditionResult ? 'true' : 'false',
          branchResult
        };
      }

      return {
        condition: config.conditionType,
        result: conditionResult,
        branchExecuted: conditionResult ? 'true' : 'false',
        branchResult: { completed: true, results: [] }
      };
    }

    case 'split': {
      const config = step.config as SplitConfig;

      if (!enrollmentId) {
        throw new Error('Enrollment ID required for split steps');
      }

      // Select a variant based on percentages
      const selectedVariantId = selectVariant(config.variants);
      const selectedVariant = config.variants.find(v => v.id === selectedVariantId);

      // Update enrollment with selected variant
      await supabase
        .from('automation_enrollments')
        .update({ variant_id: selectedVariantId })
        .eq('id', enrollmentId);

      if (selectedVariant && selectedVariant.steps.length > 0) {
        const variantResult = await executeBranch(selectedVariant.steps, contactId, userId, triggerData, enrollmentId);
        return {
          split: true,
          selectedVariant: selectedVariantId,
          variantName: selectedVariant.name,
          variantResult
        };
      }

      return {
        split: true,
        selectedVariant: selectedVariantId,
        variantName: selectedVariant?.name || 'unknown',
        variantResult: { completed: true, results: [] }
      };
    }

    default:
      throw new Error(`Unknown step type: ${step.type}`);
  }
}

/**
 * Calculate when the next step should execute
 */
function calculateNextActionTime(step: AutomationStep): Date {
  // If it's a wait step, calculate delay
  if (step.type === 'wait') {
    const config = step.config as WaitConfig;
    const now = new Date();

    switch (config.unit) {
      case 'minutes':
        return new Date(now.getTime() + config.duration * 60 * 1000);
      case 'hours':
        return new Date(now.getTime() + config.duration * 60 * 60 * 1000);
      case 'days':
        return new Date(now.getTime() + config.duration * 24 * 60 * 60 * 1000);
      default:
        return now;
    }
  }

  // Non-wait steps execute immediately
  return new Date();
}

/**
 * Evaluate a condition for a contact
 */
async function evaluateCondition(
  config: ConditionConfig,
  contactId: string,
  enrollmentId: string
): Promise<boolean> {
  const supabase = await createClient();

  switch (config.conditionType) {
    case 'email_opened': {
      // Check if the contact opened the email from the specified step
      const { data: logs } = await supabase
        .from('email_logs')
        .select('id')
        .eq('contact_id', contactId)
        .eq('step_id', config.params.emailStepId)
        .not('opened_at', 'is', null)
        .limit(1);

      return (logs?.length || 0) > 0;
    }

    case 'email_clicked': {
      // Check if the contact clicked any link in the email
      const { data: logs } = await supabase
        .from('email_logs')
        .select('id')
        .eq('contact_id', contactId)
        .eq('step_id', config.params.emailStepId)
        .not('clicked_at', 'is', null)
        .limit(1);

      return (logs?.length || 0) > 0;
    }

    case 'tag_exists': {
      // Check if the contact has a specific tag
      const { data: contact } = await supabase
        .from('contacts')
        .select('tags')
        .eq('id', contactId)
        .single();

      const tags = contact?.tags || [];
      return tags.includes(config.params.tag);
    }

    case 'field_equals': {
      // Check if a contact field equals a specific value
      const { data: contact } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (!contact || !config.params.field) return false;

      const fieldValue = contact[config.params.field];
      return String(fieldValue) === String(config.params.value);
    }

    default:
      return false;
  }
}

/**
 * Execute a branch (array of steps) for a contact
 */
async function executeBranch(
  steps: AutomationStep[],
  contactId: string,
  userId: string,
  triggerData: Record<string, any>,
  enrollmentId: string
): Promise<{ completed: boolean; results: any[] }> {
  const results: any[] = [];

  for (const step of steps) {
    try {
      const result = await executeStep(step, contactId, userId, triggerData, enrollmentId);
      results.push({ stepId: step.id, success: true, result });
    } catch (error) {
      results.push({ stepId: step.id, success: false, error: (error as Error).message });
      return { completed: false, results };
    }
  }

  return { completed: true, results };
}

/**
 * Select a random variant based on percentages
 */
function selectVariant(variants: SplitConfig['variants']): string {
  const random = Math.random() * 100;
  let cumulative = 0;

  for (const variant of variants) {
    cumulative += variant.percentage;
    if (random < cumulative) {
      return variant.id;
    }
  }

  // Fallback to first variant
  return variants[0]?.id || '';
}

// ============================================
// Scheduled Processing (called by cron)
// ============================================

/**
 * Process all pending automation steps
 * This should be called by a cron job every minute
 */
export async function processScheduledSteps(): Promise<{
  processed: number;
  errors: number;
}> {
  const supabase = await createClient();

  // Get all active enrollments that are due for execution
  const { data: pendingEnrollments, error } = await supabase
    .from('automation_enrollments')
    .select('id')
    .eq('status', 'active')
    .lte('next_action_at', new Date().toISOString())
    .limit(100); // Process up to 100 at a time

  if (error) {
    console.error('[Automation Cron] Error fetching enrollments:', error);
    return { processed: 0, errors: 1 };
  }

  if (!pendingEnrollments || pendingEnrollments.length === 0) {
    return { processed: 0, errors: 0 };
  }

  console.log(`[Automation Cron] Processing ${pendingEnrollments.length} enrollments`);

  let processed = 0;
  let errors = 0;

  // Process each enrollment
  for (const enrollment of pendingEnrollments) {
    try {
      await executeNextStep(enrollment.id);
      processed++;
    } catch (error) {
      console.error(`[Automation Cron] Error processing ${enrollment.id}:`, error);
      errors++;
    }
  }

  return { processed, errors };
}

// ============================================
// Trigger Handlers
// ============================================

/**
 * Handle form submission trigger
 */
export async function handleFormSubmissionTrigger(
  formId: string,
  contactId: string,
  submissionData: Record<string, any>
): Promise<void> {
  const supabase = await createClient();

  // Find automations triggered by this form
  const { data: automations } = await supabase
    .from('automations')
    .select('id')
    .eq('trigger_type', 'form_submission')
    .eq('is_active', true)
    .contains('trigger_config', { formId });

  if (!automations || automations.length === 0) {
    // Also check if form has automationId in settings
    const { data: form } = await supabase
      .from('forms')
      .select('settings')
      .eq('id', formId)
      .single();

    const automationId = form?.settings?.automationId;
    if (automationId) {
      await triggerAutomation(automationId, contactId, {
        trigger: 'form_submission',
        formId,
        submission: submissionData,
      });
    }
    return;
  }

  // Trigger all matching automations
  for (const automation of automations) {
    await triggerAutomation(automation.id, contactId, {
      trigger: 'form_submission',
      formId,
      submission: submissionData,
    });
  }
}

/**
 * Handle contact created trigger
 */
export async function handleContactCreatedTrigger(
  contactId: string,
  source: string
): Promise<void> {
  const supabase = await createClient();

  // Get contact's user_id
  const { data: contact } = await supabase
    .from('contacts')
    .select('user_id')
    .eq('id', contactId)
    .single();

  if (!contact?.user_id) return;

  // Find automations for this trigger
  const { data: automations } = await supabase
    .from('automations')
    .select('id')
    .eq('trigger_type', 'contact_created')
    .eq('user_id', contact.user_id)
    .eq('is_active', true);

  if (!automations) return;

  for (const automation of automations) {
    await triggerAutomation(automation.id, contactId, {
      trigger: 'contact_created',
      source,
    });
  }
}

/**
 * Handle tag added trigger
 */
export async function handleTagAddedTrigger(
  contactId: string,
  tag: string
): Promise<void> {
  const supabase = await createClient();

  // Get contact's user_id
  const { data: contact } = await supabase
    .from('contacts')
    .select('user_id')
    .eq('id', contactId)
    .single();

  if (!contact?.user_id) return;

  // Find automations triggered by this tag
  const { data: automations } = await supabase
    .from('automations')
    .select('id, trigger_config')
    .eq('trigger_type', 'tag_added')
    .eq('user_id', contact.user_id)
    .eq('is_active', true);

  if (!automations) return;

  for (const automation of automations) {
    const config = automation.trigger_config as { tag?: string };
    if (config.tag === tag) {
      await triggerAutomation(automation.id, contactId, {
        trigger: 'tag_added',
        tag,
      });
    }
  }
}
