import { createClient } from '@/lib/supabase/server';
import { inngest } from '@/inngest/client';
import { NextRequest } from 'next/server';

/**
 * POST /api/workflow/[id]/run - Trigger workflow execution
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workflowId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify workflow exists and belongs to user
    const { data: workflow, error: fetchError } = await supabase
      .from('workflows')
      .select('id, name, is_active')
      .eq('id', workflowId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !workflow) {
      return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Parse optional trigger data from request body
    let triggerData: Record<string, unknown> = {};
    try {
      const body = await req.json();
      triggerData = body.triggerData || {};
    } catch {
      // No body or invalid JSON, use empty trigger data
    }

    // Send event to Inngest
    await inngest.send({
      name: 'workflow/execute',
      data: {
        workflowId,
        userId: user.id,
        triggerData,
      },
    });

    return Response.json({
      success: true,
      message: `Workflow "${workflow.name}" execution started`,
      workflowId,
    });

  } catch (error) {
    console.error('[Workflow Run Error]:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
