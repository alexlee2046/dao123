
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorPicker } from '@/components/builder/settings/ColorPicker';
import { SpacingControl } from '@/components/builder/settings/SpacingControl';
import { SettingsSection } from './SettingsSection';
import { SelectedComponentProps } from './types';

interface BlockPropertiesProps {
    selected: SelectedComponentProps;
    setProp: (key: string, value: any) => void;
    getDisplayValue: (key: string) => any;
    t: (key: string) => string;
    isBlockComponent: boolean;
    componentName: string;
}

export const BlockProperties = ({ selected, setProp, getDisplayValue, t, isBlockComponent, componentName }: BlockPropertiesProps) => {
    if (!isBlockComponent) return null;

    return (
        <SettingsSection title={`🧱 ${t('blockComponents')}`}>
            {/* Background Color */}
            {selected.backgroundColor !== undefined && (
                <ColorPicker
                    label={t('backgroundColor')}
                    value={getDisplayValue('backgroundColor')}
                    onChange={(v) => setProp('backgroundColor', v)}
                />
            )}

            {/* Background Image */}
            {selected.backgroundImage !== undefined && (
                <div className="space-y-2">
                    <Label className="text-xs">{t('backgroundImage')}</Label>
                    <Input
                        value={getDisplayValue('backgroundImage') || ''}
                        onChange={(e) => setProp('backgroundImage', e.target.value)}
                        placeholder="https://..."
                    />
                </div>
            )}

            {/* Text Align */}
            {selected.textAlign !== undefined && (
                <div className="space-y-2">
                    <Label className="text-xs">{t('textAlign')}</Label>
                    <div className="flex gap-1">
                        {['left', 'center', 'right'].map((align) => (
                            <Button
                                key={align}
                                variant={getDisplayValue('textAlign') === align ? 'default' : 'outline'}
                                size="sm"
                                className="flex-1 h-8"
                                onClick={() => setProp('textAlign', align)}
                            >
                                {t(`textAlignOptions.${align}`) || align}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Min Height */}
            {selected.minHeight !== undefined && (
                <SpacingControl
                    label={t('minHeight')}
                    value={getDisplayValue('minHeight')}
                    onChange={(v) => setProp('minHeight', v)}
                    max={800}
                />
            )}

            {/* Variant */}
            {selected.variant !== undefined && (
                <div className="space-y-2">
                    <Label className="text-xs">{t('properties.styleVariant')}</Label>
                    <Select
                        value={selected.variant}
                        onValueChange={(value) => setProp('variant', value)}
                    >
                        <SelectTrigger className="h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {componentName.includes('Card') ? (
                                <>
                                    <SelectItem value="default">{t('variants.default')}</SelectItem>
                                    <SelectItem value="bordered">Bordered</SelectItem>
                                    <SelectItem value="elevated">Elevated</SelectItem>
                                </>
                            ) : componentName.includes('Navbar') ? (
                                <>
                                    <SelectItem value="light">Light</SelectItem>
                                    <SelectItem value="dark">Dark</SelectItem>
                                    <SelectItem value="transparent">Transparent</SelectItem>
                                </>
                            ) : (
                                <>
                                    <SelectItem value="light">Light</SelectItem>
                                    <SelectItem value="dark">Dark</SelectItem>
                                </>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </SettingsSection>
    );
};
