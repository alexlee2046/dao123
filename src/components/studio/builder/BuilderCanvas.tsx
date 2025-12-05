import React, { useEffect } from 'react';
import { Frame, Element, useEditor } from '@craftjs/core';
import { BuilderContainer } from '@/components/builder/atoms/BuilderContainer';
import { BuilderText } from '@/components/builder/atoms/BuilderText';
import { useStudioStore } from '@/lib/store';
import { useTranslations } from 'next-intl';

export const BuilderCanvas = () => {
    const { builderData } = useStudioStore();
    const { actions } = useEditor();
    const t = useTranslations('builder');

    useEffect(() => {
        if (builderData) {
            try {
                // 验证数据格式
                const data = typeof builderData === 'string' ? JSON.parse(builderData) : builderData;

                // 检查是否有 ROOT 节点
                if (!data.ROOT) {
                    console.warn("Builder data missing ROOT node, using default");
                    return;
                }

                // 验证所有节点都有必需的属性
                for (const [nodeId, node] of Object.entries(data)) {
                    const nodeData = node as any;
                    if (!nodeData.type || !nodeData.type.resolvedName) {
                        console.warn(`Node ${nodeId} has invalid type, skipping deserialization`);
                        return;
                    }
                }

                actions.deserialize(builderData);
            } catch (e) {
                console.error("Failed to load builder data:", e);
                // 不要崩溃，让默认画布显示
            }
        }
    }, [builderData, actions]);

    return (
        <div className="w-full h-full bg-white min-h-[800px] shadow-sm">
            <Frame>
                <Element is={BuilderContainer} canvas className="w-full h-full p-8 bg-white min-h-screen">
                    <BuilderText text={t('canvasWelcome')} tag="h1" className="text-4xl font-bold mb-4" />
                    <BuilderText text={t('canvasInstruction')} className="text-lg text-gray-600" />
                </Element>
            </Frame>
        </div>
    );
};
