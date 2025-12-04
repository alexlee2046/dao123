
/**
 * Pricing Strategy & Cost Analysis
 * 
 * 1 Credit ~= $0.01 USD (Based on $10/1000 credits entry plan)
 * 
 * Infrastructure Costs (Estimated):
 * - Vercel Serverless Function: ~$0.000002 / request
 * - Supabase Database: Negligible per transaction
 * - Supabase Storage: ~$0.021 / GB / Month
 *   - Image (~2MB): Negligible storage cost, mainly bandwidth
 *   - Video (~10MB): Higher bandwidth
 * 
 * AI API Costs (OpenRouter/Providers):
 * - Chat (Input + Output):
 *   - GPT-4o/Claude 3.5: ~$0.01 - $0.03 per turn
 *   - Flash/Haiku/DeepSeek: < $0.001 per turn
 * - Image:
 *   - DALL-E 3: $0.04 - $0.08
 *   - Flux/Pro: $0.03 - $0.06
 * - Video:
 *   - Luma/Runway: $0.10 - $0.50 (High variance)
 * 
 * Formula:
 * Cost = (API_Price / Value_Per_Credit) * Margin_Multiplier + Infrastructure_Buffer
 * Margin_Multiplier: 1.5x to 2.0x (to cover free users, failed gens, development)
 */

export const PRICING_CONSTANTS = {
    VALUE_PER_CREDIT: 0.01, // $0.01
    INFRA_BUFFER: 1, // 1 Credit overhead for storage/compute
};

export const MODEL_COSTS: Record<string, number> = {
    // Chat Models (Per Message)
    // Premium Models (Target ROI > 5x)
    'openai/gpt-5': 20,           // Premium Future Model
    'openai/gpt-4o': 5,           // Standard Premium ($0.01 cost -> $0.05 price)
    'anthropic/claude-3.5-sonnet': 5,
    'google/gemini-3-pro-preview': 5, // Added as requested
    'qwen/qwen-2.5-72b-instruct': 3,

    // Efficient/Free-tier Models (Charge 1 credit to cover infra/compute overhead)
    'google/gemini-2.5-flash': 1,
    'deepseek/deepseek-chat': 1,
    'deepseek/deepseek-chat-v3.1:free': 1,
    'qwen/qwen3-coder:free': 1,
    'google/gemini-2.0-flash-exp:free': 1,
    'moonshotai/kimi-k2:free': 1,

    // Image Models (Per Generation)
    // Target ROI > 5x (Cost ~$0.04 -> Price $0.20-$0.25)
    'openai/dall-e-3': 25,
    'openai/gpt-image-1': 25,
    'black-forest-labs/flux-1.1-pro': 25,
    'google/gemini-3-pro-image-preview': 25,
    'stabilityai/stable-diffusion-xl-beta-v2-2-2': 15, // Lower cost model

    // Video Models (Per Generation)
    // High Cost Items (Cost ~$0.30 -> Price $2.00)
    'luma/dream-machine': 200,
    'runway/gen-3-alpha': 250,
    'kling/kling-v1': 200,
};

export const DEFAULT_COSTS = {
    chat: 5,      // Default for unknown chat models
    image: 25,    // Default for unknown image models
    video: 200,   // Default for unknown video models
};

export function calculateCost(type: 'chat' | 'image' | 'video', modelId: string): number {
    // 1. Check specific model cost
    if (modelId in MODEL_COSTS) {
        return MODEL_COSTS[modelId];
    }

    // 2. Heuristic based on model ID strings if not explicitly listed
    if (type === 'chat') {
        if (modelId.includes('gpt-4') || modelId.includes('claude-3') || modelId.includes('pro')) return 3;
        if (modelId.includes('flash') || modelId.includes('mini') || modelId.includes('haiku')) return 1;
        if (modelId.includes('deepseek')) return 1; // DeepSeek models are generally cheap
        if (modelId.includes('free')) return 0;
    }

    if (type === 'image') {
        if (modelId.includes('pro') || modelId.includes('ultra') || modelId.includes('3')) return 8;
    }

    // 3. Fallback to defaults
    return DEFAULT_COSTS[type];
}
