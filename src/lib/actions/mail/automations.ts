'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getAutomations() {
    const supabase = await createClient();
    const { data } = await supabase
        .from('automations')
        .select('*')
        .order('created_at', { ascending: false });
    return data || [];
}

export async function createAutomation(name: string, triggerType: string, steps: any[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase.from('automations').insert({
        user_id: user.id,
        name,
        trigger_type: triggerType,
        steps,
        is_active: false // Draft by default
    });

    if (error) throw new Error(error.message);
    revalidatePath('/mail/automations');
    return { success: true };
}

export async function toggleAutomation(id: string, isActive: boolean) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('automations')
        .update({ is_active: isActive })
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/mail/automations');
    return { success: true };
}
