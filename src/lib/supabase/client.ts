import { createBrowserClient } from '@supabase/ssr'

/**
 * 创建 Supabase 浏览器客户端
 * 
 * 安全说明：
 * - 验证环境变量存在性
 * - 在开发环境提供明确的错误信息
 */

// 验证 Supabase 配置
function getSupabaseConfig() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
        // 在构建时可能还没有环境变量，允许继续但记录警告
        if (typeof window !== 'undefined') {
            console.error('[Supabase] Missing configuration. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
        }
        // 返回占位符以允许构建通过，但运行时会失败
        return {
            url: url || 'https://placeholder.supabase.co',
            anonKey: anonKey || 'placeholder-key',
            isValid: false
        };
    }

    return { url, anonKey, isValid: true };
}

let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
    // 单例模式，避免创建多个客户端实例
    if (clientInstance) {
        return clientInstance;
    }

    const config = getSupabaseConfig();

    clientInstance = createBrowserClient(config.url, config.anonKey);

    return clientInstance;
}

// 导出验证函数供其他模块使用
export function isSupabaseConfigured(): boolean {
    const config = getSupabaseConfig();
    return config.isValid;
}
