import { useState } from 'react';
import { useStudioStore } from '@/lib/store';
import { generateSitePlan, generateDesignSystem } from '@/app/actions/ai';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export type AgentStep = 'idle' | 'architect' | 'designer' | 'builder' | 'complete';

export function useAgentOrchestrator() {
    const {
        selectedModel,
        setBuilderData,
        toggleBuilderMode,
        isBuilderMode
    } = useStudioStore();

    const [currentStep, setCurrentStep] = useState<AgentStep>('idle');
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');

    const t = useTranslations('common');

    const startGeneration = async (prompt: string) => {
        try {
            if (!isBuilderMode) toggleBuilderMode();

            setCurrentStep('architect');
            setStatusMessage('架构师正在规划网站结构...');
            setProgress(10);

            // 1. Architect Step
            const sitePlan: any = await generateSitePlan(prompt, selectedModel);
            console.log('Site Plan:', sitePlan);
            setProgress(30);

            setCurrentStep('designer');
            setStatusMessage('设计师正在制定视觉规范...');

            // 2. Designer Step
            const designSystem = await generateDesignSystem(prompt, selectedModel);
            console.log('Design System:', designSystem);
            setProgress(50);

            setCurrentStep('builder');
            setStatusMessage('构建者正在生成组件...');

            // 3. Builder Step (Loop through pages and sections)
            const pagesList = sitePlan.pages || [{
                path: 'index.html',
                title: sitePlan.pageTitle || 'Home',
                sections: sitePlan.sections || []
            }];

            const builtPages = [];
            const { generateSection } = await import('@/app/actions/ai');
            const { mergeSectionsToCraftJson, sectionsToHtml } = await import('@/lib/ai/transformer');

            const totalSteps = pagesList.reduce((acc: number, page: any) => acc + page.sections.length, 0);
            let currentStepCount = 0;

            for (const page of pagesList) {
                setStatusMessage(`正在构建页面: ${page.path}...`);
                const builtSections: any[] = [];

                for (let i = 0; i < page.sections.length; i++) {
                    const section = page.sections[i];
                    setStatusMessage(`正在构建页面 ${page.path}: ${section.type} (${i + 1}/${page.sections.length})...`);

                    const component = await generateSection(
                        section.type,
                        section.description,
                        designSystem,
                        selectedModel
                    );

                    if (component) {
                        builtSections.push(component);
                    }

                    currentStepCount++;
                    setProgress(50 + Math.floor((currentStepCount / totalSteps) * 50));
                }

                // Assemble Craft.js JSON and HTML
                const craftJson = mergeSectionsToCraftJson(builtSections);
                const html = sectionsToHtml(builtSections);

                builtPages.push({
                    path: page.path,
                    content: html,
                    content_json: craftJson
                });
            }

            console.log('Built Pages:', builtPages);
            
            // Update Store with all pages
            const { setPages } = useStudioStore.getState();
            setPages(builtPages);

            setCurrentStep('complete');
            setStatusMessage('网站构建完成！');
            toast.success('网站构建完成');

        } catch (error: any) {
            console.error('Generation Error:', error);
            let errorMessage = error.message;

            if (errorMessage.includes('Insufficient credits')) {
                errorMessage = t('insufficientCredits');
            } else if (errorMessage.includes('User not authenticated')) {
                errorMessage = t('unauthorized');
            }

            toast.error(`生成失败: ${errorMessage}`);
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
