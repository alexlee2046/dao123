
import {
    LeadContact,
    HunterDomainSearchParams,
    HunterEmailFinderParams,
    HunterVerifyParams,
    HunterEmailCountParams
} from './types';

export interface SearchProvider {
    name: string;

    /**
     * Check if the provider is available (e.g. API key is set)
     */
    isAvailable(): boolean;

    /**
     * Search for emails by domain
     */
    searchDomain(params: HunterDomainSearchParams): Promise<{
        success: boolean;
        contacts: LeadContact[];
        originalData?: any;
        error?: string;
    }>;

    /**
     * Find specific email by name and domain
     */
    findEmail(params: HunterEmailFinderParams): Promise<{
        success: boolean;
        contact?: LeadContact;
        originalData?: any;
        error?: string;
    }>;

    /**
     * Verify an email address
     */
    verifyEmail(params: HunterVerifyParams): Promise<{
        success: boolean;
        data?: any; // Using any for now to be flexible with provider results, or explicitly HunterVerifyResult
        error?: string;
    }>;
}
