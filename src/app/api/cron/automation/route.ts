import { NextRequest, NextResponse } from 'next/server';

/**
 * @deprecated This cron job is deprecated.
 *
 * Automation scheduling is now handled by Inngest's step.sleep() function.
 * Inngest automatically handles workflow resumption at the scheduled time.
 *
 * See: /src/inngest/functions/automation.ts
 *
 * This endpoint is kept for backwards compatibility but does nothing.
 * TODO: Remove this file once migration is complete.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    const vercelCron = request.headers.get('x-vercel-cron');
    if (!vercelCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Return success but do nothing - Inngest handles scheduling now
  return NextResponse.json({
    success: true,
    message: 'Deprecated: Automation scheduling is now handled by Inngest',
    processed: 0,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
