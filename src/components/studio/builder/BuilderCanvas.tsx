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
                actions.deserialize(builderData);
            } catch (e) {
                console.error("Failed to load builder data", e);
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
