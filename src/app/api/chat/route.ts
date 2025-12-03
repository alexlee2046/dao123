import { OpenAI } from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { messages, apiKey, model } = await req.json();

        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: '请先在设置页面配置 OpenRouter API Key' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const openai = new OpenAI({
            apiKey: apiKey,
            baseURL: 'https://openrouter.ai/api/v1',
            defaultHeaders: {
                'HTTP-Referer': 'https://dao123.app',
                'X-Title': 'dao123',
            }
        });

        const systemPrompt = `你是一个专业的网页设计助手。你的任务是根据用户的需求生成完整的 HTML 代码。

规则：
1. 必须生成完整的 HTML 文档，包含 <!DOCTYPE html>, <html>, <head>, <body> 标签
2. 在 <head> 中必须包含 <script src="https://cdn.tailwindcss.com"></script>
3. 使用现代化的设计风格，色彩丰富，布局美观
4. 如果用户提到了上传的素材，请在代码中使用这些素材的 URL
5. 直接输出 HTML 代码，不要添加 markdown 代码块标记
6. 确保代码可以直接在浏览器中运行`;

        const response = await openai.chat.completions.create({
            model: model || 'anthropic/claude-3.5-sonnet',
            stream: true,
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages
            ],
        });

        const stream = OpenAIStream(response);
        return new StreamingTextResponse(stream);

    } catch (error: unknown) {
        console.error('AI API Error:', error);
        const message = error instanceof Error ? error.message : 'AI 服务调用失败';
        return new Response(
            JSON.stringify({ error: message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
