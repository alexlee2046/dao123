/**
 * 子域名工具函数
 * 用于验证和处理用户的子域名
 */

/**
 * 保留的子域名列表
 */
export const RESERVED_SUBDOMAINS = [
    'www', 'api', 'admin', 'app', 'mail', 'ftp', 'smtp', 'pop', 'imap',
    'blog', 'shop', 'store', 'dev', 'staging', 'test', 'static', 'assets',
    'cdn', 'docs', 'help', 'support', 'status', 'dashboard', 'console',
    'portal', 'vpn', 'ssh', 'git', 'svn', 'mysql', 'postgres', 'redis',
    'memcached',
] as const;

/**
 * 验证子域名格式
 * 
 * 规则：
 * - 只能包含小写字母、数字和连字符
 * - 不能以连字符开头或结尾
 * - 长度必须在 3-63 个字符之间
 * - 不能使用保留字
 * 
 * @param subdomain - 要验证的子域名
 * @returns 验证结果对象
 */
export function validateSubdomain(subdomain: string): {
    valid: boolean;
    error?: string;
} {
    // 检查是否为空
    if (!subdomain || subdomain.trim() === '') {
        return { valid: false, error: '子域名不能为空' };
    }

    // 转换为小写并去除空格
    const normalizedSubdomain = subdomain.toLowerCase().trim();

    // 检查长度
    if (normalizedSubdomain.length < 3) {
        return { valid: false, error: '子域名至少需要 3 个字符' };
    }

    if (normalizedSubdomain.length > 63) {
        return { valid: false, error: '子域名最多 63 个字符' };
    }

    // 检查格式：只允许字母、数字和连字符
    const formatRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
    if (!formatRegex.test(normalizedSubdomain)) {
        return {
            valid: false,
            error: '子域名只能包含小写字母、数字和连字符，且不能以连字符开头或结尾',
        };
    }

    // 检查是否包含连续的连字符
    if (normalizedSubdomain.includes('--')) {
        return { valid: false, error: '子域名不能包含连续的连字符' };
    }

    // 检查是否为保留字
    if (RESERVED_SUBDOMAINS.includes(normalizedSubdomain as any)) {
        return { valid: false, error: '该子域名已被系统保留' };
    }

    return { valid: true };
}

/**
 * 标准化子域名（转小写、去空格）
 */
export function normalizeSubdomain(subdomain: string): string {
    return subdomain.toLowerCase().trim();
}

/**
 * 生成完整的子域名 URL
 */
export function getSubdomainUrl(subdomain: string): string {
    const baseurl = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'dao123.me';
    return `https://${subdomain}.${baseurl}`;
}

/**
 * 从主机名中提取子域名
 * 
 * @param hostname - 完整的主机名，如 "alex-portfolio.dao123.me"
 * @returns 子域名部分，如 "alex-portfolio"，如果不是子域名则返回 null
 */
export function extractSubdomain(hostname: string): string | null {
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'dao123.me';

    // 移除端口号（如果有）
    const cleanHostname = hostname.split(':')[0];

    // 检查是否以基础域名结尾
    if (!cleanHostname.endsWith(baseDomain)) {
        return null;
    }

    // 提取子域名部分
    const parts = cleanHostname.split('.');
    const baseParts = baseDomain.split('.');

    // 如果域名部分数量不对，返回 null
    if (parts.length !== baseParts.length + 1) {
        return null;
    }

    const subdomain = parts[0];

    // 如果是 www 或空，返回 null
    if (!subdomain || subdomain === 'www') {
        return null;
    }

    return subdomain;
}

/**
 * 生成建议的子域名（基于用户名或项目名）
 */
export function suggestSubdomain(input: string): string {
    return input
        .toLowerCase()
        .trim()
        // 移除特殊字符，只保留字母、数字和空格
        .replace(/[^a-z0-9\s-]/g, '')
        // 将空格转换为连字符
        .replace(/\s+/g, '-')
        // 移除连续的连字符
        .replace(/-+/g, '-')
        // 移除开头和结尾的连字符
        .replace(/^-+|-+$/g, '')
        // 限制长度
        .slice(0, 63);
}

/**
 * 检查子域名是否可用（需要后端 API 配合）
 */
export async function checkSubdomainAvailability(
    subdomain: string
): Promise<{ available: boolean; error?: string }> {
    try {
        const response = await fetch('/api/subdomain/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subdomain: normalizeSubdomain(subdomain) }),
        });

        if (!response.ok) {
            throw new Error('检查失败');
        }

        return await response.json();
    } catch (error) {
        return {
            available: false,
            error: '无法检查子域名可用性，请稍后重试',
        };
    }
}

/**
 * 获取 Vercel 部署 URL
 */
export function getVercelDeployUrl(config: {
    templateRepo: string;
    subdomain: string;
    projectId: string;
}): string {
    const { templateRepo, subdomain, projectId } = config;

    const deployUrl = new URL('https://vercel.com/new/clone');

    // 设置仓库 URL
    deployUrl.searchParams.set(
        'repository-url',
        `https://github.com/${templateRepo}`
    );

    // 设置项目名称
    deployUrl.searchParams.set('project-name', `dao123-${subdomain}`);

    // 设置环境变量
    const envVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'NEXT_PUBLIC_PROJECT_ID',
    ];
    deployUrl.searchParams.set('env', envVars.join(','));

    // 设置环境变量描述
    deployUrl.searchParams.set(
        'envDescription',
        'Required environment variables for the project'
    );

    // 设置环境变量链接（可选）
    deployUrl.searchParams.set(
        'envLink',
        `${window.location.origin}/api/deployment/env?projectId=${projectId}`
    );

    return deployUrl.toString();
}

/**
 * 部署状态类型
 */
export type DeploymentStatus = 'draft' | 'deploying' | 'deployed' | 'failed';

/**
 * 获取部署状态的显示文本
 */
export function getDeploymentStatusText(status: DeploymentStatus): string {
    const statusMap: Record<DeploymentStatus, string> = {
        draft: '草稿',
        deploying: '部署中',
        deployed: '已部署',
        failed: '部署失败',
    };

    return statusMap[status] || '未知';
}

/**
 * 获取部署状态的颜色
 */
export function getDeploymentStatusColor(status: DeploymentStatus): string {
    const colorMap: Record<DeploymentStatus, string> = {
        draft: 'text-gray-500',
        deploying: 'text-blue-500',
        deployed: 'text-green-500',
        failed: 'text-red-500',
    };

    return colorMap[status] || 'text-gray-500';
}
