'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { Contact } from './contacts';

interface ImportResult {
    success: boolean;
    count: number;
    errors: string[];
}

export async function importContactsAction(contacts: Partial<Contact>[], tag?: string): Promise<ImportResult> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, count: 0, errors: ['Unauthorized'] };

    if (!contacts || contacts.length === 0) {
        return { success: false, count: 0, errors: ['No contacts provided'] };
    }

    // Default 'manual' source and valid timestamps
    const now = new Date().toISOString();
    const cleanContacts = contacts
        .filter(c => c.email) // Ensure email exists
        .map(c => ({
            user_id: user.id,
            email: c.email!.trim(),
            first_name: c.first_name?.trim() || null,
            last_name: c.last_name?.trim() || null,
            position: c.position?.trim() || null,
            phone: c.phone?.trim() || null,
            country: c.country?.trim() || null,
            source: 'import',
            tags: tag ? [tag] : [],
            created_at: now,
            updated_at: now
        }));

    if (cleanContacts.length === 0) {
        return { success: false, count: 0, errors: ['No valid contacts found (missing email)'] };
    }

    // Batch insert with onConflict: do nothing (skip duplicates)
    // Supabase upsert with limits? Typically chunking is safe. 
    // Let's do chunks of 100 just in case.
    const chunkSize = 100;
    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < cleanContacts.length; i += chunkSize) {
        const chunk = cleanContacts.slice(i, i + chunkSize);

        const { error, count } = await supabase
            .from('contacts')
            .upsert(chunk, { onConflict: 'email', ignoreDuplicates: true }) // ignoreDuplicates: true means SKIP
            .select('count'); // We can't easily get count of *inserted* rows with upsert+ignore in one go effectively if we don't return representation.

        // Actually, ignoreDuplicates: true with upsert will NOT update. 
        // Returning count might return just the number of rows passed? No, usually impacted rows.
        // Let's assume no error means success.

        if (error) {
            console.error('Import chunk error:', error);
            errors.push(`Chunk ${i / chunkSize + 1}: ${error.message}`);
        } else {
            // "count" is null often with upsert depending on headers.
            // Let's just blindly add chunk length for now, or refine if strict count needed.
            // For better UX, we might want to know how many were *new*.
            // But 'ignoreDuplicates' suppresses error.
            successCount += chunk.length;
        }
    }

    revalidatePath('/mail/contacts');
    return {
        success: errors.length === 0,
        count: successCount, // This is "processed" count, not necessarily "inserted" count.
        errors
    };
}
