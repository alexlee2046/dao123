import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const diagnostics: any = {
        timestamp: new Date().toISOString(),
        checks: []
    };

    // Check 1: Environment variables
    diagnostics.checks.push({
        name: 'Environment Variables',
        status: 'ok',
        details: {
            NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            OPENROUTER_API_KEY: !!process.env.OPENROUTER_API_KEY,
        }
    });

    // Check 2: Database settings
    try {
        const adminSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: settings, error } = await adminSupabase
            .from('system_settings')
            .select('key, value')
            .eq('key', 'OPENROUTER_API_KEY')
            .single();

        diagnostics.checks.push({
            name: 'Database OpenRouter Key',
            status: error ? (error.code === 'PGRST116' ? 'not_found' : 'error') : 'ok',
            hasValue: !!settings?.value,
            keyLength: settings?.value?.length || 0,
            error: error?.message
        });

    } catch (error: any) {
        diagnostics.checks.push({
            name: 'Database Connection',
            status: 'error',
            error: error.message
        });
    }

    // Check 3: Try to get current user (if authenticated)
    try {
        const supabase = await createServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (user) {
            const adminSupabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            const { data: profile, error: profileError } = await adminSupabase
                .from('profiles')
                .select('credits')
                .eq('id', user.id)
                .single();

            diagnostics.checks.push({
                name: 'Current User',
                status: 'authenticated',
                userId: user.id,
                email: user.email,
                credits: profile?.credits ?? 'N/A',
                profileError: profileError?.message
            });
        } else {
            diagnostics.checks.push({
                name: 'Current User',
                status: 'not_authenticated',
                message: 'No user session found',
                authError: authError?.message
            });
        }
    } catch (error: any) {
        diagnostics.checks.push({
            name: 'User Authentication Check',
            status: 'error',
            error: error.message
        });
    }

    return NextResponse.json(diagnostics, { status: 200 });
}
