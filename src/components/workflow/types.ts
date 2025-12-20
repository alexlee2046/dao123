/**
 * Workflow Editor Types
 */

import type { Node, Edge } from '@xyflow/react';
import type { NodeMeta, NodeCategory } from '@/inngest/core/types';

/**
 * Workflow node data stored in React Flow node
 */
export interface WorkflowNodeData extends Record<string, unknown> {
  /** Node type ID from registry (e.g., 'ai.generateImage') */
  nodeType: string;
  /** Node metadata from registry */
  meta: NodeMeta;
  /** User-configured values */
  config: Record<string, unknown>;
  /** Node label (user editable) */
  label: string;
  /** Execution status */
  status?: 'pending' | 'running' | 'completed' | 'failed';
  /** Last execution result */
  lastResult?: {
    success: boolean;
    output?: Record<string, unknown>;
    error?: string;
  };
}

/**
 * React Flow node with our custom data
 */
export type WorkflowFlowNode = Node<WorkflowNodeData>;

/**
 * React Flow edge
 */
export type WorkflowFlowEdge = Edge;

/**
 * Node props for custom node component
 */
export interface WorkflowNodeProps {
  id: string;
  data: WorkflowNodeData;
  selected?: boolean;
}

/**
 * Palette item for dragging
 */
export interface PaletteItem {
  id: string;
  name: string;
  description: string;
  category: NodeCategory;
  module: string;
  icon: string;
  color?: string;
}

/**
 * Editor state
 */
export interface WorkflowEditorState {
  nodes: WorkflowFlowNode[];
  edges: WorkflowFlowEdge[];
  selectedNodeId: string | null;
  isDirty: boolean;
}

/**
 * Saved workflow format
 */
export interface SavedWorkflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowFlowNode[];
  edges: WorkflowFlowEdge[];
  trigger: {
    type: string;
    filter?: Record<string, unknown>;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
