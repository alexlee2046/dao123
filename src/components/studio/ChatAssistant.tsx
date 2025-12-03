import React, { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import type { Message } from 'ai';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Paperclip, Send, Sparkles, AlertCircle, Bot, User } from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { AssetLibrary } from "@/components/studio/AssetLibrary";

export function ChatAssistant() {
    const { assets, setHtmlContent, openRouterApiKey, selectedModel } = useStudioStore();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [localInput, setLocalInput] = useState('');

    const { messages, append, isLoading } = useChat({
        api: '/api/chat',
        body: {
            apiKey: openRouterApiKey,
            model: selectedModel,
        },
        onFinish: (message: Message) => {
            const htmlContent = message.content;
            if (htmlContent.includes('<!DOCTYPE') || htmlContent.includes('<html')) {
                setHtmlContent(htmlContent);
            }
        },
    });

    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
            const content = lastMessage.content;
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

    const handleSend = async () => {
        if (!localInput.trim()) return;
        if (!openRouterApiKey) {
            alert('请先在设置页面配置 OpenRouter API Key');
            return;
        }

        let messageContent = localInput;
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

    return (
        <div className="flex flex-col h-full bg-background/50 backdrop-blur-xl border-l border-border/50 shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-border/50 bg-background/50 backdrop-blur-md sticky top-0 z-10 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                    <Bot className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">AI 设计助手</h3>
                    <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${openRouterApiKey ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`} />
                        <p className="text-xs text-muted-foreground font-medium">
                            {openRouterApiKey ? '已连接' : '未配置 API Key'}
                        </p>
                    </div>
                </div>
            </div>

            {/* API Key Warning */}
            {!openRouterApiKey && (
                <div className="p-4 animate-in slide-in-from-top-2 fade-in">
                    <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="font-medium">
                            请先在设置页面配置 OpenRouter API Key
                        </AlertDescription>
                    </Alert>
                </div>
            )}

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-4 opacity-50">
                            <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center">
                                <Sparkles className="h-8 w-8 text-primary/50" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-medium">开始您的设计之旅</p>
                                <p className="text-sm text-muted-foreground">描述您想要的网站，AI 将为您实时生成</p>
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
                                        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
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
                                <AvatarFallback className="bg-muted"><Bot className="h-4 w-4" /></AvatarFallback>
                            </Avatar>
                            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-muted/50 border border-border/50 flex items-center gap-3">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce"></div>
                                </div>
                                <span className="text-xs text-muted-foreground font-medium">思考中...</span>
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 bg-background/50 backdrop-blur-md border-t border-border/50">
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                    <div className="relative bg-background rounded-xl border border-border shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                        <Textarea
                            placeholder="描述你想构建的网站..."
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
                            <AssetLibrary>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors rounded-lg"
                                    disabled={isLoading}
                                    title="素材库"
                                >
                                    <Paperclip className="h-4 w-4" />
                                </Button>
                            </AssetLibrary>
                            <Button
                                size="icon"
                                className={cn(
                                    "h-8 w-8 transition-all duration-300 rounded-lg",
                                    localInput.trim() ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25" : "bg-muted text-muted-foreground"
                                )}
                                onClick={handleSend}
                                disabled={isLoading || !localInput.trim()}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground px-1">
                    <div className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        <span>
                            {assets.length > 0
                                ? `已启用 ${assets.length} 个设计素材`
                                : '支持多模态输入'}
                        </span>
                    </div>
                    <div className="opacity-50">Enter 发送</div>
                </div>
            </div>
        </div>
    );
}
