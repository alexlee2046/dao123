import React, { useEffect, useRef, useCallback } from 'react';
import { Frame, Element, useEditor } from '@craftjs/core';
import { BuilderContainer } from '@/components/builder/atoms/BuilderContainer';
import { BuilderText } from '@/components/builder/atoms/BuilderText';
import { BuilderFrame } from './BuilderFrame';
import { useStudioStore } from '@/lib/store';
import { useTranslations } from 'next-intl';

export const BuilderCanvas = () => {
    const { builderData, htmlContent, setBuilderData } = useStudioStore();
    const { actions } = useEditor();
    const t = useTranslations('builder');
    const [isConverting, setIsConverting] = React.useState(false);

    // Refs to prevent duplicate conversions and stale closure issues
    const conversionAttemptedRef = useRef(false);
    const lastHtmlContentRef = useRef<string | null>(null);
    const isMountedRef = useRef(true);

    // Use refs for actions and setBuilderData to avoid useEffect dependency issues
    const actionsRef = useRef(actions);
    const setBuilderDataRef = useRef(setBuilderData);

    // Keep refs updated
    useEffect(() => {
        actionsRef.current = actions;
    }, [actions]);

    useEffect(() => {
        setBuilderDataRef.current = setBuilderData;
    }, [setBuilderData]);

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        const loadData = async () => {
            // Case 1: builderData exists and is valid
            if (builderData) {
                try {
                    // Normalize data
                    const dataToLoad = typeof builderData === 'string'
                        ? JSON.parse(builderData)
                        : builderData;

                    // Check for ROOT node
                    if (!dataToLoad.ROOT) {
                        console.debug("[BuilderCanvas] Builder data missing ROOT node, will not load");
                        return;
                    }

                    // Validate all nodes have proper type
                    for (const [nodeId, node] of Object.entries(dataToLoad)) {
                        const nodeData = node as any;
                        if (!nodeData.type || !nodeData.type.resolvedName) {
                            console.warn(`[BuilderCanvas] Node ${nodeId} has invalid type, skipping entire deserialization`);
                            return;
                        }
                    }

                    // Valid data - reset conversion tracking since we have fresh data
                    conversionAttemptedRef.current = false;
                    lastHtmlContentRef.current = null;

                    // Deserialize into Craft.js editor
                    actionsRef.current.deserialize(JSON.stringify(dataToLoad));
                    console.log("[BuilderCanvas] Successfully loaded builder data with", Object.keys(dataToLoad).length, "nodes");

                } catch (e) {
                    console.error("[BuilderCanvas] Failed to parse or load builder data:", e);
                }
                return;
            }

            // Case 2: No builderData but have htmlContent - perform lazy conversion
            if (htmlContent) {
                // Prevent duplicate conversion for the same content
                if (conversionAttemptedRef.current && lastHtmlContentRef.current === htmlContent) {
                    console.log("[BuilderCanvas] Skipping duplicate conversion attempt for same HTML content");
                    return;
                }

                console.log("[BuilderCanvas] No builder data found, performing lazy conversion...");

                // Mark conversion as attempted
                conversionAttemptedRef.current = true;
                lastHtmlContentRef.current = htmlContent;

                setIsConverting(true);

                try {
                    // Dynamic import for server action
                    const { convertHtmlToCraft } = await import('@/app/actions/parser');
                    const result = await convertHtmlToCraft(htmlContent);

                    // Check if still mounted
                    if (!isMountedRef.current) {
                        console.log("[BuilderCanvas] Component unmounted during conversion, aborting");
                        return;
                    }

                    if (result.success && result.data) {
                        const jsonString = JSON.stringify(result.data);

                        // Update store
                        setBuilderDataRef.current(jsonString);

                        // Load into editor immediately
                        actionsRef.current.deserialize(jsonString);

                        console.log("[BuilderCanvas] Lazy conversion successful with", Object.keys(result.data).length, "nodes");
                    } else {
                        console.error("[BuilderCanvas] Lazy conversion failed:", result.error);
                        // Reset conversion flag to allow retry
                        conversionAttemptedRef.current = false;
                    }
                } catch (err) {
                    console.error("[BuilderCanvas] Error during lazy conversion:", err);
                    // Reset conversion flag to allow retry
                    conversionAttemptedRef.current = false;
                } finally {
                    if (isMountedRef.current) {
                        setIsConverting(false);
                    }
                }
            }
        };

        loadData();
    }, [builderData, htmlContent]); // Removed actions and setBuilderData from deps, using refs instead

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
