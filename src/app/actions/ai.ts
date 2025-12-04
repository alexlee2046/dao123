'use server';

import { generateObject, streamObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { DesignSystemSchema, SitePlanSchema, ComponentSchema } from '@/lib/ai/schemas';
import { z } from 'zod';
import { deductCredits } from '@/lib/actions/credits';
import { calculateCost } from '@/lib/pricing';

// Initialize providers
const openRouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
});

const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// Helper to get provider based on model string
function getProvider(modelName: string) {
    if (modelName.startsWith('google/')) {
        // Remove prefix for Google provider if needed, or pass as is if SDK handles it
        // The Vercel Google provider expects model names like 'models/gemini-1.5-pro-latest'
        // But our frontend sends 'google/gemini-2.0-flash-exp:free'
        // Let's map common ones or just strip prefix
        const cleanName = modelName.replace('google/', '');
        return google(cleanName);
    }
    return openRouter(modelName);
}

// 1. Architect Agent: Generate Site Plan
export async function generateSitePlan(prompt: string, model: string) {
    'use server';

    const cost = calculateCost('agent_architect', model);
    await deductCredits(cost, `Architect Agent: ${model}`);

    const systemPrompt = `
    You are an expert Website Architect. Your goal is to plan the structure of a high-converting, aesthetically pleasing website based on the user's request.
    
    Analyze the user's request and break it down into logical sections.
    For each section, determine its type (Hero, Features, etc.) and write a detailed description of what it should contain.
    
    Be specific about content requirements.
  `;

    const { object } = await generateObject({
        model: getProvider(model),
        schema: SitePlanSchema,
        system: systemPrompt,
        prompt: prompt,
    });

    return object;
}

// 2. Designer Agent: Generate Design System
export async function generateDesignSystem(intent: string, model: string) {
    'use server';

    const cost = calculateCost('agent_designer', model);
    await deductCredits(cost, `Designer Agent: ${model}`);

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
    await deductCredits(cost, `Builder Agent (Stream): ${sectionType} using ${model}`);

    const systemPrompt = `
    You are an expert React Component Builder using Craft.js.
    Your task is to build a single website section based on the Architect's description and the Designer's design system.
    
    Available Components:
    - BuilderContainer: Layout wrapper (flex/grid). Props: className, children.
    - BuilderText: Text element. Props: text, tag (h1-h6, p, span), className.
    - BuilderButton: Interactive button. Props: text, href, variant (default, outline, ghost), className.
    - BuilderImage: Image element. Props: src, alt, className.
    - CustomHTML: Escape hatch for complex SVG/animations. Props: code, className.
    
    Design System Rules:
    - Use the provided Design System for colors, fonts, and spacing.
    - PRIMARY COLOR: ${designSystem.colors.primary}
    - BACKGROUND: ${designSystem.colors.background}
    - TEXT: ${designSystem.colors.text}
    - ROUNDED: ${designSystem.borderRadius}
    
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
    await deductCredits(cost, `Builder Agent: ${sectionType} using ${model}`);

    const systemPrompt = `
    You are an expert React Component Builder using Craft.js.
    Your task is to build a single website section based on the Architect's description and the Designer's design system.
    
    Available Components:
    - BuilderContainer: Layout wrapper (flex/grid). Props: className, children.
    - BuilderText: Text element. Props: text, tag (h1-h6, p, span), className.
    - BuilderButton: Interactive button. Props: text, href, variant (default, outline, ghost), className.
    - BuilderImage: Image element. Props: src, alt, className.
    - CustomHTML: Escape hatch for complex SVG/animations. Props: code, className.
    
    Design System Rules:
    - Use the provided Design System for colors, fonts, and spacing.
    - PRIMARY COLOR: ${designSystem.colors.primary}
    - BACKGROUND: ${designSystem.colors.background}
    - TEXT: ${designSystem.colors.text}
    - ROUNDED: ${designSystem.borderRadius}
    
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
