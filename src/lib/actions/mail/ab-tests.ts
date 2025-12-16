'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getABTests() {
    const supabase = await createClient();
    const { data } = await supabase
        .from('ab_tests')
        .select('*')
        .order('created_at', { ascending: false });
    return data || [];
}

export async function createABTest(name: string, campaignId: string, variants: any[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase.from('ab_tests').insert({
        user_id: user.id,
        name,
        campaign_id: campaignId,
        variants,
        status: 'draft'
    });

    if (error) throw new Error(error.message);
    revalidatePath('/mail/ab-tests');
    return { success: true };
}
