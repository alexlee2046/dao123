'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { SegmentRule } from '@/lib/mail/segments/evaluator';

export async function getSegments() {
    const supabase = await createClient();
    const { data } = await supabase
        .from('segments')
        .select('*')
        .order('created_at', { ascending: false });
    return data || [];
}

export async function createSegment(name: string, rules: SegmentRule) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase.from('segments').insert({
        user_id: user.id,
        name,
        rules
    });

    if (error) throw new Error(error.message);
    revalidatePath('/mail/segments');
    return { success: true };
}

export async function deleteSegment(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('segments').delete().eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/mail/segments');
    return { success: true };
}
