import { NextRequest, NextResponse } from 'next/server';
import { searchCompanyAction } from '@/lib/actions/mail/companies';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const domain = searchParams.get('domain');

    if (!domain) {
        return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    const result = await searchCompanyAction(domain);

    if (!result) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json(result);
}
