import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

// This needs to be configured in Stripe Dashboard
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
    const body = await req.text();
    const sig = (await headers()).get('stripe-signature') as string;

    let event;

    try {
        if (!endpointSecret) throw new Error('Missing Stripe Webhook Secret');
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        const userId = session.metadata.userId;
        const creditsAmount = parseInt(session.metadata.creditsAmount);

        if (userId && creditsAmount) {
            // Use Admin Client to bypass RLS
            const supabase = createAdminClient();

            // 1. Get current profile to ensure it exists
            const { data: profile } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', userId)
                .single();

            const currentCredits = profile?.credits || 0;

            // 2. Update credits
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ credits: currentCredits + creditsAmount })
                .eq('id', userId);

            if (updateError) {
                console.error('Failed to update credits:', updateError);
            } else {
                // 3. Record transaction
                await supabase.from('transactions').insert({
                    user_id: userId,
                    amount: creditsAmount,
                    type: 'purchase',
                    description: `Stripe Purchase: ${session.id}`
                });
            }
        }
    }

    return NextResponse.json({ received: true });
}
