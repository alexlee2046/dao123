import React from 'react';
import { useEditor } from '@craftjs/core';
import { ChevronRight, ChevronDown, Box, Type, Image, Layout, MousePointerClick } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslations } from 'next-intl';

export const LayersPanel = () => {
  const { nodes, actions, selected } = useEditor((state) => ({
    nodes: state.nodes,
    selected: state.events.selected,
  }));
  
  const t = useTranslations('studio');

  const handleSelect = (id: string) => {
    actions.selectNode(id);
  };

  const [expanded, setExpanded] = React.useState<Set<string>>(new Set(['ROOT']));

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  const renderNode = (id: string, depth = 0) => {
    const node = nodes[id] as any;
    if (!node) return null;

    if (node.hidden) return null;

    const isSelected = selected.has(id);
    const hasChildren = node.nodes && node.nodes.length > 0;
    const isExpanded = expanded.has(id);

    // Determine Icon
    let Icon = Box;
    const name = node.data.displayName || node.data.name;
    const resolvedName = node.data.type?.resolvedName || '';
    
    if (name.includes('Text') || resolvedName.includes('Text')) Icon = Type;
    if (name.includes('Image') || resolvedName.includes('Image')) Icon = Image;
    if (name.includes('Button') || resolvedName.includes('Button')) Icon = MousePointerClick;
    if (name.includes('Row') || name.includes('Column') || name.includes('Container') || name.includes('Grid') || resolvedName.includes('Container')) Icon = Layout;

    return (
      <div key={id} className="select-none">
        <div
          className={cn(
            "flex items-center py-1.5 px-2 cursor-pointer text-xs transition-colors border-l-2",
            isSelected 
              ? "bg-primary/10 text-primary font-medium border-primary" 
              : "border-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground"
          )}
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
          onClick={(e) => {
            e.stopPropagation();
            handleSelect(id);
          }}
        >
            <div 
                className={cn("w-4 h-4 mr-0.5 flex items-center justify-center rounded-sm hover:bg-black/5 dark:hover:bg-white/10", !hasChildren && "invisible")}
                onClick={(e) => hasChildren && toggleExpand(id, e)}
            >
                 {isExpanded ? <ChevronDown className="w-3 h-3 opacity-50" /> : <ChevronRight className="w-3 h-3 opacity-50" />}
            </div>
          <Icon className="w-3.5 h-3.5 mr-2 opacity-70" />
          <span className="truncate flex-1">{node.data.custom?.displayName || node.data.displayName}</span>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {node.nodes.map((childId: string) => renderNode(childId, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
        <div className="p-3 border-b bg-muted/20">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('layers')}
            </h3>
        </div>
        <ScrollArea className="flex-1">
            <div className="p-2 pb-10">
                {nodes['ROOT'] ? renderNode('ROOT') : <div className="p-4 text-xs text-muted-foreground text-center">No layers found</div>}
            </div>
        </ScrollArea>
    </div>
  );
};
