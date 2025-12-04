import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { deductCredits, getCredits } from '@/lib/actions/credits';
import { getImageModelConfig } from '@/lib/ai-config';

export async function POST(req: Request) {
    try {
        const { prompt, model, type, apiKey: userApiKey } = await req.json();
        if (!type || type !== 'image') {
            return NextResponse.json({ error: '不支持的生成类型：仅支持 image' }, { status: 400 });
        }

        // 1. Get User
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '未授权' }, { status: 401 });
        }

        // 2. Get Platform API Key from DB
        let apiKey = process.env.OPENROUTER_API_KEY;

        // Try to fetch from DB
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
            console.warn('Failed to fetch API key from DB, falling back to env:', e);
        }

        if (userApiKey) {
            // If user provides key, we use it.
            apiKey = userApiKey;
        }

        if (!apiKey) {
            return NextResponse.json({ error: '服务器配置错误：缺少 API Key' }, { status: 500 });
        }

        // 3. Validate Model & Cost
        const modelConfig = getImageModelConfig(model);
        const selectedModel = modelConfig.id;
        const cost = modelConfig.cost;

        // 4. Check Credits (Read-only check to fail fast)
        // Only check if not using own key? Usually we deduct credits for platform usage.
        // If user provides key, maybe we shouldn't deduct credits?
        // For now, let's assume we always deduct credits as per original logic,
        // unless the original logic implied something else.
        // The original logic DEDUCTED credits regardless of key source, so we keep it.

        const currentCredits = await getCredits();
        if (currentCredits < cost) {
             return NextResponse.json({ error: '积分不足' }, { status: 402 });
        }

        let imageBase64 = '';

        // 5. Generate Image
        try {
            console.log(`Generating image with model: ${selectedModel}`);

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
                    "X-Title": "Dao123 Studio",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('OpenRouter API Error:', response.status, errorData);
                throw new Error(errorData.error?.message || `OpenRouter API Error: ${response.status}`);
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;

            if (!content) {
                console.error('No content in response:', data);
                throw new Error("No content received from provider");
            }

            // Extract image URL from content
            let imageUrl = '';

            // 1. Check for Markdown image syntax: ![alt](url)
            const markdownMatch = content.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);

            // 2. Check for raw URL (http...)
            const urlMatch = content.match(/(https?:\/\/[^\s)]+)/);

            if (markdownMatch && markdownMatch[1]) {
                imageUrl = markdownMatch[1];
            } else if (urlMatch && urlMatch[1]) {
                imageUrl = urlMatch[1];
            } else if (content.trim().startsWith('http')) {
                imageUrl = content.trim();
            } else {
                console.error('Could not parse image URL from content:', content);
                throw new Error("Failed to parse image URL from response");
            }

            // Fetch the image to convert to base64
            const imgRes = await fetch(imageUrl);
            if (!imgRes.ok) throw new Error(`Failed to download generated image: ${imgRes.status}`);

            const arrayBuffer = await imgRes.arrayBuffer();
            imageBase64 = Buffer.from(arrayBuffer).toString('base64');

        } catch (genError: any) {
            console.error('Generation Error:', genError);
            return NextResponse.json({ error: `Generation failed: ${genError.message}` }, { status: 500 });
        }

        // 6. Upload to Storage
        const buffer = Buffer.from(imageBase64, 'base64');
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

        const { error: uploadError } = await supabase
            .storage
            .from('assets')
            .upload(fileName, buffer, {
                contentType: 'image/png',
                upsert: false
            });

        if (uploadError) {
             return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from('assets')
            .getPublicUrl(fileName);

        // 7. Deduct Credits (FINAL STEP)
        try {
            await deductCredits(cost, `Generated ${type} with ${selectedModel}`);
        } catch (creditError) {
            // CRITICAL: If deduction fails here, we have already given the user the image.
            // We should probably log this significantly.
            console.error('CRITICAL: Credit deduction failed AFTER generation:', creditError);
            // We still return success because the user got their image, but we might want to flag the account.
        }

        // 8. Save Asset Record
        const { data: assetRecord, error: dbError } = await supabase
            .from('assets')
            .insert({
                user_id: user.id,
                url: publicUrl,
                name: prompt.substring(0, 50),
                type: 'image'
            })
            .select()
            .single();

        if (dbError) {
            return NextResponse.json({ error: dbError.message }, { status: 500 });
        }

        return NextResponse.json(assetRecord);

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        console.error('Generation error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
