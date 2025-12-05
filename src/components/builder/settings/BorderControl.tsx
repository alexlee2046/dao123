'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ColorPicker } from './ColorPicker';
import { cn } from '@/lib/utils';

interface BorderControlProps {
    width?: string;
    style?: string;
    color?: string;
    radius?: string;
    onWidthChange?: (value: string) => void;
    onStyleChange?: (value: string) => void;
    onColorChange?: (value: string) => void;
    onRadiusChange?: (value: string) => void;
}

const borderStyles = [
    { value: 'none', label: '无' },
    { value: 'solid', label: '实线' },
    { value: 'dashed', label: '虚线' },
    { value: 'dotted', label: '点线' },
    { value: 'double', label: '双线' },
];

export function BorderControl({
    width = '0px',
    style = 'none',
    color = '#e5e7eb',
    radius = '0px',
    onWidthChange,
    onStyleChange,
    onColorChange,
    onRadiusChange,
}: BorderControlProps) {
    const parseValue = (val: string): number => {
        const num = parseInt(val, 10);
        return isNaN(num) ? 0 : num;
    };

    return (
        <div className="space-y-3">
            {/* 边框样式 */}
            {onStyleChange && (
                <div className="space-y-2">
                    <Label className="text-xs">边框样式</Label>
                    <Select value={style} onValueChange={onStyleChange}>
                        <SelectTrigger className="h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {borderStyles.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={cn(
                                                "w-8 h-0",
                                                s.value !== 'none' && 'border-t-2'
                                            )}
                                            style={{
                                                borderStyle: s.value,
                                                borderColor: '#000',
                                            }}
                                        />
                                        <span>{s.label}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* 边框宽度 */}
            {onWidthChange && style !== 'none' && (
                <div className="space-y-2">
                    <Label className="text-xs">边框宽度</Label>
                    <div className="flex items-center gap-3">
                        <Slider
                            value={[parseValue(width)]}
                            onValueChange={(v) => onWidthChange(`${v[0]}px`)}
                            min={0}
                            max={10}
                            step={1}
                            className="flex-1"
                        />
                        <div className="w-16">
                            <Input
                                value={parseValue(width)}
                                onChange={(e) => onWidthChange(`${e.target.value}px`)}
                                className="h-8 text-center"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* 边框颜色 */}
            {onColorChange && style !== 'none' && (
                <ColorPicker
                    label="边框颜色"
                    value={color}
                    onChange={onColorChange}
                />
            )}

            {/* 圆角 */}
            {onRadiusChange && (
                <div className="space-y-2">
                    <Label className="text-xs">圆角</Label>
                    <div className="flex items-center gap-3">
                        <Slider
                            value={[parseValue(radius)]}
                            onValueChange={(v) => onRadiusChange(`${v[0]}px`)}
                            min={0}
                            max={50}
                            step={1}
                            className="flex-1"
                        />
                        <div className="w-16">
                            <Input
                                value={parseValue(radius)}
                                onChange={(e) => onRadiusChange(`${e.target.value}px`)}
                                className="h-8 text-center"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
