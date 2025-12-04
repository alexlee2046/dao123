import React from 'react';
import { useEditor } from '@craftjs/core';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export const SettingsPanel = () => {
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
                点击画布中的组件进行编辑
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6">
            <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-medium">{selected.name} 设置</h3>
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
                        <Label>文本内容</Label>
                        <Input
                            value={selected.text}
                            onChange={(e) => actions.setProp(selected.id, (prop: any) => (prop.text = e.target.value))}
                        />
                    </div>
                )}

                {selected.src !== undefined && (
                    <div className="space-y-2">
                        <Label>图片链接</Label>
                        <Input
                            value={selected.src}
                            onChange={(e) => actions.setProp(selected.id, (prop: any) => (prop.src = e.target.value))}
                        />
                    </div>
                )}

                {selected.href !== undefined && (
                    <div className="space-y-2">
                        <Label>链接地址</Label>
                        <Input
                            value={selected.href}
                            onChange={(e) => actions.setProp(selected.id, (prop: any) => (prop.href = e.target.value))}
                        />
                    </div>
                )}

                {selected.variant !== undefined && (
                    <div className="space-y-2">
                        <Label>样式变体</Label>
                        <Select
                            value={selected.variant}
                            onValueChange={(value) => actions.setProp(selected.id, (prop: any) => (prop.variant = value))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">Default</SelectItem>
                                <SelectItem value="secondary">Secondary</SelectItem>
                                <SelectItem value="outline">Outline</SelectItem>
                                <SelectItem value="ghost">Ghost</SelectItem>
                                <SelectItem value="destructive">Destructive</SelectItem>
                                <SelectItem value="link">Link</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {selected.tag !== undefined && (
                    <div className="space-y-2">
                        <Label>HTML 标签</Label>
                        <Select
                            value={selected.tag}
                            onValueChange={(value) => actions.setProp(selected.id, (prop: any) => (prop.tag = value))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="h1">H1</SelectItem>
                                <SelectItem value="h2">H2</SelectItem>
                                <SelectItem value="h3">H3</SelectItem>
                                <SelectItem value="p">Paragraph</SelectItem>
                                <SelectItem value="span">Span</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {selected.code !== undefined && (
                    <div className="space-y-2">
                        <Label>HTML 代码</Label>
                        <Textarea
                            className="font-mono text-xs h-32"
                            value={selected.code}
                            onChange={(e) => actions.setProp(selected.id, (prop: any) => (prop.code = e.target.value))}
                        />
                    </div>
                )}

                <div className="space-y-2">
                    <Label>Tailwind Classes</Label>
                    <Textarea
                        className="font-mono text-xs h-20"
                        value={selected.className || ''}
                        onChange={(e) => actions.setProp(selected.id, (prop: any) => (prop.className = e.target.value))}
                        placeholder="e.g. bg-blue-500 p-4"
                    />
                </div>
            </div>
        </div>
    );
};
