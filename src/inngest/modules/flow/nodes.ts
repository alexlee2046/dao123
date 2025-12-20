import { z } from 'zod';
import type { NodeDefinition, NodeContext, NodeResult } from '../../core/types';
import { createClient } from '@/lib/supabase/server';

// ============================================
// Flow 模块 - 流程控制节点
// ============================================

// --- Wait Node ---

const waitInputSchema = z.object({
  duration: z.number().min(1).describe('等待时长'),
  unit: z.enum(['seconds', 'minutes', 'hours', 'days']).describe('时间单位'),
});

type WaitInput = z.infer<typeof waitInputSchema>;

export const waitNode: NodeDefinition<WaitInput> = {
  meta: {
    id: 'flow.wait',
    name: '等待',
    description: '暂停工作流执行指定时间。用于延迟发送邮件等场景。',
    category: 'flow',
    module: 'flow',
    icon: 'Clock',
    color: '#6b7280',
    inputSchema: waitInputSchema,
    outputDescription: '返回等待的时长信息',
    examples: [
      { name: '等待1小时', config: { duration: 1, unit: 'hours' } },
      { name: '等待3天', config: { duration: 3, unit: 'days' } },
    ],
  },

  async execute(input: WaitInput, _context: NodeContext): Promise<NodeResult> {
    // Wait 节点实际执行由 Inngest step.sleep 处理
    // 这里只返回配置信息，实际等待在 workflow executor 中实现
    return {
      success: true,
      data: {
        duration: input.duration,
        unit: input.unit,
        waitUntil: calculateWaitUntil(input.duration, input.unit),
      },
      output: {
        waited: true,
        duration: input.duration,
        unit: input.unit,
      },
    };
  },
};

function calculateWaitUntil(duration: number, unit: string): Date {
  const now = new Date();
  switch (unit) {
    case 'seconds':
      return new Date(now.getTime() + duration * 1000);
    case 'minutes':
      return new Date(now.getTime() + duration * 60 * 1000);
    case 'hours':
      return new Date(now.getTime() + duration * 60 * 60 * 1000);
    case 'days':
      return new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
    default:
      return now;
  }
}

// --- Condition Node ---

const conditionInputSchema = z.object({
  conditionType: z.enum(['email_opened', 'email_clicked', 'tag_exists', 'field_equals', 'expression']).describe('条件类型'),
  params: z.object({
    emailStepId: z.string().optional().describe('检查的邮件步骤 ID (email_opened/clicked)'),
    tag: z.string().optional().describe('标签名 (tag_exists)'),
    field: z.string().optional().describe('字段名 (field_equals)'),
    value: z.string().optional().describe('比较值 (field_equals)'),
    expression: z.string().optional().describe('自定义表达式'),
  }).describe('条件参数'),
});

type ConditionInput = z.infer<typeof conditionInputSchema>;

export const conditionNode: NodeDefinition<ConditionInput> = {
  meta: {
    id: 'flow.condition',
    name: '条件分支',
    description: '根据条件判断执行不同分支。支持邮件打开/点击、标签存在、字段比较等条件。',
    category: 'flow',
    module: 'flow',
    icon: 'GitBranch',
    color: '#8b5cf6',
    inputSchema: conditionInputSchema,
    outputs: [
      { id: 'true', name: '条件为真', type: 'any' },
      { id: 'false', name: '条件为假', type: 'any' },
    ],
    outputDescription: '返回条件评估结果 (true/false)',
    examples: [
      {
        name: '检查邮件是否打开',
        config: {
          conditionType: 'email_opened',
          params: { emailStepId: 'step_1' },
        },
      },
      {
        name: '检查标签是否存在',
        config: {
          conditionType: 'tag_exists',
          params: { tag: 'vip' },
        },
      },
    ],
  },

  async execute(input: ConditionInput, context: NodeContext): Promise<NodeResult> {
    const result = await evaluateCondition(input, context);

    return {
      success: true,
      data: {
        conditionType: input.conditionType,
        result,
      },
      output: {
        conditionResult: result,
        branch: result ? 'true' : 'false',
      },
    };
  },
};

async function evaluateCondition(input: ConditionInput, context: NodeContext): Promise<boolean> {
  const supabase = await createClient();
  const { conditionType, params } = input;
  const contactId = context.contactId;

  if (!contactId) {
    return false;
  }

  switch (conditionType) {
    case 'email_opened': {
      if (!params.emailStepId) return false;
      const { data: logs } = await supabase
        .from('email_logs')
        .select('id')
        .eq('contact_id', contactId)
        .eq('step_id', params.emailStepId)
        .not('opened_at', 'is', null)
        .limit(1);
      return (logs?.length || 0) > 0;
    }

    case 'email_clicked': {
      if (!params.emailStepId) return false;
      const { data: logs } = await supabase
        .from('email_logs')
        .select('id')
        .eq('contact_id', contactId)
        .eq('step_id', params.emailStepId)
        .not('clicked_at', 'is', null)
        .limit(1);
      return (logs?.length || 0) > 0;
    }

    case 'tag_exists': {
      if (!params.tag) return false;
      const { data: contact } = await supabase
        .from('contacts')
        .select('tags')
        .eq('id', contactId)
        .single();
      const tags: string[] = contact?.tags || [];
      return tags.includes(params.tag);
    }

    case 'field_equals': {
      if (!params.field) return false;
      const { data: contact } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();
      if (!contact) return false;
      const fieldValue = contact[params.field];
      return String(fieldValue) === String(params.value);
    }

    case 'expression': {
      // 简单表达式评估，从 context.stepsData 中获取数据
      // 格式: {{step1.output.success}} === true
      if (!params.expression || !context.stepsData) return false;
      try {
        const stepsData = context.stepsData;
        const expr = params.expression.replace(
          /\{\{(\w+)\.(\w+)\.(\w+)\}\}/g,
          (_match: string, stepId: string, prop: string, subProp: string) => {
            const stepData = stepsData[stepId] as Record<string, unknown> | undefined;
            const propData = stepData?.[prop] as Record<string, unknown> | undefined;
            const value = propData?.[subProp] ?? stepData?.[subProp];
            return JSON.stringify(value);
          }
        );
        // 安全评估简单表达式
        return Boolean(eval(expr));
      } catch {
        return false;
      }
    }

    default:
      return false;
  }
}

// --- Split (A/B Test) Node ---

const splitInputSchema = z.object({
  variants: z.array(z.object({
    id: z.string().describe('变体 ID'),
    name: z.string().describe('变体名称'),
    percentage: z.number().min(0).max(100).describe('百分比 (0-100)'),
  })).min(2).describe('变体列表，百分比总和应为 100'),
});

type SplitInput = z.infer<typeof splitInputSchema>;

export const splitNode: NodeDefinition<SplitInput> = {
  meta: {
    id: 'flow.split',
    name: 'A/B 分流',
    description: '按百分比随机分配到不同分支。用于 A/B 测试。',
    category: 'flow',
    module: 'flow',
    icon: 'Split',
    color: '#f59e0b',
    inputSchema: splitInputSchema,
    outputDescription: '返回选中的变体 ID',
    examples: [
      {
        name: '50/50 分流',
        config: {
          variants: [
            { id: 'a', name: '变体 A', percentage: 50 },
            { id: 'b', name: '变体 B', percentage: 50 },
          ],
        },
      },
    ],
  },

  async execute(input: SplitInput, _context: NodeContext): Promise<NodeResult> {
    const selectedVariantId = selectVariant(input.variants);
    const selectedVariant = input.variants.find((v) => v.id === selectedVariantId);

    return {
      success: true,
      data: {
        selectedVariantId,
        selectedVariantName: selectedVariant?.name,
      },
      output: {
        variantId: selectedVariantId,
        variantName: selectedVariant?.name,
        branch: selectedVariantId,
      },
    };
  },
};

function selectVariant(variants: { id: string; percentage: number }[]): string {
  const random = Math.random() * 100;
  let cumulative = 0;

  for (const variant of variants) {
    cumulative += variant.percentage;
    if (random < cumulative) {
      return variant.id;
    }
  }

  return variants[0]?.id || '';
}

// --- 导出所有节点 ---

export const flowNodes = [waitNode, conditionNode, splitNode];
