import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { extractHtml, parseMultiPageResponse } from '@/lib/page-parser';
import type { UIMessage as Message } from '@ai-sdk/react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Paperclip, Send, Sparkles, AlertCircle, Bot, User, Atom, Loader2, X, Bug, Layout, Grid, Mail, CreditCard } from "lucide-react";
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
        pendingPrompt,
        setPendingPrompt,
        setAiGeneratedCache, // 缓存 AI 生成的内容
    } = useStudioStore();


    const { startGeneration, stopBuild, currentStep, progress, statusMessage } = useAgentOrchestrator();

    const scrollRef = useRef<HTMLDivElement>(null);
    const [localInput, setLocalInput] = useState('');
    const [models, setModels] = useState<Model[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    // 本地聊天素材状态 - 只显示用户在聊天中上传的素材
    const [chatAssets, setChatAssets] = useState<ChatAsset[]>([]);

    // Debug info state
    const [debugInfo, setDebugInfo] = useState<{
        length?: number;
        extractStatus?: string;
        previewSnippet?: string;
        error?: string;
    } | null>(null);
    const [showDebug, setShowDebug] = useState(false);

    const [mode, setMode] = useState<'chat' | 'builder'>('chat');

    // Track if we've already processed the pending prompt
    const pendingPromptProcessedRef = useRef(false);

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

    // Auto-trigger generation if pendingPrompt exists (from project creation)
    useEffect(() => {
        // Wait for both models to be loaded AND selectedModel to be valid
        const isModelValid = selectedModel && selectedModel.trim() !== '';
        if (pendingPrompt && models.length > 0 && isModelValid && !pendingPromptProcessedRef.current) {
            pendingPromptProcessedRef.current = true;

            // Clear the pending prompt FIRST to avoid loops
            setPendingPrompt(null);

            // Call handleSend directly immediately
            handleSend(pendingPrompt);
        }
    }, [pendingPrompt, models, selectedModel, setPendingPrompt]);

    // Use refs to keep latest state accessible in event handlers if needed, 
    // but for useChat body we can use the state directly as it re-renders.
    const selectedModelRef = useRef(selectedModel);
    const htmlContentRef = useRef(htmlContent);

    useEffect(() => {
        selectedModelRef.current = selectedModel;
    }, [selectedModel]);
    useEffect(() => {
        htmlContentRef.current = htmlContent;
    }, [htmlContent]);

    const { messages, sendMessage, stop, status, error, setMessages } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/chat',
            body: {
                model: selectedModel,
                currentHtml: htmlContent,
                mode: 'direct',
            },
        }),
        onError: (err: Error) => {
            console.error('Chat error:', err);

            // 解析错误消息提供用户友好提示
            const errorMsg = err.message || '';
            let userMessage = t('chatPanel.serviceError');
            let hint = '';

            if (errorMsg.includes('429') || errorMsg.includes('rate-limited') || errorMsg.includes('rate limit')) {
                userMessage = '当前模型繁忙，请稍后重试或切换其他模型';
                hint = '💡 免费模型使用人数多，建议选择付费模型';
            } else if (errorMsg.includes('Provider returned error')) {
                userMessage = 'AI 服务商暂时不可用';
                hint = '💡 建议切换到其他模型重试';
            } else if (errorMsg.includes('Failed after')) {
                userMessage = '多次重试失败，AI 服务暂时不可用';
                hint = '💡 请稍后重试或联系管理员';
            }

            toast.error(userMessage, {
                duration: 6000,
                description: hint || undefined,
            });
        },
        // onFinish removed in favor of real-time monitoring below
    });

    // Track previous message count to detect new messages
    const lastMsgContentRef = useRef('');

    // Real-time monitoring of the last assistant message
    useEffect(() => {
        const lastMsg = messages[messages.length - 1];

        // Only proceed if it's an assistant message AND we are streaming or just finished
        if (!lastMsg || lastMsg.role !== 'assistant') return;

        let currentContent = '';
        const msgAny = lastMsg as any;
        if (typeof msgAny.content === 'string') {
            currentContent = msgAny.content;
        } else if (msgAny.parts) {
            currentContent = msgAny.parts
                .filter((part: any) => part.type === 'text')
                .map((part: any) => part.text)
                .join('');
        }

        if (!currentContent) return;

        // Update debug info in real-time
        if (currentContent.length !== lastMsgContentRef.current.length) {
            lastMsgContentRef.current = currentContent;
            setDebugInfo(prev => ({
                ...prev,
                length: currentContent.length,
                extractStatus: 'Streaming...',
                previewSnippet: currentContent.substring(0, 50) + '...' + currentContent.substring(currentContent.length - 50),
            }));
        }

        // If status went from streaming to submitted/ready, OR if we have a significant length and status is no longer 'streaming'
        // Note: useChat status can be 'streaming', 'submitted', 'ready', 'error'

        if (status !== 'streaming' && currentContent.length > 0) {
            // Debounce final parsing slightly to ensure we have everything
            const timer = setTimeout(() => {
                handleFinalParsing(currentContent);
            }, 500);
            return () => clearTimeout(timer);
        }

    }, [messages, status]);

    const handleFinalParsing = async (content: string) => {
        console.log('[ChatAssistant] Starting final parsing, content length:', content.length);

        // Update debug info
        const extractedHtml = extractHtml(content);
        setDebugInfo({
            length: content.length,
            extractStatus: extractedHtml ? 'Success (Client)' : 'Failed (Client)',
            previewSnippet: content.substring(0, 50) + '...' + content.substring(content.length - 50),
        });

        if (extractedHtml) {
            console.log('[ChatAssistant] Successfully extracted HTML on client side directly.');
        } else {
            console.warn('[ChatAssistant] Client-side extraction failed.');
        }

        try {
            // Call backend API for robust parsing
            const response = await fetch('/api/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });

            if (!response.ok) throw new Error(`Parsing failed with status ${response.status}`);

            const { pages } = await response.json();

            if (pages && pages.length > 0) {
                const currentPages = useStudioStore.getState().pages;
                const mergedPagesMap = new Map(currentPages.map(p => [p.path, p]));
                pages.forEach((p: Page) => mergedPagesMap.set(p.path, p));
                const finalPages = Array.from(mergedPagesMap.values());

                console.log('[ChatAssistant] Setting pages:', {
                    count: finalPages.length,
                    paths: finalPages.map(p => p.path),
                    contentLengths: finalPages.map(p => ({ path: p.path, length: p.content?.length || 0 }))
                });

                setPages(finalPages);

                // 缓存 AI 生成的 HTML（取第一个页面的内容）
                const primaryPage = finalPages.find(p => p.path === 'index.html') || finalPages[0];
                if (primaryPage?.content) {
                    setAiGeneratedCache(primaryPage.content);
                    console.log('[ChatAssistant] ✅ Cached AI generated content:', {
                        path: primaryPage.path,
                        length: primaryPage.content.length,
                        preview: primaryPage.content.substring(0, 100)
                    });

                    // 同时确保 htmlContent 也被更新
                    const storeState = useStudioStore.getState();
                    console.log('[ChatAssistant] Store state after cache:', {
                        htmlContentLength: storeState.htmlContent?.length,
                        cacheExists: !!storeState.aiGeneratedCache,
                        cacheLength: storeState.aiGeneratedCache?.html?.length
                    });
                } else {
                    console.warn('[ChatAssistant] ⚠️ No primary page content to cache!');
                }

                toast.success(t('chatPanel.previewUpdated'));
                return;
            }
        } catch (error) {
            console.error('[ChatAssistant] Parsing API error:', error);
            // Fallback
            const newPages = parseMultiPageResponse(content);
            if (newPages.length > 0) {
                const currentPages = useStudioStore.getState().pages;
                const mergedPagesMap = new Map(currentPages.map(p => [p.path, p]));
                newPages.forEach(p => mergedPagesMap.set(p.path, p));
                const finalPages = Array.from(mergedPagesMap.values());
                setPages(finalPages);

                // 缓存 fallback 解析的内容
                const primaryPage = finalPages.find(p => p.path === 'index.html') || finalPages[0];
                if (primaryPage?.content) {
                    setAiGeneratedCache(primaryPage.content);
                }

                toast.success(t('chatPanel.previewUpdated'));
                return;
            }
        }

        // Final fallback
        if (extractedHtml) {
            setHtmlContent(extractedHtml);
            setAiGeneratedCache(extractedHtml); // 也缓存这个
            // Removed deprecated setBuilderData call
            toast.success(t('chatPanel.previewUpdated'));
        }
    };

    const isLoading = status === 'streaming' || status === 'submitted' || uploading;

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);


    const handleStopBuild = () => {
        setUploading(false); // Reuse this state or separate one?
        // stop() is for useChat.
        stop();
        stopBuild();
        toast.info(t('chatPanel.stopped'));
    };

    const handleSend = async (contentOverride?: string) => {
        const contentToSend = typeof contentOverride === 'string' ? contentOverride : localInput;
        if (!contentToSend.trim()) return;

        // Validate model is selected before sending
        if (!selectedModel || selectedModel.trim() === '') {
            toast.error('请先选择一个模型');
            console.error('[ChatAssistant] Cannot send: model not selected');
            return;
        }

        // Reset stop flag
        // isBuildingStopped.current = false; // Handled by hook

        if (mode === 'builder') {
            setLocalInput(''); // Clear input
            await startGeneration(contentToSend, 'builder');
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

                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn("h-7 w-7 p-0", showDebug ? "text-primary bg-primary/10" : "text-muted-foreground")}
                        onClick={() => setShowDebug(!showDebug)}
                        title="Toggle Debug Info"
                    >
                        <Bug className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-6 pb-4">
                    {currentStep !== 'idle' && (
                        <div className={cn(
                            "p-4 rounded-lg border space-y-3",
                            currentStep === 'error'
                                ? "bg-destructive/10 border-destructive/30"
                                : "bg-muted/50 border-border/50"
                        )}>
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium flex items-center gap-2">
                                    {currentStep === 'error' ? (
                                        <AlertCircle className="h-4 w-4 text-destructive" />
                                    ) : (
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    )}
                                    <span className={currentStep === 'error' ? 'text-destructive' : ''}>
                                        {statusMessage}
                                    </span>
                                </span>
                                {currentStep !== 'error' && (
                                    <span className="text-muted-foreground">{progress}%</span>
                                )}
                            </div>
                            {currentStep !== 'error' && (
                                <>
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
                                </>
                            )}
                            {currentStep === 'error' && (
                                <div className="text-xs text-muted-foreground mt-2 p-2 bg-background/50 rounded">
                                    💡 建议：尝试切换到其他模型，或稍后重试
                                </div>
                            )}
                        </div>
                    )}

                    {messages.length === 0 && currentStep === 'idle' && (
                        <div className="flex flex-col h-full">
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 opacity-100 mt-10">
                                <div className="space-y-2">
                                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center mx-auto mb-4 border border-border/50 shadow-sm">
                                        <Sparkles className="h-8 w-8 text-primary" />
                                    </div>
                                    <h2 className="font-semibold text-lg text-foreground tracking-tight">{t('chatPanel.emptyTitle')}</h2>
                                    <p className="text-sm text-muted-foreground max-w-[280px] mx-auto leading-relaxed">{t('chatPanel.emptyDesc')}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 w-full max-w-[320px] px-2">
                                    {[
                                        { label: 'Hero Section', prompt: 'Create a modern hero section with a headline, subheadline, and two buttons.', icon: Layout },
                                        { label: 'Feature Grid', prompt: 'Add a features section with 3 columns and icons.', icon: Grid },
                                        { label: 'Newsletter', prompt: 'Create a clean newsletter signup section.', icon: Mail },
                                        { label: 'Pricing', prompt: 'Generate a pricing table with 3 tiers.', icon: CreditCard },
                                    ].map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSend(item.prompt)}
                                            className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/80 hover:border-primary/30 hover:shadow-md transition-all duration-300 group text-left"
                                        >
                                            <div className="p-2 rounded-full bg-background/50 group-hover:bg-primary/10 transition-colors">
                                                <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                            <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
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
                                                    <><span className="animate-pulse text-yellow-500">⚡</span><span>{t('chatPanel.coding')}</span></>
                                                ) : (
                                                    <><span className="text-emerald-500">✅</span><span>{t('chatPanel.previewUpdated')}</span></>
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
                                <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-destructive ml-1" onClick={handleStopBuild}>{t('chatPanel.stop')}</Button>
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />

                    {/* Debug Info Panel */}
                    {(debugInfo && showDebug) && (
                        <div className="mt-4 p-3 bg-card rounded-md text-xs font-mono border border-border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/50">
                                <span className="font-bold text-primary flex items-center gap-2">
                                    <Bug className="h-3 w-3" /> Debug Info
                                </span>
                                <Button variant="ghost" size="sm" className="h-4 w-4 p-0 hover:bg-muted" onClick={() => setShowDebug(false)}><X className="h-3 w-3" /></Button>
                            </div>
                            <div className="space-y-1.5 text-muted-foreground">
                                <div className="flex justify-between">
                                    <span>Length:</span>
                                    <span className="text-foreground font-medium">{debugInfo?.length || 0} chars</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Status:</span>
                                    <span className={cn("font-medium", debugInfo?.extractStatus?.includes('Success') ? "text-emerald-500" : "text-amber-500")}>{debugInfo?.extractStatus || 'Waiting...'}</span>
                                </div>
                                <div className="mt-2 text-[10px] text-muted-foreground/70">Raw Snippet:</div>
                                <div className="bg-muted/50 p-2 rounded border border-border/50 text-[10px] whitespace-pre-wrap break-all h-20 overflow-y-auto custom-scrollbar">
                                    {debugInfo?.previewSnippet || 'No content yet...'}
                                </div>
                                {debugInfo?.error && (
                                    <p className="text-destructive font-semibold mt-1">Error: {debugInfo.error}</p>
                                )}
                            </div>
                        </div>
                    )}
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
                            <Button size="icon" className={cn("h-7 w-7 rounded-lg transition-all", localInput.trim() ? "bg-primary shadow-md" : "bg-muted text-muted-foreground")} onClick={() => handleSend()} disabled={!localInput.trim() || isLoading} data-testid="chat-send-button">
                                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="mt-2 flex items-center justify-between px-1">
                    <div className="flex bg-muted/30 p-0.5 rounded-lg border border-border/30">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMode('chat')}
                            data-testid="mode-toggle-chat"
                            className={cn("h-6 text-[10px] px-3 rounded-md transition-all", mode === 'chat' ? "bg-background shadow-sm text-primary font-medium" : "text-muted-foreground hover:bg-muted/50")}
                        >
                            Chat
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMode('builder')}
                            data-testid="mode-toggle-builder"
                            className={cn("h-6 text-[10px] px-3 rounded-md transition-all", mode === 'builder' ? "bg-background shadow-sm text-primary font-medium" : "text-muted-foreground hover:bg-muted/50")}
                        >
                            Builder ⚡
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* GuideModal removed as requested */}
                        <Select value={selectedModel} onValueChange={setSelectedModel}>
                            <SelectTrigger className="h-7 text-xs border-none bg-muted/30 focus:ring-0 px-2 text-foreground hover:bg-muted/50 transition-colors w-auto min-w-[120px] justify-end rounded-lg gap-2">
                                <span className="text-muted-foreground/50 text-[10px] hidden sm:inline">Model:</span>
                                <SelectValue placeholder={t('chatPanel.selectModel')} />
                            </SelectTrigger>
                            <SelectContent align="end" className="w-[300px]">
                                {models.map(m => (
                                    <SelectItem key={m.id} value={m.id} className="text-xs flex justify-between w-full">
                                        <div className="flex justify-between w-full gap-4">
                                            <span>{m.name}</span>
                                            <span className="text-muted-foreground opacity-70">
                                                {m.cost_per_unit > 0 ? `${m.cost_per_unit} 积分` : '免费'}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    );
}
