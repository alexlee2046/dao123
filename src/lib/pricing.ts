
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
    'openai/gpt-5-mini': 5,       // Efficient Premium
    'google/gemini-3-pro-preview': 10, // Google Flagship

    // Efficient/Free-tier Models
    'deepseek/deepseek-v3.2': 1,         // Very cheap standard
    'deepseek/deepseek-v3.2-speciale': 3, // Performance variant
    'qwen/qwen-2.5-72b-instruct': 2,      // Best Open Model

    // Legacy / Fallbacks
    'openai/gpt-4o': 6,
    'anthropic/claude-3.5-sonnet': 6,
    'google/gemini-2.5-flash': 1,

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

export function calculateCost(type: 'chat' | 'image' | 'video' | 'agent_architect' | 'agent_designer' | 'agent_builder', modelId: string): number {
    // 1. Check specific model cost
    if (modelId in MODEL_COSTS) {
        return MODEL_COSTS[modelId];
    }

    // Agentic Workflow Pricing
    // Agentic Workflow Pricing
    if (type === 'agent_architect') {
        // Architect uses high-reasoning models
        // Fixed cost per plan generation
        if (modelId.includes('gpt-5') && !modelId.includes('mini')) return 10;
        if (modelId.includes('gemini-3')) return 8;
        return 5; // Default for others (Mini/DeepSeek)
    }
    if (type === 'agent_designer') {
        // Designer uses high-reasoning models
        // Fixed cost per design system
        if (modelId.includes('gpt-5') && !modelId.includes('mini')) return 8;
        return 5;
    }
    if (type === 'agent_builder') {
        // Builder uses faster models
        // Cost per section
        if (modelId.includes('deepseek')) return 1;
        if (modelId.includes('qwen')) return 2;
        if (modelId.includes('gpt-5-mini')) return 2;
        if (modelId.includes('gemini-3')) return 3; // Pro is expensive
        return 5; // Default (GPT-5 full)
    }

    // Existing Chat Pricing
    if (type === 'chat') {
        if (modelId.includes('claude-3-5-sonnet')) return 3;
        if (modelId.includes('gpt-4o')) return 5;
        if (modelId.includes('gemini')) return 1;
        return 2; // Default
    }

    if (type === 'image') return 10;
    if (type === 'video') return 50;

    return 0;
}

export function calculateUserCost(baseCost: number, modelId: string, membershipTier: 'free' | 'pro' = 'free'): number {
    // Define Free Models based on cost (<= 1)
    // This aligns with the pricing strategy where efficient models are ~1 credit
    const isFreeModel = baseCost <= 1;

    if (membershipTier === 'free') {
        if (!isFreeModel) {
            // Premium model for free user -> Blocked
            // We return -1 to indicate this action is not allowed for the current tier
            return -1;
        }
        // Free user pays for free models
        return baseCost;
    }

    if (membershipTier === 'pro') {
        if (isFreeModel) {
            // Pro user gets free models for 0 credits
            return 0;
        }
        // Pro user pays for premium models
        return baseCost;
    }

    return baseCost;
}

export function getEffectiveTier(profile: { membership_tier?: string | null, membership_expires_at?: string | null }): 'free' | 'pro' {
    if (profile?.membership_tier === 'pro') {
        // Check expiry if present
        if (profile.membership_expires_at) {
            const expiresAt = new Date(profile.membership_expires_at);
            // Give a small buffer (e.g. 1 hour) or strict check
            if (expiresAt < new Date()) {
                return 'free';
            }
        }
        return 'pro';
    }
    return 'free';
}
