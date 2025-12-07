const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ 错误: 请在 .env.local 中配置 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function main() {
    const email = process.argv[2]
    if (!email) {
        console.error('❌ 请提供用户邮箱')
        console.log('用法: node --env-file=.env.local scripts/set-admin.js <email>')
        process.exit(1)
    }

    console.log(`🔍 正在查找用户: ${email}...`)
    
    // 获取所有用户（假设用户数不超过 1000，开发环境通常足够）
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000
    })
    
    if (listError) {
        console.error('❌ 获取用户列表失败:', listError.message)
        process.exit(1)
    }

    const user = users.find(u => u.email === email)

    if (!user) {
        console.error('❌ 未找到该邮箱的用户')
        process.exit(1)
    }

    console.log(`✅ 找到用户 ID: ${user.id}`)
    console.log('🔄 正在更新用户权限和会员等级...')

    // 更新 profiles 表
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            role: 'admin',
            membership_tier: 'pro',
            membership_expires_at: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 100年有效期
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

    if (updateError) {
        console.error('❌ 更新失败:', updateError.message)
        process.exit(1)
    }

    console.log('🎉 更新成功！')
    console.log(`👤 用户: ${email}`)
    console.log('👑 角色: admin')
    console.log('⭐ 会员: pro (永久)')
    console.log('\n请刷新页面以查看更改。')
}

main()
