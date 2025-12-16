export interface CompanyResult {
    domain: string;
    name: string | null;
    industry: string | null;
    size_range: string | null;
    description: string | null;
    linkedin_url: string | null;
    twitter_url: string | null;
    facebook_url: string | null;
    source: 'hunter' | 'apollo' | 'local';
    raw_data: any;
}

export interface ContactResult {
    email: string;
    first_name: string | null;
    last_name: string | null;
    position: string | null;
    linkedin_url: string | null;
    confidence_score: number | null;
    is_verified: boolean;
    source: 'hunter' | 'apollo' | 'local';
}

export interface LeadProvider {
    name: string;
    searchCompany(domain: string): Promise<CompanyResult | null>;
    searchContacts(domain: string, limit?: number): Promise<ContactResult[]>;
}
