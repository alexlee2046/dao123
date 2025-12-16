
interface VercelDomainResponse {
    name: string;
    apexName: string;
    projectId: string;
    redirect?: string | null;
    redirectStatusCode?: number | null;
    gitBranch?: string | null;
    updatedAt?: number;
    createdAt?: number;
    verified: boolean;
    verification?: {
        type: string;
        domain: string;
        value: string;
        reason: string;
    }[];
    error?: {
        code: string;
        message: string;
    };
}

interface VercelDomainConfigResponse {
    configuredBy?: string[];
    acceptedChallenges?: string[];
    misconfigured: boolean;
}

interface VercelDomainVerifyResponse {
    name: string;
    apexName: string;
    projectId: string;
    verified: boolean;
    verification?: {
        type: string;
        domain: string;
        value: string;
        reason: string;
    }[];
}


const VERCEL_API_URL = 'https://api.vercel.com/v9';

export class VercelClient {
    private token: string;
    private projectId: string;
    private teamId?: string;

    constructor() {
        this.token = process.env.VERCEL_API_TOKEN || '';
        this.projectId = process.env.VERCEL_PROJECT_ID || '';
        this.teamId = process.env.VERCEL_TEAM_ID;

        if (!this.token || !this.projectId) {
            console.error('Missing VERCEL_API_TOKEN or VERCEL_PROJECT_ID environment variables');
        }
    }

    private getHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
        };
    }

    private getUrl(path: string, params?: Record<string, string>) {
        const url = new URL(`${VERCEL_API_URL}${path}`);
        if (this.teamId) {
            url.searchParams.append('teamId', this.teamId);
        }
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });
        }
        return url.toString();
    }

    /**
     * Add a domain to the Vercel project
     */
    async addDomain(domain: string): Promise<VercelDomainResponse> {
        const url = this.getUrl(`/projects/${this.projectId}/domains`);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ name: domain }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Failed to add domain');
            }

            return data;
        } catch (error) {
            console.error('Error adding domain to Vercel:', error);
            throw error;
        }
    }

    /**
     * Remove a domain from the Vercel project
     */
    async removeDomain(domain: string): Promise<void> {
        const url = this.getUrl(`/projects/${this.projectId}/domains/${domain}`);

        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: this.getHeaders(),
            });

            const data = await response.json();

            if (!response.ok) { // 404 is fine (already deleted) but others are not
                if (response.status !== 404) {
                    throw new Error(data.error?.message || 'Failed to remove domain');
                }
            }
        } catch (error) {
            console.error('Error removing domain from Vercel:', error);
            throw error;
        }
    }

    /**
     * Get domain configuration status
     */
    async getDomainConfig(domain: string): Promise<VercelDomainConfigResponse> {
        const url = this.getUrl(`/projects/${this.projectId}/domains/${domain}/config`);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error?.message || 'Failed to get domain config');
            }
            return data;
        } catch (error) {
            console.error('Error getting domain config:', error);
            throw error;
        }
    }

    /**
     * Verify a domain
     */
    async verifyDomain(domain: string): Promise<VercelDomainVerifyResponse> {
        const url = this.getUrl(`/projects/${this.projectId}/domains/${domain}/verify`);

        try {
            const response = await fetch(url, {
                method: 'POST', // Vercel documentation says POST for verify
                headers: this.getHeaders(),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error?.message || 'Failed to verify domain');
            }
            return data;
        } catch (error) {
            console.error('Error verifying domain:', error);
            throw error;
        }
    }
}
