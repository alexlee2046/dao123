import React, { useEffect } from 'react';
import { Frame, Element, useEditor } from '@craftjs/core';
import { BuilderContainer } from '@/components/builder/atoms/BuilderContainer';
import { BuilderText } from '@/components/builder/atoms/BuilderText';
import { BuilderFrame } from './BuilderFrame';
import { useStudioStore } from '@/lib/store';
import { useTranslations } from 'next-intl';

export const BuilderCanvas = () => {
    const { builderData, htmlContent, setBuilderData } = useStudioStore(); // Add htmlContent and setBuilderData
    const { actions } = useEditor();
    const t = useTranslations('builder');
    const [isConverting, setIsConverting] = React.useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (builderData) {
                try {
                    // Normalize data
                    let dataToLoad = typeof builderData === 'string' ? JSON.parse(builderData) : builderData;

                    // Check for ROOT
                    if (!dataToLoad.ROOT) {
                        console.debug("Builder data missing ROOT node");
                        return;
                    }

                    // Validate nodes
                    for (const [nodeId, node] of Object.entries(dataToLoad)) {
                        const nodeData = node as any;
                        if (!nodeData.type || !nodeData.type.resolvedName) {
                            console.warn(`Node ${nodeId} has invalid type, skipping deserialization`);
                            return;
                        }
                    }

                    actions.deserialize(JSON.stringify(dataToLoad));
                } catch (e) {
                    console.error("Failed to load builder data:", e);
                }
            } else if (htmlContent) {
                // Lazy Conversion: If no builderData but we have HTML, convert it now (Zero Loss)
                console.log("[BuilderCanvas] No builder data found, performing lazy conversion...");
                setIsConverting(true);
                try {
                    // Dynamic import to avoid server-side issues (though this is a client component)
                    const { convertHtmlToCraft } = await import('@/app/actions/parser');
                    const result = await convertHtmlToCraft(htmlContent);

                    if (result.success && result.data) {
                        const jsonString = JSON.stringify(result.data);
                        setBuilderData(jsonString); // Update store
                        actions.deserialize(jsonString); // Load into editor immediately
                        console.log("[BuilderCanvas] Lazy conversion successful");
                    } else {
                        console.error("[BuilderCanvas] Lazy conversion failed:", result.error);
                    }
                } catch (err) {
                    console.error("[BuilderCanvas] Error during lazy conversion:", err);
                } finally {
                    setIsConverting(false);
                }
            }
        };

        loadData();
    }, [builderData, htmlContent, actions, setBuilderData]);

    if (isConverting) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-gray-500 font-medium">Converting page for editing...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-white flex flex-col">
            <BuilderFrame>
                <Frame>
                    <Element is={BuilderContainer} canvas className="w-full flex-1 bg-white min-h-full">
                        <BuilderText text={t('canvasWelcome')} tag="h1" className="text-4xl font-bold mb-4" />
                        <BuilderText text={t('canvasInstruction')} className="text-lg text-gray-600" />
                    </Element>
                </Frame>
            </BuilderFrame>
        </div>
    );
};
