import { createClient } from '@/lib/supabase/server';
import { hunter } from './hunter';
import { ContactResult, CompanyResult } from './types';

// Default provider is Hunter for now
const provider = hunter;

export async function searchCompany(domain: string): Promise<CompanyResult | null> {
    const supabase = await createClient();

    // 1. Local First
    const { data: localCompany } = await supabase
        .from('companies')
        .select('*')
        .eq('domain', domain)
        .single();

    if (localCompany) {
        return {
            ...localCompany,
            source: localCompany.source || 'local',
        };
    }

    // 2. External Fallback
    console.log(`[Adapter] Fetching company ${domain} from ${provider.name}...`);
    const externalCompany = await provider.searchCompany(domain);

    if (externalCompany) {
        // 3. Persist
        const { error } = await supabase.from('companies').upsert({
            domain: externalCompany.domain,
            name: externalCompany.name,
            industry: externalCompany.industry,
            size_range: externalCompany.size_range,
            description: externalCompany.description,
            source: externalCompany.source,
            raw_data: externalCompany.raw_data,
        });

        if (error) console.error('Failed to persist company:', error);

        return externalCompany;
    }

    return null;
}

export async function searchContacts(domain: string): Promise<ContactResult[]> {
    const supabase = await createClient();

    // 1. Get Company ID (Ensure it exists preferably)
    let companyId: string | null = null;
    const { data: localCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('domain', domain)
        .single();

    if (localCompany) {
        companyId = localCompany.id;

        // 2. Local Contacts Check
        const { data: localContacts } = await supabase
            .from('contacts')
            .select('*')
            .eq('company_id', companyId);

        if (localContacts && localContacts.length > 0) {
            return localContacts.map(c => ({
                email: c.email,
                first_name: c.first_name,
                last_name: c.last_name,
                position: c.position,
                confidence_score: c.confidence_score,
                is_verified: true, // simplified
                source: 'local',
                linkedin_url: null
            }));
        }
    }

    // 3. External Fallback
    console.log(`[Adapter] Fetching contacts for ${domain} from ${provider.name}...`);
    const externalContacts = await provider.searchContacts(domain);

    if (externalContacts.length > 0) {
        // Ensure company exists before inserting contacts
        if (!companyId) {
            // Need to fetch company data if we don't have it, or just create a skeleton
            const companyData = await searchCompany(domain);
            if (companyData) {
                // Fetch ID again because searchCompany doesn't return ID (it returns CompanyResult)
                const { data: newCompany } = await supabase
                    .from('companies')
                    .select('id')
                    .eq('domain', domain)
                    .single();
                companyId = newCompany?.id || null;
            }
        }

        if (companyId) {
            // 4. Persist Contacts
            // Use ignoreDuplicates or onConflict to update
            const contactsToInsert = externalContacts.map(c => ({
                company_id: companyId,
                email: c.email,
                first_name: c.first_name,
                last_name: c.last_name,
                position: c.position,
                confidence_score: c.confidence_score,
            }));

            const { error } = await supabase
                .from('contacts')
                .upsert(contactsToInsert, { onConflict: 'email' });

            if (error) console.error('Failed to persist contacts:', error);
        }
    }

    return externalContacts;
}
