"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import {
    MessageSquare,
    FileText,
    Box,
    Layers,
    Settings,
    LogOut
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStudioStore } from "@/lib/store";

interface SidebarRailProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    className?: string;
}

export function SidebarRail({
    activeTab,
    onTabChange,
    className
}: SidebarRailProps) {
    const t = useTranslations('studio');
    const { isBuilderMode } = useStudioStore();

    const topItems = [
        { id: 'chat', icon: MessageSquare, label: t('chat') || 'Chat', visible: true },
        { id: 'pages', icon: FileText, label: t('pages') || 'Pages', visible: true },
        // Builder Mode Specific Items
        { id: 'blocks', icon: Box, label: 'Blocks', visible: isBuilderMode },
        { id: 'layers', icon: Layers, label: 'Layers', visible: isBuilderMode },
    ];

    const bottomItems = [
        // Placeholder for future global settings or similar
        // { id: 'settings', icon: Settings, label: 'Settings', visible: true },
    ];

    return (
        <TooltipProvider delayDuration={0}>
            <div className={cn(
                "w-12 border-r bg-muted/10 flex flex-col items-center py-4 gap-4 z-20",
                className
            )}>
                <div className="flex flex-col items-center gap-2 w-full px-2">
                    {topItems.filter(item => item.visible).map((item) => (
                        <Tooltip key={item.id}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={activeTab === item.id ? "secondary" : "ghost"}
                                    size="icon"
                                    className={cn(
                                        "h-9 w-9 rounded-lg transition-all",
                                        activeTab === item.id
                                            ? "bg-primary/10 text-primary shadow-sm hover:bg-primary/20"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                    onClick={() => onTabChange(item.id)}
                                >
                                    <item.icon className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={10}>
                                {item.label}
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </div>

                <div className="flex-1" />

                <div className="flex flex-col items-center gap-2 w-full px-2">
                    {bottomItems.filter(item => item.visible).map((item) => (
                        <Tooltip key={item.id}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    onClick={() => onTabChange(item.id)}
                                >
                                    <item.icon className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={10}>
                                {item.label}
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </div>
            </div>
        </TooltipProvider>
    );
}
