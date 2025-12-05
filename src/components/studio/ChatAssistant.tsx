import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { UIMessage as Message } from '@ai-sdk/react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Paperclip, Send, Sparkles, AlertCircle, Bot, User, Atom, Loader2, MessageSquare, Layout, X, Settings2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
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
        architectModel,
        setArchitectModel,
        designerModel,
        setDesignerModel,
        builderModel,
        setBuilderModel,
    } = useStudioStore();

    const { startGeneration, currentStep, progress, statusMessage } = useAgentOrchestrator();

    const scrollRef = useRef<HTMLDivElement>(null);
    const [localInput, setLocalInput] = useState('');
    const [models, setModels] = useState<Model[]>([]);
    const [mode, setMode] = useState<'guide' | 'direct'>('direct');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    // 本地聊天素材状态 - 只显示用户在聊天中上传的素材
    const [chatAssets, setChatAssets] = useState<ChatAsset[]>([]);

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

    const extractHtml = (content: string) => {
        const markdownMatch = content.match(/```html\s*([\s\S]*?)(```|$)/);
        if (markdownMatch) return markdownMatch[1];

        const start = content.indexOf('<!DOCTYPE html>');
        const start2 = content.indexOf('<html');
        const startIndex = start !== -1 ? start : start2;

        if (startIndex !== -1) return content.substring(startIndex);
        return null;
    };

    // 使用 refs 来存储动态值，确保每次请求时获取最新值
    const selectedModelRef = useRef(selectedModel);
    const htmlContentRef = useRef(htmlContent);
    const modeRef = useRef(mode);

    // 更新 refs
    useEffect(() => {
        selectedModelRef.current = selectedModel;
    }, [selectedModel]);
    useEffect(() => {
        htmlContentRef.current = htmlContent;
    }, [htmlContent]);
    useEffect(() => {
        modeRef.current = mode;
    }, [mode]);

    // Configure transport with API endpoint and dynamic body parameters
    const transport = useMemo(() => new DefaultChatTransport({
        api: '/api/chat',
        body: () => ({
            model: selectedModelRef.current,
            currentHtml: htmlContentRef.current,
            mode: modeRef.current,
        }),
    }), []);

    const { messages, sendMessage, stop, status, error, setMessages } = useChat({
        transport,
        onError: (err) => {
            console.error('Chat error:', err);
            toast.error(err.message || t('chatPanel.serviceError'));
        },
        onFinish: ({ message }: any) => {
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

            if (content.includes('<!-- page:')) {
                const pages: Page[] = [];
                const pageRegex = /<!-- page: (.*?) -->([\s\S]*?)(?=<!-- page: |$)/g;
                let match;
                while ((match = pageRegex.exec(content)) !== null) {
                    pages.push({
                        path: match[1].trim(),
                        content: match[2].trim()
                    });
                }
                if (pages.length > 0) {
                    setPages(pages);
                    return;
                }
            }
            const extractedHtml = extractHtml(content);
            if (extractedHtml) setHtmlContent(extractedHtml);
        },
    });

    const isLoading = status === 'streaming' || status === 'submitted';

    // 当模式改变时，清空消息历史，避免格式冲突
    useEffect(() => {
        setMessages([]);
    }, [mode, setMessages]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = async (contentOverride?: string) => {
        const contentToSend = typeof contentOverride === 'string' ? contentOverride : localInput;
        if (!contentToSend.trim()) return;

        // Check if we should use the Agentic Builder Workflow
        // Trigger if mode is 'direct' (Generate) and user asks for a full site or uses keywords
        // For now, let's add a toggle or just check a keyword like "build site" or if we are in builder mode?
        // Let's assume if the user clicks "生成" (Generate mode) we try to use the new flow if enabled.

        // TEMPORARY: Disable auto-trigger of Agentic Workflow until it is fully stable and configured.
        // Users reported accidental switching and 500 errors.
        /*
        if (mode === 'direct' && (contentToSend.includes('网站') || contentToSend.includes('page') || contentToSend.includes('site'))) {
            await startGeneration(contentToSend);
            setLocalInput('');
            return;
        }
        */

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

                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Settings2 className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">{t('chatPanel.modelSettings')}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {t('chatPanel.modelSettingsDesc')}
                                    </p>
                                </div>
                                <div className="grid gap-3">
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="architect" className="text-xs">{t('chatPanel.architect')}</Label>
                                        <Select value={architectModel} onValueChange={setArchitectModel}>
                                            <SelectTrigger id="architect" className="col-span-2 h-8">
                                                <SelectValue placeholder={t('chatPanel.selectModel')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {models.map(m => (
                                                    <SelectItem key={m.id} value={m.id} className="text-xs">{m.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="designer" className="text-xs">{t('chatPanel.designer')}</Label>
                                        <Select value={designerModel} onValueChange={setDesignerModel}>
                                            <SelectTrigger id="designer" className="col-span-2 h-8">
                                                <SelectValue placeholder={t('chatPanel.selectModel')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {models.map(m => (
                                                    <SelectItem key={m.id} value={m.id} className="text-xs">{m.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="builder" className="text-xs">{t('chatPanel.builder')}</Label>
                                        <Select value={builderModel} onValueChange={setBuilderModel}>
                                            <SelectTrigger id="builder" className="col-span-2 h-8">
                                                <SelectValue placeholder={t('chatPanel.selectModel')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {models.map(m => (
                                                    <SelectItem key={m.id} value={m.id} className="text-xs">{m.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <div className="flex items-center bg-muted/50 rounded-lg p-0.5 border border-border/50">
                        <button
                            onClick={() => setMode('guide')}
                            className={cn("px-2 py-1 text-[10px] font-medium rounded-md transition-all flex items-center gap-1", mode === 'guide' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
                        >
                            <MessageSquare className="h-3 w-3" />
                            {t('chatPanel.modeGuide')}
                        </button>
                        <button
                            onClick={() => setMode('direct')}
                            className={cn("px-2 py-1 text-[10px] font-medium rounded-md transition-all flex items-center gap-1", mode === 'direct' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
                        >
                            <Layout className="h-3 w-3" />
                            {t('chatPanel.modeDirect')}
                        </button>
                    </div>
                </div>
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
                            placeholder={t('chatPanel.inputPlaceholder')}
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
                            <Button size="icon" className={cn("h-7 w-7 rounded-lg transition-all", localInput.trim() ? "bg-primary shadow-md" : "bg-muted text-muted-foreground")} onClick={() => handleSend()} disabled={!localInput.trim()}>
                                <Send className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="mt-2 flex items-center justify-end gap-2 px-1">
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
