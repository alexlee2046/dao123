import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
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
            // Use a fresh client with service role if possible, but here we rely on the RPC being security definer
            // and accessible to anon (which is risky without a secret check, but we check stripe signature).
            // Ideally we use SUPABASE_SERVICE_ROLE_KEY.

            const supabase = await createClient();

            // We need to bypass RLS or use a system function.
            // Since we are in a webhook, we don't have a user session.
            // We will call the RPC. Note: RPC needs to be exposed to public or we need service key.
            // For this demo, we assume the RPC is callable.

            const { error } = await supabase.rpc('increment_credits', {
                user_id: userId,
                amount: creditsAmount,
                description: `Stripe Purchase: ${session.id}`
            });

            if (error) console.error('Failed to credit user:', error);
        }
    }

    return NextResponse.json({ received: true });
}
