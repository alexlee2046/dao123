import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createClient } from '@/lib/supabase/server';
import { getDefaultModel } from '@/lib/actions/models';
import { z } from 'zod';
import { nanoid } from 'nanoid';

export const runtime = 'edge';

/**
 * Email Sequence Registry - Available step types
 * Reuses patterns from workflow NODE_REGISTRY
 */
const STEP_TYPES = {
  'send_email': {
    name: 'Send Email',
    description: 'Send an email to the contact',
    params: {
      subject: { type: 'string', required: true, description: 'Email subject line' },
      body: { type: 'string', required: true, description: 'Email body content (HTML supported)' },
      preheader: { type: 'string', description: 'Preview text shown in inbox' },
    },
  },
  'wait': {
    name: 'Wait',
    description: 'Wait for a specified duration before next step',
    params: {
      duration: { type: 'number', required: true, description: 'Duration to wait' },
      unit: { type: 'enum', values: ['minutes', 'hours', 'days'], default: 'days' },
    },
  },
  'add_tag': {
    name: 'Add Tag',
    description: 'Add a tag to the contact for segmentation',
    params: {
      tag: { type: 'string', required: true, description: 'Tag name to add' },
    },
  },
} as const;

// Zod schema for generated email sequence
const emailStepSchema = z.object({
  id: z.string().describe('Unique step ID'),
  type: z.enum(['send_email', 'wait', 'add_tag']).describe('Step type'),
  config: z.object({
    // For send_email
    subject: z.string().optional().describe('Email subject'),
    body: z.string().optional().describe('Email body HTML'),
    preheader: z.string().optional().describe('Preview text'),
    // For wait
    duration: z.number().optional().describe('Wait duration'),
    unit: z.enum(['minutes', 'hours', 'days']).optional().describe('Wait unit'),
    // For add_tag
    tag: z.string().optional().describe('Tag name'),
  }).describe('Step configuration'),
  order: z.number().describe('Step order (1-based)'),
});

const emailSequenceSchema = z.object({
  name: z.string().describe('Sequence name'),
  description: z.string().describe('Sequence description'),
  goal: z.string().describe('Marketing goal of this sequence'),
  targetAudience: z.string().describe('Target audience description'),
  steps: z.array(emailStepSchema).min(2).describe('Sequence steps (at least 2)'),
  estimatedDuration: z.string().describe('Total duration of sequence (e.g., "7 days")'),
  expectedOutcome: z.string().describe('Expected outcome/conversion goal'),
});

// Few-shot examples for better generation
const FEW_SHOT_EXAMPLES = `
## Example 1: Welcome Sequence (新用户欢迎)
Input: "新用户注册后的欢迎邮件序列，介绍产品功能"
Output:
{
  "name": "新用户欢迎序列",
  "description": "引导新用户了解产品核心功能，提高激活率",
  "goal": "用户激活",
  "targetAudience": "刚注册的新用户",
  "steps": [
    {"id": "step1", "type": "send_email", "config": {"subject": "欢迎加入！开始您的旅程", "body": "<h1>欢迎！</h1><p>感谢您的注册...</p>", "preheader": "一分钟快速上手指南"}, "order": 1},
    {"id": "step2", "type": "wait", "config": {"duration": 1, "unit": "days"}, "order": 2},
    {"id": "step3", "type": "send_email", "config": {"subject": "3个让您事半功倍的技巧", "body": "<h1>专业技巧</h1><p>以下是我们用户最喜欢的功能...</p>"}, "order": 3},
    {"id": "step4", "type": "wait", "config": {"duration": 2, "unit": "days"}, "order": 4},
    {"id": "step5", "type": "send_email", "config": {"subject": "需要帮助吗？", "body": "<h1>我们在这里</h1><p>如果您有任何问题...</p>"}, "order": 5},
    {"id": "step6", "type": "add_tag", "config": {"tag": "onboarding_completed"}, "order": 6}
  ],
  "estimatedDuration": "3 days",
  "expectedOutcome": "用户完成首次核心操作"
}

## Example 2: Lead Nurturing (线索培育)
Input: "下载白皮书后的培育序列，最终引导到演示预约"
Output:
{
  "name": "白皮书下载培育序列",
  "description": "通过价值内容培育线索，引导预约产品演示",
  "goal": "演示预约",
  "targetAudience": "下载白皮书的潜在客户",
  "steps": [
    {"id": "step1", "type": "send_email", "config": {"subject": "您的白皮书已准备好", "body": "<h1>感谢下载</h1><p>点击下载您的白皮书...</p>"}, "order": 1},
    {"id": "step2", "type": "add_tag", "config": {"tag": "whitepaper_downloaded"}, "order": 2},
    {"id": "step3", "type": "wait", "config": {"duration": 2, "unit": "days"}, "order": 3},
    {"id": "step4", "type": "send_email", "config": {"subject": "深度解读：白皮书核心观点", "body": "<h1>核心洞察</h1><p>在白皮书中，我们提到...</p>"}, "order": 4},
    {"id": "step5", "type": "wait", "config": {"duration": 3, "unit": "days"}, "order": 5},
    {"id": "step6", "type": "send_email", "config": {"subject": "客户案例：他们如何实现30%增长", "body": "<h1>成功案例</h1><p>看看我们的客户是如何...</p>"}, "order": 6},
    {"id": "step7", "type": "wait", "config": {"duration": 2, "unit": "days"}, "order": 7},
    {"id": "step8", "type": "send_email", "config": {"subject": "预约15分钟演示，了解如何应用到您的业务", "body": "<h1>下一步</h1><p>预约一个简短的演示...</p>"}, "order": 8}
  ],
  "estimatedDuration": "7 days",
  "expectedOutcome": "预约产品演示"
}
`;

/**
 * Validate generated sequence structure
 */
function validateSequence(sequence: z.infer<typeof emailSequenceSchema>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check step order is sequential
  const orders = sequence.steps.map(s => s.order).sort((a, b) => a - b);
  for (let i = 0; i < orders.length; i++) {
    if (orders[i] !== i + 1) {
      errors.push(`Step order should be sequential 1-${orders.length}, got ${orders.join(',')}`);
      break;
    }
  }

  // Check send_email steps have required fields
  for (const step of sequence.steps) {
    if (step.type === 'send_email') {
      if (!step.config.subject) {
        errors.push(`Step ${step.id} (send_email) missing subject`);
      }
      if (!step.config.body) {
        errors.push(`Step ${step.id} (send_email) missing body`);
      }
    }
    if (step.type === 'wait') {
      if (!step.config.duration) {
        errors.push(`Step ${step.id} (wait) missing duration`);
      }
    }
    if (step.type === 'add_tag') {
      if (!step.config.tag) {
        errors.push(`Step ${step.id} (add_tag) missing tag`);
      }
    }
  }

  // Should have at least one send_email
  const emailSteps = sequence.steps.filter(s => s.type === 'send_email');
  if (emailSteps.length === 0) {
    errors.push('Sequence must have at least one send_email step');
  }

  return { valid: errors.length === 0, errors };
}

export async function POST(req: Request) {
  try {
    const { prompt, language = 'zh', productInfo } = await req.json();

    if (!prompt) {
      return Response.json({ error: '请描述您想要创建的邮件序列' }, { status: 400 });
    }

    // Get API Key
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      console.warn('Failed to fetch API key from DB');
    }

    if (!apiKey) {
      return Response.json({ error: 'API Key 未配置' }, { status: 500 });
    }

    // Get default model (Gemini 3 Flash recommended)
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

    const systemPrompt = `You are an email marketing expert. Create effective email sequences that nurture leads and drive conversions.

## Available Step Types

${Object.entries(STEP_TYPES).map(([type, def]) => `
### ${type}
**${def.name}**: ${def.description}
Parameters: ${Object.entries(def.params).map(([name, p]) => `${name} (${p.type}${p.required ? ', required' : ''})`).join(', ')}
`).join('\n')}

## Best Practices
1. Start with immediate value (welcome/thank you)
2. Space emails 1-3 days apart (not too frequent)
3. Build value before asking for action
4. Use clear, compelling subject lines (< 50 chars)
5. Include one clear CTA per email
6. End with strong call-to-action email
7. Add tags for segmentation

## Email Body Format
- Use clean HTML with <h1>, <p>, <a> tags
- Keep emails concise (150-300 words)
- Include personalization placeholders: {{first_name}}, {{company_name}}
- Always include a clear CTA button

## Output Language
Generate all content in ${language === 'zh' ? 'Chinese (简体中文)' : 'English'}.

${productInfo ? `## Product/Service Context\n${productInfo}` : ''}

${FEW_SHOT_EXAMPLES}`;

    // Generate with retry on validation failure
    let attempts = 0;
    const maxAttempts = 2;
    let lastError: string | null = null;

    while (attempts < maxAttempts) {
      attempts++;

      const userPrompt = lastError
        ? `Create an email sequence for: ${prompt}\n\nPREVIOUS ATTEMPT FAILED:\n${lastError}\nPlease fix these issues.`
        : `Create an email sequence for: ${prompt}`;

      const result = await generateObject({
        model: openRouter(modelId),
        schema: emailSequenceSchema,
        system: systemPrompt,
        prompt: userPrompt,
      });

      // Validate
      const validation = validateSequence(result.object);

      if (validation.valid) {
        // Ensure unique IDs
        const stepsWithIds = result.object.steps.map((step) => ({
          ...step,
          id: step.id || `step_${nanoid(6)}`,
        }));

        return Response.json({
          success: true,
          sequence: {
            ...result.object,
            steps: stepsWithIds,
          },
          _meta: {
            attempts,
            model: modelId,
          }
        });
      }

      lastError = validation.errors.join('\n');
      console.warn(`[Email Sequence Generate] Attempt ${attempts} failed:`, validation.errors);
    }

    return Response.json({
      error: `邮件序列生成验证失败: ${lastError}`,
      _meta: { attempts, model: modelId }
    }, { status: 422 });

  } catch (error: unknown) {
    console.error('[Email Sequence Generate Error]:', error);
    return Response.json({
      error: error instanceof Error ? error.message : 'AI 服务调用失败'
    }, { status: 500 });
  }
}
