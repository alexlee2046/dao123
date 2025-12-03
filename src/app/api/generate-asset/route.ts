import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { prompt, model, apiKey, type } = await req.json();

        if (!apiKey) {
            return NextResponse.json({ error: 'API Key is required' }, { status: 401 });
        }

        const openai = new OpenAI({
            apiKey: apiKey,
            baseURL: 'https://openrouter.ai/api/v1',
        });

        // 1. Generate Asset
        let imageUrl = '';

        if (type === 'image') {
            const response = await openai.images.generate({
                model: model,
                prompt: prompt,
                n: 1,
                size: '1024x1024',
            });
            imageUrl = response.data[0].url || '';
        } else {
            // Video generation is less standardized. 
            // For now, we'll try the same endpoint or a chat completion if it's a video model that returns a URL.
            // But typically video generation via API is async or different.
            // We will treat it as image generation for now or throw error if not supported.
            return NextResponse.json({ error: 'Video generation is not yet fully supported via this standard endpoint.' }, { status: 400 });
        }

        if (!imageUrl) {
            throw new Error('Failed to generate image URL');
        }

        // 2. Download the image
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) throw new Error('Failed to download generated image');
        const imageBuffer = await imageResponse.arrayBuffer();

        // 3. Upload to Supabase
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
        }

        const fileName = `generated-${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage
            .from('assets')
            .upload(fileName, imageBuffer, {
                contentType: 'image/png',
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('assets')
            .getPublicUrl(fileName);

        // 4. Save to DB
        const { data: asset, error: dbError } = await supabase
            .from('assets')
            .insert({
                user_id: user.id,
                url: publicUrl,
                name: prompt.slice(0, 50) + (prompt.length > 50 ? '...' : ''),
                type: 'image',
            })
            .select()
            .single();

        if (dbError) throw dbError;

        return NextResponse.json(asset);

    } catch (error: any) {
        console.error('Generation error:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate asset' }, { status: 500 });
    }
}
