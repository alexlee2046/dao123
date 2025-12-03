import { OpenAI } from 'openai';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { apiKey, modelId } = await req.json();

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: '缺少 OpenRouter API Key' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const openai = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://dao123.app',
        'X-Title': 'dao123',
      },
    });

    if (modelId) {
      try {
        const detail = await openai.models.retrieve(modelId);
        return new Response(
          JSON.stringify({ ok: true, exists: true, model: detail }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (e: unknown) {
        const list = await openai.models.list();
        const exists = Array.isArray(list?.data)
          ? list.data.some((m: { id: string }) => m.id === modelId)
          : false;
        const message = e instanceof Error ? e.message : '模型不可用';
        return new Response(
          JSON.stringify({ ok: false, exists, error: message }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const models = await openai.models.list();
    return new Response(
      JSON.stringify({ ok: true, count: models?.data?.length || 0, models: models?.data || [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '模型验证失败';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
