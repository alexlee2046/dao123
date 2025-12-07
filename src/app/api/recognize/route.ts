import { NextResponse } from 'next/server';
import { recognizeWebPage, isValidUrl } from '@/lib/web-page-recognition';

export const runtime = 'nodejs'; // Required for jsdom

export async function POST(req: Request) {
    try {
        const { content } = await req.json();

        if (!content) {
            return NextResponse.json(
                { error: 'Content is required' },
                { status: 400 }
            );
        }

        console.log('[API/Recognize] Processing content...');

        const isUrl = isValidUrl(content.trim());
        const result = await recognizeWebPage(content.trim());

        if (!result) {
            return NextResponse.json(
                { error: 'Failed to recognize content' },
                { status: 422 }
            );
        }

        return NextResponse.json({
            success: true,
            isUrl,
            data: result
        });

    } catch (error: any) {
        console.error('[API/Recognize] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
