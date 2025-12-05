'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BuilderStyleProps } from '@/lib/builder/styleUtils';

type AnimationProps = NonNullable<BuilderStyleProps['animation']>;

interface AnimationSettingsProps {
    animation?: AnimationProps;
    onChange: (animation: AnimationProps) => void;
}

export function AnimationSettings({
    animation,
    onChange
}: AnimationSettingsProps) {
    // Default values
    const currentAnimation: AnimationProps = animation || {
        type: 'none',
        duration: 0.5,
        delay: 0,
        infinite: false
    };

    const updateAnimation = (updates: Partial<AnimationProps>) => {
        // If we are changing type to something other than none, ensure defaults
        if (updates.type && updates.type !== 'none' && !animation) {
            onChange({
                type: updates.type,
                duration: 0.5,
                delay: 0,
                infinite: false,
                ...updates
            } as AnimationProps);
        } else {
            onChange({ ...currentAnimation, ...updates } as AnimationProps);
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-xs font-medium">Animation Type</Label>
                <Select
                    value={currentAnimation.type}
                    onValueChange={(value) => updateAnimation({ type: value as any })}
                >
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="fadeIn">Fade In</SelectItem>
                        <SelectItem value="fadeInUp">Fade In Up</SelectItem>
                        <SelectItem value="fadeInDown">Fade In Down</SelectItem>
                        <SelectItem value="fadeInLeft">Fade In Left</SelectItem>
                        <SelectItem value="fadeInRight">Fade In Right</SelectItem>
                        <SelectItem value="zoomIn">Zoom In</SelectItem>
                        <SelectItem value="bounce">Bounce</SelectItem>
                        <SelectItem value="pulse">Pulse</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {currentAnimation.type !== 'none' && (
                <>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs">Duration (s)</Label>
                            <span className="text-xs text-muted-foreground">{currentAnimation.duration}s</span>
                        </div>
                        <Slider
                            value={[currentAnimation.duration]}
                            onValueChange={(value) => updateAnimation({ duration: value[0] })}
                            min={0.1}
                            max={3}
                            step={0.1}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs">Delay (s)</Label>
                            <span className="text-xs text-muted-foreground">{currentAnimation.delay}s</span>
                        </div>
                        <Slider
                            value={[currentAnimation.delay]}
                            onValueChange={(value) => updateAnimation({ delay: value[0] })}
                            min={0}
                            max={2}
                            step={0.1}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Label className="text-xs">Infinite Loop</Label>
                        <Switch
                            checked={currentAnimation.infinite}
                            onCheckedChange={(checked) => updateAnimation({ infinite: checked })}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
