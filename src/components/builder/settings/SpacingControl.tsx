'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

interface SpacingControlProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    min?: number;
    max?: number;
    unit?: 'px' | 'rem' | '%';
}

export function SpacingControl({
    value,
    onChange,
    label,
    min = 0,
    max = 100,
    unit = 'px'
}: SpacingControlProps) {
    // 解析当前值
    const parseValue = (val: string): number => {
        const num = parseInt(val, 10);
        return isNaN(num) ? 0 : num;
    };

    const numericValue = parseValue(value);

    const handleSliderChange = (newValue: number[]) => {
        onChange(`${newValue[0]}${unit}`);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        onChange(`${val}${unit}`);
    };

    return (
        <div className="space-y-2">
            {label && <Label className="text-xs">{label}</Label>}
            <div className="flex items-center gap-3">
                <Slider
                    value={[numericValue]}
                    onValueChange={handleSliderChange}
                    min={min}
                    max={max}
                    step={1}
                    className="flex-1"
                />
                <div className="w-20 flex items-center">
                    <Input
                        value={numericValue}
                        onChange={handleInputChange}
                        className="h-8 text-center pr-0"
                    />
                    <span className="text-xs text-muted-foreground ml-1">{unit}</span>
                </div>
            </div>
        </div>
    );
}

interface BoxSpacingControlProps {
    padding?: { top: string; right: string; bottom: string; left: string };
    margin?: { top: string; right: string; bottom: string; left: string };
    onPaddingChange?: (side: string, value: string) => void;
    onMarginChange?: (side: string, value: string) => void;
}

export function BoxSpacingControl({
    padding = { top: '0px', right: '0px', bottom: '0px', left: '0px' },
    margin = { top: '0px', right: '0px', bottom: '0px', left: '0px' },
    onPaddingChange,
    onMarginChange,
}: BoxSpacingControlProps) {
    return (
        <div className="space-y-4">
            {/* Margin */}
            {onMarginChange && (
                <div className="space-y-2">
                    <Label className="text-xs font-medium">Margin</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <SpacingControl
                            label="Top"
                            value={margin.top}
                            onChange={(v) => onMarginChange('top', v)}
                            max={200}
                        />
                        <SpacingControl
                            label="Bottom"
                            value={margin.bottom}
                            onChange={(v) => onMarginChange('bottom', v)}
                            max={200}
                        />
                        <SpacingControl
                            label="Left"
                            value={margin.left}
                            onChange={(v) => onMarginChange('left', v)}
                            max={200}
                        />
                        <SpacingControl
                            label="Right"
                            value={margin.right}
                            onChange={(v) => onMarginChange('right', v)}
                            max={200}
                        />
                    </div>
                </div>
            )}

            {/* Padding */}
            {onPaddingChange && (
                <div className="space-y-2">
                    <Label className="text-xs font-medium">Padding</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <SpacingControl
                            label="Top"
                            value={padding.top}
                            onChange={(v) => onPaddingChange('top', v)}
                            max={200}
                        />
                        <SpacingControl
                            label="Bottom"
                            value={padding.bottom}
                            onChange={(v) => onPaddingChange('bottom', v)}
                            max={200}
                        />
                        <SpacingControl
                            label="Left"
                            value={padding.left}
                            onChange={(v) => onPaddingChange('left', v)}
                            max={200}
                        />
                        <SpacingControl
                            label="Right"
                            value={padding.right}
                            onChange={(v) => onPaddingChange('right', v)}
                            max={200}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
