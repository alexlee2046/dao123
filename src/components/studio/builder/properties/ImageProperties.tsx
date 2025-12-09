
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SettingsSection } from './SettingsSection';
import { SelectedComponentProps } from './types';

interface ImagePropertiesProps {
    selected: SelectedComponentProps;
    setProp: (key: string, value: any) => void;
    isImageComponent: boolean;
    t: (key: string) => string;
}

export const ImageProperties = ({ selected, setProp, isImageComponent, t }: ImagePropertiesProps) => {
    if (!isImageComponent) return null;

    return (
        <SettingsSection title={`🖼️ ${t('image')}`}>
            {selected.src !== undefined && (
                <div className="space-y-2">
                    <Label className="text-xs">{t('properties.imageUrl')}</Label>
                    <Input
                        value={selected.src}
                        onChange={(e) => setProp('src', e.target.value)}
                    />
                </div>
            )}
            {selected.alt !== undefined && (
                <div className="space-y-2">
                    <Label className="text-xs">{t('properties.altText')}</Label>
                    <Input
                        value={selected.alt}
                        onChange={(e) => setProp('alt', e.target.value)}
                    />
                </div>
            )}
            {selected.objectFit !== undefined && (
                <div className="space-y-2">
                    <Label className="text-xs">{t('properties.objectFit')}</Label>
                    <Select
                        value={selected.objectFit}
                        onValueChange={(value) => setProp('objectFit', value)}
                    >
                        <SelectTrigger className="h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="cover">Cover</SelectItem>
                            <SelectItem value="contain">Contain</SelectItem>
                            <SelectItem value="fill">Fill</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="scale-down">Scale Down</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
        </SettingsSection>
    );
};
