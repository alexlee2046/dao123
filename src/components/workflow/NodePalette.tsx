'use client';

/**
 * Node Palette Component
 *
 * Displays available node types grouped by module
 * Supports drag-and-drop to canvas
 */

import { useMemo, useState } from 'react';
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
  Search,
  ChevronDown,
  ChevronRight,
  LucideIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { PaletteItem } from './types';
import type { NodeCategory } from '@/inngest/core/types';

// Icon mapping for node types
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

// Category colors
const categoryColors: Record<NodeCategory, string> = {
  trigger: '#22c55e',
  action: '#3b82f6',
  flow: '#a855f7',
  transform: '#f59e0b',
  ai: '#ec4899',
  media: '#06b6d4',
  integration: '#6366f1',
};

// Static node definitions (will be populated from registry at runtime)
// This is a fallback/demo list
const defaultNodes: PaletteItem[] = [
  // AI Module
  {
    id: 'ai.generateImage',
    name: 'Generate Image',
    description: 'Text-to-image or image-to-image generation',
    category: 'ai',
    module: 'ai',
    icon: 'image',
    color: categoryColors.ai,
  },
  {
    id: 'ai.generateVideo',
    name: 'Generate Video',
    description: 'Text-to-video or image-to-video generation',
    category: 'ai',
    module: 'ai',
    icon: 'video',
    color: categoryColors.ai,
  },
  {
    id: 'ai.generateText',
    name: 'Generate Text',
    description: 'LLM text generation with various formats',
    category: 'ai',
    module: 'ai',
    icon: 'message-square',
    color: categoryColors.ai,
  },
  {
    id: 'ai.generateEmail',
    name: 'Generate Email',
    description: 'AI-powered marketing email generation',
    category: 'ai',
    module: 'ai',
    icon: 'mail',
    color: categoryColors.ai,
  },

  // Media Module
  {
    id: 'media.upload',
    name: 'Upload Media',
    description: 'Upload external URL to storage',
    category: 'media',
    module: 'media',
    icon: 'upload',
    color: categoryColors.media,
  },
  {
    id: 'media.download',
    name: 'Download Media',
    description: 'Download media as base64',
    category: 'media',
    module: 'media',
    icon: 'download',
    color: categoryColors.media,
  },
  {
    id: 'media.filter',
    name: 'Filter Media',
    description: 'Filter media list (first/last/random)',
    category: 'media',
    module: 'media',
    icon: 'filter',
    color: categoryColors.media,
  },
  {
    id: 'media.merge',
    name: 'Merge Media',
    description: 'Combine media into gallery/grid',
    category: 'media',
    module: 'media',
    icon: 'layers',
    color: categoryColors.media,
  },

  // Email Module
  {
    id: 'email.send',
    name: 'Send Email',
    description: 'Send email using template or HTML',
    category: 'action',
    module: 'email',
    icon: 'mail-send',
    color: categoryColors.action,
  },

  // Flow Module
  {
    id: 'flow.delay',
    name: 'Delay',
    description: 'Wait for specified duration',
    category: 'flow',
    module: 'flow',
    icon: 'clock',
    color: categoryColors.flow,
  },
  {
    id: 'flow.approval',
    name: 'Human Approval',
    description: 'Wait for manual approval',
    category: 'flow',
    module: 'flow',
    icon: 'check-circle',
    color: categoryColors.flow,
  },
  {
    id: 'flow.forEach',
    name: 'For Each',
    description: 'Loop over array items',
    category: 'flow',
    module: 'flow',
    icon: 'repeat',
    color: categoryColors.flow,
  },
];

interface NodePaletteItemProps {
  item: PaletteItem;
}

function NodePaletteItem({ item }: NodePaletteItemProps) {
  const Icon = iconMap[item.icon] || FileText;

  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex cursor-grab items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent active:cursor-grabbing"
    >
      <div
        className="flex h-8 w-8 items-center justify-center rounded-md"
        style={{ backgroundColor: item.color + '20' }}
      >
        <Icon className="h-4 w-4" style={{ color: item.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-medium">{item.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {item.description}
        </div>
      </div>
    </div>
  );
}

interface ModuleGroupProps {
  module: string;
  items: PaletteItem[];
  defaultOpen?: boolean;
}

function ModuleGroup({ module, items, defaultOpen = false }: ModuleGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
        <span>{module}</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 px-2 pb-3">
        {items.map((item) => (
          <NodePaletteItem key={item.id} item={item} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

interface NodePaletteProps {
  nodes?: PaletteItem[];
}

export function NodePalette({ nodes = defaultNodes }: NodePaletteProps) {
  const [search, setSearch] = useState('');

  // Filter nodes by search
  const filteredNodes = useMemo(() => {
    if (!search.trim()) return nodes;
    const lower = search.toLowerCase();
    return nodes.filter(
      (n) =>
        n.name.toLowerCase().includes(lower) ||
        n.description.toLowerCase().includes(lower) ||
        n.module.toLowerCase().includes(lower)
    );
  }, [nodes, search]);

  // Group by module
  const groupedNodes = useMemo(() => {
    const groups: Record<string, PaletteItem[]> = {};
    filteredNodes.forEach((node) => {
      if (!groups[node.module]) {
        groups[node.module] = [];
      }
      groups[node.module].push(node);
    });
    return groups;
  }, [filteredNodes]);

  return (
    <div className="flex h-full flex-col">
      {/* Search */}
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Node List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {Object.entries(groupedNodes).map(([module, items], index) => (
            <ModuleGroup
              key={module}
              module={module}
              items={items}
              defaultOpen={index < 2}
            />
          ))}
          {filteredNodes.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No nodes found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
