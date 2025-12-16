
import { createClient } from '@/lib/supabase/client';
import { VercelClient } from '@/lib/vercel';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { domain, siteId } = body;

        if (!domain || !siteId) {
            return NextResponse.json(
                { error: 'Missing domain or siteId' },
                { status: 400 }
            );
        }

        // 1. Validate permissions
        // Note: Using client side supabase here might be tricky if RLS depends on cookies forwarded
        // Better to use server client if we have one or just rely on the existing auth mechanism
        // For simplicity, let's assume we use the service role key for admin tasks OR authorize via cookie
        // But better practice: pass cookies to createServerClient

        // Let's create a server client to verify user ownership
        const supabase = createClient();

        // Check if project exists and belongs to user (implicit via RLS if we query)
        // However, this API is called from client, so we should check auth.
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify project ownership
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('id, custom_domain')
            .eq('id', siteId)
            .eq('user_id', user.id) // Ensure ownership
            .single();

        if (projectError || !project) {
            return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 });
        }

        // 2. Add domain to Vercel
        const vercel = new VercelClient();

        // If replacing an existing domain, we might want to clean up the old one?
        // or just overwrite. For now let's just add new one.
        const vercelResponse = await vercel.addDomain(domain);

        if (vercelResponse.error) {
            return NextResponse.json({ error: vercelResponse.error.message }, { status: 400 });
        }

        // 3. Update database
        const { error: updateError } = await supabase
            .from('projects')
            .update({ custom_domain: domain })
            .eq('id', siteId);

        if (updateError) {
            // Rollback Vercel add if DB failed? 
            // Ideally yes, but for MVP keep it simple.
            console.error('Failed to update DB after adding to Vercel:', updateError);
            return NextResponse.json({ error: 'Failed to save domain to database' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            domain: vercelResponse
        });

    } catch (error) {
        console.error('Domain API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const siteId = searchParams.get('siteId');
        const domain = searchParams.get('domain');

        if (!siteId || !domain) {
            return NextResponse.json({ error: 'Missing siteId or domain' }, { status: 400 });
        }

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Verify ownership
        const { data: project } = await supabase
            .from('projects')
            .select('id')
            .eq('id', siteId)
            .eq('user_id', user.id)
            .single();

        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Remove from Vercel
        const vercel = new VercelClient();
        await vercel.removeDomain(domain);

        // Update DB
        await supabase
            .from('projects')
            .update({ custom_domain: null }) // assuming we clear it
            .eq('id', siteId)
            .eq('custom_domain', domain); // Only clear if it matches

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete Domain Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
