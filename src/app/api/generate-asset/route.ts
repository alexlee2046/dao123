import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { deductCredits } from '@/lib/actions/credits';
import { getModelById, getDefaultModel } from '@/lib/actions/models';
import { calculateUserCost, getEffectiveTier } from '@/lib/pricing';

export async function POST(req: Request) {
    try {
        const { prompt, model, type, apiKey: userApiKey } = await req.json();

        // Validate type
        if (!type || !['image', 'video'].includes(type)) {
            return NextResponse.json({ error: '不支持的生成类型：仅支持 image 或 video' }, { status: 400 });
        }

        // 1. Get User
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '未授权' }, { status: 401 });
        }

        // Get User Profile for Tier
        const { data: profile } = await supabase
            .from('profiles')
            .select('membership_tier, membership_expires_at, credits')
            .eq('id', user.id)
            .single();

        const effectiveTier = getEffectiveTier(profile || {});

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

        // 3. Get Model Config from Database (Dynamic!)
        let modelConfig = model ? await getModelById(model) : null;

        // If model not found or not specified, get default for this type
        if (!modelConfig) {
            modelConfig = await getDefaultModel(type as 'image' | 'video');
        }

        if (!modelConfig) {
            return NextResponse.json({
                error: `没有可用的 ${type === 'image' ? '图片' : '视频'} 生成模型，请联系管理员在后台添加。`
            }, { status: 404 });
        }

        // Verify model type matches requested type
        if (modelConfig.type !== type) {
            return NextResponse.json({
                error: `模型 ${modelConfig.name} 不支持 ${type} 生成`
            }, { status: 400 });
        }

        const selectedModel = modelConfig.id;
        const baseCost = modelConfig.cost_per_unit;

        // Calculate Actual Cost based on Tier (Pro users may get free access to is_free models)
        let actualCost = baseCost;
        if (effectiveTier === 'pro' && modelConfig.is_free) {
            actualCost = 0;
        } else {
            actualCost = calculateUserCost(baseCost, selectedModel, effectiveTier);
        }

        if (actualCost < 0) {
            return NextResponse.json({
                error: `您的会员等级 (${effectiveTier === 'pro' ? '专业版' : '免费版'}) 无法使用此高级模型，请升级会员。`
            }, { status: 403 });
        }

        // 4. Check Credits
        const currentCredits = profile?.credits || 0;

        if (currentCredits < actualCost) {
            return NextResponse.json({ error: '积分不足' }, { status: 402 });
        }

        let assetBase64 = '';
        let assetUrl = '';
        let contentType = type === 'image' ? 'image/png' : 'video/mp4';
        let fileExtension = type === 'image' ? 'png' : 'mp4';

        // 5. Generate Asset
        try {
            console.log(`Generating ${type} with model: ${selectedModel}`);

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3006",
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

            // Extract URL from content
            // 1. Check for Markdown image/video syntax: ![alt](url) or [alt](url)
            const markdownMatch = content.match(/!?\[.*?\]\((https?:\/\/[^\s)]+)\)/);

            // 2. Check for raw URL (http...)
            const urlMatch = content.match(/(https?:\/\/[^\s)]+)/);

            if (markdownMatch && markdownMatch[1]) {
                assetUrl = markdownMatch[1];
            } else if (urlMatch && urlMatch[1]) {
                assetUrl = urlMatch[1];
            } else if (content.trim().startsWith('http')) {
                assetUrl = content.trim();
            } else {
                console.error('Could not parse asset URL from content:', content);
                throw new Error("Failed to parse asset URL from response");
            }

            // Fetch the asset to convert to base64
            const assetRes = await fetch(assetUrl);
            if (!assetRes.ok) throw new Error(`Failed to download generated ${type}: ${assetRes.status}`);

            // Detect content type from response
            const responseContentType = assetRes.headers.get('content-type');
            if (responseContentType) {
                contentType = responseContentType;
                if (responseContentType.includes('jpeg') || responseContentType.includes('jpg')) {
                    fileExtension = 'jpg';
                } else if (responseContentType.includes('png')) {
                    fileExtension = 'png';
                } else if (responseContentType.includes('webp')) {
                    fileExtension = 'webp';
                } else if (responseContentType.includes('gif')) {
                    fileExtension = 'gif';
                } else if (responseContentType.includes('mp4')) {
                    fileExtension = 'mp4';
                } else if (responseContentType.includes('webm')) {
                    fileExtension = 'webm';
                }
            }

            const arrayBuffer = await assetRes.arrayBuffer();
            assetBase64 = Buffer.from(arrayBuffer).toString('base64');

        } catch (genError: any) {
            console.error('Generation Error:', genError);
            return NextResponse.json({ error: `Generation failed: ${genError.message}` }, { status: 500 });
        }

        // 6. Upload to Storage
        const buffer = Buffer.from(assetBase64, 'base64');
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

        const { error: uploadError } = await supabase
            .storage
            .from('assets')
            .upload(fileName, buffer, {
                contentType: contentType,
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
            if (actualCost > 0) {
                await deductCredits(actualCost, `Generated ${type} with ${modelConfig.name}`);
            }
        } catch (creditError) {
            // CRITICAL: If deduction fails here, we have already given the user the asset.
            console.error('CRITICAL: Credit deduction failed AFTER generation:', creditError);
        }

        // 8. Save Asset Record
        const { data: assetRecord, error: dbError } = await supabase
            .from('assets')
            .insert({
                user_id: user.id,
                url: publicUrl,
                name: prompt.substring(0, 50),
                type: type
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
