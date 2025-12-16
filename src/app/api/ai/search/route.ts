import { NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { getDefaultModel } from '@/lib/actions/models';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: '请输入查询内容' }, { status: 400 });
    }

    // 1. Get API Key
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
      console.warn('Failed to fetch API key from DB');
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key 未配置' }, { status: 500 });
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

    const systemPrompt = `You are a B2B Lead Generation expert.
User will ask to find companies based on industry, location, or description.
You must return a JSON array of suggested DOMAINS (website URLs) that match the criteria.
Return ONLY the JSON array of strings. No markdown, no explanation.
Example Input: "Find saas companies in california"
Example Output: ["salesforce.com", "oracle.com", "workday.com", "adobe.com", "intuit.com"]
`;

    // 4. Generate response
    const { text } = await generateText({
      model: openRouter(modelId),
      system: systemPrompt,
      prompt: query,
    });

    return new Response(text, { status: 200 });

  } catch (error: unknown) {
    console.error('[AI Search API Error]:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'AI 服务调用失败'
    }, { status: 500 });
  }
}
