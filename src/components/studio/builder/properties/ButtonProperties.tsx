
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SettingsSection } from './SettingsSection';
import { SelectedComponentProps } from './types';

interface ButtonPropertiesProps {
    selected: SelectedComponentProps;
    setProp: (key: string, value: any) => void;
    t: (key: string) => string;
    isButtonComponent: boolean;
}

export const ButtonProperties = ({ selected, setProp, t, isButtonComponent }: ButtonPropertiesProps) => {
    if (!isButtonComponent || selected.variant === undefined) return null;

    return (
        <SettingsSection title={`🎨 ${t('button')}`}>
            <div className="space-y-2">
                <Label className="text-xs">{t('styleVariant')}</Label>
                <Select
                    value={selected.variant}
                    onValueChange={(value) => setProp('variant', value)}
                >
                    <SelectTrigger className="h-8">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="default">{t('variants.default')}</SelectItem>
                        <SelectItem value="secondary">{t('variants.secondary')}</SelectItem>
                        <SelectItem value="outline">{t('variants.outline')}</SelectItem>
                        <SelectItem value="ghost">{t('variants.ghost')}</SelectItem>
                        <SelectItem value="destructive">{t('variants.destructive')}</SelectItem>
                        <SelectItem value="link">{t('variants.link')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {selected.size !== undefined && (
                <div className="space-y-2">
                    <Label className="text-xs">{t('properties.buttonSize')}</Label>
                    <Select
                        value={selected.size}
                        onValueChange={(value) => setProp('size', value)}
                    >
                        <SelectTrigger className="h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="default">{t('sizes.default')}</SelectItem>
                            <SelectItem value="sm">{t('sizes.sm')}</SelectItem>
                            <SelectItem value="lg">{t('sizes.lg')}</SelectItem>
                            <SelectItem value="icon">Icon</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
        </SettingsSection>
    );
};
