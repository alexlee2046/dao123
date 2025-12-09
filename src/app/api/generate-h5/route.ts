import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deductCredits } from '@/lib/actions/credits';
import { calculateCost, calculateUserCost, getEffectiveTier } from '@/lib/pricing';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
    try {
        const { prompt, model = 'google/gemini-2.0-flash-exp' } = await req.json();

        // 1. Authenticate
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Cost Check
        const { data: profile } = await supabase
            .from('profiles')
            .select('membership_tier, membership_expires_at, credits')
            .eq('id', user.id)
            .single();

        const effectiveTier = getEffectiveTier(profile || {});
        // Use a fixed cost for H5 generation or dynamic based on model
        // Using 'h5' type we defined in pricing.ts
        const baseCost = calculateCost('h5', model);
        const actualCost = calculateUserCost(baseCost, model, effectiveTier);

        if ((profile?.credits || 0) < actualCost) {
            return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
        }

        // 3. Setup AI
        // Fetch API Key (reuse logic from other routes, simplified here)
        let apiKey = process.env.OPENROUTER_API_KEY;
        const { data: dbSetting } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'OPENROUTER_API_KEY')
            .single();
        if (dbSetting?.value) apiKey = dbSetting.value;

        if (!apiKey) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const openRouter = createOpenAI({
            apiKey: apiKey,
            baseURL: 'https://openrouter.ai/api/v1',
            headers: {
                'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://www.dao123.me',
                'X-Title': 'Dao123 H5 Builder',
            }
        });

        // 4. Generate
        // Schema definition for H5 Page
        const schema = z.object({
            background: z.string().describe('CSS background value, e.g. "#ffffff" or "linear-gradient(...)"'),
            elements: z.array(z.object({
                type: z.enum(['text', 'image', 'button']),
                content: z.string().describe('Text content or Image URL'),
                style: z.string().describe('CSS style string for the element. position:absolute is recommended for free layout.')
            })).describe('List of elements on the page')
        });

        const result = await generateObject({
            model: openRouter(model),
            schema: schema,
            system: `You are an expert H5 mobile page designer. 
            Create a beautiful, modern, and high-conversion mobile page design based on the user's request.
            - Use absolute positioning (left, top, width, height) in styles to create a structured layout.
            - Screen size is typically 375x667px.
            - For images, use unsplash placeholder URLs if needed (e.g. source.unsplash.com/random/...).
            - Ensure text has appropriate font-size, color, and line-height.`,
            prompt: prompt
        });

        // 5. Deduct Credits
        if (actualCost > 0) {
            try {
                await deductCredits(actualCost, `Generated H5 Page (${model})`);
            } catch (e) {
                console.error('Credit deduction failed', e);
                // Don't fail the request if deduction fails, but log it
            }
        }

        return NextResponse.json({ page: result.object });

    } catch (error: any) {
        console.error('H5 Generation Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
