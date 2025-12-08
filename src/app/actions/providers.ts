'use server';

// This file contains provider initialization that can be imported by server actions
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

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
// Note: This is a sync function but wrapped in async to satisfy 'use server' requirements
export async function getProvider(modelName: string) {
    if (modelName.startsWith('google/')) {
        const cleanName = modelName.replace('google/', '');
        return google(cleanName);
    }
    return openRouter(modelName);
}
