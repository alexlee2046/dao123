import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { deductCredits } from '@/lib/actions/credits';

export async function POST(req: Request) {
    try {
        const { prompt, model, type, apiKey: userApiKey } = await req.json();
        if (!type || type !== 'image') {
            return NextResponse.json({ error: '不支持的生成类型：仅支持 image' }, { status: 400 });
        }

        // 1. Get User and Check Credits
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Get Platform API Key from DB
        let apiKey = process.env.OPENROUTER_API_KEY;

        // Try to fetch from DB
        const { data: dbKey } = await supabase.rpc('get_system_config', { config_key: 'OPENROUTER_API_KEY' });
        if (dbKey) {
            apiKey = dbKey;
        }

        if (userApiKey) {
            // If user provides key, we use it.
            // But we might still want to deduct credits if they are using our platform features?
            // For now, let's prioritize User Key if provided (maybe for testing), otherwise Platform Key.
            apiKey = userApiKey;
        }

        if (!apiKey) { // Changed from !apiKey && !userApiKey because apiKey now holds the final key
            return NextResponse.json({ error: 'Server configuration error: Missing API Key' }, { status: 500 });
        }


        // 3. Validate Model
        const allowedModels = [
            'openai/dall-e-3',
            'openai/gpt-image-1',
            'stabilityai/stable-diffusion-xl-beta-v2-2-2',
            'black-forest-labs/flux-1.1-pro',
            'google/gemini-3-pro-image-preview',
        ];

        let selectedModel = model;
        if (!selectedModel || !allowedModels.includes(selectedModel)) {
            selectedModel = 'openai/dall-e-3'; // Default fallback
        }

        // 4. Calculate Cost
        let cost = 10; // Base cost
        if (selectedModel.includes('flux') || selectedModel.includes('gemini')) {
            cost = 15; // Premium models
        }

        // 5. Deduct Credits
        await deductCredits(cost, `Generated ${type} with ${selectedModel}`);



        let imageBase64 = '';

        // OpenRouter Image Generation (Standardized Interface)
        // Most OpenRouter image models support the OpenAI-compatible images.generate endpoint
        // OpenRouter Image Generation via Chat Completions API
        // OpenRouter uses a unified API where image generation models are accessed via /chat/completions
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
            // 1. Check for Markdown image syntax: ![alt](url)
            const markdownMatch = content.match(/!\[.*?\]\((.*?)\)/);

            // 2. Check for raw URL (http...)
            const urlMatch = content.match(/https?:\/\/[^\s)]+/);

            let imageUrl = '';
            if (markdownMatch && markdownMatch[1]) {
                imageUrl = markdownMatch[1];
            } else if (urlMatch && urlMatch[0]) {
                imageUrl = urlMatch[0];
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
            throw new Error(`Generation failed: ${genError.message}`);
        }

        const buffer = Buffer.from(imageBase64, 'base64');
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

        const { error: uploadError } = await supabase
            .storage
            .from('assets')
            .upload(fileName, buffer, {
                contentType: 'image/png',
                upsert: false
            });

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

        // Get Public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from('assets')
            .getPublicUrl(fileName);

        // Save Asset Record
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

        if (dbError) throw new Error(dbError.message);

        return NextResponse.json(assetRecord);

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        console.error('Generation error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
