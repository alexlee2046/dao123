
import { VercelClient } from '@/lib/vercel';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const domain = searchParams.get('domain');

        if (!domain) {
            return NextResponse.json({ error: 'Missing domain parameter' }, { status: 400 });
        }

        const vercel = new VercelClient();

        // 1. Get Domain Config to check misconfiguration
        const config = await vercel.getDomainConfig(domain);

        // 2. If valid or pending, we might want to try verifying it if it's not verified
        let verificationResponse = null;

        if (config.misconfigured) {
            // If misconfigured, verification details usually help
            // Maybe try to verify to get fresh status
            try {
                verificationResponse = await vercel.verifyDomain(domain);
            } catch (e) {
                console.warn('Verification check failed explicitly:', e);
            }
        } else {
            // It seems configured, let's just return success? 
            // Vercel API behavior: getDomainConfig tells if it's misconfigured.
            // verifying it gives more details.
            try {
                verificationResponse = await vercel.verifyDomain(domain);
            } catch (e) {
                // Ignore if verify fails, we rely on config
            }
        }

        return NextResponse.json({
            configured: !config.misconfigured,
            config,
            verification: verificationResponse
        });

    } catch (error: any) {
        console.error('Domain Check API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
