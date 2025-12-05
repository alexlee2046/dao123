import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const { price, credits, type = 'credits', plan = 'pro' } = await req.json();
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '未授权' }, { status: 401 });
        }

        let lineItems;
        let metadata;

        if (type === 'membership') {
            lineItems = [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Pro 专业版会员 (月付)',
                        description: '免费使用基础模型，优先支持',
                    },
                    unit_amount: Math.round(price * 100),
                },
                quantity: 1,
            }];
            metadata = {
                userId: user.id,
                type: 'membership',
                plan,
            };
        } else {
            lineItems = [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `${credits} 积分`,
                        description: '用于 AI 生成的积分',
                    },
                    unit_amount: Math.round(price * 100),
                },
                quantity: 1,
            }];
            metadata = {
                userId: user.id,
                type: 'credits',
                creditsAmount: credits,
            };
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${req.headers.get('origin')}/settings?success=true&type=${type}`,
            cancel_url: `${req.headers.get('origin')}/settings?canceled=true`,
            metadata: metadata,
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
