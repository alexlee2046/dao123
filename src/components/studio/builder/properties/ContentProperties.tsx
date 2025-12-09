
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { CodeEditor } from '@/components/ui/code-editor';
import { SettingsSection } from './SettingsSection';
import { SelectedComponentProps } from './types';

interface ContentPropertiesProps {
    selected: SelectedComponentProps;
    setProp: (key: string, value: any) => void;
    t: (key: string) => string;
}

export const ContentProperties = ({ selected, setProp, t }: ContentPropertiesProps) => {
    // Determine if we should show this section
    const hasContent = selected.text !== undefined ||
        selected.code !== undefined ||
        selected.src !== undefined ||
        selected.href !== undefined ||
        selected.title !== undefined;

    if (!hasContent) return null;

    return (
        <SettingsSection title={`📝 ${t('textContent')}`}>
            {/* Hero Element Content */}
            {selected.title !== undefined && (
                <div className="space-y-2">
                    <Label className="text-xs">{t('properties.title')}</Label>
                    <Input
                        value={selected.title}
                        onChange={(e) => setProp('title', e.target.value)}
                    />
                </div>
            )}
            {selected.subtitle !== undefined && (
                <div className="space-y-2">
                    <Label className="text-xs">{t('properties.subtitle')}</Label>
                    <Input
                        value={selected.subtitle}
                        onChange={(e) => setProp('subtitle', e.target.value)}
                    />
                </div>
            )}
            {selected.description !== undefined && (
                <div className="space-y-2">
                    <Label className="text-xs">{t('properties.description')}</Label>
                    <Textarea
                        value={selected.description}
                        onChange={(e) => setProp('description', e.target.value)}
                        rows={3}
                    />
                </div>
            )}
            {selected.buttonText !== undefined && (
                <div className="space-y-2">
                    <Label className="text-xs">{t('properties.primaryButtonText')}</Label>
                    <Input
                        value={selected.buttonText}
                        onChange={(e) => setProp('buttonText', e.target.value)}
                    />
                </div>
            )}
            {selected.buttonHref !== undefined && (
                <div className="space-y-2">
                    <Label className="text-xs">{t('properties.primaryButtonLink')}</Label>
                    <Input
                        value={selected.buttonHref}
                        onChange={(e) => setProp('buttonHref', e.target.value)}
                    />
                </div>
            )}
            {selected.showSecondaryButton !== undefined && (
                <div className="flex items-center justify-between pt-2">
                    <Label className="text-xs">{t('properties.showSecondaryButton')}</Label>
                    <Switch
                        checked={selected.showSecondaryButton}
                        onCheckedChange={(checked) => setProp('showSecondaryButton', checked)}
                    />
                </div>
            )}
            {selected.showSecondaryButton && selected.secondaryButtonText !== undefined && (
                <div className="space-y-2">
                    <Label className="text-xs">{t('properties.secondaryButtonText')}</Label>
                    <Input
                        value={selected.secondaryButtonText}
                        onChange={(e) => setProp('secondaryButtonText', e.target.value)}
                    />
                </div>
            )}
            {selected.showSecondaryButton && selected.secondaryButtonHref !== undefined && (
                <div className="space-y-2">
                    <Label className="text-xs">{t('properties.secondaryButtonLink')}</Label>
                    <Input
                        value={selected.secondaryButtonHref}
                        onChange={(e) => setProp('secondaryButtonHref', e.target.value)}
                    />
                </div>
            )}

            {(selected.title !== undefined || selected.buttonText !== undefined) && <Separator className="my-2" />}

            {/* General Text Content */}
            {selected.text !== undefined && (
                <div className="space-y-2">
                    <Label className="text-xs">{t('textContent')}</Label>
                    {selected.text.length > 50 ? (
                        <Textarea
                            value={selected.text}
                            onChange={(e) => setProp('text', e.target.value)}
                            rows={3}
                        />
                    ) : (
                        <Input
                            value={selected.text}
                            onChange={(e) => setProp('text', e.target.value)}
                        />
                    )}
                </div>
            )}

            {/* Image Src */}
            {selected.src !== undefined && (
                <div className="space-y-2">
                    <Label className="text-xs">{t('imageLink')}</Label>
                    <Input
                        value={selected.src}
                        onChange={(e) => setProp('src', e.target.value)}
                        placeholder="https://..."
                    />
                    {selected.src && (
                        <img
                            src={selected.src}
                            alt="Preview"
                            className="w-full h-20 object-cover rounded border"
                        />
                    )}
                </div>
            )}

            {/* Link Href */}
            {selected.href !== undefined && (
                <div className="space-y-2">
                    <Label className="text-xs">{t('linkAddress')}</Label>
                    <Input
                        value={selected.href}
                        onChange={(e) => setProp('href', e.target.value)}
                        placeholder="https://..."
                    />
                </div>
            )}

            {/* Link Target */}
            {selected.target !== undefined && (
                <div className="flex items-center justify-between">
                    <Label className="text-xs">{t('openInNewTab')}</Label>
                    <Switch
                        checked={selected.target === '_blank'}
                        onCheckedChange={(checked) => setProp('target', checked ? '_blank' : '_self')}
                    />
                </div>
            )}

            {/* HTML Code */}
            {selected.code !== undefined && (
                <div className="space-y-2">
                    <Label className="text-xs">{t('htmlCode')}</Label>
                    <CodeEditor
                        value={selected.code}
                        onChange={(value) => setProp('code', value || '')}
                        language="html"
                        height="200px"
                        minimap={false}
                    />
                </div>
            )}
        </SettingsSection>
    );
};
