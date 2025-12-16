import { NextRequest, NextResponse } from 'next/server';
import { unlockContactAction } from '@/lib/actions/mail/contacts';

export async function POST(request: NextRequest) {
    try {
        const { contactId } = await request.json();

        if (!contactId) {
            return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
        }

        const result = await unlockContactAction(contactId);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
