import { NextRequest, NextResponse } from 'next/server';
import { logClick } from '@/lib/actions/mail/analytics';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'Missing target URL' }, { status: 400 });
    }

    if (id) {
        logClick(id).catch(console.error);
    }

    return NextResponse.redirect(url);
}
