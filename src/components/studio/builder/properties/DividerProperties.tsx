
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SpacingControl } from '@/components/builder/settings/SpacingControl';
import { ColorPicker } from '@/components/builder/settings/ColorPicker';
import { SettingsSection } from './SettingsSection';
import { SelectedComponentProps } from './types';

interface DividerPropertiesProps {
    selected: SelectedComponentProps;
    setProp: (key: string, value: any) => void;
    t: (key: string) => string;
    isDividerComponent: boolean;
}

export const DividerProperties = ({ selected, setProp, t, isDividerComponent }: DividerPropertiesProps) => {
    if (!isDividerComponent) return null;

    return (
        <SettingsSection title={`➖ ${t('divider')}`}>
            {/* Orientation */}
            {selected.orientation !== undefined && (
                <div className="space-y-2">
                    <Label className="text-xs">{t('orientation')}</Label>
                    <Select
                        value={selected.orientation}
                        onValueChange={(value) => setProp('orientation', value)}
                    >
                        <SelectTrigger className="h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="horizontal">{t('horizontal')}</SelectItem>
                            <SelectItem value="vertical">{t('vertical')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Thickness */}
            {selected.thickness !== undefined && (
                <SpacingControl
                    label={t('thickness')}
                    value={selected.thickness}
                    onChange={(v) => setProp('thickness', v)}
                    max={20}
                />
            )}

            {/* Color */}
            {selected.color !== undefined && (
                <ColorPicker
                    label={t('dividerColor')}
                    value={selected.color}
                    onChange={(v) => setProp('color', v)}
                />
            )}
        </SettingsSection>
    );
};
