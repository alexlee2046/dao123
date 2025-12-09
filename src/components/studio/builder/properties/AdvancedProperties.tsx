
import React from 'react';
import { Label } from '@/components/ui/label';
import { CodeEditor } from '@/components/ui/code-editor';
import { SettingsSection } from './SettingsSection';
import { SelectedComponentProps } from './types';

interface AdvancedPropertiesProps {
    selected: SelectedComponentProps;
    setProp: (key: string, value: any) => void;
    t: (key: string) => string;
}

export const AdvancedProperties = ({ selected, setProp, t }: AdvancedPropertiesProps) => {
    return (
        <SettingsSection title={`⚙️ ${t('advanced')}`} defaultOpen={false}>
            {/* Tailwind Classes */}
            <div className="space-y-2">
                <Label className="text-xs">{t('tailwindClasses')}</Label>
                <CodeEditor
                    value={selected.className || ''}
                    onChange={(value) => setProp('className', value || '')}
                    language="plaintext"
                    height="80px"
                    minimap={false}
                />
            </div>
        </SettingsSection>
    );
};
