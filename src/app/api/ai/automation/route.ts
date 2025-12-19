import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createClient } from '@/lib/supabase/server';
import { getDefaultModel } from '@/lib/actions/models';
import { z } from 'zod';
import { nanoid } from 'nanoid';

export const runtime = 'edge';

// Schema for the generated automation sequence
const automationStepSchema = z.object({
  type: z.enum(['send_email', 'wait', 'add_tag', 'remove_tag']),
  config: z.object({
    subject: z.string().optional(),
    content: z.string().optional(),
    duration: z.number().optional(),
    unit: z.enum(['minutes', 'hours', 'days']).optional(),
    tag: z.string().optional(),
  }),
});

const automationSequenceSchema = z.object({
  name: z.string().describe('Automation sequence name'),
  description: z.string().describe('Brief description of the sequence'),
  steps: z.array(automationStepSchema).describe('Sequence of automation steps'),
  explanation: z.string().describe('Explanation of the strategy'),
});

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
    } catch (e) {
      console.warn('Failed to fetch API key from DB, falling back to env');
    }

    if (!apiKey) {
      return Response.json({ error: 'API Key 未配置' }, { status: 500 });
    }

    // Get default model
    let modelId = 'anthropic/claude-3.5-sonnet';
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

产品/服务: ${productDescription}
目标受众: ${targetAudience || '通用受众'}
序列长度: ${sequenceLength} 封邮件
语气风格: ${toneMap[tone] || tone}
输出语言: ${language === 'zh' ? '中文' : 'English'}

序列设计原则:
1. 第一封: 欢迎邮件 - 建立信任，介绍价值主张
2. 第二封: 痛点挖掘 - 描述用户面临的问题
3. 第三封: 解决方案 - 展示产品如何解决问题
4. 第四封: 社会证明 - 案例、评价、数据
5. 第五封: 行动号召 - 限时优惠或特别offer

每封邮件之间应该有合理的等待时间（通常1-3天）。
邮件内容应该简洁有力，每封控制在150字以内。
使用HTML格式但不要包含html/body标签。

生成的steps数组应该交替包含send_email和wait步骤。`;

    // Generate structured response
    const result = await generateObject({
      model: openRouter(modelId),
      schema: automationSequenceSchema,
      system: systemPrompt,
      prompt: `请为以下产品生成一个${sequenceLength}封邮件的自动化序列：\n\n${productDescription}`,
    });

    // Add IDs to the generated steps
    const stepsWithIds = result.object.steps.map((step, index) => ({
      id: nanoid(),
      type: step.type,
      order: index,
      config: step.config,
    }));

    return Response.json({
      success: true,
      sequence: {
        name: result.object.name,
        description: result.object.description,
        steps: stepsWithIds,
        explanation: result.object.explanation,
      }
    });

  } catch (error: unknown) {
    console.error('[AI Automation API Error]:', error);
    return Response.json({
      error: error instanceof Error ? error.message : 'AI 服务调用失败'
    }, { status: 500 });
  }
}
