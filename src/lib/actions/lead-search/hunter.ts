'use server';

/**
 * Hunter.io Server Actions
 * 用于在服务端安全调用 Hunter.io API
 */

import { createHunterClient, HunterDomainSearchResult, HunterEmailFinderResult, HunterVerifyResult, HunterEmailCountResult, LeadContact } from '@/lib/services/lead-search';

// 获取 Hunter 客户端
function getClient() {
    const apiKey = process.env.HUNTER_API_KEY;
    if (!apiKey) {
        throw new Error('HUNTER_API_KEY 环境变量未设置');
    }
    return createHunterClient(apiKey);
}

/**
 * 域名搜索 - 获取一个域名下的所有邮箱
 */
export async function searchDomain(params: {
    domain: string;
    limit?: number;
    offset?: number;
    type?: 'personal' | 'generic';
    seniority?: string[];
    department?: string[];
}): Promise<{
    success: boolean;
    data?: HunterDomainSearchResult;
    contacts?: LeadContact[];
    error?: string;
}> {
    try {
        const client = getClient();
        const result = await client.domainSearch(params);
        const contacts = client.domainSearchToLeadContacts(result);

        return {
            success: true,
            data: result,
            contacts,
        };
    } catch (error) {
        console.error('[Hunter] 域名搜索失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '搜索失败',
        };
    }
}

/**
 * 邮箱查找 - 按姓名和域名查找邮箱
 */
export async function findEmail(params: {
    domain: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
}): Promise<{
    success: boolean;
    data?: HunterEmailFinderResult;
    contact?: LeadContact;
    error?: string;
}> {
    try {
        const client = getClient();
        const result = await client.findEmail(params);

        if (!result) {
            return {
                success: false,
                error: '未找到匹配的邮箱地址',
            };
        }

        const contact = client.emailFinderToLeadContact(result);

        return {
            success: true,
            data: result,
            contact,
        };
    } catch (error) {
        console.error('[Hunter] 邮箱查找失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '查找失败',
        };
    }
}

/**
 * 邮箱验证 - 验证邮箱是否有效
 */
export async function verifyEmail(email: string): Promise<{
    success: boolean;
    data?: HunterVerifyResult;
    isValid?: boolean;
    error?: string;
}> {
    try {
        const client = getClient();
        const result = await client.verifyEmail({ email });

        return {
            success: true,
            data: result,
            isValid: result.status === 'valid',
        };
    } catch (error) {
        console.error('[Hunter] 邮箱验证失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '验证失败',
        };
    }
}

/**
 * 批量邮箱验证
 */
export async function verifyEmails(emails: string[]): Promise<{
    success: boolean;
    results: Array<{
        email: string;
        isValid: boolean;
        status?: string;
        error?: string;
    }>;
}> {
    const results = await Promise.all(
        emails.map(async (email) => {
            try {
                const client = getClient();
                const result = await client.verifyEmail({ email });
                return {
                    email,
                    isValid: result.status === 'valid',
                    status: result.status,
                };
            } catch (error) {
                return {
                    email,
                    isValid: false,
                    error: error instanceof Error ? error.message : '验证失败',
                };
            }
        })
    );

    return {
        success: true,
        results,
    };
}

/**
 * 邮箱计数 - 获取域名下的邮箱数量
 */
export async function getEmailCount(domain: string): Promise<{
    success: boolean;
    data?: HunterEmailCountResult;
    error?: string;
}> {
    try {
        const client = getClient();
        const result = await client.emailCount({ domain });

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        console.error('[Hunter] 邮箱计数失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '获取失败',
        };
    }
}

/**
 * 获取账户信息和配额
 */
export async function getAccountInfo(): Promise<{
    success: boolean;
    data?: {
        email: string;
        firstName: string;
        lastName: string;
        planName: string;
        planLevel: number;
        resetDate: string;
        requests: {
            searches: { used: number; available: number };
            verifications: { used: number; available: number };
        };
    };
    error?: string;
}> {
    try {
        const client = getClient();
        const result = await client.getAccountInfo();

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        console.error('[Hunter] 获取账户信息失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '获取失败',
        };
    }
}
