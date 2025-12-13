import React from 'react';
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize, RotateCcw } from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { useTranslations } from 'next-intl';
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface CanvasControlsProps {
    className?: string;
}

export function CanvasControls({ className }: CanvasControlsProps) {
    const t = useTranslations('studio');
    const { runCommand, isBuilderMode } = useStudioStore();

    // Only show in builder mode
    if (!isBuilderMode) return null;

    const handleZoomIn = () => {
        runCommand('dao:zoom-in');
    };

    const handleZoomOut = () => {
        runCommand('dao:zoom-out');
    };

    const handleZoomReset = () => {
        runCommand('dao:zoom-reset');
    };

    const handleFitCanvas = () => {
        runCommand('core:canvas-clear');
    };

    return (
        <TooltipProvider delayDuration={300}>
            <div className={cn(
                "flex items-center gap-0.5 bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg p-0.5",
                className
            )}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={handleZoomOut}
                        >
                            <ZoomOut className="h-3.5 w-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                        {t('editor.commands.zoomOut')} (⌘-)
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs font-mono min-w-[50px]"
                            onClick={handleZoomReset}
                        >
                            100%
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                        {t('editor.commands.zoomReset')} (⌘0)
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={handleZoomIn}
                        >
                            <ZoomIn className="h-3.5 w-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                        {t('editor.commands.zoomIn')} (⌘+)
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}
