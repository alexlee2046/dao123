
import { SearchProvider } from './provider';
import { HunterProvider } from './providers/hunter-provider';
import {
    LeadContact,
    HunterDomainSearchParams,
    HunterEmailFinderParams,
    HunterVerifyParams
} from './types';

interface UnifiedSearchResult<T> {
    success: boolean;
    data?: T;
    provider: string;
    error?: string;
}

export class UnifiedSearchService {
    private providers: SearchProvider[] = [];

    constructor(providers: SearchProvider[]) {
        this.providers = providers;
    }

    /**
     * Get the best available provider for a specific task
     * Currently defaults to the first available one (Hunter)
     */
    private getProvider(): SearchProvider | null {
        return this.providers.find(p => p.isAvailable()) || null;
    }

    async searchDomain(params: HunterDomainSearchParams): Promise<UnifiedSearchResult<{ contacts: LeadContact[], meta: any }>> {
        const provider = this.getProvider();
        if (!provider) {
            return {
                success: false,
                provider: 'none',
                error: 'No search providers configured'
            };
        }

        const result = await provider.searchDomain(params);
        return {
            success: result.success,
            provider: provider.name,
            data: result.success ? {
                contacts: result.contacts,
                meta: result.originalData
            } : undefined,
            error: result.error
        };
    }

    async findEmail(params: HunterEmailFinderParams): Promise<UnifiedSearchResult<{ contact: LeadContact, meta: any }>> {
        const provider = this.getProvider();
        if (!provider) {
            return {
                success: false,
                provider: 'none',
                error: 'No search providers configured'
            };
        }

        const result = await provider.findEmail(params);
        return {
            success: result.success,
            provider: provider.name,
            data: (result.success && result.contact) ? {
                contact: result.contact,
                meta: result.originalData
            } : undefined,
            error: result.error
        };
    }

    async verifyEmail(params: HunterVerifyParams): Promise<UnifiedSearchResult<{ status: any, meta: any }>> {
        const provider = this.getProvider();
        if (!provider) {
            return {
                success: false,
                provider: 'none',
                error: 'No search providers configured'
            };
        }

        const result = await provider.verifyEmail(params);
        return {
            success: result.success,
            provider: provider.name,
            data: result.success ? {
                status: result.data,
                meta: result.data
            } : undefined,
            error: result.error
        };
    }
}

// Factory to create the default service instance
export function createUnifiedService(): UnifiedSearchService {
    const hunterApiKey = process.env.HUNTER_API_KEY;
    const providers = [
        new HunterProvider(hunterApiKey),
        // Future: new ApolloProvider(apolloKey),
        // Future: new ProxycurlProvider(proxycurlKey),
    ];
    return new UnifiedSearchService(providers);
}
