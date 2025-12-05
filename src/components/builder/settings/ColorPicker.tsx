'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// 预设颜色
const presetColors = [
    // 灰色系
    '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a', '#000000',
    // 彩色
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
];

interface ColorPickerProps {
    value: string;
    onChange: (color: string) => void;
    label?: string;
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
    const [color, setColor] = useState(value || '#ffffff');

    useEffect(() => {
        setColor(value || '#ffffff');
    }, [value]);

    const handleColorChange = (newColor: string) => {
        setColor(newColor);
        onChange(newColor);
    };

    return (
        <div className="space-y-2">
            {label && <Label className="text-xs">{label}</Label>}
            <Popover>
                <PopoverTrigger asChild>
                    <button
                        className={cn(
                            "w-full h-9 rounded-md border border-input flex items-center gap-2 px-3 hover:bg-accent transition-colors",
                            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        )}
                    >
                        <div
                            className="h-5 w-5 rounded border border-gray-300"
                            style={{ backgroundColor: color }}
                        />
                        <span className="text-sm text-muted-foreground flex-1 text-left">
                            {color}
                        </span>
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="start">
                    <div className="space-y-3">
                        {/* 颜色输入 */}
                        <div className="flex gap-2">
                            <div
                                className="h-9 w-9 rounded border border-gray-300 shrink-0"
                                style={{ backgroundColor: color }}
                            />
                            <Input
                                value={color}
                                onChange={(e) => handleColorChange(e.target.value)}
                                placeholder="#000000"
                                className="h-9"
                            />
                        </div>

                        {/* 预设颜色 */}
                        <div className="grid grid-cols-11 gap-1">
                            {presetColors.map((presetColor) => (
                                <button
                                    key={presetColor}
                                    className={cn(
                                        "h-5 w-5 rounded-sm border border-gray-200 hover:scale-110 transition-transform",
                                        color === presetColor && "ring-2 ring-primary ring-offset-1"
                                    )}
                                    style={{ backgroundColor: presetColor }}
                                    onClick={() => handleColorChange(presetColor)}
                                />
                            ))}
                        </div>

                        {/* 透明 */}
                        <button
                            className={cn(
                                "w-full h-8 rounded border border-dashed border-gray-300 text-xs text-muted-foreground hover:bg-accent transition-colors",
                                color === 'transparent' && "ring-2 ring-primary"
                            )}
                            onClick={() => handleColorChange('transparent')}
                        >
                            透明 / Transparent
                        </button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
