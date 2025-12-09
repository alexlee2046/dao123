
import React from 'react';
import { AnimationSettings } from '@/components/builder/settings/AnimationSettings';
import { SettingsSection } from './SettingsSection';
import { SelectedComponentProps } from './types';

interface AnimationPropertiesProps {
    selected: SelectedComponentProps;
    setProp: (key: string, value: any) => void;
    t: (key: string) => string;
}

export const AnimationProperties = ({ selected, setProp, t }: AnimationPropertiesProps) => {
    return (
        <SettingsSection title={`✨ ${t('advanced')}`} defaultOpen={false}>
            <AnimationSettings
                animation={selected.animation}
                onChange={(v) => setProp('animation', v)}
            />
        </SettingsSection>
    );
};
