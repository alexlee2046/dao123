import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeSubdomain, validateSubdomain } from '@/lib/subdomain';

/**
 * API 路由：检查子域名可用性
 * POST /api/subdomain/check
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { subdomain } = body;

        // 验证输入
        if (!subdomain) {
            return NextResponse.json(
                { available: false, error: '子域名不能为空' },
                { status: 400 }
            );
        }

        // 标准化子域名
        const normalizedSubdomain = normalizeSubdomain(subdomain);

        // 验证格式
        const validation = validateSubdomain(normalizedSubdomain);
        if (!validation.valid) {
            return NextResponse.json(
                { available: false, error: validation.error },
                { status: 400 }
            );
        }

        // 检查数据库中是否已存在
        const supabase = await createClient();
        const { data: existing, error: dbError } = await supabase
            .from('projects')
            .select('id')
            .eq('subdomain', normalizedSubdomain)
            .maybeSingle();

        if (dbError) {
            console.error('Database error:', dbError);
            return NextResponse.json(
                { available: false, error: '检查失败，请稍后重试' },
                { status: 500 }
            );
        }

        // 如果已存在，返回不可用
        if (existing) {
            return NextResponse.json(
                { available: false, error: '该子域名已被占用' },
                { status: 200 }
            );
        }

        // 可用
        return NextResponse.json(
            { available: true },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error checking subdomain:', error);
        return NextResponse.json(
            { available: false, error: '服务器错误' },
            { status: 500 }
        );
    }
}
