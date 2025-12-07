
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

export async function POST(req: Request) {
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
        if (!foundPages && (content.includes('<html') || content.includes('<!DOCTYPE'))) {
            console.log('[API/Parse] No page markers found, treating as single page.');
            let rawContent = cleanPageContent(content);
            const $ = cheerio.load(rawContent);
            pages.push({
                path: 'index.html',
                content: $.html()
            });
        }

        return NextResponse.json({ pages });

    } catch (error: any) {
        console.error('[API/Parse] Error parsing content:', error);
        return NextResponse.json(
            { error: 'Failed to parse content', details: error.message },
            { status: 500 }
        );
    }
}
