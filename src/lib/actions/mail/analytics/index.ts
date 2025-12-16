'use server'

import { createClient } from '@supabase/supabase-js';

export async function logOpen(logId: string) {
    // Using Service Role for analytics to bypass RLS (public endpoints trigger these)
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Update Log
    const { data: log, error } = await supabase
        .from('email_logs')
        .update({
            status: 'opened',
            opened_at: new Date().toISOString()
        })
        .eq('id', logId)
        .select('campaign_id')
        .single();

    if (error || !log) return;

    // 2. Increment Campaign Stats (Atomic RPC preferred, but using JSONB update for now)
    // For simplicity MVP: Fetch -> Update. 
    // In prod: Use Postgres function `increment_campaign_stats(campaign_id, 'opened')`

    const { data: campaign } = await supabase
        .from('campaigns')
        .select('stats')
        .eq('id', log.campaign_id)
        .single();

    if (campaign) {
        const stats = campaign.stats as any;
        stats.opened = (stats.opened || 0) + 1;

        await supabase.from('campaigns').update({ stats }).eq('id', log.campaign_id);
    }
}

export async function logClick(logId: string) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Update Log
    const { data: log, error } = await supabase
        .from('email_logs')
        .select('click_count, campaign_id')
        .eq('id', logId)
        .single();

    if (error || !log) return;

    await supabase
        .from('email_logs')
        .update({
            status: 'clicked', // or keep as opened? usually implies open. 
            click_count: (log.click_count || 0) + 1
        })
        .eq('id', logId);

    // 2. Increment Campaign Stats
    const { data: campaign } = await supabase
        .from('campaigns')
        .select('stats')
        .eq('id', log.campaign_id)
        .single();

    if (campaign) {
        const stats = campaign.stats as any;
        stats.clicked = (stats.clicked || 0) + 1;
        await supabase.from('campaigns').update({ stats }).eq('id', log.campaign_id);
    }
}
