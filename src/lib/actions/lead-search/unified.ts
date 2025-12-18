
'use server';

import { createUnifiedService } from '@/lib/services/lead-search/unified-service';
import { createSearchHistory, getSearchHistory } from '@/lib/services/lead-search/history';
import { HunterDomainSearchParams, HunterEmailFinderParams, HunterVerifyParams } from '@/lib/services/lead-search/types';

/**
 * Unified Search Actions
 */

export async function unifiedSearchDomain(params: HunterDomainSearchParams) {
    const service = createUnifiedService();
    const result = await service.searchDomain(params);

    // Log history (success or failure)
    await createSearchHistory({
        search_type: 'domain',
        query: params,
        result_summary: {
            provider: result.provider,
            success: result.success,
            found_count: result.data?.contacts?.length || 0,
            error: result.error
        }
    });

    return result;
}

export async function unifiedFindEmail(params: HunterEmailFinderParams) {
    const service = createUnifiedService();
    const result = await service.findEmail(params);

    // Log history
    await createSearchHistory({
        search_type: 'email',
        query: params,
        result_summary: {
            provider: result.provider,
            success: result.success,
            found: !!result.data?.contact,
            email: result.data?.contact?.email,
            error: result.error
        }
    });

    return result;
}

export async function unifiedVerifyEmail(params: HunterVerifyParams) {
    const service = createUnifiedService();
    const result = await service.verifyEmail(params);

    // Only log if specifically requested to avoid noise, or maybe log aggregated batch later
    await createSearchHistory({
        search_type: 'verify',
        query: params,
        result_summary: {
            provider: result.provider,
            success: result.success,
            status: result.data?.status,
            error: result.error
        }
    });

    return result;
}

export async function unifiedBatchVerifyEmails(emails: string[]) {
    // Limit concurrency to 5
    const BATCH_SIZE = 5;
    const results = [];

    // Process in chunks
    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
        const chunk = emails.slice(i, i + BATCH_SIZE);
        const chunkPromises = chunk.map(email => unifiedVerifyEmail({ email }));
        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);
    }

    return results;
}

import { getAccountInfo } from './hunter';

export async function getRecentSearches(limit = 10) {
    return await getSearchHistory(limit);
}

export async function unifiedGetAccountInfo() {
    // Currently only Hunter supports this, so we call it directly
    // In future, this could be aggregated across providers
    return await getAccountInfo();
}
