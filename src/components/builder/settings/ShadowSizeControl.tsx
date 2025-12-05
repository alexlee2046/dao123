'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface ShadowControlProps {
    value?: string;
    onChange: (value: string) => void;
}

const shadowPresets = [
    { value: 'none', label: '无', class: '' },
    { value: 'shadow-sm', label: '小', class: 'shadow-sm' },
    { value: 'shadow', label: '中', class: 'shadow' },
    { value: 'shadow-md', label: '大', class: 'shadow-md' },
    { value: 'shadow-lg', label: '特大', class: 'shadow-lg' },
    { value: 'shadow-xl', label: '超大', class: 'shadow-xl' },
    { value: 'shadow-2xl', label: '极大', class: 'shadow-2xl' },
];

export function ShadowControl({ value = 'none', onChange }: ShadowControlProps) {
    return (
        <div className="space-y-2">
            <Label className="text-xs">阴影效果</Label>
            <div className="grid grid-cols-4 gap-2">
                {shadowPresets.map((preset) => (
                    <button
                        key={preset.value}
                        className={cn(
                            "h-12 rounded border bg-white flex items-center justify-center text-xs transition-all",
                            preset.class,
                            value === preset.value
                                ? "ring-2 ring-primary border-primary"
                                : "border-gray-200 hover:border-gray-300"
                        )}
                        onClick={() => onChange(preset.value)}
                    >
                        {preset.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

interface SizeControlProps {
    width?: string;
    height?: string;
    onWidthChange?: (value: string) => void;
    onHeightChange?: (value: string) => void;
}

const widthPresets = [
    { value: 'auto', label: 'Auto' },
    { value: 'w-full', label: '100%' },
    { value: 'w-1/2', label: '50%' },
    { value: 'w-1/3', label: '33%' },
    { value: 'w-1/4', label: '25%' },
    { value: 'w-fit', label: 'Fit' },
];

export function SizeControl({
    width = 'auto',
    height = 'auto',
    onWidthChange,
    onHeightChange,
}: SizeControlProps) {
    return (
        <div className="space-y-3">
            {/* 宽度 */}
            {onWidthChange && (
                <div className="space-y-2">
                    <Label className="text-xs">宽度</Label>
                    <div className="flex flex-wrap gap-1">
                        {widthPresets.map((preset) => (
                            <Button
                                key={preset.value}
                                variant={width === preset.value ? "default" : "outline"}
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => onWidthChange(preset.value)}
                            >
                                {preset.label}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* 高度 */}
            {onHeightChange && (
                <div className="space-y-2">
                    <Label className="text-xs">高度</Label>
                    <div className="flex gap-2 items-center">
                        <Button
                            variant={height === 'auto' ? "default" : "outline"}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => onHeightChange('auto')}
                        >
                            Auto
                        </Button>
                        <Button
                            variant={height === 'h-full' ? "default" : "outline"}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => onHeightChange('h-full')}
                        >
                            100%
                        </Button>
                        <Button
                            variant={height === 'h-screen' ? "default" : "outline"}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => onHeightChange('h-screen')}
                        >
                            Screen
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
