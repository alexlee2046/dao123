import { NextRequest, NextResponse } from 'next/server';
import { searchContactsAction } from '@/lib/actions/mail/contacts';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const domain = searchParams.get('domain');

    if (!domain) {
        return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    const result = await searchContactsAction(domain);

    return NextResponse.json(result);
}
