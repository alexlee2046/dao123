import { useState } from 'react';
import { useStudioStore } from '@/lib/store';
import { generateSitePlan, generateDesignSystem } from '@/app/actions/ai';
import { toast } from 'sonner';

export type AgentStep = 'idle' | 'architect' | 'designer' | 'builder' | 'complete';

export function useAgentOrchestrator() {
    const {
        architectModel,
        builderModel,
        setBuilderData,
        toggleBuilderMode,
        isBuilderMode
    } = useStudioStore();

    const [currentStep, setCurrentStep] = useState<AgentStep>('idle');
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');

    const startGeneration = async (prompt: string) => {
        try {
            if (!isBuilderMode) toggleBuilderMode();

            setCurrentStep('architect');
            setStatusMessage('架构师正在规划网站结构...');
            setProgress(10);

            // 1. Architect Step
            const sitePlan = await generateSitePlan(prompt, architectModel);
            console.log('Site Plan:', sitePlan);
            setProgress(30);

            setCurrentStep('designer');
            setStatusMessage('设计师正在制定视觉规范...');

            // 2. Designer Step
            const designSystem = await generateDesignSystem(prompt, architectModel); // Use Architect model for Design too for now
            console.log('Design System:', designSystem);
            setProgress(50);

            setCurrentStep('builder');
            setStatusMessage('构建者正在生成组件...');

            // 3. Builder Step (Loop through sections)
            const totalSections = sitePlan.sections.length;
            const builtSections: any[] = [];

            for (let i = 0; i < totalSections; i++) {
                const section = sitePlan.sections[i];
                setStatusMessage(`正在构建: ${section.type} (${i + 1}/${totalSections})...`);

                // Stream the component generation
                // Note: streamSectionGeneration returns a Response object (stream)
                // We need to handle it on client side differently or change the server action to return StreamableValue
                // For now, let's assume the server action returns a StreamableValue (we need to update server action)
                // OR we just use generateObject for simplicity in this MVP if streaming is complex to type.

                // Let's switch to generateObject in the server action for simplicity and robustness first,
                // as streamObject over server actions can be tricky with types.
                // But wait, we wanted streaming.

                // The error says: Type 'Response' is not assignable to type 'StreamableValue'.
                // This is because streamSectionGeneration calls .toTextStreamResponse() which returns a Response.
                // readStreamableValue expects a StreamableValue.

                // We should change streamSectionGeneration to return createStreamableValue().value
                // But createStreamableValue is from 'ai/rsc'.

                // Let's modify the server action to return the result of streamObject directly?
                // No, streamObject returns { partialObjectStream, ... }

                // Let's try to use `readStreamableValue` with the stream.
                // Actually, if we return `toTextStreamResponse()`, we should consume it as a fetch response on client?
                // But we are calling a server action.

                // FIX: Let's change the server action to return `streamObject(...).toTextStreamResponse()` is for API routes.
                // For Server Actions, we should use `createStreamableValue`.

                // However, to save time and ensure stability, let's switch to `generateObject` (non-streaming) for the Builder step for now.
                // It will be slightly slower but safer.

                const { generateSection } = await import('@/app/actions/ai');
                const component = await generateSection(
                    section.type,
                    section.description,
                    designSystem,
                    builderModel
                );

                if (component) {
                    builtSections.push(component);
                }

                setProgress(50 + Math.floor(((i + 1) / totalSections) * 50));
            }

            // Assemble final Craft.js JSON structure
            const { mergeSectionsToCraftJson } = await import('@/lib/ai/transformer');
            const craftJson = mergeSectionsToCraftJson(builtSections);

            console.log('Craft JSON:', craftJson);
            setBuilderData(craftJson);

            setCurrentStep('complete');
            setStatusMessage('构建完成！');
            toast.success('网站构建完成');

        } catch (error: any) {
            console.error('Generation Error:', error);
            toast.error(`生成失败: ${error.message}`);
            setCurrentStep('idle');
        }
    };

    return {
        currentStep,
        progress,
        statusMessage,
        startGeneration
    };
}
