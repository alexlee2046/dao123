
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/builder/settings/ColorPicker';
import { SettingsSection } from './SettingsSection';
import { SelectedComponentProps } from './types';

interface TextPropertiesProps {
    selected: SelectedComponentProps;
    setProp: (key: string, value: any) => void;
    getDisplayValue: (key: string) => any;
    t: (key: string) => string;
    isTextComponent: boolean;
}

export const TextProperties = ({ selected, setProp, getDisplayValue, t, isTextComponent }: TextPropertiesProps) => {
    if (!isTextComponent) return null;

    return (
        <SettingsSection title={`🔤 ${t('text')}`}>
            {/* HTML Tag */}
            {selected.tag !== undefined && (
                <div className="space-y-2">
                    <Label className="text-xs">{t('htmlTag')}</Label>
                    <Select
                        value={selected.tag}
                        onValueChange={(value) => setProp('tag', value)}
                    >
                        <SelectTrigger className="h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="h1">{t('tags.h1')}</SelectItem>
                            <SelectItem value="h2">{t('tags.h2')}</SelectItem>
                            <SelectItem value="h3">{t('tags.h3')}</SelectItem>
                            <SelectItem value="h4">H4</SelectItem>
                            <SelectItem value="h5">H5</SelectItem>
                            <SelectItem value="h6">H6</SelectItem>
                            <SelectItem value="p">{t('tags.p')}</SelectItem>
                            <SelectItem value="span">{t('tags.span')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Font Size */}
            {selected.fontSize !== undefined && (
                <div className="space-y-2">
                    <Label className="text-xs">{t('properties.fontSize')}</Label>
                    <Input
                        value={getDisplayValue('fontSize')}
                        onChange={(e) => setProp('fontSize', e.target.value)}
                        placeholder="16px"
                    />
                </div>
            )}

            {/* Font Weight */}
            {selected.fontWeight !== undefined && (
                <div className="space-y-2">
                    <Label className="text-xs">{t('properties.fontWeight')}</Label>
                    <Select
                        value={getDisplayValue('fontWeight')}
                        onValueChange={(value) => setProp('fontWeight', value)}
                    >
                        <SelectTrigger className="h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="300">Light (300)</SelectItem>
                            <SelectItem value="400">Regular (400)</SelectItem>
                            <SelectItem value="500">Medium (500)</SelectItem>
                            <SelectItem value="600">SemiBold (600)</SelectItem>
                            <SelectItem value="700">Bold (700)</SelectItem>
                            <SelectItem value="800">ExtraBold (800)</SelectItem>
                            <SelectItem value="900">Black (900)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Line Height */}
            {selected.lineHeight !== undefined && (
                <div className="space-y-2">
                    <Label className="text-xs">{t('properties.lineHeight')}</Label>
                    <Input
                        value={getDisplayValue('lineHeight')}
                        onChange={(e) => setProp('lineHeight', e.target.value)}
                        placeholder="1.5"
                    />
                </div>
            )}

            {/* Text Align */}
            {selected.textAlign !== undefined && (
                <div className="space-y-2">
                    <Label className="text-xs">{t('textAlign')}</Label>
                    <div className="flex gap-1">
                        {['left', 'center', 'right', 'justify'].map((align) => (
                            <Button
                                key={align}
                                variant={getDisplayValue('textAlign') === align ? 'default' : 'outline'}
                                size="sm"
                                className="flex-1 h-8"
                                onClick={() => setProp('textAlign', align)}
                            >
                                <span className="text-xs">{t(`textAlignOptions.${align}`)}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Text Decoration */}
            {selected.textDecoration !== undefined && (
                <div className="space-y-2">
                    <Label className="text-xs">{t('properties.textDecoration')}</Label>
                    <Select
                        value={getDisplayValue('textDecoration')}
                        onValueChange={(value) => setProp('textDecoration', value)}
                    >
                        <SelectTrigger className="h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="underline">Underline</SelectItem>
                            <SelectItem value="line-through">Line Through</SelectItem>
                            <SelectItem value="overline">Overline</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Color */}
            {selected.color !== undefined && (
                <ColorPicker
                    label={t('backgroundColor').replace('Background', 'Text')}
                    value={getDisplayValue('color')}
                    onChange={(v) => setProp('color', v)}
                />
            )}
        </SettingsSection>
    );
};
