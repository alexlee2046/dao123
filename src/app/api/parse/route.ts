
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const runtime = 'nodejs'; // Cheerio usage prefers nodejs runtime usually, though it can run on edge, node is safer for large payloads and logging

interface ParseRequest {
    content: string;
}

/**
 * 清理页面内容，移除 markdown 代码块标记
 */
const cleanPageContent = (html: string): string => {
    return html.replace(/```html\s*/gi, '').replace(/```\s*/g, '');
};

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    const startTime = Date.now();
    try {
        const { content } = (await req.json()) as ParseRequest;

        if (!content) {
            return NextResponse.json({ pages: [] });
        }

        // 1. Detailed Logging for Debugging
        console.log('--- [API/Parse] Received Content for Parsing ---');
        console.log(`Length: ${content.length} characters`);
        console.log('Snippet (first 200 chars):', content.substring(0, 200).replace(/\n/g, '\\n'));
        console.log('Snippet (last 200 chars):', content.substring(Math.max(0, content.length - 200)).replace(/\n/g, '\\n'));
        console.log('------------------------------------------------');

        const pages: { path: string; content: string }[] = [];

        // 2. Split content by page markers
        // Regex to find <!-- page: filename --> ... content
        // We use a similar regex strategy as client-side but backed by Cheerio for the content body
        const pageRegex = /<!-- page: (.*?) -->([\s\S]*?)(?=<!-- page: |$)/g;
        let match;
        let foundPages = false;

        while ((match = pageRegex.exec(content)) !== null) {
            foundPages = true;
            const pathRaw = match[1].trim();
            const path = pathRaw.endsWith('.html') ? pathRaw : `${pathRaw}.html`;
            let rawContent = match[2].trim();

            // Clean markdown blocks if present inside the marker
            rawContent = cleanPageContent(rawContent);

            // 3. Robust Parsing with Cheerio
            // Cheerio will automatically close tags, fix nesting, and provide a valid HTML structure.
            const $ = cheerio.load(rawContent);
            const fixedContent = $.html();

            pages.push({
                path,
                content: fixedContent
            });

            console.log(`[API/Parse] Parsed page: ${path}, Length: ${fixedContent.length}`);
        }

        // Fallback: If no pages found, try to parse the whole content as one page if it looks like HTML
        if (!foundPages) {
            console.log('[API/Parse] No page markers found.');
            let rawContent = cleanPageContent(content);

            // 如果包含完整 HTML 结构
            if (rawContent.includes('<html') || rawContent.includes('<!DOCTYPE')) {
                console.log('[API/Parse] Treating as single complete page.');
                const $ = cheerio.load(rawContent);
                pages.push({
                    path: 'index.html',
                    content: $.html()
                });
            } else {
                // 尝试检测是否包含 partial HTML (如 div, section, main 等)
                // DeepSeek 有时只返回部分 HTML 代码
                console.log('[API/Parse] Trying to wrap partial content.');
                const $ = cheerio.load(rawContent);
                const bodyContent = $('body').length > 0 ? $('body').html() : $.html(); // 如果 cheerio 自动包裹了 body，提取出来；否则直接用

                if (bodyContent && bodyContent.trim().length > 10) { // 简单检查是否有内容
                    console.log('[API/Parse] Wrapped partial content into scaffolding.');
                    const scaffoldedHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen">
    ${bodyContent}
</body>
</html>`;
                    pages.push({
                        path: 'index.html',
                        content: scaffoldedHtml
                    });
                }
            }
        }

        // Insert logging before return
        try {
            if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
                const supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY);
                await supabase.from('ai_logs').insert({
                    type: 'parse',
                    status: pages.length > 0 ? 'success' : 'warning', // Warning if no pages found
                    input_snippet: content ? content.substring(0, 500) : '',
                    output_snippet: JSON.stringify(pages).substring(0, 500),
                    duration_ms: Date.now() - startTime,
                    meta: {
                        pages_count: pages.length,
                        page_paths: pages.map(p => p.path),
                        full_content_length: content ? content.length : 0
                    }
                });
            }
        } catch (logErr) {
            console.error('[API/Parse] Failed to log:', logErr);
        }

        return NextResponse.json({ pages });

    } catch (error: any) {
        // Log Error to DB
        try {
            if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
                const supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY);
                await supabase.from('ai_logs').insert({
                    type: 'parse',
                    status: 'error',
                    error: error.message,
                    duration_ms: Date.now() - startTime,
                    meta: { stack: error.stack }
                });
            }
        } catch (logErr) { console.error('Failed to log error:', logErr); }

        console.error('[API/Parse] Error parsing content:', error);
        return NextResponse.json(
            { error: 'Failed to parse content', details: error.message },
            { status: 500 }
        );
    }
}
