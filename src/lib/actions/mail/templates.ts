'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getTemplates() {
    const supabase = await createClient();
    const { data } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });
    return data || [];
}

export async function getTemplate(id: string) {
    const supabase = await createClient();
    const { data } = await supabase
        .from('templates')
        .select('*')
        .eq('id', id)
        .single();
    return data;
}

export async function saveTemplate(data: { name: string; content_json: any; content_html?: string; thumbnail?: string }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase.from('templates').insert({
        user_id: user.id,
        name: data.name,
        content_json: data.content_json,
        content_html: data.content_html,
        thumbnail: data.thumbnail
    });

    if (error) throw new Error(error.message);
    revalidatePath('/mail/templates');
    return { success: true };
}
