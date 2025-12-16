import { streamText, convertToModelMessages } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createClient } from '@/lib/supabase/server';
import { getDefaultModel } from '@/lib/actions/models';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { prompt, tone, context } = await req.json();

    // 1. Get API Key from DB or environment
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
      return new Response(
        JSON.stringify({ error: 'API Key 未配置' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Get default chat model
    let modelId = 'anthropic/claude-3.5-sonnet';
    const defaultModel = await getDefaultModel('chat');
    if (defaultModel) {
      modelId = defaultModel.id;
    }

    // 3. Create OpenRouter client
    const openRouter = createOpenAI({
      apiKey: apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      name: 'openrouter',
      headers: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://www.dao123.me',
        'X-Title': 'dao123',
      }
    });

    const systemPrompt = `You are an expert email marketing copywriter. 
Your goal is to write high-converting email content based on the user's request.

Tone: ${tone || 'Professional'}
Context: ${context || 'General marketing email'}

Rules:
1. Write the subject line (labeled "Subject:") and the body.
2. Keep it concise and engaging.
3. Use HTML format for the body (p, br, strong, etc.) but do NOT wrap in <html> or <body> tags. Just the inner content.
`;

    // 4. Stream response
    const result = streamText({
      model: openRouter(modelId),
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    return result.toUIMessageStreamResponse();

  } catch (error: unknown) {
    console.error('[AI Email API Error]:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'AI 服务调用失败'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
