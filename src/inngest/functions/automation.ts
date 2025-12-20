import { inngest } from '../client';
import { nodeRegistry } from '../core/registry';
import { createClient } from '@/lib/supabase/server';
import type { NodeContext, WorkflowStep } from '../core/types';
import type { ConditionConfig, SplitConfig } from '@/lib/automation/engine';

// 兼容旧版 automation 步骤格式
interface LegacyAutomationStep {
  id: string;
  type: 'send_email' | 'wait' | 'add_tag' | 'remove_tag' | 'condition' | 'split';
  config: Record<string, unknown>;
  order: number;
}

// 步骤类型映射: 旧类型 → 新节点 ID
const STEP_TYPE_TO_NODE_ID: Record<string, string> = {
  send_email: 'email.send',
  wait: 'flow.wait',
  add_tag: 'contact.addTag',
  remove_tag: 'contact.removeTag',
  condition: 'flow.condition',
  split: 'flow.split',
};

/**
 * 将旧版步骤格式转换为新版 WorkflowStep
 */
function convertLegacySteps(steps: unknown[]): WorkflowStep[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return steps.map((step: any, index: number) => {
    // 如果已经是新格式 (有 nodeId)，直接返回
    if (step.nodeId) {
      return step as WorkflowStep;
    }

    // 转换旧格式
    const legacyStep = step as LegacyAutomationStep;
    const nodeId = STEP_TYPE_TO_NODE_ID[legacyStep.type];

    if (!nodeId) {
      console.warn(`Unknown legacy step type: ${legacyStep.type}`);
      return null;
    }

    // 转换配置格式
    let config = { ...legacyStep.config };
    let delay: WorkflowStep['delay'] | undefined;

    // 特殊处理 wait 类型 - 将配置转为 delay
    if (legacyStep.type === 'wait') {
      delay = {
        duration: (legacyStep.config.duration as number) || 1,
        unit: (legacyStep.config.unit as 'seconds' | 'minutes' | 'hours' | 'days') || 'minutes',
      };
      config = {}; // wait 节点不需要其他配置
    }

    return {
      id: legacyStep.id || `step-${index}`,
      nodeId,
      config,
      delay,
    } as WorkflowStep;
  }).filter(Boolean) as WorkflowStep[];
}

// ============================================
// 自动化工作流执行函数
// ============================================

/**
 * 表单提交触发的自动化
 */
export const onFormSubmitted = inngest.createFunction(
  {
    id: 'automation-form-submitted',
    name: 'Form Submission Automation',
    retries: 3,
  },
  { event: 'form/submitted' },
  async ({ event, step }) => {
    const { formId, contactId, fields } = event.data;
    const supabase = await createClient();

    // Step 1: 查找关联的自动化
    const automations = await step.run('find-automations', async () => {
      // 通过 form settings 查找
      const { data: form } = await supabase
        .from('forms')
        .select('settings, user_id')
        .eq('id', formId)
        .single();

      if (!form) return [];

      const automationId = (form.settings as { automationId?: string } | null)?.automationId;
      if (!automationId) return [];

      const { data: automation } = await supabase
        .from('automations')
        .select('*')
        .eq('id', automationId)
        .eq('is_active', true)
        .single();

      return automation ? [{ ...automation, userId: form.user_id }] : [];
    });

    if (automations.length === 0) {
      return { skipped: true, reason: 'No active automation found' };
    }

    // Step 2: 执行每个自动化
    for (const automation of automations) {
      const steps = convertLegacySteps(automation.steps as unknown[]);
      await executeWorkflowSteps(
        step,
        steps,
        {
          userId: automation.userId,
          contactId,
          workflowId: automation.id,
          variables: fields as Record<string, string>,
        },
        automation.id
      );
    }

    return { success: true, automationsExecuted: automations.length };
  }
);

/**
 * 联系人创建触发的自动化
 */
export const onContactCreated = inngest.createFunction(
  {
    id: 'automation-contact-created',
    name: 'Contact Created Automation',
    retries: 3,
  },
  { event: 'contact/created' },
  async ({ event, step }) => {
    const { contactId } = event.data;
    const supabase = await createClient();

    // 查找触发的自动化
    const automations = await step.run('find-automations', async () => {
      const { data: contact } = await supabase
        .from('contacts')
        .select('user_id')
        .eq('id', contactId)
        .single();

      if (!contact) return [];

      const { data } = await supabase
        .from('automations')
        .select('*')
        .eq('user_id', contact.user_id)
        .eq('trigger_type', 'contact_created')
        .eq('is_active', true);

      return (data || []).map((a) => ({ ...a, userId: contact.user_id }));
    });

    if (automations.length === 0) {
      return { skipped: true };
    }

    for (const automation of automations) {
      const steps = convertLegacySteps(automation.steps as unknown[]);
      await executeWorkflowSteps(
        step,
        steps,
        {
          userId: automation.userId,
          contactId,
          workflowId: automation.id,
        },
        automation.id
      );
    }

    return { success: true, automationsExecuted: automations.length };
  }
);

/**
 * 标签添加触发的自动化
 */
export const onTagAdded = inngest.createFunction(
  {
    id: 'automation-tag-added',
    name: 'Tag Added Automation',
    retries: 3,
  },
  { event: 'contact/tag.added' },
  async ({ event, step }) => {
    const { contactId, tag, userId } = event.data;
    const supabase = await createClient();

    // 查找匹配的自动化
    const automations = await step.run('find-automations', async () => {
      const { data } = await supabase
        .from('automations')
        .select('*')
        .eq('user_id', userId)
        .eq('trigger_type', 'tag_added')
        .eq('is_active', true);

      // 过滤匹配的 tag
      return (data || []).filter((a) => {
        const config = a.trigger_config as { tag?: string };
        return config.tag === tag;
      });
    });

    if (automations.length === 0) {
      return { skipped: true };
    }

    for (const automation of automations) {
      const steps = convertLegacySteps(automation.steps as unknown[]);
      await executeWorkflowSteps(
        step,
        steps,
        {
          userId,
          contactId,
          workflowId: automation.id,
        },
        automation.id
      );
    }

    return { success: true, automationsExecuted: automations.length };
  }
);

/**
 * 页面访问触发的自动化 (Phase 2)
 */
export const onPageVisited = inngest.createFunction(
  {
    id: 'automation-page-visited',
    name: 'Page Visit Automation',
    retries: 3,
  },
  { event: 'contact/page.visited' },
  async ({ event, step }) => {
    const { contactId, pageUrl, userId } = event.data;
    const supabase = await createClient();

    // 查找匹配 URL 模式的自动化
    const automations = await step.run('find-automations', async () => {
      const { data } = await supabase
        .from('automations')
        .select('*')
        .eq('user_id', userId)
        .eq('trigger_type', 'page_visit')
        .eq('is_active', true);

      // 过滤匹配 URL 模式的自动化
      return (data || []).filter((a) => {
        const config = a.trigger_config as { urlPattern?: string };
        if (!config.urlPattern) return false;

        // 支持通配符匹配: * 匹配任意字符
        const pattern = config.urlPattern
          .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // 转义正则特殊字符
          .replace(/\*/g, '.*'); // * 转为 .*
        const regex = new RegExp(`^${pattern}$`, 'i');
        return regex.test(pageUrl);
      });
    });

    if (automations.length === 0) {
      return { skipped: true, reason: 'No matching page visit automation' };
    }

    for (const automation of automations) {
      const steps = convertLegacySteps(automation.steps as unknown[]);
      await executeWorkflowSteps(
        step,
        steps,
        {
          userId,
          contactId,
          workflowId: automation.id,
          variables: { pageUrl },
        },
        automation.id
      );
    }

    return { success: true, automationsExecuted: automations.length };
  }
);

/**
 * 定时触发检查 (Phase 2)
 * 每5分钟运行一次，检查需要执行的定时自动化
 */
export const onScheduledCheck = inngest.createFunction(
  {
    id: 'automation-scheduled-check',
    name: 'Scheduled Automation Check',
  },
  { cron: '*/5 * * * *' }, // 每5分钟检查
  async ({ step }) => {
    const supabase = await createClient();
    const now = new Date();

    // 查找所有定时自动化
    const automations = await step.run('find-scheduled-automations', async () => {
      const { data } = await supabase
        .from('automations')
        .select('*')
        .eq('trigger_type', 'scheduled')
        .eq('is_active', true);

      return data || [];
    });

    if (automations.length === 0) {
      return { skipped: true, reason: 'No scheduled automations' };
    }

    const triggeredAutomations: string[] = [];

    for (const automation of automations) {
      const config = automation.trigger_config as {
        frequency: 'daily' | 'weekly' | 'monthly';
        time: string;
        dayOfWeek?: number;
        dayOfMonth?: number;
        audience?: 'all' | 'tagged';
        audienceTag?: string;
        timezone?: string;
      };

      // 检查是否应该在当前时间触发
      const shouldTrigger = await step.run(`check-schedule-${automation.id}`, async () => {
        const tz = config.timezone || 'UTC';
        const nowInTz = new Date(now.toLocaleString('en-US', { timeZone: tz }));
        const currentHour = nowInTz.getHours();
        const currentMinute = nowInTz.getMinutes();
        const currentDay = nowInTz.getDay();
        const currentDate = nowInTz.getDate();

        // 解析配置的时间
        const [targetHour, targetMinute] = (config.time || '09:00').split(':').map(Number);

        // 检查时间是否在当前5分钟窗口内
        const minuteDiff = currentHour * 60 + currentMinute - (targetHour * 60 + targetMinute);
        if (minuteDiff < 0 || minuteDiff >= 5) return false;

        // 检查频率
        switch (config.frequency) {
          case 'daily':
            return true;
          case 'weekly':
            return currentDay === (config.dayOfWeek ?? 1);
          case 'monthly':
            return currentDate === (config.dayOfMonth ?? 1);
          default:
            return false;
        }
      });

      if (!shouldTrigger) continue;

      // 获取目标联系人
      const contacts = await step.run(`get-contacts-${automation.id}`, async () => {
        let query = supabase
          .from('contacts')
          .select('id')
          .eq('user_id', automation.user_id);

        if (config.audience === 'tagged' && config.audienceTag) {
          query = query.contains('tags', [config.audienceTag]);
        }

        const { data } = await query.limit(1000); // 限制批量
        return data || [];
      });

      // 为每个联系人执行自动化
      for (const contact of contacts) {
        const steps = convertLegacySteps(automation.steps as unknown[]);
        await executeWorkflowSteps(
          step,
          steps,
          {
            userId: automation.user_id,
            contactId: contact.id,
            workflowId: automation.id,
          },
          automation.id
        );
      }

      triggeredAutomations.push(automation.id);
    }

    return {
      success: true,
      checked: automations.length,
      triggered: triggeredAutomations.length,
      automationIds: triggeredAutomations,
    };
  }
);

/**
 * 手动触发的自动化
 */
export const onAutomationTrigger = inngest.createFunction(
  {
    id: 'automation-manual-trigger',
    name: 'Manual Automation Trigger',
    retries: 3,
  },
  { event: 'automation/trigger' },
  async ({ event, step }) => {
    const { automationId, contactId, triggerData } = event.data;
    const supabase = await createClient();

    // 获取自动化
    const automation = await step.run('get-automation', async () => {
      const { data } = await supabase
        .from('automations')
        .select('*, users:user_id(id)')
        .eq('id', automationId)
        .single();

      return data;
    });

    if (!automation || !automation.is_active) {
      return { skipped: true, reason: 'Automation not found or inactive' };
    }

    const steps = convertLegacySteps(automation.steps as unknown[]);
    await executeWorkflowSteps(
      step,
      steps,
      {
        userId: automation.user_id,
        contactId,
        workflowId: automationId,
        variables: triggerData as Record<string, string>,
      },
      automationId
    );

    return { success: true };
  }
);

// ============================================
// 工作流步骤执行辅助函数
// ============================================

/**
 * 执行工作流步骤
 * 使用 Inngest step 确保每一步都是可恢复的
 */
async function executeWorkflowSteps(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  step: any, // Inngest step context
  steps: WorkflowStep[],
  context: NodeContext,
  workflowId: string,
  branchPrefix: string = '' // For nested branches
) {
  let previousOutput: Record<string, unknown> = {};

  for (let i = 0; i < steps.length; i++) {
    const workflowStep = steps[i];
    const stepId = `${branchPrefix}step-${i}-${workflowStep.nodeId}`;

    // 处理延迟
    if (workflowStep.delay) {
      const duration = formatDuration(workflowStep.delay);
      await step.sleep(`wait-${stepId}`, duration);
    }

    // 检查条件
    if (workflowStep.condition) {
      const shouldExecute = await step.run(`check-${stepId}`, async () => {
        return evaluateCondition(workflowStep.condition!, previousOutput);
      });

      if (!shouldExecute) {
        continue;
      }
    }

    // 执行节点
    const result = await step.run(stepId, async () => {
      // 合并配置和上一步输出
      const input = {
        ...workflowStep.config,
        ...replaceVariables(workflowStep.config, {
          ...context.variables,
          ...previousOutput,
        }),
      };

      return nodeRegistry.execute(workflowStep.nodeId, input, {
        ...context,
        previousData: previousOutput,
      });
    });

    if (!result.success && workflowStep.onError === 'stop') {
      throw new Error(`Step ${workflowStep.id} failed: ${result.error}`);
    }

    // 处理条件分支节点
    if (workflowStep.nodeId === 'flow.condition') {
      const branch = (result.output?.branch as 'true' | 'false') || 'false';
      const config = workflowStep.config as unknown as ConditionConfig;
      const branchSteps = branch === 'true' ? config.trueBranch : config.falseBranch;

      // 记录分支决策
      await trackBranchDecision(context, workflowStep.id, branch, workflowId);

      if (branchSteps && branchSteps.length > 0) {
        const convertedBranchSteps = convertLegacySteps(branchSteps);
        await executeWorkflowSteps(
          step,
          convertedBranchSteps,
          context,
          workflowId,
          `${branchPrefix}branch-${workflowStep.id}-${branch}-`
        );
      }
      // 继续执行主流程中的下一步
      continue;
    }

    // 处理 A/B 分流节点
    if (workflowStep.nodeId === 'flow.split') {
      const variantId = result.output?.variantId as string;
      const config = workflowStep.config as unknown as SplitConfig;
      const selectedVariant = config.variants?.find(v => v.id === variantId);

      // 记录变体选择
      await trackVariantSelection(context, workflowStep.id, variantId, workflowId);

      if (selectedVariant?.steps && selectedVariant.steps.length > 0) {
        const convertedVariantSteps = convertLegacySteps(selectedVariant.steps);
        await executeWorkflowSteps(
          step,
          convertedVariantSteps,
          context,
          workflowId,
          `${branchPrefix}variant-${variantId}-`
        );
      }
      // 继续执行主流程中的下一步
      continue;
    }

    // 保存输出供下一步使用
    if (result.output) {
      previousOutput = { ...previousOutput, ...result.output };
    }
  }
}

/**
 * 记录分支决策到 enrollment
 */
async function trackBranchDecision(
  context: NodeContext,
  stepId: string,
  branch: 'true' | 'false',
  automationId: string
): Promise<void> {
  if (!context.contactId) return;

  try {
    const supabase = await createClient();
    const branchEntry = `${stepId}:${branch}`;

    // 先获取当前 branch_path，然后追加
    const { data: enrollment } = await supabase
      .from('automation_enrollments')
      .select('branch_path')
      .eq('contact_id', context.contactId)
      .eq('automation_id', automationId)
      .single();

    const currentPath: string[] = enrollment?.branch_path || [];
    const newPath = [...currentPath, branchEntry];

    await supabase
      .from('automation_enrollments')
      .update({ branch_path: newPath })
      .eq('contact_id', context.contactId)
      .eq('automation_id', automationId);
  } catch (error) {
    // 非关键操作，记录错误但不中断流程
    console.warn('Failed to track branch decision:', error);
  }
}

/**
 * 记录 A/B 测试变体选择
 */
async function trackVariantSelection(
  context: NodeContext,
  _stepId: string,
  variantId: string,
  automationId: string
): Promise<void> {
  if (!context.contactId) return;

  try {
    const supabase = await createClient();

    await supabase
      .from('automation_enrollments')
      .update({ variant_id: variantId })
      .eq('contact_id', context.contactId)
      .eq('automation_id', automationId);
  } catch (error) {
    console.warn('Failed to track variant selection:', error);
  }
}

/**
 * 格式化延迟时间为 Inngest 格式
 */
function formatDuration(delay: { duration: number; unit: string }): string {
  const { duration, unit } = delay;
  switch (unit) {
    case 'seconds':
      return `${duration}s`;
    case 'minutes':
      return `${duration}m`;
    case 'hours':
      return `${duration}h`;
    case 'days':
      return `${duration}d`;
    default:
      return `${duration}m`;
  }
}

/**
 * 评估条件
 */
function evaluateCondition(
  condition: WorkflowStep['condition'],
  data: Record<string, unknown>
): boolean {
  if (!condition) return true;

  const value = data[condition.field];

  switch (condition.type) {
    case 'equals':
      return value === condition.value;
    case 'contains':
      return String(value).includes(String(condition.value));
    case 'exists':
      return value !== undefined && value !== null;
    default:
      return true;
  }
}

/**
 * 替换变量
 */
function replaceVariables(
  config: Record<string, unknown>,
  variables: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'string') {
      result[key] = value.replace(/\{\{(\w+)\}\}/g, (_, name) => {
        return String(variables[name] ?? `{{${name}}}`);
      });
    } else {
      result[key] = value;
    }
  }

  return result;
}

// 导出所有函数
export const automationFunctions = [
  onFormSubmitted,
  onContactCreated,
  onTagAdded,
  onPageVisited,        // Phase 2: 页面访问触发
  onScheduledCheck,     // Phase 2: 定时触发
  onAutomationTrigger,
];
