"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { useStudioStore } from "@/lib/store";

const POPULAR_MODELS = [
    // === OpenAI ===
    { id: 'openai/gpt-5', name: 'OpenAI GPT-5 (旗舰)', category: 'OpenAI' },
    { id: 'openai/gpt-5-mini', name: 'OpenAI GPT-5 Mini (高性价比)', category: 'OpenAI' },

    // === Google Gemini ===
    { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro (预览)', category: 'Google' },
    { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', category: 'Google' },

    // === DeepSeek ===
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', category: 'DeepSeek' },
    { id: 'deepseek/deepseek-chat-v3.1:free', name: 'DeepSeek V3.1 (免费)', category: 'DeepSeek' },

    // === Moonshot / Kimi ===
    { id: 'moonshotai/kimi-k2:free', name: 'Kimi K2 (免费)', category: 'Moonshot' },

    // === Qwen ===
    { id: 'qwen/qwen3-coder:free', name: 'Qwen3 Coder 480B (免费)', category: 'Qwen' },
    { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen2.5 72B Instruct', category: 'Qwen' },

    // === Free ===
    { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash Exp (免费)', category: 'Google' },
];

export default function SettingsPage() {
    const { openRouterApiKey, selectedModel, setOpenRouterApiKey, setSelectedModel } = useStudioStore();
    const [apiKey, setApiKey] = useState(openRouterApiKey);
    const [saved, setSaved] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [verifyOk, setVerifyOk] = useState<boolean | null>(null);
    const [verifyMsg, setVerifyMsg] = useState('');

    useEffect(() => {
        setApiKey(openRouterApiKey);
    }, [openRouterApiKey]);

    const handleSave = () => {
        setOpenRouterApiKey(apiKey);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleVerify = async () => {
        setVerifying(true);
        setVerifyOk(null);
        setVerifyMsg('');
        try {
            const res = await fetch('/api/models/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey, modelId: selectedModel }),
            });
            const data = await res.json();
            if (data && (data.ok === true || data.exists === true)) {
                setVerifyOk(true);
                setVerifyMsg('模型已通过验证，可用');
            } else {
                setVerifyOk(false);
                setVerifyMsg(data?.error || '模型未通过验证或不可用');
            }
        } catch {
            setVerifyOk(false);
            setVerifyMsg('网络错误或验证失败');
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto py-10 px-10 md:px-16 lg:px-20">
            <h1 className="text-3xl font-bold tracking-tight mb-8">设置</h1>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>OpenRouter API 配置</CardTitle>
                        <CardDescription>
                            配置你的 OpenRouter API Key 以启用 AI 功能。
                            <a
                                href="https://openrouter.ai/keys"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-primary hover:underline inline-flex items-center gap-1"
                            >
                                获取 API Key <ExternalLink className="h-3 w-3" />
                            </a>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {saved && (
                            <Alert className="bg-green-50 border-green-200">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800">
                                    API Key 已保存！
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="apiKey">OpenRouter API Key</Label>
                            <Input
                                id="apiKey"
                                type="password"
                                placeholder="sk-or-v1-..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                API Key 将安全地存储在浏览器本地，不会上传到服务器
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="model">AI 模型</Label>
                            <Select value={selectedModel} onValueChange={setSelectedModel}>
                                <SelectTrigger id="model">
                                    <SelectValue placeholder="选择模型" />
                                </SelectTrigger>
                                <SelectContent>
                                    {POPULAR_MODELS.map((model) => (
                                        <SelectItem key={model.id} value={model.id}>
                                            {model.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                <strong>2025年推荐：</strong> Claude Opus 4.5 是目前代码生成质量最高的模型，其次是 Claude Sonnet 4.5 和 Grok Code Fast 1
                            </p>
                            <div className="flex items-center gap-3 pt-2">
                                <Button variant="outline" onClick={handleVerify} disabled={verifying || !apiKey}>
                                    {verifying ? '验证中...' : '验证模型'}
                                </Button>
                                {verifyOk !== null && (
                                    verifyOk ? (
                                        <span className="text-xs text-emerald-600">{verifyMsg}</span>
                                    ) : (
                                        <span className="text-xs text-red-600">{verifyMsg}</span>
                                    )
                                )}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSave}>保存配置</Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>使用指南</CardTitle>
                        <CardDescription>如何使用 AI 生成网站</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm">1. 获取 API Key</h3>
                            <p className="text-sm text-muted-foreground">
                                访问 openrouter.ai 注册账号并创建 API Key
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm">2. 配置 Key</h3>
                            <p className="text-sm text-muted-foreground">
                                将 API Key 粘贴到上方输入框并保存
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm">3. 开始创建</h3>
                            <p className="text-sm text-muted-foreground">
                                进入 Studio 编辑器，在左侧聊天框描述你的需求，AI 会自动生成网页代码
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm">4. 使用素材</h3>
                            <p className="text-sm text-muted-foreground">
                                在右侧素材库上传图片，AI 会在生成时自动使用这些素材
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
