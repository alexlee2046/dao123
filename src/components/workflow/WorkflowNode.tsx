'use client';

/**
 * Custom Workflow Node Component
 *
 * Renders a node in the React Flow canvas with:
 * - Icon and label
 * - Status indicator
 * - Input/output handles
 */

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Mail,
  FileText,
  GitBranch,
  Image,
  Video,
  MessageSquare,
  Upload,
  Download,
  Filter,
  Layers,
  Clock,
  CheckCircle,
  Repeat,
  Loader2,
  CheckCircle2,
  XCircle,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkflowNodeProps } from './types';

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  'mail-send': Mail,
  mail: Mail,
  file: FileText,
  'git-branch': GitBranch,
  image: Image,
  video: Video,
  'message-square': MessageSquare,
  upload: Upload,
  download: Download,
  filter: Filter,
  layers: Layers,
  clock: Clock,
  'check-circle': CheckCircle,
  repeat: Repeat,
};

// Status indicators
const statusIcons: Record<string, { icon: LucideIcon; className: string }> = {
  pending: { icon: Clock, className: 'text-muted-foreground' },
  running: { icon: Loader2, className: 'text-blue-500 animate-spin' },
  completed: { icon: CheckCircle2, className: 'text-green-500' },
  failed: { icon: XCircle, className: 'text-red-500' },
};

function WorkflowNodeComponent({ data, selected }: WorkflowNodeProps) {
  const Icon = iconMap[data.meta.icon] || FileText;
  const color = data.meta.color || '#6366f1';
  const status = data.status;
  const StatusIcon = status ? statusIcons[status]?.icon : null;
  const statusClass = status ? statusIcons[status]?.className : '';

  return (
    <div
      className={cn(
        'group relative min-w-[180px] rounded-lg border-2 bg-card shadow-md transition-all',
        selected ? 'border-primary shadow-lg' : 'border-border',
        'hover:shadow-lg'
      )}
    >
      {/* Input Handle (left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-background !bg-muted-foreground"
      />

      {/* Header */}
      <div
        className="flex items-center gap-2 rounded-t-md px-3 py-2"
        style={{ backgroundColor: color + '15' }}
      >
        <div
          className="flex h-6 w-6 items-center justify-center rounded"
          style={{ backgroundColor: color + '30' }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
        <span className="flex-1 truncate text-sm font-medium">{data.label}</span>
        {StatusIcon && (
          <StatusIcon className={cn('h-4 w-4 shrink-0', statusClass)} />
        )}
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <div className="text-xs text-muted-foreground">
          {data.meta.description.length > 50
            ? data.meta.description.slice(0, 50) + '...'
            : data.meta.description}
        </div>

        {/* Show config summary if has values */}
        {Object.keys(data.config).length > 0 && (
          <div className="mt-2 space-y-1">
            {Object.entries(data.config)
              .slice(0, 3)
              .map(([key, value]) => (
                <div key={key} className="flex text-xs">
                  <span className="text-muted-foreground">{key}:</span>
                  <span className="ml-1 truncate font-mono">
                    {typeof value === 'string'
                      ? value.length > 20
                        ? value.slice(0, 20) + '...'
                        : value
                      : JSON.stringify(value).slice(0, 20)}
                  </span>
                </div>
              ))}
          </div>
        )}

        {/* Error display */}
        {data.lastResult?.error && (
          <div className="mt-2 rounded bg-red-500/10 px-2 py-1 text-xs text-red-500">
            {data.lastResult.error}
          </div>
        )}
      </div>

      {/* Module badge */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ backgroundColor: color, color: 'white' }}
        >
          {data.meta.module}
        </span>
      </div>

      {/* Output Handle (right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-background !bg-muted-foreground"
      />
    </div>
  );
}

export const WorkflowNode = memo(WorkflowNodeComponent);
