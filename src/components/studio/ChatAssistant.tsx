import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
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
import ReactMarkdown from 'react-markdown';

export function ChatAssistant() {
    const {
        assets,
        htmlContent,
        setHtmlContent,
        setPages,
        selectedModel,
        addAsset,
        setSelectedModel,
        architectModel,
        setArchitectModel,
        builderModel,
        setBuilderModel,
        removeAsset
    } = useStudioStore();

    const { startGeneration, currentStep, progress, statusMessage } = useAgentOrchestrator();

    const scrollRef = useRef<HTMLDivElement>(null);
    const [localInput, setLocalInput] = useState('');
    const [models, setModels] = useState<Model[]>([]);
    const [mode, setMode] = useState<'guide' | 'direct'>('direct');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

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

    const { messages, append, isLoading, stop } = useChat({
        api: '/api/chat',
        body: {
            model: selectedModel,
            currentHtml: htmlContent,
            mode,
        },
        onFinish: (message: any) => {
            const content = message.content || '';
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
        onError: (error: any) => {
            console.error('Chat API Error:', error);
            toast.error(error.message || 'AI服务调用失败');
        },
    } as any) as any;

    useEffect(() => {
        const lastMessage = messages[messages.length - 1] as any;
        if (lastMessage && lastMessage.role === 'assistant') {
            const content = lastMessage.content;
            if (content.includes('<!-- page:')) return;
            const extractedHtml = extractHtml(content);
            if (extractedHtml) setHtmlContent(extractedHtml);
        }
    }, [messages, setHtmlContent]);

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

        // For this MVP, let's just hook it up:
        if (mode === 'direct' && (contentToSend.includes('网站') || contentToSend.includes('page') || contentToSend.includes('site'))) {
            await startGeneration(contentToSend);
            setLocalInput('');
            return;
        }

        let messageContent = contentToSend;
        if (assets.length > 0) {
            const assetInfo = assets.map((asset, idx) =>
                `素材${idx + 1}: ${asset.name} (${asset.url})`
            ).join('\n');
            messageContent += `\n\n可用素材：\n${assetInfo}`;
        }

        await append({
            role: 'user',
            content: messageContent,
        });

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

            addAsset({ ...newAsset, type: newAsset.type as "image" | "video" | "font" });
            setLocalInput(prev => prev + (prev ? '\n' : '') + `[附件: ${file.name}](${publicUrl})`);
            toast.success("文件已上传");
        } catch (error: any) {
            console.error(error);
            toast.error("上传失败: " + error.message);
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
                        <h3 className="font-semibold text-sm text-foreground">Dao 助手</h3>
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
                                    <h4 className="font-medium leading-none">模型设置</h4>
                                    <p className="text-sm text-muted-foreground">
                                        配置不同 Agent 使用的 AI 模型
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="architect">架构师</Label>
                                        <Select value={architectModel} onValueChange={setArchitectModel}>
                                            <SelectTrigger id="architect" className="col-span-2 h-8">
                                                <SelectValue placeholder="Select model" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                                                <SelectItem value="openai/gpt-4o">GPT-4o</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="builder">构建者</Label>
                                        <Select value={builderModel} onValueChange={setBuilderModel}>
                                            <SelectTrigger id="builder" className="col-span-2 h-8">
                                                <SelectValue placeholder="Select model" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="google/gemini-2.0-flash-exp:free">Gemini 2.0 Flash</SelectItem>
                                                <SelectItem value="deepseek/deepseek-chat">DeepSeek V3</SelectItem>
                                                <SelectItem value="openai/gpt-4o-mini">GPT-4o Mini</SelectItem>
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
                            沟通
                        </button>
                        <button
                            onClick={() => setMode('direct')}
                            className={cn("px-2 py-1 text-[10px] font-medium rounded-md transition-all flex items-center gap-1", mode === 'direct' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
                        >
                            <Layout className="h-3 w-3" />
                            生成
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
                                <span className={currentStep === 'architect' ? 'text-primary font-medium' : ''}>规划</span>
                                <span className={currentStep === 'designer' ? 'text-primary font-medium' : ''}>设计</span>
                                <span className={currentStep === 'builder' ? 'text-primary font-medium' : ''}>构建</span>
                            </div>
                        </div>
                    )}

                    {messages.length === 0 && currentStep === 'idle' && (
                        <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-4 opacity-50">
                            <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center relative">
                                <Sparkles className="h-6 w-6 text-primary/50" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-medium text-sm">道生一 (Origin)</p>
                                <p className="text-xs text-muted-foreground">描述您的想法，开启创造之旅</p>
                            </div>
                        </div>
                    )}

                    {messages.map((msg: any) => {
                        const isUser = msg.role === 'user';
                        const isHtml = msg.role === 'assistant' && (msg.content.includes('<!DOCTYPE html>') || msg.content.includes('```html'));

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
                                                <span className="text-xs">{isLoading && msg.id === messages[messages.length - 1].id ? '正在构建...' : '设计已完成'}</span>
                                            </div>
                                            <div className="text-[10px] opacity-90 flex items-center gap-1.5 bg-background/10 rounded px-2 py-1">
                                                {isLoading && msg.id === messages[messages.length - 1].id ? (
                                                    <><span className="animate-pulse text-yellow-400">⚡</span><span>AI 正在编写代码...</span></>
                                                ) : (
                                                    <><span className="text-emerald-400">✅</span><span>预览已更新</span></>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="whitespace-pre-wrap leading-relaxed">
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
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
                                <span className="text-xs text-muted-foreground font-medium">思考中...</span>
                                <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-destructive ml-1" onClick={() => stop()}>停止</Button>
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-3 bg-background/50 backdrop-blur-md border-t border-border/50">
                {assets.length > 0 && (
                    <div className="flex gap-2 mb-2 overflow-x-auto py-1 px-1 no-scrollbar">
                        {assets.map((asset) => (
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
                                            onClick={() => removeAsset(asset.id)}
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
                            placeholder="描述你想构建的网站... (支持拖拽素材)"
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
                <div className="mt-2 flex items-center justify-between gap-2 px-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        {assets.length === 0 && (
                            <>
                                <Sparkles className="h-3 w-3 text-amber-500" />
                                <span>支持多模态输入</span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <GuideModal onComplete={(prompt) => handleSend(prompt)} />
                        <Select value={selectedModel} onValueChange={setSelectedModel}>
                            <SelectTrigger className="h-6 text-[10px] border-none bg-transparent focus:ring-0 px-1 text-muted-foreground hover:text-foreground w-auto min-w-[100px] justify-end">
                                <SelectValue placeholder={models.length > 0 ? "选择模型" : "无可用模型"} />
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
