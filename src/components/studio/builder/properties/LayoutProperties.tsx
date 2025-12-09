
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { SpacingControl } from '@/components/builder/settings/SpacingControl';
import { SettingsSection } from './SettingsSection';
import { SelectedComponentProps } from './types';

interface LayoutPropertiesProps {
    selected: SelectedComponentProps;
    setProp: (key: string, value: any) => void;
    t: (key: string) => string;
    isLayoutComponent: boolean;
    componentName: string;
}

export const LayoutProperties = ({ selected, setProp, t, isLayoutComponent, componentName }: LayoutPropertiesProps) => {
    if (!isLayoutComponent) return null;

    return (
        <SettingsSection title={`📐 ${t('layoutComponents')}`}>
            {/* Gap */}
            {selected.gap !== undefined && (
                <SpacingControl
                    label={t('gap')}
                    value={selected.gap}
                    onChange={(v) => setProp('gap', v)}
                    max={64}
                />
            )}

            {/* Wrap */}
            {selected.wrap !== undefined && (
                <div className="flex items-center justify-between">
                    <Label className="text-xs">{t('properties.autoWrap')}</Label>
                    <Switch
                        checked={selected.wrap}
                        onCheckedChange={(checked) => setProp('wrap', checked)}
                    />
                </div>
            )}

            {/* Columns */}
            {selected.columns !== undefined && (
                <div className="space-y-2">
                    <Label className="text-xs">{t('columns')}</Label>
                    <Select
                        value={String(selected.columns)}
                        onValueChange={(value) => setProp('columns', parseInt(value))}
                    >
                        <SelectTrigger className="h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[1, 2, 3, 4, 5, 6].map((n) => (
                                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Justify Content */}
            {selected.justify !== undefined && (
                <div className="space-y-2">
                    <Label className="text-xs">{t('justifyContent')}</Label>
                    <Select
                        value={selected.justify}
                        onValueChange={(value) => setProp('justify', value)}
                    >
                        <SelectTrigger className="h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="start">{t('justify.start')}</SelectItem>
                            <SelectItem value="center">{t('justify.center')}</SelectItem>
                            <SelectItem value="end">{t('justify.end')}</SelectItem>
                            <SelectItem value="between">{t('justify.between')}</SelectItem>
                            <SelectItem value="around">{t('justify.around')}</SelectItem>
                            <SelectItem value="evenly">{t('justify.evenly')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Align Items */}
            {selected.align !== undefined && (
                <div className="space-y-2">
                    <Label className="text-xs">{t('alignItems')}</Label>
                    <Select
                        value={selected.align}
                        onValueChange={(value) => setProp('align', value)}
                    >
                        <SelectTrigger className="h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="start">{t('align.start')}</SelectItem>
                            <SelectItem value="center">{t('align.center')}</SelectItem>
                            <SelectItem value="end">{t('align.end')}</SelectItem>
                            <SelectItem value="stretch">{t('align.stretch')}</SelectItem>
                            {componentName.includes('Row') && (
                                <SelectItem value="baseline">Baseline</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </SettingsSection>
    );
};
