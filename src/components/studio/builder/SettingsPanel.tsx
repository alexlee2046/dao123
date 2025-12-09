import React from 'react';
import { useEditor } from '@craftjs/core';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Trash2, Monitor } from 'lucide-react';
import { useStudioStore } from '@/lib/store';
import { ScrollArea } from '@/components/ui/scroll-area';

import { ContentProperties } from './properties/ContentProperties';
import { TextProperties } from './properties/TextProperties';
import { ButtonProperties } from './properties/ButtonProperties';
import { ImageProperties } from './properties/ImageProperties';
import { VideoProperties } from './properties/VideoProperties';
import { DividerProperties } from './properties/DividerProperties';
import { LayoutProperties } from './properties/LayoutProperties';
import { BlockProperties } from './properties/BlockProperties';
import { DimensionProperties } from './properties/DimensionProperties';
import { BorderShadowProperties } from './properties/BorderShadowProperties';
import { AnimationProperties } from './properties/AnimationProperties';
import { AdvancedProperties } from './properties/AdvancedProperties';
import { SelectedComponentProps } from './properties/types';

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
    const { previewDevice } = useStudioStore();
    const { actions, selected, isEnabled } = useEditor((state, query) => {
        const [currentNodeId] = state.events.selected;
        let selected: SelectedComponentProps | undefined;

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
        if (!selected) return;
        actions.setProp(selected.id, (prop: any) => {
            if (previewDevice === 'desktop' || !responsiveStyleProps.includes(key)) {
                prop[key] = value;
            } else {
                // 初始化 responsiveStyles 结构
                if (!prop.responsiveStyles) prop.responsiveStyles = {};
                if (!prop.responsiveStyles[previewDevice]) prop.responsiveStyles[previewDevice] = {};

                // 对于对象类型的属性（如 padding/margin），我们需要确保合并时基于当前有效值
                // 但在这里，value 通常已经是完整的对象（由控件生成）
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
    // const isLinkComponent = componentName.includes('Link'); 
    const isLayoutComponent = componentName.includes('Row') || componentName.includes('Column') || componentName.includes('Grid') || componentName.includes('Container');
    const isBlockComponent = componentName.includes('Hero') || componentName.includes('Card') || componentName.includes('Navbar') || componentName.includes('Footer');
    const isDividerComponent = componentName.includes('Divider');
    // const isCustomHTML = componentName.includes('CustomHTML') || componentName.includes('Custom HTML');

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
                    <ContentProperties selected={selected} setProp={setProp} t={t} />

                    {/* ========== 文本样式 ========== */}
                    <TextProperties
                        selected={selected}
                        setProp={setProp}
                        getDisplayValue={getDisplayValue}
                        t={t}
                        isTextComponent={isTextComponent}
                    />

                    {/* ========== 按钮样式 ========== */}
                    <ButtonProperties
                        selected={selected}
                        setProp={setProp}
                        t={t}
                        isButtonComponent={isButtonComponent}
                    />

                    {/* ========== 图片设置 ========== */}
                    <ImageProperties
                        selected={selected}
                        setProp={setProp}
                        isImageComponent={isImageComponent}
                        t={t}
                    />


                    {/* ========== 视频设置 ========== */}
                    <VideoProperties
                        selected={selected}
                        setProp={setProp}
                        isVideoComponent={isVideoComponent}
                        t={t}
                    />

                    {/* ========== 分隔线设置 ========== */}
                    <DividerProperties
                        selected={selected}
                        setProp={setProp}
                        t={t}
                        isDividerComponent={isDividerComponent}
                    />

                    {/* ========== 布局设置 ========== */}
                    <LayoutProperties
                        selected={selected}
                        setProp={setProp}
                        t={t}
                        isLayoutComponent={isLayoutComponent}
                        componentName={componentName}
                    />

                    {/* ========== 区块设置 ========== */}
                    <BlockProperties
                        selected={selected}
                        setProp={setProp}
                        getDisplayValue={getDisplayValue}
                        t={t}
                        isBlockComponent={isBlockComponent}
                        componentName={componentName}
                    />

                    {/* ========== 尺寸设置 ========== */}
                    <DimensionProperties
                        selected={selected}
                        setProp={setProp}
                        getDisplayValue={getDisplayValue}
                        t={t}
                        isBlockComponent={isBlockComponent}
                    />

                    {/* ========== 边框与阴影 ========== */}
                    <BorderShadowProperties
                        selected={selected}
                        setProp={setProp}
                        getDisplayValue={getDisplayValue}
                        t={t}
                    />

                    {/* ========== 动画效果 ========== */}
                    <AnimationProperties
                        selected={selected}
                        setProp={setProp}
                        t={t}
                    />

                    {/* ========== 高级样式 ========== */}
                    <AdvancedProperties
                        selected={selected}
                        setProp={setProp}
                        t={t}
                    />
                </div>
            </ScrollArea>
        </div>
    );
};
