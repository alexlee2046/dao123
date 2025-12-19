'use client';

import { X, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export interface BulkAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  disabled?: boolean;
}

interface BulkActionsBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onClearSelection: () => void;
  selectedLabel?: string;
  clearLabel?: string;
  className?: string;
}

export function BulkActionsBar({
  selectedCount,
  actions,
  onClearSelection,
  selectedLabel = 'selected',
  clearLabel = 'Clear',
  className,
}: BulkActionsBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={cn(
            'flex items-center gap-3 p-3 rounded-lg bg-muted/80 backdrop-blur-sm border',
            className
          )}
        >
          {/* Selection Info */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {selectedCount} {selectedLabel}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              {clearLabel}
            </Button>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-border" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant={action.variant || 'secondary'}
                  size="sm"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className="h-8"
                >
                  {Icon && <Icon className="h-4 w-4 mr-1.5" />}
                  {action.label}
                </Button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
