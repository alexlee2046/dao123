'use client';

/**
 * Visual Workflow Editor
 *
 * DAG-based workflow editor using React Flow (@xyflow/react)
 */

import { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ReactFlowProvider,
  ReactFlowInstance,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { NodePalette } from './NodePalette';
import { WorkflowNode } from './WorkflowNode';
import { NodeConfigPanel } from './NodeConfigPanel';
import type {
  WorkflowFlowNode,
  WorkflowFlowEdge,
  WorkflowNodeData,
  PaletteItem,
} from './types';

// Custom node types for React Flow
const nodeTypes = {
  workflow: WorkflowNode,
};

interface WorkflowEditorProps {
  initialNodes?: WorkflowFlowNode[];
  initialEdges?: WorkflowFlowEdge[];
  onSave?: (nodes: WorkflowFlowNode[], edges: WorkflowFlowEdge[]) => void;
  readOnly?: boolean;
}

function WorkflowEditorInner({
  initialNodes = [],
  initialEdges = [],
  onSave: _onSave,
  readOnly = false,
}: WorkflowEditorProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowFlowNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<WorkflowFlowEdge>(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Get selected node (cast to WorkflowFlowNode)
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) as WorkflowFlowNode | undefined;

  // Handle edge connections
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  // Handle node selection
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
    },
    []
  );

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Handle drag over from palette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop from palette
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const data = event.dataTransfer.getData('application/reactflow');
      if (!data) return;

      const paletteItem: PaletteItem = JSON.parse(data);

      // Get drop position
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      // Create new node
      const newNode: WorkflowFlowNode = {
        id: `node-${Date.now()}`,
        type: 'workflow',
        position,
        data: {
          nodeType: paletteItem.id,
          meta: {
            id: paletteItem.id,
            name: paletteItem.name,
            description: paletteItem.description,
            category: paletteItem.category,
            module: paletteItem.module,
            icon: paletteItem.icon,
            color: paletteItem.color,
            inputSchema: {} as never, // Will be loaded from registry
          },
          config: {},
          label: paletteItem.name,
        },
      };

      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(newNode.id);
    },
    [reactFlowInstance, setNodes]
  );

  // Handle node config update
  const onNodeConfigUpdate = useCallback(
    (nodeId: string, config: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, config } } : n
        )
      );
    },
    [setNodes]
  );

  // Handle node label update
  const onNodeLabelUpdate = useCallback(
    (nodeId: string, label: string) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, label } } : n
        )
      );
    },
    [setNodes]
  );

  // Handle node delete
  const onNodeDelete = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
      );
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }
    },
    [setNodes, setEdges, selectedNodeId]
  );

  return (
    <div className="flex h-full w-full">
      {/* Left: Node Palette */}
      {!readOnly && (
        <div className="w-64 border-r bg-muted/30">
          <NodePalette />
        </div>
      )}

      {/* Center: Flow Canvas */}
      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onNodesChange={readOnly ? undefined : (onNodesChange as any)}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onEdgesChange={readOnly ? undefined : (onEdgesChange as any)}
          onConnect={readOnly ? undefined : onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onDrop={readOnly ? undefined : onDrop}
          onDragOver={readOnly ? undefined : onDragOver}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[16, 16]}
          deleteKeyCode={readOnly ? null : 'Delete'}
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly}
          elementsSelectable={!readOnly}
        >
          <Background gap={16} size={1} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const data = node.data as WorkflowNodeData;
              return data.meta.color || '#6366f1';
            }}
          />
        </ReactFlow>
      </div>

      {/* Right: Config Panel */}
      {selectedNode && !readOnly && (
        <div className="w-80 border-l bg-muted/30">
          <NodeConfigPanel
            node={selectedNode}
            onConfigUpdate={(config) =>
              onNodeConfigUpdate(selectedNode.id, config)
            }
            onLabelUpdate={(label) =>
              onNodeLabelUpdate(selectedNode.id, label)
            }
            onDelete={() => onNodeDelete(selectedNode.id)}
            onClose={() => setSelectedNodeId(null)}
          />
        </div>
      )}
    </div>
  );
}

export function WorkflowEditor(props: WorkflowEditorProps) {
  return (
    <ReactFlowProvider>
      <WorkflowEditorInner {...props} />
    </ReactFlowProvider>
  );
}
