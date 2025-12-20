/**
 * Pricing Strategy & Cost Analysis (Updated: 2025-12-20)
 *
 * 1 Credit ~= $0.01 USD (Based on $10/1000 credits entry plan)
 *
 * Infrastructure Costs (Estimated):
 * - Vercel Serverless Function: ~$0.000002 / request
 * - Supabase Database: Negligible per transaction
 * - Supabase Storage: ~$0.021 / GB / Month
 *
 * AI API Costs (OpenRouter 2025-12 Pricing):
 * - Chat (Input + Output per 1K in + 2K out tokens):
 *   - DeepSeek V3.2: ~$0.001 (极致性价比)
 *   - Gemini 3 Flash: ~$0.0065 (性价比之王)
 *   - Gemini 3 Pro: ~$0.026
 *   - Claude Sonnet 4.5: ~$0.033
 *   - GPT-5.1: ~$0.022
 * - Image (按分辨率计费，以下为1K分辨率):
 *   - Nano Banana (2.5 Flash Image): ~$0.039/张 (1290 tokens @ $30/M)
 *   - Nano Banana Pro (3 Pro Image): ~$0.134/张 (1K-2K), ~$0.24/张 (4K)
 *   - Flux 2 Pro: $0.03/MP首个 + $0.015/MP后续 (1K=$0.03, 2K=$0.075)
 *   - Flux 2 Max: $0.07/MP首个 + $0.03/MP后续 (1K=$0.07, 2K=$0.16)
 * - Video:
 *   - Luma/Runway: $0.30 - $0.50 (需验证可用性)
 *
 * Formula:
 * Cost = (API_Price / VALUE_PER_CREDIT) * Margin_Multiplier + INFRA_BUFFER
 * Margin_Multiplier: 1.5x to 3.0x (varies by model tier)
 */

export const PRICING_CONSTANTS = {
    VALUE_PER_CREDIT: 0.01, // $0.01
    INFRA_BUFFER: 1, // 1 Credit overhead for storage/compute
};

export const MODEL_COSTS: Record<string, number> = {
    // ============ Chat Models (Per Turn) ============
    // Free Tier (成本 < $0.002)
    'deepseek/deepseek-v3.2': 1,              // $0.001, 利润率 900%+
    'google/gemini-2.5-flash-lite-preview': 1, // $0.001, 利润率 900%+
    'qwen/qwen-2.5-72b-instruct': 1,          // $0.0013, 利润率 669%

    // Best Value (成本 $0.005-0.01)
    'google/gemini-3-flash-preview': 5,        // $0.0065, 利润率 669%, 12月17日发布
    'openai/gpt-5-mini': 8,                   // $0.0085, 利润率 841%

    // Flagship (成本 $0.02-0.04)
    'google/gemini-3-pro-preview': 15,         // $0.026, 利润率 477%
    'anthropic/claude-sonnet-4.5': 20,         // $0.033, 利润率 506%
    'openai/gpt-5.1': 25,                     // $0.022, 利润率 1036%
    'openai/gpt-5': 25,                       // Legacy

    // ============ Image Models (Per Generation, 1K分辨率基准) ============
    // 注意: 图像按分辨率计费，高分辨率成本更高，建议限制或分级收费
    'google/gemini-2.5-flash-image': 8,        // Nano Banana, $0.039/张, 利润率 105%
    'google/gemini-3-pro-image-preview': 20,   // Nano Banana Pro, $0.134/张(1K), 利润率 49%
    'black-forest-labs/flux.2-pro': 15,        // $0.03/张(1K), 利润率 400%
    'black-forest-labs/flux.2-max': 25,        // $0.07/张(1K), 利润率 257%

    // Legacy (保留兼容性，但建议迁移)
    'black-forest-labs/flux-1.1-pro': 15,      // 已下架，保留避免报错

    // ============ Video Models (Per Generation) ============
    'luma/dream-machine': 150,                 // $0.30-0.50, 需验证可用性
    'runway/gen-3-alpha': 180,                 // 需验证可用性
};

export const DEFAULT_COSTS = {
    chat: 5,     // 默认使用 Gemini 3 Flash 级别
    image: 20,   // 默认使用 Nano Banana Pro 级别 (安全边际)
    video: 150,
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

    if (type === 'image') return 20; // 安全默认值，覆盖大部分图像模型成本
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
