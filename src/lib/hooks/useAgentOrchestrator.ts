
import { useState, useRef, useCallback } from 'react';
import { useStudioStore, type Page } from '@/lib/store';
import { generateSitePlan } from '@/app/actions/architect';
import { generateSection, generateDesignSystem } from '@/app/actions/ai';
import { sectionsToHtml } from '@/lib/ai/transformer';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export type AgentStep = 'idle' | 'architect' | 'designer' | 'builder' | 'complete' | 'error';

export function useAgentOrchestrator() {
    const {
        selectedModel,
        setPages,
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

        // Validate and fallback model if empty
        const modelToUse = selectedModel && selectedModel.trim() !== ''
            ? selectedModel
            : 'anthropic/claude-3.5-sonnet'; // Default fallback

        if (!selectedModel || selectedModel.trim() === '') {
            console.warn('[AgentOrchestrator] Empty model, using fallback:', modelToUse);
        }

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
                const planResult = await generateSitePlan(prompt, modelToUse);

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
                    designSystem = await generateDesignSystem(prompt, modelToUse);
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
                                    modelToUse
                                );
                                builtSections.push(component);
                            }

                            if (isBuildingStopped.current) return;

                            const html = sectionsToHtml(builtSections);

                            // Update Store
                            useStudioStore.setState(state => ({
                                pages: state.pages.map(p =>
                                    p.path === pagePlan.path ? {
                                        ...p,
                                        content: html,
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
                    modelToUse
                );

                if (isBuildingStopped.current) return;

                const html = sectionsToHtml([componentSchema]);

                // If in builder mode, set data directly.
                // The requirements say "Generates Builder Component directly".

                setHtmlContent(html);

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

            // 解析错误消息，提取有用信息
            const errorMsg = error.message || '';
            const errorStr = JSON.stringify(error);

            // 解析常见错误类型，提供用户友好的消息
            let userMessage = '生成失败，请重试';
            let errorTitle = '生成失败';

            // 429 Rate Limit 错误 - 最常见
            if (errorMsg.includes('429') || errorMsg.includes('rate-limited') || errorMsg.includes('rate limit') || errorStr.includes('429')) {
                userMessage = '当前模型请求过于频繁，正在被限流。建议：\n1. 稍等几秒后重试\n2. 或切换到其他模型';
                errorTitle = '⏳ 模型繁忙';
            }
            // Provider 返回错误
            else if (errorMsg.includes('Provider returned error')) {
                userMessage = 'AI 服务商暂时不可用，请稍后重试或切换其他模型';
                errorTitle = '🔌 服务暂时不可用';
            }
            // 数据策略错误
            else if (errorMsg.includes('data policy') || errorMsg.includes('Free model publication')) {
                userMessage = '模型配置错误：请在 OpenRouter 设置中开启数据共享，或选择其他模型';
                errorTitle = '⚙️ 配置问题';
            }
            // 找不到端点
            else if (errorMsg.includes('No endpoints found')) {
                userMessage = '找不到可用的模型端点，请稍后重试或选择其他模型';
                errorTitle = '🔍 模型不可用';
            }
            // 积分不足
            else if (errorMsg.includes('credits') || errorMsg.includes('积分')) {
                userMessage = '积分不足，请充值后重试';
                errorTitle = '💰 积分不足';
            }
            // API 密钥问题
            else if (errorMsg.includes('API key') || errorMsg.includes('Unauthorized') || errorMsg.includes('401')) {
                userMessage = 'API 密钥配置错误，请联系管理员';
                errorTitle = '🔑 密钥问题';
            }
            // 网络错误
            else if (errorMsg.includes('fetch') || errorMsg.includes('network') || errorMsg.includes('ECONNREFUSED')) {
                userMessage = '网络连接失败，请检查网络后重试';
                errorTitle = '🌐 网络错误';
            }
            // 超时
            else if (errorMsg.includes('timeout') || errorMsg.includes('Timeout')) {
                userMessage = '请求超时，AI 模型响应时间过长，请重试';
                errorTitle = '⏱️ 请求超时';
            }

            setStatusMessage(`${errorTitle}: ${userMessage}`);
            setCurrentStep('error');

            // 使用更醒目的错误提示
            toast.error(userMessage, {
                duration: 8000,  // 显示更长时间
                description: '💡 提示：可以尝试切换到其他模型',
            });
        }
    }, [selectedModel, currentPages, setPages, isBuilderMode, toggleBuilderMode]);

    return {
        currentStep,
        progress,
        statusMessage,
        startGeneration,
        stopBuild
    };
}
