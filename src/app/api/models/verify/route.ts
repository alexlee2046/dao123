import OpenAI from 'openai';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    // 1. Auth Check
    const supabaseUserClient = await createServerClient();
    const { data: { user } } = await supabaseUserClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { apiKey, modelId } = await req.json();

    // Fetch API Key from system settings or env using Admin Client (Service Role)
    // We use Service Role because system_settings might be protected
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: setting } = await supabaseAdmin
      .from('system_settings')
      .select('value')
      .eq('key', 'OPENROUTER_API_KEY')
      .single();

    const systemApiKey = setting?.value || process.env.OPENROUTER_API_KEY;

    // If apiKey is provided in body (e.g. admin testing), use it. Otherwise use system key.
    // Note: Allowing users to pass 'apiKey' might be a security risk if they can use it to bypass rate limits?
    // But here it seems intended for "Test this Key" functionality in Admin UI.
    // We should probably check if the user is an ADMIN if they are trying to test a key, but for now Basic Auth is better than nothing.
    const finalApiKey = apiKey || systemApiKey;

    if (!finalApiKey) {
      return new Response(
        JSON.stringify({ error: 'System API Key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const openai = new OpenAI({
      apiKey: finalApiKey,
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
