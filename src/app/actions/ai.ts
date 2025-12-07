'use server';

import { generateObject, streamObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { DesignSystemSchema, SitePlanSchema, ComponentSchema } from '@/lib/ai/schemas';
import { z } from 'zod';
import { deductCredits } from '@/lib/actions/credits';
import { calculateCost, calculateUserCost, getEffectiveTier } from '@/lib/pricing';
import { createClient } from '@/lib/supabase/server';

// Initialize providers
const openRouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    name: 'openrouter',
});

const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// Helper to get provider based on model string
function getProvider(modelName: string) {
    if (modelName.startsWith('google/')) {
        const cleanName = modelName.replace('google/', '');
        return google(cleanName);
    }
    return openRouter(modelName);
}

// Helper to deduct credits with tier check
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

// 1. Architect Agent: Generate Site Plan
export async function generateSitePlan(prompt: string, model: string) {
    'use server';

    try {
        const cost = calculateCost('agent_architect', model);
        await deductAgentCredits(cost, model, `Architect Agent: ${model}`);

        const systemPrompt = `
    You are an expert Website Architect. Your goal is to plan the structure of a high-converting, aesthetically pleasing website based on the user's request.
    
    Analyze the user's request and determine if it requires multiple pages (e.g., Home, About, Contact, Pricing).
    If the request is simple (e.g., "Landing page"), create a single 'index.html'.
    If the request implies a full site (e.g., "Company website"), create multiple pages.
    
    For each page:
    1. Define the file path (index.html, about.html, etc.)
    2. Break it down into logical sections.
    3. For each section, determine its type and detailed requirements.
    
    Be specific about content requirements.
  `;

        const { object } = await generateObject({
            model: getProvider(model),
            schema: SitePlanSchema,
            system: systemPrompt,
            prompt: prompt,
        });

        return object;
    } catch (error: any) {
        console.error('Error in generateSitePlan:', error);
        throw new Error(error.message || 'Failed to generate site plan');
    }
}

// 2. Designer Agent: Generate Design System
export async function generateDesignSystem(intent: string, model: string) {
    'use server';

    const cost = calculateCost('agent_designer', model);
    await deductAgentCredits(cost, model, `Designer Agent: ${model}`);

    const systemPrompt = `
    You are a world-class UI/UX Designer. Your goal is to create a cohesive design system (Tailwind CSS tokens) for a website.
    
    Based on the user's intent ("Modern SaaS", "Playful Portfolio", "Luxury Brand"), define the color palette, typography, spacing, and border radius.
    
    Use Tailwind CSS classes for all values.
    - Colors: bg-blue-500, text-gray-900, etc.
    - Spacing: py-12, gap-8
    - Radius: rounded-xl
    
    Ensure high contrast and accessibility.
  `;

    const { object } = await generateObject({
        model: getProvider(model),
        schema: DesignSystemSchema,
        system: systemPrompt,
        prompt: `Design intent: ${intent}`,
    });

    return object;
}

// 3. Builder Agent: Generate Section Component (Streaming)
export async function streamSectionGeneration(
    sectionType: string,
    description: string,
    designSystem: any,
    model: string
) {
    'use server';

    // Note: Streaming makes it harder to deduct credits upfront if we want to charge per token, 
    // but we are charging per section (fixed cost).
    const cost = calculateCost('agent_builder', model);
    await deductAgentCredits(cost, model, `Builder Agent (Stream): ${sectionType} using ${model}`);

    const systemPrompt = `
    You are an expert React Component Builder using Craft.js.
    Your task is to build a single website section based on the Architect's description and the Designer's design system.
    
    Available Components:
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
    
    Design System Rules:
    - Use the provided Design System for colors, fonts, and spacing.
    - PRIMARY COLOR: ${designSystem.colors.primary}
    - BACKGROUND: ${designSystem.colors.background}
    - TEXT: ${designSystem.colors.text}
    - ROUNDED: ${designSystem.borderRadius}
    
    HYBRID STRATEGY:
    1. **Standard Sections**: Use high-level components (BuilderHero, BuilderNavbar) when the request matches standard layouts. This is best for editability.
    2. **Custom Designs**: Use ATOMIC components (BuilderContainer, BuilderRow, BuilderColumn) with Tailwind classes for unique layouts.
       - You can build ANYTHING using BuilderContainer + Tailwind classes.
       - Feel free to use gradients, shadows, borders, absolute positioning via \`className\`.
       - Add animations via \`animation\` prop on atoms.
    
    Output a single JSON object matching the ComponentSchema.
    The root element MUST be a BuilderContainer.
  `;

    const result = await streamObject({
        model: getProvider(model),
        schema: ComponentSchema,
        system: systemPrompt,
        prompt: `Build a ${sectionType} section. Description: ${description}`,
    });

    return result.toTextStreamResponse();
}

// 4. Builder Agent: Generate Section Component (Non-Streaming Fallback)
export async function generateSection(
    sectionType: string,
    description: string,
    designSystem: any,
    model: string
) {
    'use server';

    const cost = calculateCost('agent_builder', model);
    await deductAgentCredits(cost, model, `Builder Agent: ${sectionType} using ${model}`);

    const systemPrompt = `
    You are an expert React Component Builder using Craft.js.
    Your task is to build a single website section based on the Architect's description and the Designer's design system.
    
    Available Components:
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
    
    Design System Rules:
    - Use the provided Design System for colors, fonts, and spacing.
    - PRIMARY COLOR: ${designSystem.colors.primary}
    - BACKGROUND: ${designSystem.colors.background}
    - TEXT: ${designSystem.colors.text}
    - ROUNDED: ${designSystem.borderRadius}
    
    HYBRID STRATEGY:
    1. **Standard Sections**: Use high-level components (BuilderHero, BuilderNavbar) when the request matches standard layouts. This is best for editability.
    2. **Custom Designs**: Use ATOMIC components (BuilderContainer, BuilderRow, BuilderColumn) with Tailwind classes for unique layouts.
       - You can build ANYTHING using BuilderContainer + Tailwind classes.
       - Feel free to use gradients, shadows, borders, absolute positioning via \`className\`.
       - Add animations via \`animation\` prop on atoms.
    
    Output a single JSON object matching the ComponentSchema.
    The root element MUST be a BuilderContainer.
  `;

    const { object } = await generateObject({
        model: getProvider(model),
        schema: ComponentSchema,
        system: systemPrompt,
        prompt: `Build a ${sectionType} section. Description: ${description}`,
    });

    return object;
}
