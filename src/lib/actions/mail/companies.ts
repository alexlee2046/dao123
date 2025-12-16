'use server'

import { searchCompany as adapterSearchCompany } from '@/lib/mail/data-adapter';

export async function searchCompanyAction(domain: string) {
    try {
        const company = await adapterSearchCompany(domain);
        return company;
    } catch (error) {
        console.error('Search Company Error:', error);
        return null;
    }
}
