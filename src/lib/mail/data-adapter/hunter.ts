import { ContactResult, CompanyResult, LeadProvider } from './types';

export class HunterAdapter implements LeadProvider {
    name = 'hunter';
    private apiKey: string;
    private baseUrl = 'https://api.hunter.io/v2';

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.HUNTER_API_KEY || '';
    }

    private async fetch(endpoint: string, params: Record<string, string>) {
        if (!this.apiKey) {
            console.warn('Hunter API Key is missing');
            return null;
        }

        const searchParams = new URLSearchParams({
            api_key: this.apiKey,
            ...params,
        });

        try {
            const res = await fetch(`${this.baseUrl}${endpoint}?${searchParams.toString()}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!res.ok) {
                if (res.status === 401) throw new Error('Invalid Hunter API Key');
                if (res.status === 429) throw new Error('Hunter API Rate Limit Exceeded');
                return null; // Handle 404 or other errors gracefully
            }

            return await res.json();
        } catch (error) {
            console.error('Hunter API Error:', error);
            return null;
        }
    }

    async searchCompany(domain: string): Promise<CompanyResult | null> {
        // Hunter's Domain Search endpoint returns company info along with emails
        // We utilize query parameters to just fetch 1 email to minimize cost/latency if possible,
        // but Hunter is primarily email-focused.
        // For "Company Info", Hunter isn't the best source compared to Apollo, but we do our best.
        const data = await this.fetch('/domain-search', { domain, limit: '1' });

        if (!data?.data) return null;

        const { organization, emails } = data.data;

        // If Hunter doesn't recognize the domain, it might return empty logic
        if (!organization && (!emails || emails.length === 0)) return null;

        return {
            domain,
            name: organization || domain, // Hunter doesn't always provide rich company data
            industry: null, // Hunter doesn't provide industry 
            size_range: null,
            description: null,
            linkedin_url: null,
            twitter_url: null,
            facebook_url: null,
            source: 'hunter',
            raw_data: data.data,
        };
    }

    async searchContacts(domain: string, limit = 10): Promise<ContactResult[]> {
        const data = await this.fetch('/domain-search', { domain, limit: String(limit) });

        if (!data?.data?.emails) return [];

        return data.data.emails.map((email: any) => ({
            email: email.value,
            first_name: email.first_name,
            last_name: email.last_name,
            position: email.position,
            linkedin_url: email.linkedin,
            confidence_score: email.confidence,
            is_verified: email.verification?.status === 'valid', // Simplification
            source: 'hunter',
        }));
    }
}

export const hunter = new HunterAdapter();
