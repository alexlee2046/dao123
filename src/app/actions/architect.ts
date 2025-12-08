'use server';

import { generateObject } from 'ai';
import { SitePlanSchema } from '@/lib/ai/schemas';
import { getProvider, deductAgentCredits, getModelDataFromDB } from './ai';

export async function generateSitePlan(prompt: string, model: string = 'anthropic/claude-3.5-sonnet') {
    try {
        const { cost, is_free } = await getModelDataFromDB(model);
        await deductAgentCredits(cost, model, `Architect Agent: ${model}`, is_free);

        const { object } = await generateObject({
            model: await getProvider(model),
            schema: SitePlanSchema,
            prompt: `
        You are an expert Information Architect and Product Manager for a website builder.
        Your goal is to plan the structure of a website based on the user's request.

        User Request: "${prompt}"

        Instructions:
        1. Analyze the intent. Is it a portfolio? A SaaS landing page? A blog?
        2. Determine the necessary pages. Typically include 'index.html' (Home).
        3. For each page, strictly define:
           - path: e.g., 'index.html', 'about.html'
           - title: SEO title
           - sections: An ordered list of sections (e.g., Hero, Features, Pricing).
           - description: A brief visual/functional description of the page purpose.
        4. Keep it concise but complete. Do not "forget" common pages like Contact or About if implied by the request.
        5. Return ONLY the JSON structure conforming to the schema.
      `,
            temperature: 0.7,
        });

        return { success: true, sitePlan: object };
    } catch (error: any) {
        console.error('Error in generateSitePlan:', error);
        return { success: false, error: error.message || 'Failed to generate site plan' };
    }
}
