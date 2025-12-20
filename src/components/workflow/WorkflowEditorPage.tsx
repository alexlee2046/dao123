'use client';

/**
 * Workflow Editor Page Component
 *
 * Full-page workflow editor with save functionality
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Play, ArrowLeft, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { WorkflowEditor } from './WorkflowEditor';
import { AIWorkflowChat } from './AIWorkflowChat';
import type { WorkflowFlowNode, WorkflowFlowEdge, SavedWorkflow } from './types';

interface WorkflowEditorPageProps {
  workflow?: SavedWorkflow;
  locale: string;
}

export function WorkflowEditorPage({ workflow, locale }: WorkflowEditorPageProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [nodes, setNodes] = useState<WorkflowFlowNode[]>(workflow?.nodes || []);
  const [edges, setEdges] = useState<WorkflowFlowEdge[]>(workflow?.edges || []);

  // Workflow settings
  const [name, setName] = useState(workflow?.name || 'Untitled Workflow');
  const [description, setDescription] = useState(workflow?.description || '');
  const [isActive, setIsActive] = useState(workflow?.isActive ?? false);
  const [triggerType] = useState(
    workflow?.trigger?.type || 'manual'
  );

  // Convert nodes/edges to DAG format for saving
  const convertToDAGFormat = useCallback(() => {
    return {
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.data.nodeType,
        config: node.data.config,
        position: node.position,
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        sourceHandle: edge.sourceHandle || undefined,
        target: edge.target,
        targetHandle: edge.targetHandle || undefined,
      })),
    };
  }, [nodes, edges]);

  // Save workflow
  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a workflow name');
      return;
    }

    setIsSaving(true);
    try {
      const dagData = convertToDAGFormat();

      const response = await fetch('/api/workflow', {
        method: workflow?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: workflow?.id,
          name,
          description,
          trigger: { type: triggerType },
          nodes: dagData.nodes,
          edges: dagData.edges,
          isActive,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save workflow');
      }

      const data = await response.json();
      toast.success('Workflow saved');

      // Redirect to edit page if new workflow
      if (!workflow?.id && data.id) {
        router.push(`/${locale}/workflow/${data.id}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save workflow');
    } finally {
      setIsSaving(false);
    }
  };

  // Run workflow
  const handleRun = async () => {
    if (!workflow?.id) {
      toast.error('Please save the workflow first');
      return;
    }

    setIsRunning(true);
    try {
      const response = await fetch(`/api/workflow/${workflow.id}/run`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to run workflow');
      }

      const data = await response.json();
      toast.success(`Workflow started: ${data.runId}`);
    } catch (error) {
      console.error('Run error:', error);
      toast.error('Failed to run workflow');
    } finally {
      setIsRunning(false);
    }
  };

  // Handle editor changes
  const handleEditorSave = useCallback(
    (newNodes: WorkflowFlowNode[], newEdges: WorkflowFlowEdge[]) => {
      setNodes(newNodes);
      setEdges(newEdges);
    },
    []
  );

  // Handle AI-generated workflow
  const handleApplyWorkflow = useCallback(
    (newNodes: WorkflowFlowNode[], newEdges: WorkflowFlowEdge[]) => {
      setNodes(newNodes);
      setEdges(newEdges);
      toast.success('工作流已应用');
    },
    []
  );

  return (
    <div className="flex h-screen flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-card px-4 py-2">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/workflow`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-64 border-none bg-transparent text-lg font-semibold focus-visible:ring-0"
            placeholder="Workflow name..."
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Settings */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Workflow Settings</DialogTitle>
                <DialogDescription>
                  Configure workflow name, description, and trigger
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Workflow name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this workflow does..."
                    rows={3}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {}}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Run */}
          <Button
            variant="outline"
            onClick={handleRun}
            disabled={isRunning || !workflow?.id}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            {isRunning ? 'Running...' : 'Run'}
          </Button>

          {/* Save */}
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <WorkflowEditor
          initialNodes={nodes}
          initialEdges={edges}
          onSave={handleEditorSave}
        />
      </div>

      {/* AI Chat */}
      <AIWorkflowChat onApplyWorkflow={handleApplyWorkflow} />
    </div>
  );
}
