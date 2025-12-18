/**
 * Hunter.io API 客户端
 * 文档: https://hunter.io/api-documentation/v2
 */

export {
    type HunterConfig,
    type HunterDomainSearchParams,
    type HunterDomainSearchResult,
    type HunterEmailFinderParams,
    type HunterEmailFinderResult,
    type HunterVerifyParams,
    type HunterVerifyResult,
    type HunterEmailCountParams,
    type HunterEmailCountResult,
    type HunterApiResponse,
} from './types';

import {
    HunterConfig,
    HunterDomainSearchParams,
    HunterDomainSearchResult,
    HunterEmailFinderParams,
    HunterEmailFinderResult,
    HunterVerifyParams,
    HunterVerifyResult,
    HunterEmailCountParams,
    HunterEmailCountResult,
    HunterApiResponse,
    LeadContact,
    LeadCompany,
} from './types';

const DEFAULT_BASE_URL = 'https://api.hunter.io/v2';

export class HunterClient {
    private apiKey: string;
    private baseUrl: string;

    constructor(config: HunterConfig) {
        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    }

    /**
     * 发送 API 请求
     */
    private async request<T>(
        endpoint: string,
        params: Record<string, unknown> = {}
    ): Promise<HunterApiResponse<T>> {
        const url = new URL(`${this.baseUrl}${endpoint}`);

        // 添加 API Key
        url.searchParams.set('api_key', this.apiKey);

        // 添加其他参数
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    value.forEach(v => url.searchParams.append(key, String(v)));
                } else {
                    url.searchParams.set(key, String(value));
                }
            }
        });

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        const responseData = await response.json().catch(() => ({}));

        if (!response.ok) {
            const errorDetails = responseData.errors?.[0]?.details || '';

            // 特殊处理计划限制错误，让用户知道这是免费计划的限制
            if (errorDetails.includes('limited') || errorDetails.includes('plan')) {
                throw new Error(`免费计划限制: ${errorDetails}。请升级到付费计划以获取更多数据。`);
            }

            throw new Error(
                errorDetails ||
                `Hunter API error: ${response.status} ${response.statusText}`
            );
        }

        return responseData;
    }

    /**
     * 域名搜索 - 获取一个域名下的所有邮箱
     * @param params 搜索参数
     * @returns 域名搜索结果
     */
    async domainSearch(params: HunterDomainSearchParams): Promise<HunterApiResponse<HunterDomainSearchResult>> {
        const response = await this.request<any>('/domain-search', {
            domain: params.domain,
            limit: params.limit || 10,
            offset: params.offset || 0,
            type: params.type,
            seniority: params.seniority,
            department: params.department,
        });

        return {
            ...response,
            data: this.transformDomainSearchResult(response.data)
        };
    }

    /**
     * 邮箱查找 - 按姓名和域名查找邮箱
     * @param params 查找参数
     * @returns 邮箱查找结果
     */
    async findEmail(params: HunterEmailFinderParams): Promise<HunterApiResponse<HunterEmailFinderResult> | null> {
        try {
            const requestParams: Record<string, unknown> = {
                domain: params.domain,
            };

            if (params.fullName) {
                requestParams.full_name = params.fullName;
            } else {
                if (params.firstName) requestParams.first_name = params.firstName;
                if (params.lastName) requestParams.last_name = params.lastName;
            }

            if (params.maxDuration) {
                requestParams.max_duration = params.maxDuration;
            }

            const response = await this.request<any>('/email-finder', requestParams);
            return {
                ...response,
                data: this.transformEmailFinderResult(response.data)
            };
        } catch (error) {
            // 如果未找到邮箱，返回 null 而不是抛出错误
            if (error instanceof Error && error.message.includes('email address was not found')) {
                return null;
            }
            throw error;
        }
    }

    /**
     * 邮箱验证 - 验证邮箱是否有效
     * @param params 验证参数
     * @returns 验证结果
     */
    async verifyEmail(params: HunterVerifyParams): Promise<HunterApiResponse<HunterVerifyResult>> {
        const response = await this.request<any>('/email-verifier', {
            email: params.email,
        });

        return {
            ...response,
            data: this.transformVerifyResult(response.data)
        };
    }

    /**
     * 邮箱计数 - 获取域名下的邮箱数量
     * @param params 计数参数
     * @returns 计数结果
     */
    async emailCount(params: HunterEmailCountParams): Promise<HunterApiResponse<HunterEmailCountResult>> {
        const response = await this.request<any>('/email-count', {
            domain: params.domain,
            type: params.type,
        });

        return {
            ...response,
            data: this.transformEmailCountResult(response.data)
        };
    }

    /**
     * 获取账户信息
     */
    async getAccountInfo(): Promise<{
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
    }> {
        const response = await this.request<any>('/account');
        const data = response.data;

        return {
            email: data.email,
            firstName: data.first_name,
            lastName: data.last_name,
            planName: data.plan_name,
            planLevel: data.plan_level,
            resetDate: data.reset_date,
            requests: {
                searches: data.requests?.searches || { used: 0, available: 0 },
                verifications: data.requests?.verifications || { used: 0, available: 0 },
            },
        };
    }

    // ============== 数据转换方法 ==============

    private transformDomainSearchResult(data: any): HunterDomainSearchResult {
        return {
            domain: data.domain,
            disposable: data.disposable,
            webmail: data.webmail,
            acceptAll: data.accept_all,
            pattern: data.pattern,
            organization: data.organization,
            country: data.country,
            state: data.state,
            city: data.city,
            emails: (data.emails || []).map((email: any) => ({
                value: email.value,
                type: email.type,
                confidence: email.confidence,
                firstName: email.first_name,
                lastName: email.last_name,
                position: email.position,
                seniority: email.seniority,
                department: email.department,
                linkedin: email.linkedin,
                twitter: email.twitter,
                phoneNumber: email.phone_number,
                sources: (email.sources || []).map((src: any) => ({
                    domain: src.domain,
                    uri: src.uri,
                    extractedOn: src.extracted_on,
                    lastSeenOn: src.last_seen_on,
                    stillOnPage: src.still_on_page,
                })),
                verification: email.verification ? {
                    date: email.verification.date,
                    status: email.verification.status,
                } : undefined,
            })),
            linkedDomains: data.linked_domains,
        };
    }

    private transformEmailFinderResult(data: any): HunterEmailFinderResult {
        return {
            email: data.email,
            score: data.score,
            domain: data.domain,
            acceptAll: data.accept_all,
            position: data.position,
            twitter: data.twitter,
            linkedinUrl: data.linkedin_url,
            firstName: data.first_name,
            lastName: data.last_name,
            sources: (data.sources || []).map((src: any) => ({
                domain: src.domain,
                uri: src.uri,
                extractedOn: src.extracted_on,
                lastSeenOn: src.last_seen_on,
                stillOnPage: src.still_on_page,
            })),
            verification: data.verification ? {
                date: data.verification.date,
                status: data.verification.status,
            } : undefined,
        };
    }

    private transformVerifyResult(data: any): HunterVerifyResult {
        return {
            email: data.email,
            status: data.status,
            score: data.score,
            regexp: data.regexp,
            gibberish: data.gibberish,
            disposable: data.disposable,
            webmail: data.webmail,
            mxRecords: data.mx_records,
            smtpServer: data.smtp_server,
            smtpCheck: data.smtp_check,
            acceptAll: data.accept_all,
            block: data.block,
            sources: (data.sources || []).map((src: any) => ({
                domain: src.domain,
                uri: src.uri,
                extractedOn: src.extracted_on,
                lastSeenOn: src.last_seen_on,
                stillOnPage: src.still_on_page,
            })),
        };
    }

    private transformEmailCountResult(data: any): HunterEmailCountResult {
        return {
            total: data.total,
            personalEmails: data.personal_emails,
            genericEmails: data.generic_emails,
            department: data.department,
            seniority: data.seniority,
        };
    }

    // ============== 转换为通用格式 ==============

    /**
     * 将 Hunter 搜索结果转换为通用联系人格式
     */
    domainSearchToLeadContacts(result: HunterDomainSearchResult): LeadContact[] {
        const company: LeadCompany = {
            name: result.organization,
            domain: result.domain,
            website: `https://${result.domain}`,
            country: result.country,
            location: [result.city, result.state, result.country].filter(Boolean).join(', '),
        };

        return result.emails.map(email => ({
            firstName: email.firstName,
            lastName: email.lastName,
            fullName: [email.firstName, email.lastName].filter(Boolean).join(' '),
            email: email.value,
            phone: email.phoneNumber,
            position: email.position,
            department: email.department,
            linkedin: email.linkedin,
            twitter: email.twitter,
            company,
            source: 'hunter' as const,
            confidence: email.confidence,
            emailVerified: email.verification?.status === 'valid',
            emailVerificationStatus: email.verification?.status,
        }));
    }

    /**
     * 将邮箱查找结果转换为通用联系人格式
     */
    emailFinderToLeadContact(result: HunterEmailFinderResult, companyName?: string): LeadContact {
        return {
            firstName: result.firstName,
            lastName: result.lastName,
            fullName: [result.firstName, result.lastName].filter(Boolean).join(' '),
            email: result.email,
            position: result.position,
            linkedin: result.linkedinUrl,
            twitter: result.twitter,
            company: {
                domain: result.domain,
                website: `https://${result.domain}`,
                name: companyName,
            },
            source: 'hunter',
            confidence: result.score,
            emailVerified: result.verification?.status === 'valid',
            emailVerificationStatus: result.verification?.status,
        };
    }
}

/**
 * 创建 Hunter 客户端实例
 */
export function createHunterClient(apiKey?: string): HunterClient {
    const key = apiKey || process.env.HUNTER_API_KEY;

    if (!key) {
        throw new Error('Hunter API key is required. Set HUNTER_API_KEY environment variable.');
    }

    return new HunterClient({ apiKey: key });
}

// 默认导出单例（使用环境变量中的 API Key）
let defaultClient: HunterClient | null = null;

export function getHunterClient(): HunterClient {
    if (!defaultClient) {
        defaultClient = createHunterClient();
    }
    return defaultClient;
}
