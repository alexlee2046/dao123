
import { SearchProvider } from '../provider';
import { createHunterClient, HunterClient } from '../hunter';
import {
    LeadContact,
    HunterDomainSearchParams,
    HunterEmailFinderParams,
    HunterVerifyParams
} from '../types';

export class HunterProvider implements SearchProvider {
    name = 'hunter';
    private client: HunterClient | null = null;
    private apiKey: string | undefined;

    constructor(apiKey?: string) {
        this.apiKey = apiKey;
        if (apiKey) {
            this.client = createHunterClient(apiKey);
        }
    }

    isAvailable(): boolean {
        return !!this.client;
    }

    async searchDomain(params: HunterDomainSearchParams): Promise<{
        success: boolean;
        contacts: LeadContact[];
        originalData?: any;
        error?: string;
    }> {
        if (!this.client) {
            return { success: false, contacts: [], error: 'Hunter provider not configured' };
        }

        try {
            const response = await this.client.domainSearch(params);
            const contacts = this.client.domainSearchToLeadContacts(response.data);
            return { success: true, contacts, originalData: response };
        } catch (error: any) {
            return { success: false, contacts: [], error: error.message };
        }
    }

    async findEmail(params: HunterEmailFinderParams): Promise<{
        success: boolean;
        contact?: LeadContact;
        originalData?: any;
        error?: string;
    }> {
        if (!this.client) {
            return { success: false, error: 'Hunter provider not configured' };
        }

        try {
            const response = await this.client.findEmail(params);
            if (!response) {
                return { success: false, error: 'Not found' };
            }
            const contact = this.client.emailFinderToLeadContact(response.data);
            return { success: true, contact, originalData: response };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async verifyEmail(params: HunterVerifyParams): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }> {
        if (!this.client) {
            return { success: false, error: 'Hunter provider not configured' };
        }

        try {
            const result = await this.client.verifyEmail(params);
            return { success: true, data: result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}
