
import { createClient } from '@/lib/supabase/server';
import { SearchHistory } from './types';

export type SearchType = 'domain' | 'email' | 'verify' | 'count';

interface CreateHistoryParams {
    search_type: SearchType;
    query: Record<string, any>;
    result_summary: Record<string, any>;
}

export async function createSearchHistory(params: CreateHistoryParams) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error('History: No authenticated user', authError);
        return { error: 'No authenticated user', details: authError };
    }

    try {
        const { data, error } = await supabase
            .from('lead_search_history')
            .insert({
                user_id: user.id,
                search_type: params.search_type,
                query: params.query,
                result_summary: params.result_summary,
            })
            .select()
            .single();

        if (error) {
            console.error('Failed to save search history:', error);
            return { error };
        }

        return { data };
    } catch (error) {
        console.error('Error saving search history:', error);
        return { error };
    }
}

export async function getSearchHistory(limit = 20) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('lead_search_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Failed to fetch search history:', error);
        return [];
    }

    return data as SearchHistory[];
}
