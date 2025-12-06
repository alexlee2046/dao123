'use server';

import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { ComponentSchema, ComponentNode } from '@/lib/ai/schemas';
import { convertToCraftJson } from '@/lib/ai/transformer';
import { calculateCost, calculateUserCost, getEffectiveTier } from '@/lib/pricing';
import { createClient } from '@/lib/supabase/server';
import { deductCredits } from '@/lib/actions/credits';

// Initialize providers
function getProvider(modelName: string, apiKey?: string) {
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

        // Resolve API key (User key -> DB key -> Env)
        let resolvedApiKey = apiKey;
        if (!resolvedApiKey) {
            const supabase = await createClient();
            try {
                const { data: dbSetting } = await supabase
                    .from('system_settings')
                    .select('value')
                    .eq('key', 'OPENROUTER_API_KEY')
                    .single();
                if (dbSetting?.value) {
                    resolvedApiKey = dbSetting.value as string;
                }
            } catch {}
            if (!resolvedApiKey) {
                resolvedApiKey = process.env.OPENROUTER_API_KEY as string | undefined;
            }
        }

        // Friendly error if key is missing
        if (!resolvedApiKey) {
            return { success: false, error: `OpenRouter API Key 未配置。请在设置中添加，或在本次操作中传入个人 API Key。` };
        }

        const systemPrompt = `
        You are an expert React Component Builder using Craft.js.
        Your task is to convert the provided HTML/Tailwind code into a semantic Component Tree for our visual builder.

        Goal: 
        - Analyze the HTML structure and map it to the most appropriate components.
        - Use a HYBRID APPROACH:
          1. **High-Level Mode**: Use strict components like BuilderHero, BuilderNavbar, BuilderCard for standard sections. This ensures ease of editing.
          2. **Atomic Mode**: Use BuilderContainer (div), BuilderRow, BuilderColumn, BuilderText, BuilderImage with Tailwind classes (\`className\`) to build COMPLETELY CUSTOM layouts if the standard components don't fit.
        - Preserve all text content, images, and essential styling (converted to props).

        Available Components & Props:
        - BuilderContainer: { className, children } (Default wrapper, use for generic divs. Can use ANY Tailwind class for background, spacing, border, etc.)
        - BuilderText: { text, tag (h1-h6, p, span), className, animation }
        - BuilderButton: { text, href, variant (default, outline, ghost, link), size, className, animation }
        - BuilderImage: { src, alt, objectFit, className, animation }
        - BuilderHero: { title, subtitle, description, buttonText, buttonHref, secondaryButtonText, secondaryButtonHref, className }
        - BuilderCard: { title, description, buttonText, buttonHref, imageSrc, variant, className }
        - BuilderNavbar: { logoText, items: [{label, href}], ctaText, ctaHref, variant, className }
        - BuilderFooter: { logoText, description, footerColumns: [{title, links: [{label, href}]}], className }
        - BuilderRow: { gap, justify, align, wrap, className, children } (Flex row)
        - BuilderColumn: { gap, justify, align, className, children } (Flex col)
        - BuilderGrid: { columns, gap, className, children } (Grid layouts)
        - BuilderLink: { text, href, target, className }
        - BuilderVideo: { src, className }
        - BuilderDivider: { orientation, className }
        - CustomHTML: { code, className } (Only use as last resort for complex SVGs or scripts)

        Rules:
        1. **Prioritize High-Level Components** (Hero, Navbar, Footer) when the design matches standard patterns.
        2. **Use Atomic Components** (Container, Row, Column) for unique layouts. Do NOT force a unique design into a restrictive component (e.g. don't try to make a complex feature grid using just BuilderCard if it needs custom icons/layout). Build it manually with atomic components instead.
        3. **Tailwind Classes**: You have FULL FREEDOM to use any Tailwind class in \`className\` prop for \`BuilderContainer\`, \`BuilderText\`, etc. Use this for gradients, shadows, complex positioning, etc.
        4. **Animations**: You can add animations to atoms using the \`animation\` prop (e.g. { type: 'fadeInUp', duration: 0.5, delay: 0.2 }).
        5. Return a SINGLE ComponentNode that wraps the entire content.
        `;

        const { object } = await generateObject({
            model: getProvider(model, resolvedApiKey),
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
