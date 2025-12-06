import React from 'react';
import { useEditor } from '@craftjs/core';
import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Trash2, ChevronDown, ChevronUp, Monitor, Tablet, Smartphone } from 'lucide-react';
import { useStudioStore } from '@/lib/store';
import { CodeEditor } from '@/components/ui/code-editor';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ColorPicker } from '@/components/builder/settings/ColorPicker';
import { SpacingControl, BoxSpacingControl } from '@/components/builder/settings/SpacingControl';
import { BorderControl } from '@/components/builder/settings/BorderControl';
import { ShadowControl, SizeControl } from '@/components/builder/settings/ShadowSizeControl';
import { AnimationSettings } from '@/components/builder/settings/AnimationSettings';

// 可折叠的设置分组
function SettingsSection({
    title,
    children,
    defaultOpen = true
}: {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full py-2 text-sm font-medium hover:bg-accent/50 px-2 rounded transition-colors">
                    <span>{title}</span>
                    {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-2 pb-4 space-y-3">
                {children}
            </CollapsibleContent>
        </Collapsible>
    );
}

// 响应式样式属性列表
const responsiveStyleProps = [
    'padding', 'margin',
    'width', 'height', 'minHeight',
    'backgroundColor', 'backgroundImage',
    'color',
    'borderRadius', 'borderWidth', 'borderStyle', 'borderColor',
    'boxShadow',
    'textAlign', 'fontSize', 'fontWeight', 'lineHeight', 'textDecoration',
    'columns', 'gap'
];

export const SettingsPanel = () => {
    const t = useTranslations('builder');
    const { previewDevice, setPreviewDevice } = useStudioStore();
    const { actions, selected, isEnabled } = useEditor((state, query) => {
        const [currentNodeId] = state.events.selected;
        let selected: any;

        if (currentNodeId) {
            const node = state.nodes[currentNodeId];
            // 安全检查：确保节点和节点数据存在
            if (node && node.data) {
                selected = {
                    id: currentNodeId,
                    name: node.data.name || node.data.displayName || 'Unknown',
                    displayName: node.data.displayName || node.data.name || 'Unknown',
                    settings: node.related && node.related.settings,
                    isDeletable: query.node(currentNodeId).isDeletable(),
                    ...(node.data.props || {}),
                };
            }
        }

        return {
            selected,
            isEnabled: state.options.enabled,
        };
    });

    if (!isEnabled) return null;

    // 获取当前设备下的有效属性值（处理级联：Desktop -> Tablet -> Mobile）
    const getDisplayValue = (key: string) => {
        if (!selected) return undefined;
        if (previewDevice === 'desktop' || !responsiveStyleProps.includes(key)) {
            return selected[key];
        }

        // 基础值
        let val = selected[key];

        // Tablet 覆盖
        if (selected.responsiveStyles?.tablet?.[key] !== undefined) {
            if (previewDevice === 'tablet' || previewDevice === 'mobile') {
                val = selected.responsiveStyles.tablet[key];
            }
        }

        // Mobile 覆盖
        if (previewDevice === 'mobile') {
            if (selected.responsiveStyles?.mobile?.[key] !== undefined) {
                val = selected.responsiveStyles.mobile[key];
            }
        }

        return val;
    };

    const setProp = (key: string, value: any) => {
        actions.setProp(selected.id, (prop: any) => {
            if (previewDevice === 'desktop' || !responsiveStyleProps.includes(key)) {
                prop[key] = value;
            } else {
                // 初始化 responsiveStyles 结构
                if (!prop.responsiveStyles) prop.responsiveStyles = {};
                if (!prop.responsiveStyles[previewDevice]) prop.responsiveStyles[previewDevice] = {};

                // 对于对象类型的属性（如 padding/margin），我们需要确保合并时基于当前有效值
                // 但在这里，value 通常已经是完整的对象（由控件生成）
                // 如果是部分更新，控件应该负责传递完整对象
                prop.responsiveStyles[previewDevice][key] = value;
            }
        });
    };

    // 如果没有选中任何组件，显示提示信息
    if (!selected) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-4 text-center text-muted-foreground space-y-2">
                <div className="p-3 bg-muted rounded-full">
                    <Monitor className="h-6 w-6 opacity-50" />
                </div>
                <p className="text-sm font-medium">{t('selectElementPrompt')}</p>
                <p className="text-xs max-w-[200px] opacity-70">Click on any element in the canvas to customize its properties</p>
            </div>
        );
    }

    // 判断组件类型
    const componentName = selected.name || selected.displayName || '';
    const isTextComponent = componentName.includes('Text') || componentName.includes('Link');
    const isButtonComponent = componentName.includes('Button');
    const isImageComponent = componentName.includes('Image');
    const isVideoComponent = componentName.includes('Video');
    const isLinkComponent = componentName.includes('Link');
    const isLayoutComponent = componentName.includes('Row') || componentName.includes('Column') || componentName.includes('Grid') || componentName.includes('Container');
    const isBlockComponent = componentName.includes('Hero') || componentName.includes('Card') || componentName.includes('Navbar') || componentName.includes('Footer');
    const isDividerComponent = componentName.includes('Divider');
    const isCustomHTML = componentName.includes('CustomHTML') || componentName.includes('Custom HTML');

    // header removed - moved to Toolbar

    return (
        <div className="h-full flex flex-col">
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                    {/* 标题栏 */}
                    <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="font-medium text-sm">{selected.displayName || selected.name}{t('settingsSuffix')}</h3>
                        {selected.isDeletable && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => actions.delete(selected.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* ========== 内容设置 ========== */}
                    {(selected.text !== undefined || selected.code !== undefined || selected.src !== undefined || selected.href !== undefined || selected.title !== undefined) && (
                        <SettingsSection title="📝 内容">
                            {/* Hero 组件内容 */}
                            {selected.title !== undefined && (
                                <div className="space-y-2">
                                    <Label className="text-xs">标题 (Title)</Label>
                                    <Input
                                        value={selected.title}
                                        onChange={(e) => setProp('title', e.target.value)}
                                    />
                                </div>
                            )}
                            {selected.subtitle !== undefined && (
                                <div className="space-y-2">
                                    <Label className="text-xs">副标题 (Subtitle)</Label>
                                    <Input
                                        value={selected.subtitle}
                                        onChange={(e) => setProp('subtitle', e.target.value)}
                                    />
                                </div>
                            )}
                            {selected.description !== undefined && (
                                <div className="space-y-2">
                                    <Label className="text-xs">描述 (Description)</Label>
                                    <Textarea
                                        value={selected.description}
                                        onChange={(e) => setProp('description', e.target.value)}
                                        rows={3}
                                    />
                                </div>
                            )}
                            {selected.buttonText !== undefined && (
                                <div className="space-y-2">
                                    <Label className="text-xs">主按钮文本</Label>
                                    <Input
                                        value={selected.buttonText}
                                        onChange={(e) => setProp('buttonText', e.target.value)}
                                    />
                                </div>
                            )}
                            {selected.buttonHref !== undefined && (
                                <div className="space-y-2">
                                    <Label className="text-xs">主按钮链接</Label>
                                    <Input
                                        value={selected.buttonHref}
                                        onChange={(e) => setProp('buttonHref', e.target.value)}
                                    />
                                </div>
                            )}
                            {selected.showSecondaryButton !== undefined && (
                                <div className="flex items-center justify-between pt-2">
                                    <Label className="text-xs">显示次要按钮</Label>
                                    <Switch
                                        checked={selected.showSecondaryButton}
                                        onCheckedChange={(checked) => setProp('showSecondaryButton', checked)}
                                    />
                                </div>
                            )}
                            {selected.showSecondaryButton && selected.secondaryButtonText !== undefined && (
                                <div className="space-y-2">
                                    <Label className="text-xs">次要按钮文本</Label>
                                    <Input
                                        value={selected.secondaryButtonText}
                                        onChange={(e) => setProp('secondaryButtonText', e.target.value)}
                                    />
                                </div>
                            )}
                            {selected.showSecondaryButton && selected.secondaryButtonHref !== undefined && (
                                <div className="space-y-2">
                                    <Label className="text-xs">次要按钮链接</Label>
                                    <Input
                                        value={selected.secondaryButtonHref}
                                        onChange={(e) => setProp('secondaryButtonHref', e.target.value)}
                                    />
                                </div>
                            )}
                            <Separator className="my-2" />

                            {/* 文本内容 */}
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

                            {/* 图片链接 */}
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

                            {/* 链接地址 */}
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

                            {/* 链接目标 */}
                            {selected.target !== undefined && (
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">{t('openInNewTab')}</Label>
                                    <Switch
                                        checked={selected.target === '_blank'}
                                        onCheckedChange={(checked) => setProp('target', checked ? '_blank' : '_self')}
                                    />
                                </div>
                            )}

                            {/* HTML 代码 */}
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
                    )}

                    {/* ========== 文本样式 ========== */}
                    {isTextComponent && (
                        <SettingsSection title="🔤 文本样式">
                            {/* HTML 标签 */}
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

                            {/* 字体大小 */}
                            {selected.fontSize !== undefined && (
                                <div className="space-y-2">
                                    <Label className="text-xs">字体大小</Label>
                                    <Input
                                        value={getDisplayValue('fontSize')}
                                        onChange={(e) => setProp('fontSize', e.target.value)}
                                        placeholder="16px"
                                    />
                                </div>
                            )}

                            {/* 字重 */}
                            {selected.fontWeight !== undefined && (
                                <div className="space-y-2">
                                    <Label className="text-xs">字重</Label>
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

                            {/* 行高 */}
                            {selected.lineHeight !== undefined && (
                                <div className="space-y-2">
                                    <Label className="text-xs">行高</Label>
                                    <Input
                                        value={getDisplayValue('lineHeight')}
                                        onChange={(e) => setProp('lineHeight', e.target.value)}
                                        placeholder="1.5"
                                    />
                                </div>
                            )}

                            {/* 对齐方式 */}
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
                                                {align === 'left' && <span className="text-xs">左</span>}
                                                {align === 'center' && <span className="text-xs">中</span>}
                                                {align === 'right' && <span className="text-xs">右</span>}
                                                {align === 'justify' && <span className="text-xs">两端</span>}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 装饰线 (Link) */}
                            {selected.textDecoration !== undefined && (
                                <div className="space-y-2">
                                    <Label className="text-xs">装饰线</Label>
                                    <Select
                                        value={getDisplayValue('textDecoration')}
                                        onValueChange={(value) => setProp('textDecoration', value)}
                                    >
                                        <SelectTrigger className="h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">无</SelectItem>
                                            <SelectItem value="underline">下划线</SelectItem>
                                            <SelectItem value="line-through">删除线</SelectItem>
                                            <SelectItem value="overline">上划线</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* 颜色 */}
                            {selected.color !== undefined && (
                                <ColorPicker
                                    label="文字颜色"
                                    value={getDisplayValue('color')}
                                    onChange={(v) => setProp('color', v)}
                                />
                            )}
                        </SettingsSection>
                    )}

                    {/* ========== 按钮样式 ========== */}
                    {isButtonComponent && selected.variant !== undefined && (
                        <SettingsSection title="🎨 按钮样式">
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
                                    <Label className="text-xs">尺寸</Label>
                                    <Select
                                        value={selected.size}
                                        onValueChange={(value) => setProp('size', value)}
                                    >
                                        <SelectTrigger className="h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="default">默认</SelectItem>
                                            <SelectItem value="sm">小 (Small)</SelectItem>
                                            <SelectItem value="lg">大 (Large)</SelectItem>
                                            <SelectItem value="icon">图标 (Icon)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </SettingsSection>
                    )}

                    {/* ========== 图片设置 ========== */}
                    {isImageComponent && (
                        <SettingsSection title="🖼️ 图片设置">
                            {selected.src !== undefined && (
                                <div className="space-y-2">
                                    <Label className="text-xs">图片地址</Label>
                                    <Input
                                        value={selected.src}
                                        onChange={(e) => setProp('src', e.target.value)}
                                    />
                                </div>
                            )}
                            {selected.alt !== undefined && (
                                <div className="space-y-2">
                                    <Label className="text-xs">替代文本 (Alt)</Label>
                                    <Input
                                        value={selected.alt}
                                        onChange={(e) => setProp('alt', e.target.value)}
                                    />
                                </div>
                            )}
                            {selected.objectFit !== undefined && (
                                <div className="space-y-2">
                                    <Label className="text-xs">填充方式</Label>
                                    <Select
                                        value={selected.objectFit}
                                        onValueChange={(value) => setProp('objectFit', value)}
                                    >
                                        <SelectTrigger className="h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cover">覆盖 (Cover)</SelectItem>
                                            <SelectItem value="contain">包含 (Contain)</SelectItem>
                                            <SelectItem value="fill">拉伸 (Fill)</SelectItem>
                                            <SelectItem value="none">原始 (None)</SelectItem>
                                            <SelectItem value="scale-down">缩小 (Scale Down)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </SettingsSection>
                    )}

                    {/* ========== 视频设置 ========== */}
                    {isVideoComponent && (
                        <SettingsSection title="🎬 视频设置">
                            {selected.poster !== undefined && (
                                <div className="space-y-2">
                                    <Label className="text-xs">封面图</Label>
                                    <Input
                                        value={selected.poster}
                                        onChange={(e) => setProp('poster', e.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>
                            )}
                            {selected.controls !== undefined && (
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">显示控制器</Label>
                                    <Switch
                                        checked={selected.controls}
                                        onCheckedChange={(checked) => setProp('controls', checked)}
                                    />
                                </div>
                            )}
                            {selected.autoplay !== undefined && (
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">自动播放</Label>
                                    <Switch
                                        checked={selected.autoplay}
                                        onCheckedChange={(checked) => setProp('autoplay', checked)}
                                    />
                                </div>
                            )}
                            {selected.loop !== undefined && (
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">循环播放</Label>
                                    <Switch
                                        checked={selected.loop}
                                        onCheckedChange={(checked) => setProp('loop', checked)}
                                    />
                                </div>
                            )}
                            {(selected.muted !== undefined) && (
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">静音</Label>
                                    <Switch
                                        checked={selected.muted}
                                        onCheckedChange={(checked) => setProp('muted', checked)}
                                    />
                                </div>
                            )}
                        </SettingsSection>
                    )}

                    {/* ========== 分隔线设置 ========== */}
                    {isDividerComponent && (
                        <SettingsSection title="➖ 分隔线设置">
                            {/* Orientation */}
                            {selected.orientation !== undefined && (
                                <div className="space-y-2">
                                    <Label className="text-xs">{t('orientation')}</Label>
                                    <Select
                                        value={selected.orientation}
                                        onValueChange={(value) => setProp('orientation', value)}
                                    >
                                        <SelectTrigger className="h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="horizontal">{t('horizontal')}</SelectItem>
                                            <SelectItem value="vertical">{t('vertical')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Thickness */}
                            {selected.thickness !== undefined && (
                                <SpacingControl
                                    label={t('thickness')}
                                    value={selected.thickness}
                                    onChange={(v) => setProp('thickness', v)}
                                    max={20}
                                />
                            )}

                            {/* Color */}
                            {selected.color !== undefined && (
                                <ColorPicker
                                    label={t('dividerColor')}
                                    value={selected.color}
                                    onChange={(v) => setProp('color', v)}
                                />
                            )}
                        </SettingsSection>
                    )}

                    {/* ========== 布局设置 ========== */}
                    {isLayoutComponent && (
                        <SettingsSection title="📐 布局">
                            {/* 间距 */}
                            {selected.gap !== undefined && (
                                <SpacingControl
                                    label={t('gap')}
                                    value={selected.gap}
                                    onChange={(v) => setProp('gap', v)}
                                    max={64}
                                />
                            )}

                            {/* 换行 */}
                            {selected.wrap !== undefined && (
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">自动换行</Label>
                                    <Switch
                                        checked={selected.wrap}
                                        onCheckedChange={(checked) => setProp('wrap', checked)}
                                    />
                                </div>
                            )}

                            {/* 网格列数 */}
                            {selected.columns !== undefined && (
                                <div className="space-y-2">
                                    <Label className="text-xs">{t('columns')}</Label>
                                    <Select
                                        value={String(selected.columns)}
                                        onValueChange={(value) => setProp('columns', parseInt(value))}
                                    >
                                        <SelectTrigger className="h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[1, 2, 3, 4, 5, 6].map((n) => (
                                                <SelectItem key={n} value={String(n)}>{n} 列</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* 主轴对齐 */}
                            {selected.justify !== undefined && (
                                <div className="space-y-2">
                                    <Label className="text-xs">{t('justifyContent')}</Label>
                                    <Select
                                        value={selected.justify}
                                        onValueChange={(value) => setProp('justify', value)}
                                    >
                                        <SelectTrigger className="h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="start">{t('justify.start')}</SelectItem>
                                            <SelectItem value="center">{t('justify.center')}</SelectItem>
                                            <SelectItem value="end">{t('justify.end')}</SelectItem>
                                            <SelectItem value="between">{t('justify.between')}</SelectItem>
                                            <SelectItem value="around">{t('justify.around')}</SelectItem>
                                            <SelectItem value="evenly">{t('justify.evenly')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* 交叉轴对齐 */}
                            {selected.align !== undefined && (
                                <div className="space-y-2">
                                    <Label className="text-xs">{t('alignItems')}</Label>
                                    <Select
                                        value={selected.align}
                                        onValueChange={(value) => setProp('align', value)}
                                    >
                                        <SelectTrigger className="h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="start">{t('align.start')}</SelectItem>
                                            <SelectItem value="center">{t('align.center')}</SelectItem>
                                            <SelectItem value="end">{t('align.end')}</SelectItem>
                                            <SelectItem value="stretch">{t('align.stretch')}</SelectItem>
                                            {componentName.includes('Row') && (
                                                <SelectItem value="baseline">基线 (Baseline)</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </SettingsSection>
                    )}

                    {/* ========== 区块设置 ========== */}
                    {isBlockComponent && (
                        <SettingsSection title="🧱 区块设置">
                            {/* 背景色 */}
                            {selected.backgroundColor !== undefined && (
                                <ColorPicker
                                    label={t('backgroundColor')}
                                    value={getDisplayValue('backgroundColor')}
                                    onChange={(v) => setProp('backgroundColor', v)}
                                />
                            )}

                            {/* 背景图片 */}
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

                            {/* 文本对齐 */}
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
                                                {t(`textAlignOptions.${align}`)}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 最小高度 */}
                            {selected.minHeight !== undefined && (
                                <SpacingControl
                                    label={t('minHeight')}
                                    value={getDisplayValue('minHeight')}
                                    onChange={(v) => setProp('minHeight', v)}
                                    max={800}
                                />
                            )}

                            {/* 变体 */}
                            {selected.variant !== undefined && !isButtonComponent && (
                                <div className="space-y-2">
                                    <Label className="text-xs">样式变体</Label>
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
                                                    <SelectItem value="default">默认</SelectItem>
                                                    <SelectItem value="bordered">边框</SelectItem>
                                                    <SelectItem value="elevated">阴影</SelectItem>
                                                </>
                                            ) : componentName.includes('Navbar') ? (
                                                <>
                                                    <SelectItem value="light">浅色</SelectItem>
                                                    <SelectItem value="dark">深色</SelectItem>
                                                    <SelectItem value="transparent">透明</SelectItem>
                                                </>
                                            ) : (
                                                <>
                                                    <SelectItem value="light">浅色</SelectItem>
                                                    <SelectItem value="dark">深色</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </SettingsSection>
                    )}

                    {/* ========== 尺寸设置 ========== */}
                    {(selected.width !== undefined || selected.height !== undefined || selected.minHeight !== undefined || selected.padding !== undefined || selected.margin !== undefined) && (
                        <SettingsSection title="📏 尺寸与间距">
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
                    )}

                    {/* ========== 边框与阴影 ========== */}
                    {(selected.borderWidth !== undefined || selected.borderRadius !== undefined || selected.boxShadow !== undefined) && (
                        <SettingsSection title="🖼️ 边框与阴影">
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
                    )}

                    {/* ========== 动画效果 ========== */}
                    <SettingsSection title="✨ 动画效果" defaultOpen={false}>
                        <AnimationSettings
                            animation={selected.animation}
                            onChange={(v) => setProp('animation', v)}
                        />
                    </SettingsSection>

                    {/* ========== 高级样式 ========== */}
                    <SettingsSection title="⚙️ 高级样式" defaultOpen={false}>
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
                </div>
            </ScrollArea>
        </div>
    );
};
