'use server';

import { parseHtmlToBuilderJson } from '@/lib/builder/parser-server';

/**
 * Deterministic conversion of HTML to Builder JSON using JSDOM.
 * guaranteed 0% data loss via Atomic Fallback.
 */
export async function convertHtmlToCraft(html: string) {
    try {
        const builderJson = await parseHtmlToBuilderJson(html);
        return { success: true, data: builderJson };
    } catch (error: any) {
        console.error('Error in convertHtmlToCraft:', error);
        return { success: false, error: error.message };
    }
}
