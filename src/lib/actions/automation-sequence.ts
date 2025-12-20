'use server';

import { createClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

/**
 * Generated email sequence from AI
 */
export interface GeneratedSequence {
  name: string;
  description: string;
  goal: string;
  targetAudience: string;
  steps: SequenceStep[];
  estimatedDuration: string;
  expectedOutcome: string;
}

export interface SequenceStep {
  id: string;
  type: 'send_email' | 'wait' | 'add_tag';
  config: {
    subject?: string;
    body?: string;
    preheader?: string;
    duration?: number;
    unit?: 'minutes' | 'hours' | 'days';
    tag?: string;
  };
  order: number;
}

/**
 * Convert generated sequence to automation with templates
 * Creates templates for each email and links them to automation steps
 */
export async function saveSequenceAsAutomation(
  sequence: GeneratedSequence,
  options: {
    triggerType?: 'form_submission' | 'tag_added' | 'manual';
    triggerConfig?: Record<string, unknown>;
    isActive?: boolean;
  } = {}
): Promise<{ automationId: string; templateIds: string[] }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const templateIds: string[] = [];
  const automationSteps: Array<{
    id: string;
    type: string;
    config: Record<string, unknown>;
    order: number;
  }> = [];

  // Process each step
  for (const step of sequence.steps) {
    if (step.type === 'send_email') {
      // Create template for this email
      const templateId = nanoid();

      const { error: templateError } = await supabase
        .from('templates')
        .insert({
          id: templateId,
          user_id: user.id,
          name: `[${sequence.name}] ${step.config.subject || `Email ${step.order}`}`,
          content_html: wrapEmailContent(step.config.body || '', step.config.preheader),
          content_json: {
            subject: step.config.subject,
            preheader: step.config.preheader,
            body: step.config.body,
            source: 'ai_generated',
            sequenceStep: step.order,
          },
          is_public: false,
        });

      if (templateError) {
        console.error('Failed to create template:', templateError);
        throw new Error(`Failed to create template: ${templateError.message}`);
      }

      templateIds.push(templateId);

      // Add step referencing template
      automationSteps.push({
        id: step.id,
        type: 'send_email',
        config: {
          templateId,
          subject: step.config.subject,
        },
        order: step.order,
      });
    } else if (step.type === 'wait') {
      automationSteps.push({
        id: step.id,
        type: 'wait',
        config: {
          duration: step.config.duration,
          unit: step.config.unit || 'days',
        },
        order: step.order,
      });
    } else if (step.type === 'add_tag') {
      automationSteps.push({
        id: step.id,
        type: 'add_tag',
        config: {
          tag: step.config.tag,
        },
        order: step.order,
      });
    }
  }

  // Create automation
  const automationId = nanoid();
  const { error: automationError } = await supabase
    .from('automations')
    .insert({
      id: automationId,
      user_id: user.id,
      name: sequence.name,
      trigger_type: options.triggerType || 'manual',
      trigger_config: options.triggerConfig || {},
      steps: automationSteps,
      is_active: options.isActive ?? false,
    });

  if (automationError) {
    console.error('Failed to create automation:', automationError);
    throw new Error(`Failed to create automation: ${automationError.message}`);
  }

  return { automationId, templateIds };
}

/**
 * Wrap email content in a basic responsive email template
 */
function wrapEmailContent(body: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
  ${preheader ? `<span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>` : ''}
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #1a1a1a; font-size: 24px; margin-bottom: 16px; }
    p { margin-bottom: 16px; }
    a { color: #3b82f6; }
    .button { display: inline-block; background-color: #3b82f6; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    ${body}
    <div class="footer">
      <p>如果您不想再收到此类邮件，请<a href="{{unsubscribe_url}}">点击这里退订</a></p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Get automation with its templates
 */
export async function getAutomationWithTemplates(automationId: string): Promise<{
  automation: Record<string, unknown>;
  templates: Record<string, unknown>[];
} | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: automation, error } = await supabase
    .from('automations')
    .select('*')
    .eq('id', automationId)
    .eq('user_id', user.id)
    .single();

  if (error || !automation) {
    return null;
  }

  // Extract template IDs from steps
  const steps = automation.steps as Array<{ type: string; config: { templateId?: string } }>;
  const templateIds = steps
    .filter(s => s.type === 'send_email' && s.config.templateId)
    .map(s => s.config.templateId as string);

  const { data: templates } = await supabase
    .from('templates')
    .select('*')
    .in('id', templateIds);

  return {
    automation,
    templates: templates || [],
  };
}

/**
 * Preview sequence without saving
 */
export async function previewSequence(sequence: GeneratedSequence): Promise<{
  totalEmails: number;
  totalDuration: string;
  steps: Array<{
    order: number;
    type: string;
    description: string;
    timing: string;
  }>;
}> {
  let currentDay = 0;
  const steps = [];

  for (const step of sequence.steps) {
    if (step.type === 'send_email') {
      steps.push({
        order: step.order,
        type: 'email',
        description: step.config.subject || 'Email',
        timing: currentDay === 0 ? '立即' : `第 ${currentDay} 天`,
      });
    } else if (step.type === 'wait') {
      const duration = step.config.duration || 1;
      const unit = step.config.unit || 'days';
      if (unit === 'days') {
        currentDay += duration;
      } else if (unit === 'hours') {
        currentDay += Math.ceil(duration / 24);
      }
      steps.push({
        order: step.order,
        type: 'wait',
        description: `等待 ${duration} ${unit === 'days' ? '天' : unit === 'hours' ? '小时' : '分钟'}`,
        timing: '',
      });
    } else if (step.type === 'add_tag') {
      steps.push({
        order: step.order,
        type: 'tag',
        description: `添加标签: ${step.config.tag}`,
        timing: `第 ${currentDay} 天`,
      });
    }
  }

  const totalEmails = sequence.steps.filter(s => s.type === 'send_email').length;

  return {
    totalEmails,
    totalDuration: `${currentDay} 天`,
    steps,
  };
}
