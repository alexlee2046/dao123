import React, { useEffect } from 'react';
import { Frame, Element, useEditor } from '@craftjs/core';
import { BuilderContainer } from '@/components/builder/atoms/BuilderContainer';
import { BuilderText } from '@/components/builder/atoms/BuilderText';
import { useStudioStore } from '@/lib/store';

export const BuilderCanvas = () => {
    const { builderData } = useStudioStore();
    const { actions } = useEditor();

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
                    <BuilderText text="Welcome to the Builder!" tag="h1" className="text-4xl font-bold mb-4" />
                    <BuilderText text="Drag components from the left toolbox." className="text-lg text-gray-600" />
                </Element>
            </Frame>
        </div>
    );
};
