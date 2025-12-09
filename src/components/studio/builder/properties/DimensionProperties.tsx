
import React from 'react';
import { SizeControl } from '@/components/builder/settings/ShadowSizeControl';
import { BoxSpacingControl, SpacingControl } from '@/components/builder/settings/SpacingControl';
import { SettingsSection } from './SettingsSection';
import { SelectedComponentProps } from './types';

interface DimensionPropertiesProps {
    selected: SelectedComponentProps;
    setProp: (key: string, value: any) => void;
    getDisplayValue: (key: string) => any;
    t: (key: string) => string;
    isBlockComponent: boolean;
}

export const DimensionProperties = ({ selected, setProp, getDisplayValue, t, isBlockComponent }: DimensionPropertiesProps) => {
    // Check if any dimension properties exist
    const hasDimensions = selected.width !== undefined ||
        selected.height !== undefined ||
        selected.minHeight !== undefined ||
        selected.padding !== undefined ||
        selected.margin !== undefined;

    if (!hasDimensions) return null;

    return (
        <SettingsSection title={`📏 ${t('settings')}`}>
            <SizeControl
                width={getDisplayValue('width')}
                height={getDisplayValue('height')}
                onWidthChange={selected.width !== undefined ? (v) => setProp('width', v) : undefined}
                onHeightChange={selected.height !== undefined ? (v) => setProp('height', v) : undefined}
            />

            {(selected.padding !== undefined || selected.margin !== undefined) && (
                <BoxSpacingControl
                    padding={getDisplayValue('padding')}
                    margin={getDisplayValue('margin')}
                    onPaddingChange={selected.padding !== undefined ? (side, v) => {
                        const current = getDisplayValue('padding') || { top: '0px', right: '0px', bottom: '0px', left: '0px' };
                        setProp('padding', { ...current, [side]: v });
                    } : undefined}
                    onMarginChange={selected.margin !== undefined ? (side, v) => {
                        const current = getDisplayValue('margin') || { top: '0px', right: '0px', bottom: '0px', left: '0px' };
                        setProp('margin', { ...current, [side]: v });
                    } : undefined}
                />
            )}

            {selected.minHeight !== undefined && !isBlockComponent && (
                <SpacingControl
                    label={t('minHeight')}
                    value={getDisplayValue('minHeight')}
                    onChange={(v) => setProp('minHeight', v)}
                    max={800}
                />
            )}
        </SettingsSection>
    );
};
