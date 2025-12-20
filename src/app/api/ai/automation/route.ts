import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createClient } from '@/lib/supabase/server';
import { getDefaultModel } from '@/lib/actions/models';
import { z } from 'zod';
import { nanoid } from 'nanoid';

export const runtime = 'edge';

/**
 * Step Type Registry - Available automation step types
 * Similar to workflow NODE_REGISTRY for better AI guidance
 */
const STEP_TYPES = {
  'send_email': {
    name: '发送邮件',
    description: '发送一封邮件给联系人',
    params: {
      subject: { type: 'string', required: true, description: '邮件主题（< 50字符）' },
      content: { type: 'string', required: true, description: '邮件内容（HTML格式，150-300字）' },
      preheader: { type: 'string', description: '邮件预览文本（收件箱预览）' },
    },
  },
  'wait': {
    name: '等待',
    description: '等待指定时间后执行下一步',
    params: {
      duration: { type: 'number', required: true, description: '等待时长' },
      unit: { type: 'enum', values: ['minutes', 'hours', 'days'], default: 'days', description: '时间单位' },
    },
  },
  'add_tag': {
    name: '添加标签',
    description: '为联系人添加标签用于分组',
    params: {
      tag: { type: 'string', required: true, description: '标签名称' },
    },
  },
  'remove_tag': {
    name: '移除标签',
    description: '移除联系人的某个标签',
    params: {
      tag: { type: 'string', required: true, description: '标签名称' },
    },
  },
} as const;

// Valid step types as enum values
const VALID_STEP_TYPES = ['send_email', 'wait', 'add_tag', 'remove_tag'] as const;

// Schema for the generated automation sequence
const automationStepSchema = z.object({
  type: z.enum(VALID_STEP_TYPES),
  config: z.object({
    subject: z.string().optional(),
    content: z.string().optional(),
    preheader: z.string().optional(),
    duration: z.number().optional(),
    unit: z.enum(['minutes', 'hours', 'days']).optional(),
    tag: z.string().optional(),
  }),
});

const automationSequenceSchema = z.object({
  name: z.string().describe('Automation sequence name'),
  description: z.string().describe('Brief description of the sequence'),
  steps: z.array(automationStepSchema).min(2).max(20).describe('Sequence of automation steps (2-20 steps max)'),
  explanation: z.string().describe('Explanation of the strategy'),
});

// Few-shot examples for better generation accuracy
const FEW_SHOT_EXAMPLES = `
## Example 1: 新用户欢迎序列 (5封邮件)
产品: SaaS 客户管理软件
生成:
{
  "name": "新用户欢迎序列",
  "description": "引导新用户了解产品功能，提高激活率",
  "steps": [
    {"type": "send_email", "config": {"subject": "欢迎加入！开始您的旅程", "content": "<h2>欢迎！</h2><p>感谢您选择我们。让我们一起开始吧...</p><p><a href='{{login_url}}' class='button'>立即登录</a></p>", "preheader": "一分钟快速上手指南"}},
    {"type": "wait", "config": {"duration": 1, "unit": "days"}},
    {"type": "send_email", "config": {"subject": "3个让您事半功倍的技巧", "content": "<h2>专业技巧</h2><p>以下是我们用户最喜欢的功能...</p>"}},
    {"type": "wait", "config": {"duration": 2, "unit": "days"}},
    {"type": "send_email", "config": {"subject": "看看其他用户是怎么做的", "content": "<h2>成功案例</h2><p>张先生的公司提升了50%效率...</p>"}},
    {"type": "wait", "config": {"duration": 2, "unit": "days"}},
    {"type": "send_email", "config": {"subject": "需要帮助吗？", "content": "<h2>我们在这里</h2><p>如果您有任何问题，随时联系...</p>"}},
    {"type": "add_tag", "config": {"tag": "onboarding_completed"}}
  ],
  "explanation": "欢迎 → 功能介绍 → 社会证明 → 支持提醒，逐步建立信任"
}

## Example 2: 白皮书下载培育序列 (7封邮件)
产品: B2B 企业服务
生成:
{
  "name": "白皮书下载培育序列",
  "description": "通过价值内容培育线索，引导预约产品演示",
  "steps": [
    {"type": "send_email", "config": {"subject": "您的白皮书已准备好", "content": "<h2>感谢下载</h2><p>点击下载您的白皮书...</p><p><a href='{{download_url}}' class='button'>下载PDF</a></p>"}},
    {"type": "add_tag", "config": {"tag": "whitepaper_downloaded"}},
    {"type": "wait", "config": {"duration": 2, "unit": "days"}},
    {"type": "send_email", "config": {"subject": "深度解读：白皮书核心观点", "content": "<h2>核心洞察</h2><p>在白皮书中，我们提到了三个关键趋势...</p>"}},
    {"type": "wait", "config": {"duration": 3, "unit": "days"}},
    {"type": "send_email", "config": {"subject": "客户案例：他们如何实现30%增长", "content": "<h2>成功案例</h2><p>看看ABC公司是如何...</p>"}},
    {"type": "wait", "config": {"duration": 2, "unit": "days"}},
    {"type": "send_email", "config": {"subject": "预约15分钟演示，了解如何应用到您的业务", "content": "<h2>下一步</h2><p>预约一个简短的演示...</p><p><a href='{{demo_url}}' class='button'>预约演示</a></p>"}}
  ],
  "explanation": "交付内容 → 深化价值 → 社会证明 → 转化行动"
}
`;

/**
 * Validate and fix generated sequence structure
 * Returns fixed sequence if possible, or errors if not fixable
 */
function validateAndFixSequence(
  sequence: z.infer<typeof automationSequenceSchema>,
  expectedEmailCount: number = 5
): {
  valid: boolean;
  errors: string[];
  fixed: z.infer<typeof automationSequenceSchema>;
} {
  const errors: string[] = [];
  let fixedSteps = [...sequence.steps];

  // Count email steps and limit to expected
  const emailSteps = fixedSteps.filter(s => s.type === 'send_email');
  const nonEmailSteps = fixedSteps.filter(s => s.type !== 'send_email');

  // If too many emails, take only the expected count
  let limitedEmails = emailSteps.slice(0, expectedEmailCount);

  // If too few wait steps, we'll add them later
  const waitSteps = nonEmailSteps.filter(s => s.type === 'wait');
  const tagSteps = nonEmailSteps.filter(s => s.type === 'add_tag' || s.type === 'remove_tag');

  // Reconstruct the sequence with proper email + wait alternation
  const reconstructed: typeof fixedSteps = [];

  // Add tag at beginning if exists
  const leadingTag = tagSteps.find(t => t.type === 'add_tag');
  if (leadingTag) {
    reconstructed.push(leadingTag);
  }

  // Interleave emails and waits
  for (let i = 0; i < limitedEmails.length; i++) {
    reconstructed.push(limitedEmails[i]);
    // Add wait after each email except the last
    if (i < limitedEmails.length - 1) {
      const existingWait = waitSteps[i];
      if (existingWait) {
        reconstructed.push(existingWait);
      } else {
        // Create default wait step
        reconstructed.push({
          type: 'wait' as const,
          config: { duration: 2, unit: 'days' as const },
        });
      }
    }
  }

  // Add completion tag at end
  const trailingTag = tagSteps.find(t => t !== leadingTag) ||
    { type: 'add_tag' as const, config: { tag: 'sequence_completed' } };
  reconstructed.push(trailingTag);

  fixedSteps = reconstructed;

  // Check send_email steps have required fields
  for (let i = 0; i < fixedSteps.length; i++) {
    const step = fixedSteps[i];
    if (step.type === 'send_email') {
      if (!step.config.subject) {
        errors.push(`步骤 ${i + 1} (send_email) 缺少 subject`);
      }
      // If content is missing but we have subject, generate placeholder
      if (!step.config.content && step.config.subject) {
        fixedSteps[i] = {
          ...step,
          config: {
            ...step.config,
            content: `<h2>${step.config.subject}</h2><p>邮件内容待编辑...</p>`,
          },
        };
      } else if (!step.config.content) {
        errors.push(`步骤 ${i + 1} (send_email) 缺少 content`);
      }
    }
    if (step.type === 'wait') {
      if (!step.config.duration || step.config.duration <= 0) {
        // Default to 1 day if missing
        fixedSteps[i] = {
          ...step,
          config: {
            ...step.config,
            duration: 1,
            unit: step.config.unit || 'days',
          },
        };
      }
    }
    if (step.type === 'add_tag' || step.type === 'remove_tag') {
      if (!step.config.tag) {
        errors.push(`步骤 ${i + 1} (${step.type}) 缺少 tag`);
      }
    }
  }

  // Should have at least one send_email
  const finalEmailSteps = fixedSteps.filter(s => s.type === 'send_email');
  if (finalEmailSteps.length === 0) {
    errors.push('序列必须至少包含一个 send_email 步骤');
  }

  return {
    valid: errors.length === 0,
    errors,
    fixed: { ...sequence, steps: fixedSteps },
  };
}

/**
 * Generate step type catalog for AI guidance
 */
function generateStepCatalog(): string {
  return Object.entries(STEP_TYPES)
    .map(([type, def]) => {
      const params = Object.entries(def.params)
        .map(([name, p]) => {
          const required = 'required' in p && p.required ? ' (必需)' : ' (可选)';
          const defaultVal = 'default' in p ? `, 默认: ${p.default}` : '';
          return `    - ${name}: ${p.description}${required}${defaultVal}`;
        })
        .join('\n');
      return `### ${type}\n**${def.name}**: ${def.description}\n参数:\n${params}`;
    })
    .join('\n\n');
}

export async function POST(req: Request) {
  try {
    const {
      productDescription,
      targetAudience,
      sequenceLength = 5,
      tone = 'professional',
      language = 'zh'
    } = await req.json();

    if (!productDescription) {
      return Response.json({ error: '请提供产品描述' }, { status: 400 });
    }

    // Get API Key
    const supabase = await createClient();
    let apiKey = process.env.OPENROUTER_API_KEY;

    try {
      const { data: dbSetting } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'OPENROUTER_API_KEY')
        .single();

      if (dbSetting?.value) {
        apiKey = dbSetting.value;
      }
    } catch {
      console.warn('Failed to fetch API key from DB, falling back to env');
    }

    if (!apiKey) {
      return Response.json({ error: 'API Key 未配置' }, { status: 500 });
    }

    // Get default model (prefer Gemini 3 Flash for accuracy)
    let modelId = 'google/gemini-3-flash-preview';
    const defaultModel = await getDefaultModel('chat');
    if (defaultModel) {
      modelId = defaultModel.id;
    }

    // Create OpenRouter client
    const openRouter = createOpenAI({
      apiKey: apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      name: 'openrouter',
      headers: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://www.dao123.me',
        'X-Title': 'dao123',
      }
    });

    const toneMap: Record<string, string> = {
      professional: '专业正式',
      friendly: '友好亲切',
      casual: '轻松随意',
      urgent: '紧迫感',
    };

    const systemPrompt = `你是一位专业的邮件营销专家和自动化序列设计师。
根据用户提供的产品描述，生成一个高转化的邮件自动化序列。

## 可用步骤类型

${generateStepCatalog()}

## 序列设计原则
1. **开场价值**: 第一封邮件立即提供价值，建立信任
2. **间隔节奏**: send_email 和 wait 交替，间隔1-3天
3. **渐进深入**: 从介绍 → 痛点 → 方案 → 证明 → 行动
4. **简洁有力**: 每封邮件150-300字，一个明确CTA
5. **标签分组**: 结尾添加标签用于后续分群

## 邮件内容格式
- 使用 HTML 标签: <h2>, <p>, <a>, <strong>
- 按钮样式: <a href='{{url}}' class='button'>按钮文字</a>
- 变量占位符: {{first_name}}, {{company_name}}, {{login_url}}
- 不要包含 <html>, <body> 等外层标签

## 输出要求
- 语言: ${language === 'zh' ? '中文' : 'English'}
- 语气: ${toneMap[tone] || tone}
- 邮件数量: 精确 ${sequenceLength} 封（不多不少）
- 总步骤数: 精确 ${sequenceLength * 2 + 1} 个步骤
  * ${sequenceLength} 个 send_email 步骤
  * ${sequenceLength - 1} 个 wait 步骤（邮件之间）
  * 1-2 个 add_tag 步骤（开头或结尾）

**重要**: 不要生成超过 ${sequenceLength * 2 + 2} 个步骤！

${FEW_SHOT_EXAMPLES}`;

    // Generate with retry on validation failure
    let attempts = 0;
    const maxAttempts = 2;
    let lastError: string | null = null;

    while (attempts < maxAttempts) {
      attempts++;

      const userPrompt = lastError
        ? `为以下产品生成${sequenceLength}封邮件的自动化序列：\n\n${productDescription}\n\n目标受众: ${targetAudience || '通用受众'}\n\n上次生成失败:\n${lastError}\n请修正这些问题。`
        : `为以下产品生成${sequenceLength}封邮件的自动化序列：\n\n${productDescription}\n\n目标受众: ${targetAudience || '通用受众'}`;

      const result = await generateObject({
        model: openRouter(modelId),
        schema: automationSequenceSchema,
        system: systemPrompt,
        prompt: userPrompt,
      });

      // Validate and fix (pass expected email count for step truncation)
      const validation = validateAndFixSequence(result.object, sequenceLength);

      if (validation.valid) {
        // Use fixed sequence and add IDs
        const stepsWithIds = validation.fixed.steps.map((step, index) => ({
          id: nanoid(),
          type: step.type,
          order: index,
          config: step.config,
        }));

        return Response.json({
          success: true,
          sequence: {
            name: validation.fixed.name,
            description: validation.fixed.description,
            steps: stepsWithIds,
            explanation: validation.fixed.explanation,
          },
          _meta: {
            attempts,
            model: modelId,
          }
        });
      }

      lastError = validation.errors.join('\n');
      console.warn(`[AI Automation] Attempt ${attempts} failed:`, validation.errors);
    }

    return Response.json({
      error: `生成验证失败: ${lastError}`,
      _meta: { attempts, model: modelId }
    }, { status: 422 });

  } catch (error: unknown) {
    console.error('[AI Automation API Error]:', error);
    return Response.json({
      error: error instanceof Error ? error.message : 'AI 服务调用失败'
    }, { status: 500 });
  }
}
