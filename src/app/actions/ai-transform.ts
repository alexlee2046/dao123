'use server';

import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { ComponentSchema, ComponentNode } from '@/lib/ai/schemas';
import { convertToCraftJson } from '@/lib/ai/transformer';
import { calculateCost, calculateUserCost, getEffectiveTier } from '@/lib/pricing';
import { createClient } from '@/lib/supabase/server';
import { deductCredits } from '@/lib/actions/credits';

// Initialize providers
function getProvider(modelName: string, apiKey?: string) {
    if (modelName.startsWith('google/')) {
        const cleanName = modelName.replace('google/', '');
        const google = createGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        });
        return google(cleanName);
    }

    const openRouter = createOpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: apiKey || process.env.OPENROUTER_API_KEY,
    });
    return openRouter(modelName);
}

async function deductAgentCredits(baseCost: number, model: string, description: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');

    const { data: profile } = await supabase
        .from('profiles')
        .select('membership_tier, membership_expires_at')
        .eq('id', user.id)
        .single();
    
    const effectiveTier = getEffectiveTier(profile || {});
    const actualCost = calculateUserCost(baseCost, model, effectiveTier);

    if (actualCost < 0) {
        throw new Error(`您的会员等级 (${effectiveTier === 'pro' ? '专业版' : '免费版'}) 无法使用此高级模型 (${model})，请升级会员。`);
    }
    
    if (actualCost > 0) {
        await deductCredits(actualCost, description);
    }
}

/**
 * AI Transformation: HTML to Builder JSON
 * Uses an LLM to intelligently convert raw HTML into structured Builder components.
 */
export async function convertHtmlToBuilder(html: string, model: string = 'anthropic/claude-3.5-sonnet', apiKey?: string) {
    try {
        // Deduct credits for this operation (treat as 'agent_builder' or similar cost)
        // Only deduct credits if no custom API key is provided
        if (!apiKey) {
            const cost = calculateCost('agent_builder', model); 
            await deductAgentCredits(cost, model, `AI Transformation: HTML to Builder (${model})`);
        }

        const systemPrompt = `
        You are an expert React Component Builder using Craft.js.
        Your task is to convert the provided HTML/Tailwind code into a semantic Component Tree for our visual builder.

        Goal: 
        - Analyze the HTML structure and map it to the most appropriate high-level components.
        - Do NOT just wrap everything in BuilderContainer. Use BuilderHero, BuilderCard, BuilderNavbar, etc. where appropriate.
        - Preserve all text content, images, and essential styling (converted to props).

        Available Components & Props:
        - BuilderContainer: { className, children } (Default wrapper, use for generic divs)
        - BuilderText: { text, tag (h1-h6, p, span), className }
        - BuilderButton: { text, href, variant, className }
        - BuilderImage: { src, alt, className }
        - BuilderHero: { title, description, buttonText, imageSrc, className } (Detect Hero sections)
        - BuilderCard: { title, description, buttonText, imageSrc, className } (Detect Cards)
        - BuilderNavbar: { logoText, links: [{text, href}], className } (Detect Navbars)
        - BuilderFooter: { text, className } (Detect Footers)
        - BuilderRow: { className, children } (Flex row)
        - BuilderColumn: { className, children } (Flex col)
        - BuilderGrid: { columns, gap, className, children } (Grid layouts)
        - BuilderLink: { text, href, target, className }
        - BuilderVideo: { src, className }
        - BuilderDivider: { className }
        - CustomHTML: { code, className } (Only use as last resort for complex SVGs or scripts)

        Rules:
        1. If you see a <nav>, use BuilderNavbar.
        2. If you see a hero section (large text, CTA, maybe image), use BuilderHero.
        3. If you see a grid of cards, use BuilderGrid with BuilderCard children.
        4. For standard text, use BuilderText.
        5. Extract Tailwind classes into 'className' prop.
        6. Return a SINGLE ComponentNode that wraps the entire content (usually a BuilderContainer or BuilderColumn).
        `;

        const { object } = await generateObject({
            model: getProvider(model, apiKey),
            schema: ComponentSchema,
            system: systemPrompt,
            prompt: `Convert this HTML to Builder JSON:\n\n${html.substring(0, 20000)}`, // Limit length to avoid context overflow
        });

        // Transform the ComponentNode tree into Craft.js flat JSON format
        const craftJson = convertToCraftJson(object);
        
        return { success: true, data: craftJson };

    } catch (error: any) {
        console.error('Error in convertHtmlToBuilder:', error);
        return { success: false, error: error.message || 'Failed to convert HTML' };
    }
}
