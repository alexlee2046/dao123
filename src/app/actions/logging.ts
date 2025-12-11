'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Server-side logging function using Service Role key for reliability
export async function logAiRequest({
    userId,
    type,
    model,
    input,
    output,
    status,
    error,
    durationMs,
    meta = {}
}: {
    userId?: string;
    type: 'chat' | 'parse' | 'architect';
    model?: string;
    input: string;
    output?: string;
    status: 'success' | 'error' | 'pending';
    error?: string;
    durationMs?: number;
    meta?: any;
}) {
    try {
        // Use service role client to bypass potential RLS issues during logging
        // and ensuring logs are always written even if user context is weird
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey);

        const inputSnippet = input ? (input.length > 500 ? input.substring(0, 500) + '...' : input) : '';
        const outputSnippet = output ? (output.length > 500 ? output.substring(0, 500) + '...' : output) : '';

        await supabase.from('ai_logs').insert({
            user_id: userId,
            type,
            model,
            input_snippet: inputSnippet,
            output_snippet: outputSnippet,
            status,
            error,
            duration_ms: durationMs,
            meta: {
                ...meta,
                full_input: input && input.length <= 10000 ? input : undefined, // Store full input if reasonable size
                full_output: output && output.length <= 10000 ? output : undefined // Store full output if reasonable size
            }
        });
    } catch (e) {
        console.error('Failed to write AI log:', e);
    }
}
