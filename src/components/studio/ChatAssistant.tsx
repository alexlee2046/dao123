import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { extractHtml, parseMultiPageResponse } from '@/lib/page-parser';
import type { UIMessage as Message } from '@ai-sdk/react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Paperclip, Send, Sparkles, AlertCircle, Bot, User, Atom, Loader2, X } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useStudioStore, type Page } from "@/lib/store";
import { cn } from "@/lib/utils";
import { getModels, type Model } from "@/lib/actions/models";
import { toast } from "sonner";
import { GuideModal } from "./GuideModal";
import { useAgentOrchestrator } from "@/lib/hooks/useAgentOrchestrator";
import { useTranslations } from 'next-intl';
import ReactMarkdown from 'react-markdown';

// 聊天输入框中上传的素材类型
interface ChatAsset {
    id: string;
    url: string;
    name: string;
    type: 'image' | 'video' | 'font' | 'other';
}

export function ChatAssistant() {
    const t = useTranslations('studio');
    const {
        htmlContent,
        setHtmlContent,
        setPages,
        selectedModel,
        addAsset,
        setSelectedModel,
    } = useStudioStore();

    const { startGeneration, currentStep, progress, statusMessage } = useAgentOrchestrator();

    const scrollRef = useRef<HTMLDivElement>(null);
    const [localInput, setLocalInput] = useState('');
    const [models, setModels] = useState<Model[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    // 本地聊天素材状态 - 只显示用户在聊天中上传的素材
    const [chatAssets, setChatAssets] = useState<ChatAsset[]>([]);

    const [mode, setMode] = useState<'chat' | 'builder'>('chat');

    useEffect(() => {
        getModels('chat').then(setModels);
    }, []);

    useEffect(() => {
        if (models.length > 0) {
            const isSelectedValid = models.some(m => m.id === selectedModel);
            if (!isSelectedValid) {
                setSelectedModel(models[0].id);
            }
        }
    }, [models, selectedModel, setSelectedModel]);

    // 使用 refs 来存储动态值，确保每次请求时获取最新值
    const selectedModelRef = useRef(selectedModel);
    const htmlContentRef = useRef(htmlContent);

    // 更新 refs
    useEffect(() => {
        selectedModelRef.current = selectedModel;
    }, [selectedModel]);
    useEffect(() => {
        htmlContentRef.current = htmlContent;
    }, [htmlContent]);

    // Configure transport with API endpoint and dynamic body parameters
    const transport = useMemo(() => new DefaultChatTransport({
        api: '/api/chat',
        body: () => ({
            model: selectedModelRef.current,
            currentHtml: htmlContentRef.current,
            mode: 'direct', // Default to direct mode
        }),
    }), []);

    const { messages, sendMessage, stop, status, error, setMessages } = useChat({
        transport,
        onError: (err) => {
            console.error('Chat error:', err);
            toast.error(err.message || t('chatPanel.serviceError'));
        },
        onFinish: async ({ message }: any) => {
            // 提取消息内容 - 新 SDK 中内容可能在 parts 中
            let content = '';
            if (message.content) {
                content = message.content;
            } else if (message.parts) {
                content = message.parts
                    .filter((part: any) => part.type === 'text')
                    .map((part: any) => part.text)
                    .join('');
            }

            if (!content) return;

            // Log raw content for client-side debugging
            console.log('[ChatAssistant] Raw AI response length:', content.length);

            try {
                // Call backend API for robust parsing
                const response = await fetch('/api/parse', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content })
                });

                if (!response.ok) {
                    throw new Error('Parsing failed');
                }

                const { pages } = await response.json();

                if (pages && pages.length > 0) {
                    // Merge with existing pages
                    const currentPages = useStudioStore.getState().pages;
                    const mergedPagesMap = new Map(currentPages.map(p => [p.path, p]));

                    pages.forEach((p: Page) => {
                        mergedPagesMap.set(p.path, p);
                    });

                    setPages(Array.from(mergedPagesMap.values()));
                    toast.success(t('chatPanel.previewUpdated'));
                    return;
                }
            } catch (error) {
                console.error('[ChatAssistant] Parsing API error, falling back to client parser:', error);
                // Fallback to client-side parser if API fails
                const newPages = parseMultiPageResponse(content);
                if (newPages.length > 0) {
                    const currentPages = useStudioStore.getState().pages;
                    const mergedPagesMap = new Map(currentPages.map(p => [p.path, p]));
                    newPages.forEach(p => {
                        mergedPagesMap.set(p.path, p);
                    });
                    setPages(Array.from(mergedPagesMap.values()));
                    return;
                }
            }

            // Legacy single page fallback (if no pages found by either method)
            const extractedHtml = extractHtml(content);
            if (extractedHtml) setHtmlContent(extractedHtml);
        },
    });

    const isLoading = status === 'streaming' || status === 'submitted' || uploading;

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const isBuildingStopped = useRef(false);

    const handleStopBuild = () => {
        isBuildingStopped.current = true;
        setUploading(false); // Reuse this state or separate one?
        // stop() is for useChat.
        stop();
        toast.info(t('chatPanel.stopped'));
    };

    const handleSend = async (contentOverride?: string) => {
        const contentToSend = typeof contentOverride === 'string' ? contentOverride : localInput;
        if (!contentToSend.trim()) return;

        // Reset stop flag
        isBuildingStopped.current = false;

        // System 2.0: Architect Mode (New Default for Multi-Page)
        // We use a heuristic: if the user asks for "site", "website", "pages", or explicitly selects "Architect", we run the full flow.
        // For now, let's make it explicit via a new internal logic or just replace the "Builder" toggle with an "Agentic" toggle later.
        // But per requirements, let's treat 'builder' mode as the single-component generator and 'architect' as the site generator.
        // Let's add a heuristic check or just use the current 'builder' mode for now? 
        // No, the user wants a SITE generator. Let's add an explicit 'architect' mode or check the prompt.
        // For simplicity in this iteration, if 'mode' is 'architect' (which we need to add to the UI), we do the full flow.
        // Let's assume we rename 'builder' to 'agentic' and inside we decide, or just add a new mode.
        // Let's stick to the plan: Update ChatAssistant to handle the "Map then Build" flow. we'll use 'builder' mode for single, and maybe detect multiple pages?
        // Actually, the prompt says "Implement System 2.0". Let's upgrade the 'builder' mode to support both, or add a specific check.

        // Let's implement the "Architect" flow as the default for complex requests if we had an intent classifier.
        // For now, I will add logic: IF mode === 'builder' AND prompt implies multiple pages (heuristic) -> Architect.
        // OR simpler: Just replace the 'builder' logic with the Site Architect if checking a checkbox.
        // Let's modify the UI to allow selecting "Site Gen" vs "Component Gen".
        // For this code block, I will implement the 'full site' flow if a specific flag is set, or just overwrite 'builder' for now?
        // No, Component Gen is useful.
        // Let's add a simple heuristic: if content contains "site" or "pages", use Architect. Else use Component Builder.

        // Revised Plan for handleSend in 'builder' mode:
        // 1. Check intent (Client-side simple regex for now).
        // 2. If 'Site/Multi-page', call Architect -> Parallel Builders.
        // 3. If 'Component', call Single Builder (Strategy A).

        const isSiteRequest = /site|website|portfolio|pages|full/i.test(contentToSend);

        if (mode === 'builder') {
            try {
                setLocalInput(''); // Clear input

                if (isSiteRequest) {
                    // --- PATH A: Architect (Site Gen) ---
                    toast.info("Architect Agent: Planning your site structure...");

                    // 1. Call Architect
                    const { generateSitePlan } = await import('@/app/actions/architect');
                    const planResult = await generateSitePlan(contentToSend);

                    if (isBuildingStopped.current) return; // Check stop

                    if (!planResult.success || !planResult.sitePlan) {
                        throw new Error(planResult.error || "Failed to generate site plan");
                    }

                    const sitePlan = planResult.sitePlan;
                    console.log("[Architect] Plan:", sitePlan);
                    toast.success(`Architect: Planned ${sitePlan.pages.length} pages.`);

                    // 2. Initialize Pages in Store (Placeholders)
                    const { setPages, pages: currentPages } = useStudioStore.getState();

                    const newPagesMap = new Map(currentPages.map(p => [p.path, p]));
                    const pagesToBuild: { path: string, title: string, seoDescription: string, sections: any[] }[] = [];

                    // Add placeholders
                    sitePlan.pages.forEach(p => {
                        // Check if exists
                        if (newPagesMap.has(p.path)) {
                            // EDGE CASE: If page exists, we could overwrite or skip.
                            // For now, let's skip to avoid destroying user data, BUT toast about it.
                            toast.warning(`Skipping existing page: ${p.path}`);
                        } else {
                            newPagesMap.set(p.path, {
                                path: p.path,
                                content: '<div class="flex items-center justify-center h-screen"><h1>Building...</h1></div>', // Temp HTML
                                content_json: undefined,
                                status: 'pending'
                            });
                            pagesToBuild.push(p);
                        }
                    });
                    setPages(Array.from(newPagesMap.values()));

                    if (pagesToBuild.length === 0) {
                        toast.info("All planned pages already exist. Nothing to build.");
                        return;
                    }

                    // --- COST TRANSPARENCY & CONTROL ---
                    // Calculate exact estimated cost
                    // Architect Cost: Fixed based on model (System uses Architect Agent model, assume same as selected for now or default)
                    // Builder Cost: Per Page * Cost per Section (Heuristic: 1 section call per page for now)

                    const { getCredits } = await import('@/lib/actions/credits');
                    const { calculateCost } = await import('@/lib/pricing');

                    const balance = await getCredits();

                    // We need to know which model is being used. `selectedModel` is state.
                    const builderCostPerUnit = calculateCost('agent_builder', selectedModel);
                    const totalBuilderCost = pagesToBuild.length * builderCostPerUnit;
                    const estimatedTotalCost = totalBuilderCost; // Architect already paid/done at this point? 
                    // Wait, Architect was called in Step 1. That cost is ALREADY incurred.
                    // So we are estimating the *Remaining* cost for the Builders.

                    if (balance < estimatedTotalCost) {
                        toast.warning(
                            `⚠️ Low Balance: You have ${balance} credits. This build requires ~${estimatedTotalCost} credits (${pagesToBuild.length} pages x ${builderCostPerUnit}). Partial completion expected.`
                        );
                    } else {
                        toast(
                            `💰 Cost Est: ~${estimatedTotalCost} Credits (${pagesToBuild.length} pages x ${builderCostPerUnit}/page). Balance: ${balance}.`,
                            {
                                icon: '💳',
                                duration: 5000
                            }
                        );
                    }

                    // 3. Parallel Build (Builder Agents) with Concurrency Control
                    toast.info(`Builder Agents: Starting construction of ${pagesToBuild.length} pages...`);

                    const { generateSection } = await import('@/app/actions/ai');
                    const { convertToCraftJson } = await import('@/lib/ai/transformer');
                    const designSystem = { // TODO: Fetch from Designer Agent or Store
                        colors: { primary: 'bg-black', background: 'bg-white', text: 'text-gray-900' },
                        borderRadius: 'rounded-md'
                    };

                    // Helper for Concurrency (Max 3 parallel)
                    const MAX_CONCURRENCY = 3;
                    const results: { path: string, success: boolean }[] = [];

                    // Simple chunking loop
                    for (let i = 0; i < pagesToBuild.length; i += MAX_CONCURRENCY) {
                        if (isBuildingStopped.current) {
                            toast.warning("Build stopped by user.");
                            break;
                        }

                        const chunk = pagesToBuild.slice(i, i + MAX_CONCURRENCY);

                        await Promise.allSettled(chunk.map(async (pagePlan) => {
                            if (isBuildingStopped.current) return;

                            try {
                                // Construct a prompt for the page
                                const pagePrompt = `Create a ${pagePlan.title} page. Description: ${pagePlan.seoDescription}. Sections: ${pagePlan.sections.map(s => s.type).join(', ')}.`;

                                const componentSchema = await generateSection(
                                    'Page',
                                    pagePrompt,
                                    designSystem,
                                    selectedModel
                                );

                                if (isBuildingStopped.current) return;

                                const builderJson = convertToCraftJson(componentSchema);

                                // Update Store for THIS page
                                useStudioStore.setState(state => ({
                                    pages: state.pages.map(p =>
                                        p.path === pagePlan.path ? {
                                            ...p,
                                            content_json: JSON.stringify(builderJson),
                                            status: 'complete'
                                        } : p
                                    )
                                }));

                                console.log(`[Builder] Finished ${pagePlan.path}`);
                                results.push({ path: pagePlan.path, success: true });
                            } catch (err) {
                                console.error(`[Builder] Failed ${pagePlan.path}`, err);

                                // Mark as error
                                useStudioStore.setState(state => ({
                                    pages: state.pages.map(p =>
                                        p.path === pagePlan.path ? { ...p, status: 'error' } : p
                                    )
                                }));
                                results.push({ path: pagePlan.path, success: false });
                            }
                        }));
                    }

                    // Final Report
                    const successCount = results.filter(r => r.success).length;
                    const failCount = results.filter(r => !r.success).length;

                    if (failCount === 0) {
                        toast.success(`Build Complete: ${successCount} pages generated perfectly.`);
                    } else {
                        toast.warning(`Build Complete: ${successCount} success, ${failCount} failed.`);
                    }

                } else {
                    // --- PATH B: Single Component (Original Builder) ---
                    toast.info("Builder Agent: Generating component...");

                    const { generateSection } = await import('@/app/actions/ai');
                    const { convertToCraftJson } = await import('@/lib/ai/transformer');

                    const designSystem = {
                        colors: { primary: 'bg-black', background: 'bg-white', text: 'text-gray-900' },
                        borderRadius: 'rounded-md'
                    };

                    const componentSchema = await generateSection(
                        'Custom',
                        contentToSend,
                        designSystem,
                        selectedModel
                    );

                    const builderJson = convertToCraftJson(componentSchema);
                    const { setBuilderData, toggleBuilderMode } = useStudioStore.getState();
                    setBuilderData(JSON.stringify(builderJson));
                    toggleBuilderMode();
                    toast.success("Component generated!");
                }
            } catch (e: any) {
                console.error("Agent Failed:", e);
                toast.error("Agent Failed: " + e.message);
            }
            return;
        }

        // Standard Chat Mode
        let messageContent = contentToSend;
        if (chatAssets.length > 0) {
            const assetInfo = chatAssets.map((asset, idx) =>
                `${t('chatPanel.assetPrefix')}${idx + 1}: ${asset.name} (${asset.url})`
            ).join('\n');
            messageContent += `\n\n${t('chatPanel.availableAssets')}：\n${assetInfo}`;
        }

        try {
            await sendMessage({
                text: messageContent,
            });
        } catch (error: any) {
            toast.error(error.message || t('chatPanel.serviceError'));
            console.error('sendMessage error:', error);
        }

        setLocalInput('');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const { createClient } = await import('@/lib/supabase/client');
            const { saveAssetRecord } = await import('@/lib/actions/assets');
            const supabase = createClient();

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage.from('assets').upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(filePath);

            let type = 'other';
            if (file.type.startsWith('image/')) type = 'image';
            else if (file.type.startsWith('video/')) type = 'video';
            else if (file.type.startsWith('font/') || ['ttf', 'otf', 'woff', 'woff2'].includes(fileExt || '')) type = 'font';

            const newAsset = await saveAssetRecord({
                url: publicUrl,
                name: file.name,
                type,
            });

            // 同时添加到全局素材库和本地聊天素材
            addAsset({ ...newAsset, type: newAsset.type as "image" | "video" | "font" });
            setChatAssets(prev => [...prev, {
                id: newAsset.id,
                url: publicUrl,
                name: file.name,
                type: type as 'image' | 'video' | 'font' | 'other',
            }]);
            setLocalInput(prev => prev + (prev ? '\n' : '') + `[附件: ${file.name}](${publicUrl})`);
            toast.success(t('chatPanel.fileUploaded'));
        } catch (error: any) {
            console.error(error);
            toast.error(t('chatPanel.uploadFailed') + error.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            // Handle file drop (not implemented here to avoid duplication, but could be)
            return;
        }
        const assetUrl = e.dataTransfer.getData('text/plain');
        if (assetUrl) {
            setLocalInput(prev => prev + (prev ? '\n' : '') + assetUrl);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background/50 backdrop-blur-xl border-l border-border/50 shadow-2xl">
            {/* Header */}
            <div className="p-3 border-b border-border/50 bg-background/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                        <Atom className="h-4 w-4 text-primary animate-spin-slow" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-foreground">{t('chatPanel.title')}</h3>
                    </div>
                </div>

                {/* Model Selection is now in Footer or can be moved here if desired, but removing the complex Popover */}
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-6 pb-4">
                    {currentStep !== 'idle' && (
                        <div className="p-4 bg-muted/50 rounded-lg border border-border/50 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    {statusMessage}
                                </span>
                                <span className="text-muted-foreground">{progress}%</span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-500 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span className={currentStep === 'architect' ? 'text-primary font-medium' : ''}>{t('chatPanel.stepArchitect')}</span>
                                <span className={currentStep === 'designer' ? 'text-primary font-medium' : ''}>{t('chatPanel.stepDesigner')}</span>
                                <span className={currentStep === 'builder' ? 'text-primary font-medium' : ''}>{t('chatPanel.stepBuilder')}</span>
                            </div>
                        </div>
                    )}

                    {messages.length === 0 && currentStep === 'idle' && (
                        <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-4 opacity-50">
                            <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center relative">
                                <Sparkles className="h-6 w-6 text-primary/50" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-medium text-sm">{t('chatPanel.emptyTitle')}</p>
                                <p className="text-xs text-muted-foreground">{t('chatPanel.emptyDesc')}</p>
                            </div>
                        </div>
                    )}

                    {messages.map((msg: any) => {
                        const isUser = msg.role === 'user';

                        // 兼容新版 AI SDK: 内容可能在 content 或 parts 中
                        let msgContent = '';
                        if (typeof msg.content === 'string') {
                            msgContent = msg.content;
                        } else if (msg.parts && Array.isArray(msg.parts)) {
                            msgContent = msg.parts
                                .filter((part: any) => part.type === 'text')
                                .map((part: any) => part.text)
                                .join('');
                        }

                        const isHtml = msg.role === 'assistant' && msgContent && (msgContent.includes('<!DOCTYPE html>') || msgContent.includes('```html'));

                        return (
                            <div key={msg.id} className={cn("flex gap-3 group", isUser ? "flex-row-reverse" : "flex-row")}>
                                <Avatar className={cn("h-7 w-7 ring-1 ring-offset-1 ring-offset-background", isUser ? "ring-primary/20" : "ring-muted-foreground/20")}>
                                    <AvatarFallback className={isUser ? "bg-primary text-primary-foreground" : "bg-muted"}>
                                        {isUser ? <User className="h-3.5 w-3.5" /> : <Atom className="h-3.5 w-3.5" />}
                                    </AvatarFallback>
                                </Avatar>

                                <div className={cn("relative max-w-[85%] rounded-2xl px-3 py-2.5 text-sm shadow-sm", isUser ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted/50 backdrop-blur-sm border border-border/50 rounded-tl-sm")}>
                                    {isHtml ? (
                                        <div className="flex flex-col gap-2 min-w-[200px]">
                                            <div className="flex items-center gap-2 font-medium border-b border-border/10 pb-1.5">
                                                <span className="text-base">🎨</span>
                                                <span className="text-xs">{isLoading && msg.id === messages[messages.length - 1].id ? t('chatPanel.building') : t('chatPanel.designCompleted')}</span>
                                            </div>
                                            <div className="text-[10px] opacity-90 flex items-center gap-1.5 bg-background/10 rounded px-2 py-1">
                                                {isLoading && msg.id === messages[messages.length - 1].id ? (
                                                    <><span className="animate-pulse text-yellow-400">⚡</span><span>{t('chatPanel.coding')}</span></>
                                                ) : (
                                                    <><span className="text-emerald-400">✅</span><span>{t('chatPanel.previewUpdated')}</span></>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="whitespace-pre-wrap leading-relaxed">
                                            {msgContent ? <ReactMarkdown>{msgContent}</ReactMarkdown> : <span className="text-muted-foreground italic">...</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {isLoading && (
                        <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                            <Avatar className="h-7 w-7 ring-1 ring-muted-foreground/20 ring-offset-1 ring-offset-background">
                                <AvatarFallback className="bg-muted"><Atom className="h-3.5 w-3.5 animate-spin" /></AvatarFallback>
                            </Avatar>
                            <div className="px-3 py-2 rounded-2xl rounded-tl-sm bg-muted/50 border border-border/50 flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                <span className="text-xs text-muted-foreground font-medium">{t('chatPanel.thinking')}</span>
                                <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-destructive ml-1" onClick={() => stop()}>{t('chatPanel.stop')}</Button>
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-3 bg-background/50 backdrop-blur-md border-t border-border/50">
                {chatAssets.length > 0 && (
                    <div className="flex gap-2 mb-2 overflow-x-auto py-1 px-1 no-scrollbar">
                        {chatAssets.map((asset) => (
                            <div key={asset.id} className="relative group/asset shrink-0">
                                <div className="h-12 w-12 rounded-lg border border-border bg-muted/50 overflow-hidden flex items-center justify-center relative">
                                    {asset.type === 'image' ? (
                                        <img src={asset.url} alt={asset.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-1">
                                            <Paperclip className="h-4 w-4 text-muted-foreground mb-0.5" />
                                            <span className="text-[8px] text-muted-foreground w-full text-center truncate px-0.5">{asset.name}</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/asset:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="h-5 w-5 rounded-full"
                                            onClick={() => setChatAssets(prev => prev.filter(a => a.id !== asset.id))}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="relative group" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                    <div className="relative bg-background rounded-xl border border-border shadow-sm focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                        <Textarea
                            placeholder={mode === 'builder' ? "Describe the component to build (e.g. Hero section with image)..." : t('chatPanel.inputPlaceholder')}
                            className="min-h-[80px] pr-10 resize-none border-none focus-visible:ring-0 bg-transparent rounded-xl text-sm"
                            value={localInput}
                            onChange={(e) => setLocalInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />
                        <div className="absolute bottom-1.5 right-1.5 flex gap-1.5">
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,video/*,.ttf,.otf,.woff,.woff2" />
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary rounded-lg" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
                            </Button>
                            <Button size="icon" className={cn("h-7 w-7 rounded-lg transition-all", localInput.trim() ? "bg-primary shadow-md" : "bg-muted text-muted-foreground")} onClick={() => handleSend()} disabled={!localInput.trim() || isLoading}>
                                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="mt-2 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5 border border-border/50">
                            <Button
                                variant={mode === 'chat' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setMode('chat')}
                                className={cn("h-6 text-[10px] px-2 rounded-md", mode === 'chat' ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}
                            >
                                Default
                            </Button>
                            <Button
                                variant={mode === 'builder' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setMode('builder')}
                                className={cn("h-6 text-[10px] px-2 rounded-md", mode === 'builder' ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}
                                title="Generates Builder Component directly (Strategy A)"
                            >
                                <span className="mr-1">⚡</span>Builder
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <GuideModal onComplete={(prompt) => handleSend(prompt)} />
                        <Select value={selectedModel} onValueChange={setSelectedModel}>
                            <SelectTrigger className="h-6 text-[10px] border-none bg-transparent focus:ring-0 px-1 text-muted-foreground hover:text-foreground w-auto min-w-[100px] justify-end">
                                <SelectValue placeholder={models.length > 0 ? t('chatPanel.selectModel') : t('chatPanel.noModelsAvailable')} />
                            </SelectTrigger>
                            <SelectContent align="end" className="w-[200px]">
                                {models.map(m => (
                                    <SelectItem key={m.id} value={m.id} className="text-xs">{m.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    );
}
