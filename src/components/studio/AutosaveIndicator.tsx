"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { Cloud, CloudOff, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

type SaveStatus = 'idle' | 'saved' | 'saving' | 'unsaved' | 'offline' | 'error';

interface AutosaveIndicatorProps {
    status: SaveStatus;
    lastSavedAt?: number | null;
    className?: string;
}

export function AutosaveIndicator({
    status,
    lastSavedAt,
    className
}: AutosaveIndicatorProps) {
    const t = useTranslations('studio');

    const getStatusConfig = () => {
        switch (status) {
            case 'saved':
                return {
                    icon: Check,
                    text: t('saved') || 'Saved',
                    color: 'text-green-500',
                    bgColor: 'bg-green-500/10',
                };
            case 'saving':
                return {
                    icon: Loader2,
                    text: t('saving') || 'Saving...',
                    color: 'text-blue-500',
                    bgColor: 'bg-blue-500/10',
                    animate: true,
                };
            case 'unsaved':
                return {
                    icon: Cloud,
                    text: t('unsaved') || 'Unsaved changes',
                    color: 'text-yellow-500',
                    bgColor: 'bg-yellow-500/10',
                };
            case 'offline':
                return {
                    icon: CloudOff,
                    text: t('offline') || 'Offline',
                    color: 'text-muted-foreground',
                    bgColor: 'bg-muted/50',
                };
            case 'error':
                return {
                    icon: CloudOff, // Or AlertCircle
                    text: t('saveFailed') || 'Save failed',
                    color: 'text-red-500',
                    bgColor: 'bg-red-500/10',
                };
            case 'idle':
            default:
                return {
                    icon: Cloud,
                    text: t('ready') || 'Ready',
                    color: 'text-muted-foreground',
                    bgColor: 'bg-transparent',
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    const formatTime = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;

        if (diff < 60000) return t('justNow') || 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        return new Date(timestamp).toLocaleTimeString();
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all",
                            config.bgColor,
                            config.color,
                            className
                        )}
                    >
                        <Icon className={cn("w-3 h-3", config.animate && "animate-spin")} />
                        <span className="hidden sm:inline">{config.text}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{config.text}</p>
                    {lastSavedAt && status === 'saved' && (
                        <p className="text-xs text-muted-foreground">
                            {formatTime(lastSavedAt)}
                        </p>
                    )}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export default AutosaveIndicator;
