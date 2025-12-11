-- 创建 models 表 (如果不存在)
CREATE TABLE IF NOT EXISTS models (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('chat', 'image', 'video')),
    cost_per_unit FLOAT NOT NULL DEFAULT 0,
    enabled BOOLEAN NOT NULL DEFAULT true,
    is_free BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure cost_per_unit exists (if table already existed)
ALTER TABLE models ADD COLUMN IF NOT EXISTS cost_per_unit FLOAT NOT NULL DEFAULT 0;

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_models_type ON models(type);
CREATE INDEX IF NOT EXISTS idx_models_enabled ON models(enabled);
CREATE INDEX IF NOT EXISTS idx_models_provider ON models(provider);
CREATE INDEX IF NOT EXISTS idx_models_cost ON models(cost_per_unit);

-- 插入推荐的AI模型 (2025年12月最新)
INSERT INTO models (id, name, provider, type, cost_per_unit, enabled, is_free) VALUES
    -- Chat Models - Premium
    ('openai/gpt-5', 'GPT-5', 'OpenAI', 'chat', 10, true, false),
    ('openai/gpt-4o', 'GPT-4o', 'OpenAI', 'chat', 5, true, false),
    ('anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet', 'Anthropic', 'chat', 3, true, false),
    ('google/gemini-3-pro-preview', 'Gemini 3 Pro Preview', 'Google', 'chat', 2, true, false),
    ('qwen/qwen-2.5-72b-instruct', 'Qwen 2.5 72B', 'Qwen', 'chat', 1, true, false),
    
    -- Chat Models - Free/Efficient
    ('google/gemini-2.0-flash-exp:free', 'Gemini 2.0 Flash (Free)', 'Google', 'chat', 0, true, true),
    ('deepseek/deepseek-v3.2-exp', 'DeepSeek V3.2 Experimental (Free)', 'DeepSeek', 'chat', 0, true, true),
    ('deepseek/deepseek-v3.2-speciale', 'DeepSeek V3.2 Speciale', 'DeepSeek', 'chat', 1, true, false),
    ('deepseek/deepseek-chat', 'DeepSeek Chat', 'DeepSeek', 'chat', 0, true, true),
    ('qwen/qwen3-coder:free', 'Qwen3 Coder (Free)', 'Qwen', 'chat', 0, true, true),
    ('google/gemini-2.5-flash', 'Gemini 2.5 Flash', 'Google', 'chat', 0, true, true),
    
    -- Image Models
    ('openai/dall-e-3', 'DALL-E 3', 'OpenAI', 'image', 4, true, false),
    ('openai/gpt-image-1', 'GPT Image 1', 'OpenAI', 'image', 4, true, false),
    ('black-forest-labs/flux-1.1-pro', 'Flux 1.1 Pro', 'Black Forest Labs', 'image', 3, true, false),
    ('google/gemini-3-pro-image-preview', 'Gemini 3 Pro Image Preview', 'Google', 'image', 2, true, false),
    ('stabilityai/stable-diffusion-xl-beta-v2-2-2', 'Stable Diffusion XL', 'Stability AI', 'image', 1, true, false),
    
    -- Video Models
    ('luma/dream-machine', 'Luma Dream Machine', 'Luma', 'video', 10, true, false),
    ('runway/gen-3-alpha', 'Runway Gen-3 Alpha', 'Runway', 'video', 8, true, false),
    ('kling/kling-v1', 'Kling V1', 'Kling', 'video', 8, true, false)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    type = EXCLUDED.type,
    cost_per_unit = EXCLUDED.cost_per_unit,
    enabled = EXCLUDED.enabled,
    is_free = EXCLUDED.is_free,
    updated_at = NOW();

-- 创建触发器以自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_models_updated_at ON models;
CREATE TRIGGER update_models_updated_at
    BEFORE UPDATE ON models
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
