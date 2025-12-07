import { streamText, convertToModelMessages } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createClient } from '@/lib/supabase/server';
import { calculateCost, calculateUserCost, getEffectiveTier } from '@/lib/pricing';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { messages, model, currentHtml, mode = 'direct' } = await req.json();

        // 1. Authenticate User
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new Response(
                JSON.stringify({ error: '未授权' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }


        // 2. Calculate Cost
        // If modifying existing code (large context), we might want to adjust cost logic here in the future.
        const baseCost = calculateCost('chat', model || 'anthropic/claude-3.5-sonnet');
        console.log(`[Chat API] User: ${user.id}, Model: ${model}, Base Cost: ${baseCost}, Mode: ${mode}`);

        // 3. Check and Deduct Credits (using Admin Client for security)
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        let adminSupabase = null;
        let profile = null;

        if (serviceRoleKey) {
            adminSupabase = createSupabaseClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                serviceRoleKey
            );

            // Get current credits
            const { data: p, error: profileError } = await adminSupabase
                .from('profiles')
                .select('credits, membership_tier, membership_expires_at')
                .eq('id', user.id)
                .single();

            if (profileError) {
                console.error('[Chat API] Profile fetch error:', profileError);
                return new Response(
                    JSON.stringify({
                        error: '无法获取用户信息',
                        details: profileError.message
                    }),
                    { status: 500, headers: { 'Content-Type': 'application/json' } }
                );
            }
            profile = p;
        } else {
            console.warn('[Chat API] SUPABASE_SERVICE_ROLE_KEY missing. Skipping credit checks.');
        }

        if (profile) {
            const effectiveTier = getEffectiveTier(profile);
            const actualCost = calculateUserCost(baseCost, model || 'anthropic/claude-3.5-sonnet', effectiveTier);
            console.log(`[Chat API] User Tier: ${effectiveTier} (Raw: ${profile.membership_tier}), Actual Cost: ${actualCost}`);

            if (actualCost < 0) {
                return new Response(
                    JSON.stringify({
                        error: `您的会员等级 (${effectiveTier === 'pro' ? '专业版' : '免费版'}) 无法使用此高级模型，请升级会员。`
                    }),
                    { status: 403, headers: { 'Content-Type': 'application/json' } }
                );
            }

            console.log(`[Chat API] User credits: ${profile.credits}, Required: ${actualCost}`);

            if (profile.credits < actualCost) {
                return new Response(
                    JSON.stringify({
                        error: `积分不足 (当前: ${profile.credits}, 需要: ${actualCost})`
                    }),
                    { status: 402, headers: { 'Content-Type': 'application/json' } }
                );
            }

            // Deduct credits
            if (adminSupabase) {
                const { error: updateError } = await adminSupabase
                    .from('profiles')
                    .update({ credits: profile.credits - actualCost })
                    .eq('id', user.id);

                if (updateError) {
                    console.error('[Chat API] Credit deduction failed:', updateError);
                    return new Response(
                        JSON.stringify({
                            error: '扣除积分失败',
                            details: updateError.message
                        }),
                        { status: 500, headers: { 'Content-Type': 'application/json' } }
                    );
                }
                console.log(`[Chat API] Credits deducted successfully. New balance: ${profile.credits - actualCost}`);

                // Record transaction (async, don't block)
                if (actualCost > 0) {
                    adminSupabase.from('transactions').insert({
                        user_id: user.id,
                        amount: -actualCost,
                        type: 'usage',
                        description: `Chat generation (${model})`
                    }).then(({ error }) => {
                        if (error) console.error('Failed to record transaction:', error);
                    });
                }
            }
        } else if (serviceRoleKey) {
            // profile undefined but key exists means profile wasn't found in DB
            console.error('[Chat API] Profile not found for user:', user.id);
            return new Response(
                JSON.stringify({ error: '用户配置不存在，请联系管理员' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // 4. Get API Key
        let apiKey = process.env.OPENROUTER_API_KEY;

        if (adminSupabase) {
            const { data: setting, error: settingError } = await adminSupabase
                .from('system_settings')
                .select('value')
                .eq('key', 'OPENROUTER_API_KEY')
                .single();

            if (settingError && settingError.code !== 'PGRST116') {
                console.error('[Chat API] Error fetching API key from database:', settingError);
            }

            if (setting?.value) apiKey = setting.value;
        }

        console.log('[Chat API] API Key available:', !!apiKey);

        if (!apiKey) {
            console.error('[Chat API] No API key configured in database or environment');
            return new Response(
                JSON.stringify({ error: 'OpenRouter API密钥未配置，请在管理员设置中配置' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        console.log('[Chat API] Initializing OpenRouter client...');

        const openRouter = createOpenAI({
            apiKey: apiKey,
            baseURL: 'https://openrouter.ai/api/v1',
            name: 'openrouter',
            headers: {
                'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://www.dao123.me',
                'X-Title': 'dao123',
            }
        });

        let systemPrompt = '';

        if (mode === 'guide') {
            systemPrompt = `你是一个专业的网站需求分析师。你的目标是通过对话引导用户明确他们的网站需求，并最终总结出一份详细的需求文档。

规则：
1. 像人一样自然地与用户交谈，不要一次性问太多问题。
2. 引导用户思考网站的目标、受众、风格、功能板块等。
3. 当你认为已经收集到足够的信息时，或者用户要求总结时，请输出一份"需求总结"。
4. "需求总结"必须包含：网站类型、目标用户、视觉风格、主要页面/板块、特殊功能需求。
5. 在对话过程中，**绝对不要**生成 HTML 代码。你的任务只是分析和总结。
6. 最后询问用户是否确认这个方案。如果确认，告诉用户你可以开始构建了。`;
        } else {
            systemPrompt = `你是一个专业的网页设计师。你的任务是根据用户的需求设计并构建精美的网站。

规则：
1. 必须生成完整的 HTML 文档，包含 <!DOCTYPE html>, <html>, <head>, <body> 标签
2. 在 <head> 中必须包含 <script src="https://cdn.tailwindcss.com"></script>
3. 使用现代化的设计风格，色彩丰富，布局美观，注重用户体验
4. 如果用户提到了上传的素材，请在设计中合理使用这些素材
5. 直接输出 HTML 代码，不要添加 markdown 代码块标记
6. 确保代码可以直接在浏览器中运行
7. 支持多页面生成。如果你生成多个页面，请在每个页面代码前加上 "<!-- page: filename.html -->" 标记。
   例如：
   <!-- page: index.html -->
   <!DOCTYPE html><html>...</html>
   <!-- page: about.html -->
   <!DOCTYPE html><html>...</html>
8. 如果只生成一个页面，默认为 index.html，不需要加标记。
9. 页面之间的链接请使用相对路径，例如 href="about.html"。不要使用 #hash 导航，除非是页面内跳转。`;
        }

        if (currentHtml) {
            systemPrompt += `\n\n当前代码状态:\n\`\`\`html\n${currentHtml}\n\`\`\`\n\n用户想要修改上述代码。请基于用户的要求和当前代码，返回修改后的完整 HTML 代码。请保持原有代码结构，仅根据用户需求进行修改。`;
        }

        console.log('[Chat API] Calling OpenRouter API with model:', model || 'anthropic/claude-3.5-sonnet');
        console.log('[Chat API] Message count:', messages.length);

        // 清洗消息：确保 content 是字符串，如果前端传来了数组（旧版或错误格式），尝试修复
        const cleanMessages = messages.map((m: any) => {
            if (Array.isArray(m.content)) {
                // 如果 content 是数组，说明可能是 parts 结构被错误地放在了 content 字段
                // 或者这是新版 SDK 的某种内部格式
                // 我们将其转换为空字符串，并确保 parts 存在（如果原数组是 parts）
                return {
                    ...m,
                    content: m.content.map((p: any) => p.text || '').join(''), // 尝试提取文本
                    // 如果需要保留 parts，可以尝试: parts: m.content
                };
            }
            return m;
        });

        const result = streamText({
            model: openRouter(model || 'anthropic/claude-3.5-sonnet'),
            system: systemPrompt,
            messages: convertToModelMessages(cleanMessages),
        });

        console.log('[Chat API] OpenRouter API call successful, streaming response...');
        // 使用 toUIMessageStreamResponse 以兼容新版 @ai-sdk/react useChat
        return result.toUIMessageStreamResponse();

    } catch (error: unknown) {
        console.error('=== AI API Error Details ===');
        console.error('Error type:', error?.constructor?.name);
        console.error('Error message:', error instanceof Error ? error.message : error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

        let statusCode = 500;
        let errorMessage = 'AI 服务调用失败';

        if (error instanceof Error) {
            errorMessage = error.message;

            // Check for specific error types
            if (error.message.includes('Unauthorized') || error.message.includes('401')) {
                statusCode = 401;
                errorMessage = 'API密钥无效或未配置';
            } else if (error.message.includes('402') || error.message.includes('credits')) {
                statusCode = 402;
                errorMessage = '积分不足，请充值';
            } else if (error.message.includes('model')) {
                errorMessage = '模型配置错误: ' + error.message;
            }
        }

        return new Response(
            JSON.stringify({
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
            }),
            { status: statusCode, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
