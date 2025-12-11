'use server';

import { parseHtmlToBuilderJson } from '@/lib/builder/parser-server';

/**
 * Deterministic conversion of HTML to Builder JSON using JSDOM.
 * guaranteed 0% data loss via Atomic Fallback.
 */
export async function convertHtmlToCraft(html: string) {
    const startTime = Date.now();
    try {
        const builderJson = await parseHtmlToBuilderJson(html);

        // Log success
        try {
            if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
                const { createClient } = await import('@supabase/supabase-js');
                const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY);

                await supabase.from('ai_logs').insert({
                    type: 'builder_convert',
                    status: 'success',
                    input_snippet: html ? html.substring(0, 500) : '',
                    output_snippet: JSON.stringify(builderJson).substring(0, 500),
                    duration_ms: Date.now() - startTime,
                    meta: {
                        node_count: Object.keys(builderJson).length,
                        root_node: builderJson['ROOT'] ? 'present' : 'missing'
                    }
                });
            }
        } catch (logErr) {
            console.error('Failed to log builder conversion:', logErr);
        }

        return { success: true, data: builderJson };
    } catch (error: any) {
        console.error('Error in convertHtmlToCraft:', error);

        // Log error
        try {
            if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
                const { createClient } = await import('@supabase/supabase-js');
                const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY);

                await supabase.from('ai_logs').insert({
                    type: 'builder_convert',
                    status: 'error',
                    input_snippet: html ? html.substring(0, 500) : '',
                    error: error.message,
                    duration_ms: Date.now() - startTime,
                    meta: { stack: error.stack }
                });
            }
        } catch (logErr) { console.error('Failed to log error:', logErr); }

        return { success: false, error: error.message };
    }
}
