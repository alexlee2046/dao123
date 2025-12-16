'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface Campaign {
    id: string;
    name: string;
    subject: string;
    status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
    stats: {
        sent?: number;
        opened?: number;
        clicked?: number;
    };
    scheduled_at?: string;
    sent_at?: string;
    created_at: string;
}

export interface CampaignStats {
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    openRate: number;
    clickRate: number;
    contactCount: number;
}

/**
 * 获取用户所有邮件活动
 */
export async function getCampaigns(limit: number = 10): Promise<Campaign[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

    return (data || []) as Campaign[];
}

/**
 * 获取单个活动详情
 */
export async function getCampaign(id: string): Promise<Campaign | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    return data as Campaign | null;
}

/**
 * 获取聚合统计数据
 */
export async function getCampaignStats(): Promise<CampaignStats> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const defaultStats: CampaignStats = {
        totalSent: 0,
        totalOpened: 0,
        totalClicked: 0,
        openRate: 0,
        clickRate: 0,
        contactCount: 0
    };

    if (!user) return defaultStats;

    // 获取所有活动的统计
    const { data: campaigns } = await supabase
        .from('campaigns')
        .select('stats')
        .eq('user_id', user.id)
        .eq('status', 'sent');

    if (!campaigns || campaigns.length === 0) {
        // 获取联系人数量
        const { count } = await supabase
            .from('contacts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        return { ...defaultStats, contactCount: count || 0 };
    }

    // 聚合统计
    let totalSent = 0;
    let totalOpened = 0;
    let totalClicked = 0;

    for (const campaign of campaigns) {
        const stats = campaign.stats as { sent?: number; opened?: number; clicked?: number } | null;
        if (stats) {
            totalSent += stats.sent || 0;
            totalOpened += stats.opened || 0;
            totalClicked += stats.clicked || 0;
        }
    }

    // 获取联系人数量
    const { count } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    return {
        totalSent,
        totalOpened,
        totalClicked,
        openRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
        clickRate: totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0,
        contactCount: count || 0
    };
}

/**
 * 创建新的邮件活动
 */
export async function createCampaign(data: {
    name: string;
    subject: string;
    content_html?: string;
    content_json?: unknown;
    template_id?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert({
            user_id: user.id,
            name: data.name,
            subject: data.subject,
            content_html: data.content_html,
            content_json: data.content_json,
            template_id: data.template_id,
            status: 'draft',
            stats: { sent: 0, opened: 0, clicked: 0 }
        })
        .select('id')
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/mail');
    return { success: true, id: campaign.id };
}
