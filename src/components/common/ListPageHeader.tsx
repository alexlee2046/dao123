'use client';

import { LucideIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/components/link';
import { cn } from '@/lib/utils';

interface ListPageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  count?: number;
  countLabel?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: LucideIcon;
  };
  badge?: {
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  className?: string;
}

export function ListPageHeader({
  title,
  description,
  icon: Icon,
  count,
  countLabel,
  action,
  badge,
  className,
}: ListPageHeaderProps) {
  const ActionIcon = action?.icon || Plus;

  return (
    <div className={cn('flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {badge && (
              <Badge variant={badge.variant || 'secondary'}>
                {badge.label}
              </Badge>
            )}
            {count !== undefined && (
              <span className="text-sm text-muted-foreground">
                ({count}{countLabel ? ` ${countLabel}` : ''})
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>

      {action && (
        <Button
          onClick={action.onClick}
          asChild={!!action.href}
          className="mt-3 sm:mt-0"
        >
          {action.href ? (
            <Link href={action.href}>
              <ActionIcon className="h-4 w-4 mr-2" />
              {action.label}
            </Link>
          ) : (
            <>
              <ActionIcon className="h-4 w-4 mr-2" />
              {action.label}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
