'use server';

/**
 * Hunter.io Server Actions
 * 用于在服务端安全调用 Hunter.io API
 */

import { createHunterClient } from '@/lib/services/lead-search/hunter';
import { LeadContact, HunterEmailFinderResult, HunterVerifyResult, HunterEmailCountResult } from '@/lib/services/lead-search/types';
import { createSearchHistory } from '@/lib/services/lead-search/history';

const HUNTER_API_KEY = process.env.HUNTER_API_KEY!;

// 获取 Hunter 客户端
function getClient() {
    if (!HUNTER_API_KEY) {
        throw new Error('HUNTER_API_KEY 环境变量未设置');
    }
    return createHunterClient(HUNTER_API_KEY);
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
    contacts?: LeadContact[];
    error?: string;
    data?: any;
}> {
    try {
        const client = getClient();
        const response = await client.domainSearch(params);
        const contacts = client.domainSearchToLeadContacts(response.data);

        // 记录搜索历史
        await createSearchHistory({
            search_type: 'domain',
            query: params,
            result_summary: {
                total: response.meta?.results || 0,
                limit: response.meta?.limit || 0,
                offset: response.meta?.offset || 0,
                found_count: contacts.length,
            },
        });

        return {
            success: true,
            data: response.data,
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
        const response = await client.findEmail(params);

        if (!response) {
            return {
                success: false,
                error: '未找到匹配的邮箱地址',
            };
        }

        const contact = client.emailFinderToLeadContact(response.data);

        // 记录搜索历史
        await createSearchHistory({
            search_type: 'email',
            query: params,
            result_summary: {
                found: true,
                email: response.data.email,
                score: response.data.score,
                position: response.data.position,
                company: response.data.domain,
            },
        });

        return {
            success: true,
            data: response.data,
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
        const response = await client.verifyEmail({ email });
        const result = response.data;

        // 记录搜索历史
        await createSearchHistory({
            search_type: 'verify',
            query: { email },
            result_summary: {
                valid: result.status === 'valid',
                status: result.status,
                score: result.score,
            },
        });

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
                const response = await client.verifyEmail({ email });
                const result = response.data;
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
        const response = await client.emailCount({ domain });
        const result = response.data;

        // 记录搜索历史
        await createSearchHistory({
            search_type: 'count',
            query: { domain },
            result_summary: {
                total: result.total,
                personal: result.personalEmails,
                generic: result.genericEmails,
            },
        });

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
