
import React from 'react';
import { Separator } from '@/components/ui/separator';
import { BorderControl } from '@/components/builder/settings/BorderControl';
import { ShadowControl } from '@/components/builder/settings/ShadowSizeControl';
import { SettingsSection } from './SettingsSection';
import { SelectedComponentProps } from './types';

interface BorderShadowPropertiesProps {
    selected: SelectedComponentProps;
    setProp: (key: string, value: any) => void;
    getDisplayValue: (key: string) => any;
    t: (key: string) => string;
}

export const BorderShadowProperties = ({ selected, setProp, getDisplayValue, t }: BorderShadowPropertiesProps) => {
    const hasBorderOrShadow = selected.borderWidth !== undefined ||
        selected.borderRadius !== undefined ||
        selected.boxShadow !== undefined;

    if (!hasBorderOrShadow) return null;

    return (
        <SettingsSection title={`🖼️ ${t('advanced')}`}>
            <BorderControl
                width={getDisplayValue('borderWidth')}
                style={getDisplayValue('borderStyle')}
                color={getDisplayValue('borderColor')}
                radius={getDisplayValue('borderRadius')}
                onWidthChange={selected.borderWidth !== undefined ? (v) => setProp('borderWidth', v) : undefined}
                onStyleChange={selected.borderStyle !== undefined ? (v) => setProp('borderStyle', v) : undefined}
                onColorChange={selected.borderColor !== undefined ? (v) => setProp('borderColor', v) : undefined}
                onRadiusChange={selected.borderRadius !== undefined ? (v) => setProp('borderRadius', v) : undefined}
            />

            {selected.boxShadow !== undefined && (
                <>
                    <Separator className="my-4" />
                    <ShadowControl
                        value={getDisplayValue('boxShadow')}
                        onChange={(v) => setProp('boxShadow', v)}
                    />
                </>
            )}
        </SettingsSection>
    );
};
