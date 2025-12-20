import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

/**
 * GET /api/workflow - List user's workflows
 * GET /api/workflow?id=xxx - Get specific workflow
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = req.nextUrl.searchParams.get('id');

    if (id) {
      // Get specific workflow
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        return Response.json({ error: 'Workflow not found' }, { status: 404 });
      }

      return Response.json({ workflow: data });
    }

    // List all workflows
    const { data, error } = await supabase
      .from('workflows')
      .select('id, name, description, is_active, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ workflows: data });

  } catch (error) {
    console.error('[Workflow GET Error]:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * POST /api/workflow - Create new workflow
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, trigger, nodes, edges, isActive } = body;

    if (!name) {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('workflows')
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        trigger: trigger || { type: 'manual' },
        nodes: nodes || [],
        edges: edges || [],
        is_active: isActive ?? false,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Workflow Create Error]:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ id: data.id, success: true });

  } catch (error) {
    console.error('[Workflow POST Error]:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * PUT /api/workflow - Update existing workflow
 */
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, description, trigger, nodes, edges, isActive } = body;

    if (!id) {
      return Response.json({ error: 'Workflow ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (trigger !== undefined) updateData.trigger = trigger;
    if (nodes !== undefined) updateData.nodes = nodes;
    if (edges !== undefined) updateData.edges = edges;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { error } = await supabase
      .from('workflows')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[Workflow Update Error]:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('[Workflow PUT Error]:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * DELETE /api/workflow?id=xxx - Delete workflow
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = req.nextUrl.searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'Workflow ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[Workflow Delete Error]:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('[Workflow DELETE Error]:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
