'use server'

import { searchCompany, searchContacts } from '@/lib/mail/data-adapter';
import { CompanyResult, ContactResult } from '@/lib/mail/data-adapter/types';

export interface SearchResult {
    company: CompanyResult | null;
    contacts: ContactResult[];
    error?: string;
}

/**
 * 搜索公司和联系人
 */
export async function searchDomainAction(domain: string): Promise<SearchResult> {
    if (!domain || domain.trim() === '') {
        return { company: null, contacts: [], error: 'Domain is required' };
    }

    // 清理域名格式
    let cleanDomain = domain.trim().toLowerCase();
    // 移除 http://, https://, www. 前缀
    cleanDomain = cleanDomain.replace(/^(https?:\/\/)?(www\.)?/, '');
    // 移除末尾的斜杠和路径
    cleanDomain = cleanDomain.split('/')[0];

    try {
        // 并行搜索公司和联系人
        const [company, contacts] = await Promise.all([
            searchCompany(cleanDomain),
            searchContacts(cleanDomain)
        ]);

        return { company, contacts };
    } catch (error) {
        console.error('Search Domain Error:', error);
        return {
            company: null,
            contacts: [],
            error: error instanceof Error ? error.message : 'Search failed'
        };
    }
}
