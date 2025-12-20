import { z } from 'zod';
import type { NodeDefinition, NodeContext, NodeResult } from '../../core/types';
import { createClient } from '@/lib/supabase/server';
import { getProvider } from '@/app/actions/providers';
import { generateText } from 'ai';
import { calculateCost, calculateUserCost } from '@/lib/pricing';
import { getDefaultModel } from '@/lib/actions/models';

// ============================================
// AI 模块 - AI 生成节点
// ============================================

// --- Generate Image Node ---

const generateImageInputSchema = z.object({
  prompt: z.string().min(1).describe('图片生成提示词'),
  model: z.string().optional().describe('模型 ID (默认使用系统默认模型)'),
  mode: z.enum(['text-to-image', 'image-to-image']).default('text-to-image').describe('生成模式'),
  sourceImage: z.string().optional().describe('源图片 URL (image-to-image 模式)'),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4']).optional().describe('宽高比'),
  style: z.string().optional().describe('风格提示'),
});

type GenerateImageInput = z.infer<typeof generateImageInputSchema>;

export const generateImageNode: NodeDefinition<GenerateImageInput> = {
  meta: {
    id: 'ai.generateImage',
    name: '生成图片',
    description: '使用 AI 生成图片。支持文生图和图生图模式，可指定风格和宽高比。',
    category: 'ai',
    module: 'ai',
    icon: 'Image',
    color: '#8b5cf6',
    inputSchema: generateImageInputSchema,
    outputDescription: '返回生成的图片 URL 和元数据',
    estimatedDuration: 30,
    examples: [
      {
        name: '文生图',
        config: {
          prompt: '一只可爱的柴犬在草地上奔跑，阳光明媚，专业摄影',
          aspectRatio: '16:9',
        },
      },
      {
        name: '图生图',
        config: {
          prompt: '将这张照片转换为油画风格',
          mode: 'image-to-image',
          sourceImage: '{{previousStep.imageUrl}}',
        },
      },
    ],
  },

  async execute(input: GenerateImageInput, context: NodeContext): Promise<NodeResult> {
    const supabase = await createClient();

    // 获取模型配置
    const modelId = input.model || (await getDefaultModel('image'))?.id || 'openai/dall-e-3';

    // 计算成本
    const baseCost = calculateCost('image', modelId);

    // 获取用户 tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier, credits')
      .eq('id', context.userId)
      .single();

    const tier = profile?.tier || 'free';
    const finalCost = calculateUserCost(baseCost, modelId, tier);

    // 检查余额
    if (profile && profile.credits < finalCost) {
      return {
        success: false,
        error: `余额不足。需要 ${finalCost} 积分，当前余额 ${profile.credits}`,
      };
    }

    try {
      // 构建提示词
      let fullPrompt = input.prompt;
      if (input.style) {
        fullPrompt = `${input.prompt}, ${input.style}`;
      }
      if (input.aspectRatio) {
        fullPrompt = `${fullPrompt}, aspect ratio ${input.aspectRatio}`;
      }

      // 构建消息内容
      const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
        { type: 'text', text: fullPrompt },
      ];

      if (input.mode === 'image-to-image' && input.sourceImage) {
        content.push({
          type: 'image_url',
          image_url: { url: input.sourceImage },
        });
      }

      // 调用 AI API
      const model = await getProvider(modelId);

      const response = await generateText({
        model,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: [{ role: 'user', content: content as any }],
      });

      // 解析响应获取图片 URL
      let imageUrl: string | null = null;
      const text = response.text || '';

      // 尝试从响应中提取 base64 或 URL
      const base64Match = text.match(/data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+/);
      const urlMatch = text.match(/https?:\/\/[^\s"'<>]+\.(png|jpg|jpeg|webp|gif)/i);

      if (base64Match) {
        // 上传 base64 图片到 Supabase Storage
        const base64Data = base64Match[0];
        const mimeMatch = base64Data.match(/data:(image\/[a-z]+);base64,/);
        const mimeType = mimeMatch?.[1] || 'image/png';
        const ext = mimeType.split('/')[1];
        const base64Content = base64Data.replace(/data:image\/[a-z]+;base64,/, '');
        const buffer = Buffer.from(base64Content, 'base64');

        const fileName = `workflow/${context.workflowId || 'manual'}/${Date.now()}.${ext}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('assets')
          .upload(fileName, buffer, { contentType: mimeType });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage.from('assets').getPublicUrl(fileName);
          imageUrl = urlData.publicUrl;
        }
      } else if (urlMatch) {
        imageUrl = urlMatch[0];
      }

      if (!imageUrl) {
        return {
          success: false,
          error: '无法从响应中提取图片',
        };
      }

      // 扣除积分
      if (finalCost > 0) {
        await supabase.rpc('deduct_credits', {
          user_id: context.userId,
          amount: finalCost,
          description: `AI 生成图片: ${modelId}`,
        });
      }

      // 保存资产记录
      const { data: asset } = await supabase
        .from('assets')
        .insert({
          user_id: context.userId,
          type: 'image',
          url: imageUrl,
          name: `AI Generated - ${input.prompt.slice(0, 50)}`,
          metadata: {
            prompt: input.prompt,
            model: modelId,
            mode: input.mode,
            workflowId: context.workflowId,
          },
        })
        .select('id')
        .single();

      return {
        success: true,
        data: {
          imageUrl,
          assetId: asset?.id,
          model: modelId,
          cost: finalCost,
        },
        output: {
          imageUrl,
          assetId: asset?.id,
        },
        artifacts: [
          {
            type: 'image',
            url: imageUrl,
            name: `Generated Image`,
            metadata: { prompt: input.prompt, model: modelId },
          },
        ],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

// --- Generate Video Node ---

const generateVideoInputSchema = z.object({
  prompt: z.string().min(1).describe('视频生成提示词'),
  model: z.string().optional().describe('模型 ID (默认使用系统默认模型)'),
  duration: z.number().min(1).max(60).default(5).describe('视频时长 (秒)'),
  sourceImage: z.string().optional().describe('起始图片 URL (用于 image-to-video)'),
  aspectRatio: z.enum(['16:9', '9:16', '1:1']).default('16:9').describe('宽高比'),
});

type GenerateVideoInput = z.infer<typeof generateVideoInputSchema>;

export const generateVideoNode: NodeDefinition<GenerateVideoInput> = {
  meta: {
    id: 'ai.generateVideo',
    name: '生成视频',
    description: '使用 AI 生成短视频。支持文生视频和图生视频模式。',
    category: 'ai',
    module: 'ai',
    icon: 'Video',
    color: '#ec4899',
    inputSchema: generateVideoInputSchema,
    outputDescription: '返回生成的视频 URL 和元数据',
    estimatedDuration: 120,
    examples: [
      {
        name: '文生视频',
        config: {
          prompt: '城市日出延时摄影，高楼大厦，金色阳光',
          duration: 5,
          aspectRatio: '16:9',
        },
      },
      {
        name: '图生视频',
        config: {
          prompt: '让这张图片中的云朵缓慢飘动',
          sourceImage: '{{previousStep.imageUrl}}',
          duration: 5,
        },
      },
    ],
  },

  async execute(input: GenerateVideoInput, context: NodeContext): Promise<NodeResult> {
    const supabase = await createClient();

    // 获取模型配置
    const modelId = input.model || (await getDefaultModel('video'))?.id || 'luma/dream-machine';

    // 计算成本
    const baseCost = calculateCost('video', modelId);

    // 获取用户 tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier, credits')
      .eq('id', context.userId)
      .single();

    const tier = profile?.tier || 'free';
    const finalCost = calculateUserCost(baseCost, modelId, tier);

    // 检查余额
    if (profile && profile.credits < finalCost) {
      return {
        success: false,
        error: `余额不足。需要 ${finalCost} 积分，当前余额 ${profile.credits}`,
      };
    }

    try {
      // 构建提示词
      const fullPrompt = `${input.prompt}. Duration: ${input.duration} seconds, aspect ratio: ${input.aspectRatio}`;

      // 构建消息内容
      const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
        { type: 'text', text: fullPrompt },
      ];

      if (input.sourceImage) {
        content.push({
          type: 'image_url',
          image_url: { url: input.sourceImage },
        });
      }

      // 调用 AI API
      const model = await getProvider(modelId);

      const response = await generateText({
        model,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: [{ role: 'user', content: content as any }],
      });

      // 解析响应获取视频 URL
      let videoUrl: string | null = null;
      const text = response.text || '';

      // 尝试从响应中提取视频 URL
      const urlMatch = text.match(/https?:\/\/[^\s"'<>]+\.(mp4|webm|mov)/i);
      if (urlMatch) {
        videoUrl = urlMatch[0];
      }

      if (!videoUrl) {
        return {
          success: false,
          error: '无法从响应中提取视频 URL',
        };
      }

      // 扣除积分
      if (finalCost > 0) {
        await supabase.rpc('deduct_credits', {
          user_id: context.userId,
          amount: finalCost,
          description: `AI 生成视频: ${modelId}`,
        });
      }

      // 保存资产记录
      const { data: asset } = await supabase
        .from('assets')
        .insert({
          user_id: context.userId,
          type: 'video',
          url: videoUrl,
          name: `AI Generated Video - ${input.prompt.slice(0, 50)}`,
          metadata: {
            prompt: input.prompt,
            model: modelId,
            duration: input.duration,
            workflowId: context.workflowId,
          },
        })
        .select('id')
        .single();

      return {
        success: true,
        data: {
          videoUrl,
          assetId: asset?.id,
          model: modelId,
          cost: finalCost,
          duration: input.duration,
        },
        output: {
          videoUrl,
          assetId: asset?.id,
        },
        artifacts: [
          {
            type: 'video',
            url: videoUrl,
            name: `Generated Video`,
            metadata: { prompt: input.prompt, model: modelId, duration: input.duration },
          },
        ],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

// --- Generate Text Node ---

const generateTextInputSchema = z.object({
  prompt: z.string().min(1).describe('文本生成提示词'),
  model: z.string().optional().describe('模型 ID'),
  systemPrompt: z.string().optional().describe('系统提示词'),
  maxTokens: z.number().min(1).max(4096).default(1024).describe('最大输出 token 数'),
  temperature: z.number().min(0).max(2).default(0.7).describe('创意程度 (0-2)'),
  format: z.enum(['text', 'json', 'html', 'markdown']).default('text').describe('输出格式'),
  jsonSchema: z.record(z.unknown()).optional().describe('JSON 输出的 schema (format=json 时)'),
});

type GenerateTextInput = z.infer<typeof generateTextInputSchema>;

export const generateTextNode: NodeDefinition<GenerateTextInput> = {
  meta: {
    id: 'ai.generateText',
    name: '生成文本',
    description: '使用 AI 生成文本内容。支持多种格式输出，可自定义系统提示词。',
    category: 'ai',
    module: 'ai',
    icon: 'FileText',
    color: '#3b82f6',
    inputSchema: generateTextInputSchema,
    outputDescription: '返回生成的文本内容',
    estimatedDuration: 10,
    examples: [
      {
        name: '生成邮件',
        config: {
          prompt: '写一封欢迎新用户的邮件，产品是一个项目管理工具',
          systemPrompt: '你是一位专业的营销文案专家',
          format: 'html',
        },
      },
      {
        name: '生成 JSON',
        config: {
          prompt: '生成 5 个产品创意',
          format: 'json',
          jsonSchema: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
              },
            },
          },
        },
      },
    ],
  },

  async execute(input: GenerateTextInput, context: NodeContext): Promise<NodeResult> {
    const supabase = await createClient();

    // 获取模型配置
    const modelId = input.model || 'anthropic/claude-3.5-sonnet';

    // 计算成本
    const baseCost = calculateCost('chat', modelId);

    // 获取用户 tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier, credits')
      .eq('id', context.userId)
      .single();

    const tier = profile?.tier || 'free';
    const finalCost = calculateUserCost(baseCost, modelId, tier);

    // 检查余额
    if (profile && profile.credits < finalCost) {
      return {
        success: false,
        error: `余额不足。需要 ${finalCost} 积分，当前余额 ${profile.credits}`,
      };
    }

    try {
      // 调用 AI API
      const model = await getProvider(modelId);

      const messages: Array<{ role: 'system' | 'user'; content: string }> = [];

      if (input.systemPrompt) {
        messages.push({ role: 'system', content: input.systemPrompt });
      }

      // 添加格式化提示
      let formattedPrompt = input.prompt;
      if (input.format === 'json') {
        formattedPrompt = `${input.prompt}\n\n请以 JSON 格式输出。`;
        if (input.jsonSchema) {
          formattedPrompt += `\n\nJSON Schema: ${JSON.stringify(input.jsonSchema)}`;
        }
      } else if (input.format === 'html') {
        formattedPrompt = `${input.prompt}\n\n请以 HTML 格式输出。`;
      } else if (input.format === 'markdown') {
        formattedPrompt = `${input.prompt}\n\n请以 Markdown 格式输出。`;
      }

      messages.push({ role: 'user', content: formattedPrompt });

      const response = await generateText({
        model,
        messages,
        maxOutputTokens: input.maxTokens,
        temperature: input.temperature,
      });

      const text = response.text || '';

      // 扣除积分
      if (finalCost > 0) {
        await supabase.rpc('deduct_credits', {
          user_id: context.userId,
          amount: finalCost,
          description: `AI 生成文本: ${modelId}`,
        });
      }

      // 如果是 JSON 格式，尝试解析
      let parsedJson: unknown = null;
      if (input.format === 'json') {
        try {
          // 尝试提取 JSON
          const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
          if (jsonMatch) {
            parsedJson = JSON.parse(jsonMatch[0]);
          }
        } catch {
          // JSON 解析失败，返回原始文本
        }
      }

      return {
        success: true,
        data: {
          text,
          json: parsedJson,
          model: modelId,
          cost: finalCost,
          usage: response.usage,
        },
        output: {
          text,
          json: parsedJson,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

// --- Generate Email Node (specialized) ---

const generateEmailInputSchema = z.object({
  purpose: z.string().min(1).describe('邮件目的 (如: 欢迎新用户、促销活动)'),
  product: z.string().optional().describe('产品/服务描述'),
  audience: z.string().optional().describe('目标受众'),
  tone: z.enum(['professional', 'friendly', 'casual', 'urgent']).default('professional').describe('语气'),
  language: z.enum(['zh', 'en']).default('zh').describe('语言'),
  model: z.string().optional().describe('模型 ID'),
});

type GenerateEmailInput = z.infer<typeof generateEmailInputSchema>;

export const generateEmailNode: NodeDefinition<GenerateEmailInput> = {
  meta: {
    id: 'ai.generateEmail',
    name: '生成邮件',
    description: '使用 AI 生成营销邮件。自动生成主题行和 HTML 正文。',
    category: 'ai',
    module: 'ai',
    icon: 'Mail',
    color: '#f59e0b',
    inputSchema: generateEmailInputSchema,
    outputDescription: '返回邮件主题和 HTML 正文',
    estimatedDuration: 15,
    examples: [
      {
        name: '欢迎邮件',
        config: {
          purpose: '欢迎新注册用户',
          product: 'SaaS 项目管理工具',
          tone: 'friendly',
        },
      },
    ],
  },

  async execute(input: GenerateEmailInput, context: NodeContext): Promise<NodeResult> {
    const supabase = await createClient();

    const modelId = input.model || 'anthropic/claude-3.5-sonnet';
    const baseCost = calculateCost('chat', modelId);

    const { data: profile } = await supabase
      .from('profiles')
      .select('tier, credits')
      .eq('id', context.userId)
      .single();

    const tier = profile?.tier || 'free';
    const finalCost = calculateUserCost(baseCost, modelId, tier);

    if (profile && profile.credits < finalCost) {
      return {
        success: false,
        error: `余额不足。需要 ${finalCost} 积分，当前余额 ${profile.credits}`,
      };
    }

    try {
      const model = await getProvider(modelId);

      const toneMap = {
        professional: '专业正式',
        friendly: '友好亲切',
        casual: '轻松随意',
        urgent: '紧迫感',
      };

      const systemPrompt = `你是一位专业的营销邮件撰写专家。
请根据用户需求撰写高转化率的营销邮件。

输出格式:
Subject: [邮件主题]

[HTML 格式的邮件正文]

要求:
- 邮件主题简洁有吸引力
- 正文使用 HTML 格式，支持样式
- 包含明确的行动号召 (CTA)
- 语气: ${toneMap[input.tone]}
- 语言: ${input.language === 'zh' ? '中文' : 'English'}`;

      const prompt = `邮件目的: ${input.purpose}
${input.product ? `产品/服务: ${input.product}` : ''}
${input.audience ? `目标受众: ${input.audience}` : ''}`;

      const response = await generateText({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        maxOutputTokens: 2048,
        temperature: 0.7,
      });

      const text = response.text || '';

      // 解析主题和正文
      const subjectMatch = text.match(/Subject:\s*(.+?)(?:\n|$)/i);
      const subject = subjectMatch?.[1]?.trim() || '无主题';
      const html = text.replace(/Subject:\s*.+?(?:\n|$)/i, '').trim();

      // 扣除积分
      if (finalCost > 0) {
        await supabase.rpc('deduct_credits', {
          user_id: context.userId,
          amount: finalCost,
          description: `AI 生成邮件: ${modelId}`,
        });
      }

      return {
        success: true,
        data: {
          subject,
          html,
          model: modelId,
          cost: finalCost,
        },
        output: {
          subject,
          html,
          emailContent: { subject, html },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

// --- 导出所有节点 ---

export const aiNodes = [
  generateImageNode,
  generateVideoNode,
  generateTextNode,
  generateEmailNode,
];
