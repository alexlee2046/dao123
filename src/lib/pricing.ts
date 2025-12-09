
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
    // Premium Flagships
    'openai/gpt-5.1': 20,           // OpenAI Flagship
    'openai/gpt-5': 20,             // Legacy Flagship
    'openai/gpt-5-mini': 5,         // Efficient Premium
    'google/gemini-3-pro-preview': 15, // Google Flagship (LMArena #1)
    'anthropic/claude-sonnet-4.5': 15, // Coding Flagship

    // Efficient/Free-tier Models
    'deepseek/deepseek-v3.2': 1,         // Free tier standard
    'qwen/qwen-2.5-72b-instruct': 2,      // Best Open Model

    // Image Models (Per Generation)
    'openai/gpt-5-image': 25,
    'google/gemini-2.5-flash-image': 2,    // Efficient Image ("Nano Banana")
    'black-forest-labs/flux-1.1-pro': 25,
    'stabilityai/stable-diffusion-xl-beta-v2-2-2': 15,

    // Video Models (Per Generation)
    'luma/dream-machine': 200,
    'runway/gen-3-alpha': 250,
};

export const DEFAULT_COSTS = {
    chat: 5,
    image: 25,
    video: 200,
};

export function calculateCost(type: 'chat' | 'image' | 'video' | 'agent_architect' | 'agent_designer' | 'agent_builder' | 'h5', modelId: string): number {
    // 1. Check specific model cost
    if (modelId in MODEL_COSTS) {
        return MODEL_COSTS[modelId];
    }

    // 2. Agentic Workflow Pricing (Fixed Project-Level Costs)
    // Higher than single-turn because they involve multiple internal steps/reasoning
    if (type === 'agent_architect') {
        return 30; // 20 (base) + 10 (buffer/margin)
    }
    if (type === 'agent_designer') {
        return 25; // High capability vision/design
    }
    if (type === 'agent_builder') {
        // Builder usually runs many small chunks
        if (modelId.includes('deepseek') || modelId.includes('flash')) return 2;
        return 5; // Default for standard complexity block
    }

    // 3. Fallback Heuristics
    if (type === 'chat') {
        if (modelId.includes('gpt-5') || modelId.includes('gpt-4')) return 10;
        if (modelId.includes('claude') && (modelId.includes('opus') || modelId.includes('sonnet'))) return 10;
        if (modelId.includes('gemini') && modelId.includes('pro')) return 10;
        return 2; // Default for others (Flash, Haiku, open source)
    }

    if (type === 'image') return 20;
    if (type === 'video') return 200;
    if (type === 'h5') return 5;

    return 5;
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
