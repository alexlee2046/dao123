/**
 * 多渠道线索搜索 - 通用类型定义
 */

// ============== 通用类型 ==============

export type LeadSource = 'hunter' | 'apollo' | 'proxycurl' | 'clearbit' | 'manual';

export type EmailVerificationStatus =
    | 'valid'
    | 'invalid'
    | 'accept_all'
    | 'webmail'
    | 'disposable'
    | 'unknown';

export interface LeadContact {
    id?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    position?: string;
    department?: string;
    linkedin?: string;
    twitter?: string;
    company?: LeadCompany;
    source: LeadSource;
    confidence?: number; // 0-100
    emailVerified?: boolean;
    emailVerificationStatus?: EmailVerificationStatus;
    createdAt?: Date;
}

export interface LeadCompany {
    name?: string;
    domain?: string;
    website?: string;
    industry?: string;
    size?: string;
    location?: string;
    country?: string;
    description?: string;
    logo?: string;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
}

// ============== Hunter.io 类型 ==============

export interface HunterConfig {
    apiKey: string;
    baseUrl?: string;
}

// Domain Search
export interface HunterDomainSearchParams {
    domain: string;
    limit?: number;
    offset?: number;
    type?: 'personal' | 'generic';
    seniority?: string[];
    department?: string[];
}

export interface HunterDomainSearchResult {
    domain: string;
    disposable: boolean;
    webmail: boolean;
    acceptAll: boolean;
    pattern?: string;
    organization?: string;
    country?: string;
    state?: string;
    city?: string;
    emails: HunterEmail[];
    linkedDomains?: string[];
}

export interface HunterEmail {
    value: string;
    type: 'personal' | 'generic';
    confidence: number;
    sources: HunterSource[];
    firstName?: string;
    lastName?: string;
    position?: string;
    seniority?: string;
    department?: string;
    linkedin?: string;
    twitter?: string;
    phoneNumber?: string;
    verification?: HunterVerification;
}

export interface HunterSource {
    domain: string;
    uri: string;
    extractedOn: string;
    lastSeenOn: string;
    stillOnPage: boolean;
}

export interface HunterVerification {
    date: string;
    status: EmailVerificationStatus;
}

// Email Finder
export interface HunterEmailFinderParams {
    domain: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    maxDuration?: number;
}

export interface HunterEmailFinderResult {
    email: string;
    score: number;
    domain: string;
    acceptAll: boolean;
    position?: string;
    twitter?: string;
    linkedinUrl?: string;
    firstName: string;
    lastName: string;
    sources: HunterSource[];
    verification?: HunterVerification;
}

// Email Verifier
export interface HunterVerifyParams {
    email: string;
}

export interface HunterVerifyResult {
    email: string;
    status: EmailVerificationStatus;
    score: number;
    regexp: boolean;
    gibberish: boolean;
    disposable: boolean;
    webmail: boolean;
    mxRecords: boolean;
    smtpServer: boolean;
    smtpCheck: boolean;
    acceptAll: boolean;
    block: boolean;
    sources: HunterSource[];
}

// Email Count
export interface HunterEmailCountParams {
    domain: string;
    type?: 'personal' | 'generic';
}

export interface HunterEmailCountResult {
    total: number;
    personalEmails: number;
    genericEmails: number;
    department?: Record<string, number>;
    seniority?: Record<string, number>;
}

// API Response Wrapper
export interface HunterApiResponse<T> {
    data: T;
    meta?: {
        results: number;
        limit: number;
        offset: number;
        params: Record<string, unknown>;
    };
    errors?: HunterError[];
}

export interface HunterError {
    id: string;
    code: number;
    details: string;
}

// ============== Apollo.io 类型 ==============

export interface ApolloConfig {
    apiKey: string;
    baseUrl?: string;
}

export interface ApolloPeopleSearchParams {
    q_keywords?: string;
    person_titles?: string[];
    person_seniorities?: string[];
    organization_domains?: string[];
    organization_locations?: string[];
    organization_num_employees_ranges?: string[];
    per_page?: number;
    page?: number;
}

export interface ApolloPersonResult {
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    email?: string;
    emailStatus?: string;
    title?: string;
    seniority?: string;
    departments?: string[];
    linkedinUrl?: string;
    twitterUrl?: string;
    phoneNumbers?: { sanitized_number: string; type: string }[];
    organization?: ApolloOrganization;
}

export interface ApolloOrganization {
    id: string;
    name: string;
    domain?: string;
    websiteUrl?: string;
    blogUrl?: string;
    linkedinUrl?: string;
    twitterUrl?: string;
    facebookUrl?: string;
    primaryPhone?: string;
    industry?: string;
    keywords?: string[];
    estimatedNumEmployees?: number;
    city?: string;
    state?: string;
    country?: string;
    logoUrl?: string;
}

// ============== Proxycurl 类型 ==============

export interface ProxycurlConfig {
    apiKey: string;
    baseUrl?: string;
}

export interface ProxycurlPersonParams {
    linkedinProfileUrl: string;
    fallbackToCache?: boolean;
    useCache?: boolean;
    skills?: boolean;
    inferSalary?: boolean;
    personalEmail?: boolean;
    personalContactNumber?: boolean;
}

export interface ProxycurlPersonResult {
    publicIdentifier: string;
    profilePicUrl?: string;
    firstName: string;
    lastName: string;
    fullName: string;
    headline?: string;
    summary?: string;
    occupation?: string;
    countryFullName?: string;
    city?: string;
    state?: string;
    experiences?: ProxycurlExperience[];
    education?: ProxycurlEducation[];
    skills?: string[];
    inferredSalary?: { min: number; max: number };
    personalEmails?: string[];
    personalNumbers?: string[];
}

export interface ProxycurlExperience {
    title: string;
    company: string;
    companyLinkedinProfileUrl?: string;
    location?: string;
    description?: string;
    startsAt?: { year: number; month?: number };
    endsAt?: { year: number; month?: number };
}

export interface ProxycurlEducation {
    school: string;
    schoolLinkedinProfileUrl?: string;
    degree?: string;
    fieldOfStudy?: string;
    startsAt?: { year: number };
    endsAt?: { year: number };
}

// ============== 统一搜索类型 ==============

export interface UnifiedSearchParams {
    query: string;
    sources?: LeadSource[];
    filters?: {
        domain?: string;
        industry?: string[];
        location?: string[];
        seniority?: string[];
        department?: string[];
        companySize?: string[];
    };
    limit?: number;
    offset?: number;
}

export interface UnifiedSearchResult {
    contacts: LeadContact[];
    total: number;
    sources: Record<LeadSource, number>;
    cached?: boolean;
}

// ============== 搜索历史 ==============

export interface SearchHistory {
    id: string;
    userId: string;
    query: string;
    source: LeadSource;
    params: Record<string, unknown>;
    resultsCount: number;
    createdAt: Date;
}
