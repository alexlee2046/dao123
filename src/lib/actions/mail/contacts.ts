'use server'

import { createClient } from '@/lib/supabase/server';
import { searchContacts as adapterSearchContacts } from '@/lib/mail/data-adapter';
import { deductMailCredits } from './credits';
import { revalidatePath } from 'next/cache';

// Contact type matching DB schema
export interface Contact {
    id: string;
    user_id?: string;
    company_name?: string; // Enhanced property
    email: string;
    first_name: string | null;
    last_name: string | null;
    position: string | null;
    phone?: string | null;
    country?: string | null;
    tags?: string[];
    source?: string;
    confidence_score?: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface ContactFilters {
    search?: string;
    tags?: string[];
    source?: string;
    limit?: number;
    offset?: number;
    pageSize?: number; // Alias for limit
}

function maskEmail(email: string) {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

/**
 * 获取当前用户的所有联系人
 */
export async function getContacts(filters?: ContactFilters): Promise<{ contacts: Contact[]; total: number }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { contacts: [], total: 0 };

    let query = supabase
        .from('contacts')
        .select('*', { count: 'exact' });

    // Apply filters
    if (filters?.search) {
        query = query.or(`email.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`);
    }

    if (filters?.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
    }

    if (filters?.source) {
        query = query.eq('source', filters.source);
    }

    // Pagination
    const limit = filters?.limit || filters?.pageSize || 50;
    const offset = filters?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    // Order by created_at desc
    query = query.order('created_at', { ascending: false });

    const { data, count, error } = await query;

    if (error) {
        console.error('Error fetching contacts:', error);
        return { contacts: [], total: 0 };
    }

    return { contacts: data || [], total: count || 0 };
}

/**
 * 创建新联系人
 */
export async function createContact(contact: Partial<Contact>): Promise<{ success: boolean; id?: string; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    if (!contact.email) return { success: false, error: 'Email is required' };

    const { data, error } = await supabase
        .from('contacts')
        .insert({
            user_id: user.id,
            email: contact.email,
            first_name: contact.first_name,
            last_name: contact.last_name,
            position: contact.position,
            phone: contact.phone,
            country: contact.country,
            tags: contact.tags || [],
            source: contact.source || 'manual',
        })
        .select('id')
        .single();

    if (error) {
        if (error.code === '23505') {
            return { success: false, error: 'Contact with this email already exists' };
        }
        return { success: false, error: error.message };
    }

    revalidatePath('/mail/contacts');
    return { success: true, id: data?.id };
}

/**
 * 更新联系人
 */
export async function updateContact(id: string, updates: Partial<Contact>): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    const { error } = await supabase
        .from('contacts')
        .update({
            first_name: updates.first_name,
            last_name: updates.last_name,
            position: updates.position,
            phone: updates.phone,
            country: updates.country,
            tags: updates.tags,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/mail/contacts');
    return { success: true };
}

/**
 * 删除联系人
 */
export async function deleteContact(id: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/mail/contacts');
    return { success: true };
}

/**
 * 批量删除联系人
 */
export async function bulkDeleteContacts(ids: string[]): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    const { error } = await supabase
        .from('contacts')
        .delete()
        .in('id', ids);

    if (error) return { success: false, error: error.message };

    revalidatePath('/mail/contacts');
    return { success: true };
}

/**
 * 批量添加标签
 */
export async function bulkAddTags(ids: string[], tags: string[]): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    // Fetch existing contacts to merge tags
    const { data: contacts, error: fetchError } = await supabase
        .from('contacts')
        .select('id, tags')
        .in('id', ids);

    if (fetchError) return { success: false, error: fetchError.message };

    // Update each contact with merged tags
    const updates = (contacts || []).map(contact => ({
        id: contact.id,
        tags: [...new Set([...(contact.tags || []), ...tags])],
        updated_at: new Date().toISOString(),
    }));

    for (const update of updates) {
        await supabase
            .from('contacts')
            .update({ tags: update.tags, updated_at: update.updated_at })
            .eq('id', update.id);
    }

    revalidatePath('/mail/contacts');
    return { success: true };
}

// ============ Original Functions (Preserved) ============

export async function searchContactsAction(domain: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Fetch raw data from adapter (Local -> External)
    const contacts = await adapterSearchContacts(domain);

    if (!contacts || contacts.length === 0) return [];

    if (!user) {
        // Visitor: all masked
        return contacts.map(c => ({
            ...c,
            email: maskEmail(c.email),
            is_unlocked: false
        }));
    }

    // 2. Check Unlock Status
    const emails = contacts.map(c => c.email);
    const { data: dbContacts } = await supabase
        .from('contacts')
        .select('id, email')
        .in('email', emails);

    if (!dbContacts) return contacts.map(c => ({ ...c, email: maskEmail(c.email), is_unlocked: false }));

    const contactIds = dbContacts.map(c => c.id);

    const { data: unlocked } = await supabase
        .from('unlocked_contacts')
        .select('contact_id')
        .eq('user_id', user.id)
        .in('contact_id', contactIds);

    const unlockedSet = new Set(unlocked?.map(u => u.contact_id));

    // 3. Merge and Mask
    return contacts.map(c => {
        const dbContact = dbContacts.find(db => db.email === c.email);
        const isUnlocked = dbContact ? unlockedSet.has(dbContact.id) : false;

        return {
            ...c,
            id: dbContact?.id,
            email: isUnlocked ? c.email : maskEmail(c.email),
            is_unlocked: isUnlocked
        };
    });
}

export async function unlockContactAction(contactId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // 1. Check if already unlocked
    const { data: existing } = await supabase
        .from('unlocked_contacts')
        .select('*')
        .eq('user_id', user.id)
        .eq('contact_id', contactId)
        .single();

    if (existing) return { success: true, message: 'Already unlocked' };

    // 2. Deduct Credit
    await deductMailCredits(1, `Unlock contact ${contactId}`);

    // 3. Record Unlock
    const { error } = await supabase
        .from('unlocked_contacts')
        .insert({
            user_id: user.id,
            contact_id: contactId
        });

    if (error) throw new Error(error.message);

    revalidatePath('/mail');
    return { success: true };
}
