import React, { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import type { Message } from 'ai';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Paperclip, Send, Sparkles, AlertCircle, Bot, User, Atom, Loader2, MessageSquare, Layout } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useStudioStore, type Page } from "@/lib/store";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

import { getModels, type Model } from "@/lib/actions/models";
import { toast } from "sonner";
import { GuideModal } from "./GuideModal";

export function ChatAssistant() {
    const { assets, htmlContent, setHtmlContent, setPages, selectedModel, addAsset } = useStudioStore();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [localInput, setLocalInput] = useState('');
    const [models, setModels] = useState<Model[]>([]);
    const [mode, setMode] = useState<'guide' | 'direct'>('direct');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        getModels('chat').then(setModels);
    }, []);

    const { messages, append, isLoading } = useChat({
        api: '/api/chat',
        body: {
            model: selectedModel,
            currentHtml: htmlContent,
            mode,
        },
        onFinish: (message: Message) => {
            const content = message.content;

            // Check for multi-page format
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

            if (content.includes('<!DOCTYPE') || content.includes('<html')) {
                setHtmlContent(content);
            }
        },
        onError: (error) => {
            console.error('Chat API Error:', error);
            toast.error(error.message || 'AI服务调用失败，请检查API配置和积分余额');
        },
    });

    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
            const content = lastMessage.content;

            // Skip live update for multi-page for now
            if (content.includes('<!-- page:')) return;

            if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
                const startIndex = content.indexOf('<!DOCTYPE') !== -1 ? content.indexOf('<!DOCTYPE') : content.indexOf('<html');
                if (startIndex !== -1) {
                    const htmlPart = content.substring(startIndex);
                    setHtmlContent(htmlPart);
                }
            }
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
        await uploadFile(file);
    };

    const uploadFile = async (file: File) => {
        try {
            setUploading(true);
            const { createClient } = await import('@/lib/supabase/client');
            const { saveAssetRecord } = await import('@/lib/actions/assets');

            const supabase = createClient();

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('assets')
                .getPublicUrl(filePath);

            let type = 'other';
            if (file.type.startsWith('image/')) type = 'image';
            else if (file.type.startsWith('video/')) type = 'video';
            else if (file.type.startsWith('font/') || ['ttf', 'otf', 'woff', 'woff2'].includes(fileExt || '')) type = 'font';

            const newAsset = await saveAssetRecord({
                url: publicUrl,
                name: file.name,
                type,
            });

            // Add to store so it's available in context
            addAsset({
                ...newAsset,
                type: newAsset.type as "image" | "video" | "font"
            });

            // Append URL to input
            setLocalInput(prev => prev + (prev ? '\n' : '') + `[附件: ${file.name}](${publicUrl})`);
            toast.success("文件已上传并添加到聊天");

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

        // Check if dropping a file from OS
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            await uploadFile(file);
            return;
        }

        // Check if dropping an asset from AssetManager
        const assetUrl = e.dataTransfer.getData('text/plain');
        if (assetUrl) {
            setLocalInput(prev => prev + (prev ? '\n' : '') + assetUrl);
            return;
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return (
        <div className="flex flex-col h-full bg-background/50 backdrop-blur-xl border-l border-border/50 shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-border/50 bg-background/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                        <Atom className="h-6 w-6 text-primary animate-spin-slow" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">Dao 助手</h3>
                        <p className="text-xs text-muted-foreground">道生一 · 一生二</p>
                    </div>
                </div>

                <div className="flex items-center bg-muted/50 rounded-lg p-1 border border-border/50">
                    <button
                        onClick={() => setMode('guide')}
                        className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2",
                            mode === 'guide' ? "bg-background text-primary shadow-sm ring-1 ring-border/50" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                    >
                        <MessageSquare className="h-3.5 w-3.5" />
                        需求沟通
                    </button>
                    <button
                        onClick={() => setMode('direct')}
                        className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2",
                            mode === 'direct' ? "bg-background text-primary shadow-sm ring-1 ring-border/50" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                    >
                        <Layout className="h-3.5 w-3.5" />
                        生成网站
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-4 opacity-50">
                            <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center relative">
                                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-20"></div>
                                <Sparkles className="h-8 w-8 text-primary/50" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-medium">道生一 (Origin)</p>
                                <p className="text-sm text-muted-foreground">描述您的想法，开启创造之旅</p>
                            </div>
                        </div>
                    )}

                    {messages.map((msg: Message) => {
                        const isHtml = msg.role === 'assistant' && (msg.content.includes('<!DOCTYPE html>') || msg.content.includes('<html'));
                        const isUser = msg.role === 'user';

                        return (
                            <div key={msg.id} className={cn(
                                "flex gap-4 group",
                                isUser ? "flex-row-reverse" : "flex-row"
                            )}>
                                <Avatar className={cn(
                                    "h-8 w-8 ring-2 ring-offset-2 ring-offset-background transition-all",
                                    isUser ? "ring-primary/20" : "ring-muted-foreground/20"
                                )}>
                                    <AvatarFallback className={isUser ? "bg-primary text-primary-foreground" : "bg-muted"}>
                                        {isUser ? <User className="h-4 w-4" /> : <Atom className="h-4 w-4" />}
                                    </AvatarFallback>
                                </Avatar>

                                <div className={cn(
                                    "relative max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-all",
                                    isUser
                                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                                        : "bg-muted/50 backdrop-blur-sm border border-border/50 rounded-tl-sm hover:bg-muted/80"
                                )}>
                                    {isHtml ? (
                                        <div className="flex flex-col gap-3 min-w-[240px]">
                                            <div className="flex items-center gap-2 font-medium border-b border-border/10 pb-2">
                                                <span className="text-lg">🎨</span>
                                                <span>{isLoading && msg.id === messages[messages.length - 1].id ? '正在构建...' : '设计已完成'}</span>
                                            </div>
                                            <div className="text-xs opacity-90 flex items-center gap-2 bg-background/10 rounded-md p-2">
                                                {isLoading && msg.id === messages[messages.length - 1].id ? (
                                                    <>
                                                        <span className="animate-pulse text-yellow-400">⚡</span>
                                                        <span>AI 正在编写代码...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-emerald-400">✅</span>
                                                        <span>预览已更新</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {isLoading && (
                        <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2">
                            <Avatar className="h-8 w-8 ring-2 ring-muted-foreground/20 ring-offset-2 ring-offset-background">
                                <AvatarFallback className="bg-muted"><Atom className="h-4 w-4 animate-spin" /></AvatarFallback>
                            </Avatar>
                            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-muted/50 border border-border/50 flex items-center gap-3">
                                <div className="relative flex items-center justify-center w-6 h-6">
                                    <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping"></div>
                                    <div className="relative w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/50"></div>
                                </div>
                                <span className="text-xs text-muted-foreground font-medium">Dao 正在衍化万物...</span>
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 bg-background/50 backdrop-blur-md border-t border-border/50">
                <div
                    className="relative group"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                    <div className="relative bg-background rounded-xl border border-border shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                        <Textarea
                            placeholder="描述你想构建的网站... (支持拖拽图片/文件)"
                            className="min-h-[100px] pr-12 resize-none border-none focus-visible:ring-0 bg-transparent rounded-xl"
                            value={localInput}
                            onChange={(e) => setLocalInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            disabled={isLoading}
                        />
                        <div className="absolute bottom-2 right-2 flex gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileUpload}
                                accept="image/*,video/*,.ttf,.otf,.woff,.woff2"
                            />
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors rounded-lg"
                                disabled={isLoading || uploading}
                                title="上传附件"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                            </Button>

                            <Button
                                size="icon"
                                className={cn(
                                    "h-8 w-8 transition-all duration-300 rounded-lg",
                                    localInput.trim() ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25" : "bg-muted text-muted-foreground"
                                )}
                                onClick={() => handleSend()}
                                disabled={isLoading || !localInput.trim()}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 px-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap min-w-0 shrink">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">
                            {assets.length > 0
                                ? `已启用 ${assets.length} 个设计素材`
                                : '支持多模态输入'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <GuideModal onComplete={(prompt) => handleSend(prompt)} />
                        <Select
                            value={selectedModel}
                            onValueChange={(value) => useStudioStore.getState().setSelectedModel(value)}
                        >
                            <SelectTrigger className="h-7 text-xs border-none bg-transparent focus:ring-0 px-2 shadow-none text-muted-foreground hover:text-foreground transition-colors gap-1 w-auto min-w-[140px] justify-end">
                                <SelectValue placeholder="选择模型" />
                            </SelectTrigger>
                            <SelectContent align="end" className="w-[240px]">
                                {models.length > 0 ? (
                                    models.map((model) => (
                                        <SelectItem key={model.id} value={model.id} className="text-xs">
                                            {model.name}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <>
                                        <SelectItem value="openai/gpt-5" className="text-xs">GPT-5</SelectItem>
                                        <SelectItem value="google/gemini-2.0-flash-exp:free" className="text-xs">Gemini 2.0 Flash Exp (免费)</SelectItem>
                                        <SelectItem value="deepseek/deepseek-v3.2-exp" className="text-xs">DeepSeek V3.2 (免费)</SelectItem>
                                        <SelectItem value="qwen/qwen3-coder:free" className="text-xs">Qwen3 Coder (免费)</SelectItem>
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    );
}
