-- 创建 models 表 (如果不存在)
CREATE TABLE IF NOT EXISTS models (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('chat', 'image', 'video')),
    enabled BOOLEAN NOT NULL DEFAULT true,
    is_free BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_models_type ON models(type);
CREATE INDEX IF NOT EXISTS idx_models_enabled ON models(enabled);
CREATE INDEX IF NOT EXISTS idx_models_provider ON models(provider);

-- 插入推荐的AI模型 (2025年12月最新)
INSERT INTO models (id, name, provider, type, enabled, is_free) VALUES
    -- Chat Models - Premium
    ('openai/gpt-5', 'GPT-5', 'OpenAI', 'chat', true, false),
    ('openai/gpt-4o', 'GPT-4o', 'OpenAI', 'chat', true, false),
    ('anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet', 'Anthropic', 'chat', true, false),
    ('google/gemini-3-pro-preview', 'Gemini 3 Pro Preview', 'Google', 'chat', true, false),
    ('qwen/qwen-2.5-72b-instruct', 'Qwen 2.5 72B', 'Qwen', 'chat', true, false),
    
    -- Chat Models - Free/Efficient
    ('google/gemini-2.0-flash-exp:free', 'Gemini 2.0 Flash (Free)', 'Google', 'chat', true, true),
    ('deepseek/deepseek-v3.2-exp', 'DeepSeek V3.2 Experimental (Free)', 'DeepSeek', 'chat', true, true),
    ('deepseek/deepseek-v3.2-speciale', 'DeepSeek V3.2 Speciale', 'DeepSeek', 'chat', true, false),
    ('deepseek/deepseek-chat', 'DeepSeek Chat', 'DeepSeek', 'chat', true, true),
    ('qwen/qwen3-coder:free', 'Qwen3 Coder (Free)', 'Qwen', 'chat', true, true),
    ('google/gemini-2.5-flash', 'Gemini 2.5 Flash', 'Google', 'chat', true, true),
    
    -- Image Models
    ('openai/dall-e-3', 'DALL-E 3', 'OpenAI', 'image', true, false),
    ('openai/gpt-image-1', 'GPT Image 1', 'OpenAI', 'image', true, false),
    ('black-forest-labs/flux-1.1-pro', 'Flux 1.1 Pro', 'Black Forest Labs', 'image', true, false),
    ('google/gemini-3-pro-image-preview', 'Gemini 3 Pro Image Preview', 'Google', 'image', true, false),
    ('stabilityai/stable-diffusion-xl-beta-v2-2-2', 'Stable Diffusion XL', 'Stability AI', 'image', true, false),
    
    -- Video Models
    ('luma/dream-machine', 'Luma Dream Machine', 'Luma', 'video', true, false),
    ('runway/gen-3-alpha', 'Runway Gen-3 Alpha', 'Runway', 'video', true, false),
    ('kling/kling-v1', 'Kling V1', 'Kling', 'video', true, false)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    type = EXCLUDED.type,
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
