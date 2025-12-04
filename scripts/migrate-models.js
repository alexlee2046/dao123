const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
// require('dotenv').config({ path: '.env.local' }) - 使用 node --env-file=.env.local 代替

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ 错误: 请在 .env.local 中配置 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
    try {
        console.log('📦 开始执行模型表迁移...\n')

        // 读取SQL文件
        const sqlPath = path.join(__dirname, '..', 'migrations', 'add_models_table.sql')
        const sql = fs.readFileSync(sqlPath, 'utf8')

        // 执行SQL
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single()

        if (error) {
            // 尝试直接使用REST API
            console.log('⚠️  exec_sql 函数不可用,尝试分段执行...\n')

            // 手动执行主要部分
            console.log('1️⃣  创建 models 表...')
            const { error: tableError } = await supabase.rpc('exec', {
                sql: `
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
                `
            })

            if (tableError && !tableError.message.includes('already exists')) {
                throw tableError
            }

            console.log('✅ models 表已创建\n')

            // 插入初始数据
            console.log('2️⃣  插入推荐模型数据...')
            const models = [
                { id: 'openai/gpt-5', name: 'GPT-5', provider: 'OpenAI', type: 'chat', enabled: true, is_free: false },
                { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', type: 'chat', enabled: true, is_free: false },
                { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', type: 'chat', enabled: true, is_free: false },
                { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', provider: 'Google', type: 'chat', enabled: true, is_free: false },
                { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B', provider: 'Qwen', type: 'chat', enabled: true, is_free: false },
                { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)', provider: 'Google', type: 'chat', enabled: true, is_free: true },
                { id: 'deepseek/deepseek-v3.2-exp', name: 'DeepSeek V3.2 Experimental (Free)', provider: 'DeepSeek', type: 'chat', enabled: true, is_free: true },
                { id: 'deepseek/deepseek-v3.2-speciale', name: 'DeepSeek V3.2 Speciale', provider: 'DeepSeek', type: 'chat', enabled: true, is_free: false },
                { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek', type: 'chat', enabled: true, is_free: true },
                { id: 'qwen/qwen3-coder:free', name: 'Qwen3 Coder (Free)', provider: 'Qwen', type: 'chat', enabled: true, is_free: true },
                { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', type: 'chat', enabled: true, is_free: true },
                { id: 'openai/dall-e-3', name: 'DALL-E 3', provider: 'OpenAI', type: 'image', enabled: true, is_free: false },
                { id: 'openai/gpt-image-1', name: 'GPT Image 1', provider: 'OpenAI', type: 'image', enabled: true, is_free: false },
                { id: 'black-forest-labs/flux-1.1-pro', name: 'Flux 1.1 Pro', provider: 'Black Forest Labs', type: 'image', enabled: true, is_free: false },
                { id: 'google/gemini-3-pro-image-preview', name: 'Gemini 3 Pro Image Preview', provider: 'Google', type: 'image', enabled: true, is_free: false },
                { id: 'stabilityai/stable-diffusion-xl-beta-v2-2-2', name: 'Stable Diffusion XL', provider: 'Stability AI', type: 'image', enabled: true, is_free: false },
                { id: 'luma/dream-machine', name: 'Luma Dream Machine', provider: 'Luma', type: 'video', enabled: true, is_free: false },
                { id: 'runway/gen-3-alpha', name: 'Runway Gen-3 Alpha', provider: 'Runway', type: 'video', enabled: true, is_free: false },
                { id: 'kling/kling-v1', name: 'Kling V1', provider: 'Kling', type: 'video', enabled: true, is_free: false },
            ]

            const { error: insertError } = await supabase
                .from('models')
                .upsert(models, { onConflict: 'id' })

            if (insertError) {
                throw insertError
            }

            console.log(`✅ 成功插入 ${models.length} 个模型\n`)
        } else {
            console.log('✅ SQL迁移执行成功!\n')
        }

        // 验证
        const { data: modelCount } = await supabase
            .from('models')
            .select('id', { count: 'exact', head: true })

        console.log('🎉 迁移完成!')
        console.log(`📊 当前共有模型: ${modelCount?.length || 0} 个\n`)

    } catch (error) {
        console.error('❌ 迁移失败:', error.message)
        console.error('\n请手动在Supabase Dashboard SQL Editor中执行:')
        console.error('migrations/add_models_table.sql\n')
        process.exit(1)
    }
}

runMigration()
