import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { WorkflowEditorPage } from '@/components/workflow/WorkflowEditorPage';
import type { SavedWorkflow, WorkflowFlowNode, WorkflowFlowEdge } from '@/components/workflow/types';

// Force dynamic rendering since this page uses cookies for auth
export const dynamic = 'force-dynamic';

interface WorkflowEditPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function WorkflowEditPage({ params }: WorkflowEditPageProps) {
  const { locale, id } = await params;

  // Handle "new" route
  if (id === 'new') {
    return <WorkflowEditorPage locale={locale} />;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Load workflow
  const { data: workflow, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !workflow) {
    notFound();
  }

  // Convert database format to editor format
  const savedWorkflow: SavedWorkflow = {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description || undefined,
    trigger: workflow.trigger as { type: string; filter?: Record<string, unknown> },
    isActive: workflow.is_active,
    createdAt: workflow.created_at,
    updatedAt: workflow.updated_at,
    nodes: (workflow.nodes || []).map((node: { id: string; type: string; config: Record<string, unknown>; position?: { x: number; y: number } }) => ({
      id: node.id,
      type: 'workflow',
      position: node.position || { x: 0, y: 0 },
      data: {
        nodeType: node.type,
        config: node.config || {},
        label: node.type.split('.').pop() || node.type,
        meta: {
          id: node.type,
          name: node.type.split('.').pop() || node.type,
          description: '',
          category: 'action' as const,
          module: node.type.split('.')[0] || 'unknown',
          icon: 'file',
          inputSchema: {} as never,
        },
      },
    })) as WorkflowFlowNode[],
    edges: (workflow.edges || []).map((edge: { id: string; source: string; target: string; sourceHandle?: string; targetHandle?: string }) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
    })) as WorkflowFlowEdge[],
  };

  return <WorkflowEditorPage workflow={savedWorkflow} locale={locale} />;
}
