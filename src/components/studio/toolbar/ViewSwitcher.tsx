"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Box, Layers, Paintbrush, Settings2, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export type ViewType = 'blocks' | 'layers' | 'styles' | 'traits' | 'selectors';

interface ViewSwitcherProps {
    activeView?: ViewType;
    onViewChange?: (view: ViewType) => void;
    className?: string;
}

const views: { id: ViewType; icon: React.ElementType; labelKey: string }[] = [
    { id: 'blocks', icon: Box, labelKey: 'blocks' },
    { id: 'layers', icon: Layers, labelKey: 'layers' },
    { id: 'selectors', icon: Tag, labelKey: 'selectors' },
    { id: 'styles', icon: Paintbrush, labelKey: 'styles' },
    { id: 'traits', icon: Settings2, labelKey: 'traits' },
];

export function ViewSwitcher({
    activeView,
    onViewChange,
    className
}: ViewSwitcherProps) {
    const t = useTranslations('studio');
    const [internalActiveView, setInternalActiveView] = React.useState<ViewType | undefined>(activeView);

    React.useEffect(() => {
        const handleSwitchView = (e: CustomEvent) => {
            const view = e.detail.view;
            if (['blocks', 'layers', 'styles', 'traits', 'selectors'].includes(view)) {
                setInternalActiveView(view);
            } else {
                setInternalActiveView(undefined);
            }
        };

        window.addEventListener('dao:switch-view', handleSwitchView as EventListener);
        return () => window.removeEventListener('dao:switch-view', handleSwitchView as EventListener);
    }, []);

    const handleViewClick = (view: ViewType) => {
        onViewChange?.(view);
        // Dispatch event for panel switching
        window.dispatchEvent(new CustomEvent('dao:switch-view', {
            detail: { view }
        }));
    };

    return (
        <TooltipProvider>
            <div className={cn(
                "flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-lg",
                className
            )}>
                {views.map(({ id, icon: Icon, labelKey }) => (
                    <Tooltip key={id}>
                        <TooltipTrigger asChild>
                            <Button
                                variant={internalActiveView === id ? "secondary" : "ghost"}
                                size="sm"
                                className={cn(
                                    "h-7 w-7 p-0 rounded-md transition-all",
                                    internalActiveView === id && "shadow-sm"
                                )}
                                onClick={() => handleViewClick(id)}
                            >
                                <Icon className="w-3.5 h-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p>{t(labelKey) || labelKey}</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>
        </TooltipProvider>
    );
}

export default ViewSwitcher;
