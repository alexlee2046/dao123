'use server';

// This file contains provider initialization that can be imported by server actions
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Initialize providers
const openRouterApiKey = process.env.OPENROUTER_API_KEY;
const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

const openRouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: openRouterApiKey,
    name: 'openrouter',
});

const google = createGoogleGenerativeAI({
    apiKey: googleApiKey,
});

// Helper to get provider based on model string
// Note: This is a sync function but wrapped in async to satisfy 'use server' requirements
export async function getProvider(modelName: string) {
    if (modelName.startsWith('google/')) {
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            throw new Error("Google API Key is missing (GOOGLE_GENERATIVE_AI_API_KEY)");
        }
        const cleanName = modelName.replace('google/', '');
        return google(cleanName);
    }

    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error("OpenRouter API Key is missing (OPENROUTER_API_KEY)");
    }
    return openRouter(modelName);
}
