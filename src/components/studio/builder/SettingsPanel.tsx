import React from 'react';
import { useEditor } from '@craftjs/core';
import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { CodeEditor } from '@/components/ui/code-editor';

export const SettingsPanel = () => {
    const t = useTranslations('builder');
    const { actions, selected, isEnabled } = useEditor((state, query) => {
        const [currentNodeId] = state.events.selected;
        let selected: any;

        if (currentNodeId) {
            selected = {
                id: currentNodeId,
                name: state.nodes[currentNodeId].data.name,
                settings: state.nodes[currentNodeId].related && state.nodes[currentNodeId].related.settings,
                isDeletable: query.node(currentNodeId).isDeletable(),
                ...state.nodes[currentNodeId].data.props,
            };
        }

        return {
            selected,
            isEnabled: state.options.enabled,
        };
    });

    if (!isEnabled) return null;

    if (!selected) {
        return (
            <div className="p-4 text-center text-muted-foreground text-sm">
                {t('selectToEdit')}
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6">
            <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-medium">{selected.name}{t('settingsSuffix')}</h3>
                {selected.isDeletable ? (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                            actions.delete(selected.id);
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                ) : null}
            </div>

            <div className="space-y-4">
                {selected.text !== undefined && (
                    <div className="space-y-2">
                        <Label>{t('textContent')}</Label>
                        <Input
                            value={selected.text}
                            onChange={(e) => actions.setProp(selected.id, (prop: any) => (prop.text = e.target.value))}
                        />
                    </div>
                )}

                {selected.src !== undefined && (
                    <div className="space-y-2">
                        <Label>{t('imageLink')}</Label>
                        <Input
                            value={selected.src}
                            onChange={(e) => actions.setProp(selected.id, (prop: any) => (prop.src = e.target.value))}
                        />
                    </div>
                )}

                {selected.href !== undefined && (
                    <div className="space-y-2">
                        <Label>{t('linkAddress')}</Label>
                        <Input
                            value={selected.href}
                            onChange={(e) => actions.setProp(selected.id, (prop: any) => (prop.href = e.target.value))}
                        />
                    </div>
                )}

                {selected.variant !== undefined && (
                    <div className="space-y-2">
                        <Label>{t('styleVariant')}</Label>
                        <Select
                            value={selected.variant}
                            onValueChange={(value) => actions.setProp(selected.id, (prop: any) => (prop.variant = value))}
                        >
                            <SelectTrigger>
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
                )}

                {selected.tag !== undefined && (
                    <div className="space-y-2">
                        <Label>{t('htmlTag')}</Label>
                        <Select
                            value={selected.tag}
                            onValueChange={(value) => actions.setProp(selected.id, (prop: any) => (prop.tag = value))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="h1">{t('tags.h1')}</SelectItem>
                                <SelectItem value="h2">{t('tags.h2')}</SelectItem>
                                <SelectItem value="h3">{t('tags.h3')}</SelectItem>
                                <SelectItem value="p">{t('tags.p')}</SelectItem>
                                <SelectItem value="span">{t('tags.span')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {selected.code !== undefined && (
                    <div className="space-y-2">
                        <Label>{t('htmlCode')}</Label>
                        <CodeEditor
                            value={selected.code}
                            onChange={(value) => actions.setProp(selected.id, (prop: any) => (prop.code = value || ''))}
                            language="html"
                            height="200px"
                            minimap={false}
                        />
                    </div>
                )}

                <div className="space-y-2">
                    <Label>{t('tailwindClasses')}</Label>
                    <CodeEditor
                        value={selected.className || ''}
                        onChange={(value) => actions.setProp(selected.id, (prop: any) => (prop.className = value || ''))}
                        language="plaintext"
                        height="100px"
                        minimap={false}
                    />
                </div>
            </div>
        </div>
    );
};
