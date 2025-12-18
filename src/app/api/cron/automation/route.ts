import { NextRequest, NextResponse } from 'next/server';
import { processScheduledSteps } from '@/lib/automation/engine';

/**
 * Cron job endpoint for processing scheduled automation steps
 *
 * This endpoint should be called every minute by Vercel Cron
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/automation",
 *     "schedule": "* * * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sets this header for cron jobs)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // In production, require authorization
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Also check for Vercel's cron header
    const vercelCron = request.headers.get('x-vercel-cron');
    if (!vercelCron) {
      console.error('[Automation Cron] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  console.log('[Automation Cron] Starting scheduled processing...');

  try {
    const startTime = Date.now();
    const result = await processScheduledSteps();
    const duration = Date.now() - startTime;

    console.log(`[Automation Cron] Completed in ${duration}ms:`, result);

    return NextResponse.json({
      success: true,
      ...result,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Automation Cron] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
