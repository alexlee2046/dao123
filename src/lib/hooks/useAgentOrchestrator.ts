
import { useState, useRef, useCallback } from 'react';
import { useStudioStore, type Page } from '@/lib/store';
import { generateSitePlan } from '@/app/actions/architect';
import { generateSection, generateDesignSystem } from '@/app/actions/ai';
import { mergeSectionsToCraftJson, sectionsToHtml, convertToCraftJson } from '@/lib/ai/transformer';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export type AgentStep = 'idle' | 'architect' | 'designer' | 'builder' | 'complete' | 'error';

export function useAgentOrchestrator() {
    const {
        selectedModel,
        setPages,
        setBuilderData,
        toggleBuilderMode,
        isBuilderMode,
        pages: currentPages,
        setHtmlContent
    } = useStudioStore();

    const [currentStep, setCurrentStep] = useState<AgentStep>('idle');
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');

    // Ref to track cancellation
    const isBuildingStopped = useRef(false);

    const t = useTranslations('common');

    const stopBuild = useCallback(() => {
        isBuildingStopped.current = true;
        setCurrentStep('idle');
        setStatusMessage('Stopped by user');
        toast.info('Build stopped');
    }, []);

    const startGeneration = useCallback(async (prompt: string, mode: 'chat' | 'builder' | 'architect' = 'builder') => {
        isBuildingStopped.current = false;

        try {
            // Heuristic: If prompt implies multiple pages or "site", switch to architect mode
            const isSiteRequest = /site|website|portfolio|pages|full/i.test(prompt);
            const actualMode = (mode === 'builder' && isSiteRequest) ? 'architect' : mode;

            if (actualMode === 'architect') {
                // --- ARCHITECT FLOW ---
                setCurrentStep('architect');
                setStatusMessage('Architect Agent: Planning site structure...');
                setProgress(5);

                // 1. Generate Site Plan
                const planResult = await generateSitePlan(prompt, selectedModel);

                if (isBuildingStopped.current) return;

                if (!planResult.success || !planResult.sitePlan) {
                    throw new Error(planResult.error || "Failed to generate site plan");
                }

                const sitePlan = planResult.sitePlan;
                console.log("[Architect] Plan:", sitePlan);
                setProgress(20);

                // 2. Initialize Pages in Store (Placeholders)
                const newPagesMap = new Map(currentPages.map(p => [p.path, p]));
                const pagesToBuild: { path: string, title: string, seoDescription: string, sections: any[] }[] = [];

                sitePlan.pages.forEach((p: any) => {
                    if (newPagesMap.has(p.path)) {
                        toast.warning(`Skipping existing page: ${p.path}`);
                    } else {
                        newPagesMap.set(p.path, {
                            path: p.path,
                            content: '<div class="flex items-center justify-center h-screen bg-gray-50 text-gray-400"><h1>Construction in progress...</h1></div>',
                            content_json: undefined, // Will be filled by builder
                            status: 'pending'
                        });
                        pagesToBuild.push(p);
                    }
                });

                if (pagesToBuild.length === 0) {
                    toast.info("All planned pages already exist.");
                    setCurrentStep('idle');
                    return;
                }

                setPages(Array.from(newPagesMap.values()));

                // 3. User Cost Check can happen here (omitted for now to keep hook clean, relying on backend to reject if no credits)

                // 4. Designer Step (Optional, but good for consistency)
                setCurrentStep('designer');
                setStatusMessage('Designer Agent: Creating design system...');

                let designSystem;
                try {
                    designSystem = await generateDesignSystem(prompt, selectedModel);
                } catch (e) {
                    console.warn("Design system generation failed, using defaults", e);
                    designSystem = {
                        colors: { primary: 'bg-black', background: 'bg-white', text: 'text-gray-900' },
                        borderRadius: 'rounded-md'
                    };
                }

                if (isBuildingStopped.current) return;
                setProgress(35);

                // 5. Parallel Build
                setCurrentStep('builder');
                setStatusMessage(`Builder Agents: Constructing ${pagesToBuild.length} pages...`);

                const MAX_CONCURRENCY = 3;
                let completedCount = 0;
                const totalWork = pagesToBuild.length;

                for (let i = 0; i < pagesToBuild.length; i += MAX_CONCURRENCY) {
                    if (isBuildingStopped.current) break;

                    const chunk = pagesToBuild.slice(i, i + MAX_CONCURRENCY);

                    await Promise.allSettled(chunk.map(async (pagePlan) => {
                        if (isBuildingStopped.current) return;

                        try {
                            setStatusMessage(`Building ${pagePlan.path}...`);

                            // Build sections locally helper
                            const sectionPrompts = pagePlan.sections.map((s: any) => ({
                                type: s.type,
                                description: s.description
                            }));

                            // For simplicity in this v2, we treat the whole page as a set of sections generated sequentially or parallel?
                            // Let's generate sections sequentially for a single page to maintain coherence, but pages in parallel.

                            const builtSections: any[] = [];
                            for (const section of sectionPrompts) {
                                if (isBuildingStopped.current) throw new Error("Stopped");
                                const component = await generateSection(
                                    section.type,
                                    section.description,
                                    designSystem,
                                    selectedModel
                                );
                                builtSections.push(component);
                            }

                            if (isBuildingStopped.current) return;

                            const craftJson = mergeSectionsToCraftJson(builtSections);
                            const html = sectionsToHtml(builtSections);

                            // Update Store
                            useStudioStore.setState(state => ({
                                pages: state.pages.map(p =>
                                    p.path === pagePlan.path ? {
                                        ...p,
                                        content: html,
                                        content_json: craftJson,
                                        status: 'complete'
                                    } : p
                                )
                            }));

                            completedCount++;
                            setProgress(35 + Math.floor((completedCount / totalWork) * 65));

                        } catch (err) {
                            console.error(`Failed to build ${pagePlan.path}`, err);
                            useStudioStore.setState(state => ({
                                pages: state.pages.map(p =>
                                    p.path === pagePlan.path ? { ...p, status: 'error' } : p
                                )
                            }));
                        }
                    }));
                }

                setStatusMessage('All tasks completed.');
                setCurrentStep('complete');
                toast.success('Site construction finished.');

            } else {
                // --- COMPONENT BUILDER FLOW (Strategy A) ---
                setCurrentStep('builder');
                setStatusMessage('Builder Agent: Generating component...');
                setProgress(10);

                const designSystem = {
                    colors: { primary: 'bg-black', background: 'bg-white', text: 'text-gray-900' },
                    borderRadius: 'rounded-md'
                };

                const componentSchema = await generateSection(
                    'Custom Component',
                    prompt,
                    designSystem,
                    selectedModel
                );

                if (isBuildingStopped.current) return;

                const builderJson = convertToCraftJson(componentSchema); // Single component wrapper

                // If in builder mode, set data directly. If not, maybe switch?
                // The requirements say "Generates Builder Component directly".

                setBuilderData(builderJson);

                // If not in builder mode, switch to it to show the result
                if (!isBuilderMode) {
                    toggleBuilderMode();
                }

                setStatusMessage('Component generated.');
                setCurrentStep('complete');
                setProgress(100);
                toast.success('Component generated successfully.');
            }

        } catch (error: any) {
            console.error('Agent Orchestrator Error:', error);
            setStatusMessage(`Error: ${error.message}`);
            setCurrentStep('error');
            toast.error(error.message || 'Generation failed');
        }
    }, [selectedModel, currentPages, setPages, setBuilderData, isBuilderMode, toggleBuilderMode]);

    return {
        currentStep,
        progress,
        statusMessage,
        startGeneration,
        stopBuild
    };
}
