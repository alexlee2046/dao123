
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { SettingsSection } from './SettingsSection';
import { SelectedComponentProps } from './types';

interface VideoPropertiesProps {
    selected: SelectedComponentProps;
    setProp: (key: string, value: any) => void;
    isVideoComponent: boolean;
    t: (key: string) => string;
}

export const VideoProperties = ({ selected, setProp, isVideoComponent, t }: VideoPropertiesProps) => {
    if (!isVideoComponent) return null;

    return (
        <SettingsSection title={`🎬 ${t('video')}`}>
            {selected.poster !== undefined && (
                <div className="space-y-2">
                    <Label className="text-xs">{t('properties.posterImage')}</Label>
                    <Input
                        value={selected.poster}
                        onChange={(e) => setProp('poster', e.target.value)}
                        placeholder="https://..."
                    />
                </div>
            )}
            {selected.controls !== undefined && (
                <div className="flex items-center justify-between">
                    <Label className="text-xs">{t('properties.showControls')}</Label>
                    <Switch
                        checked={selected.controls}
                        onCheckedChange={(checked) => setProp('controls', checked)}
                    />
                </div>
            )}
            {selected.autoplay !== undefined && (
                <div className="flex items-center justify-between">
                    <Label className="text-xs">{t('properties.autoplay')}</Label>
                    <Switch
                        checked={selected.autoplay}
                        onCheckedChange={(checked) => setProp('autoplay', checked)}
                    />
                </div>
            )}
            {selected.loop !== undefined && (
                <div className="flex items-center justify-between">
                    <Label className="text-xs">{t('properties.loop')}</Label>
                    <Switch
                        checked={selected.loop}
                        onCheckedChange={(checked) => setProp('loop', checked)}
                    />
                </div>
            )}
            {(selected.muted !== undefined) && (
                <div className="flex items-center justify-between">
                    <Label className="text-xs">{t('properties.muted')}</Label>
                    <Switch
                        checked={selected.muted}
                        onCheckedChange={(checked) => setProp('muted', checked)}
                    />
                </div>
            )}
        </SettingsSection>
    );
};
