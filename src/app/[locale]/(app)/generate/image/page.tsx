'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import type { Asset } from "@/lib/actions/assets"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Download, Copy, Sparkles, Image as ImageIcon } from "lucide-react"
import Image from "next/image"
import { useStudioStore } from "@/lib/store"
import { AI_CONFIG } from "@/lib/ai-config"

export default function ImageGenerationPage() {
    const [prompt, setPrompt] = useState('')
    const [model, setModel] = useState(AI_CONFIG.images.defaultModel)
    const [generating, setGenerating] = useState(false)
    const [generatedImage, setGeneratedImage] = useState<Asset | null>(null)
    const { openRouterApiKey } = useStudioStore()

    const handleGenerate = async () => {
        if (!prompt) return

        // Note: We are using the API route which now prioritizes DB key, but falls back to user key.
        // We pass the user key just in case they want to use their own.

        try {
            setGenerating(true)
            const response = await fetch('/api/generate-asset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    model,
                    type: 'image',
                    apiKey: openRouterApiKey
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Generation failed')
            }

            setGeneratedImage(data)
            toast.success("图片生成成功")
        } catch (error) {
            const message = error instanceof Error ? error.message : '生成失败'
            console.error(message)
            toast.error(message)
        } finally {
            setGenerating(false)
        }
    }

    return (
        <div className="container mx-auto py-8 max-w-5xl">
            <div className="flex flex-col gap-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Sparkles className="h-8 w-8 text-primary" />
                        AI 绘图
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        使用最先进的 AI 模型创建令人惊叹的视觉效果。
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Controls */}
                    <Card className="lg:col-span-1 h-fit">
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label>模型</Label>
                                <Select value={model} onValueChange={setModel}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {AI_CONFIG.images.models.map((m) => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>提示词</Label>
                                <Textarea
                                    placeholder="详细描述您想生成的图片..."
                                    className="min-h-[150px]"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                />
                            </div>

                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handleGenerate}
                                disabled={generating || !prompt}
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        生成中...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        生成图片
                                    </>
                                )}
                            </Button>

                            <p className="text-xs text-muted-foreground text-center">
                                消耗: {AI_CONFIG.images.models.find(m => m.id === model)?.cost || 10} 积分
                            </p>
                        </CardContent>
                    </Card>

                    {/* Preview */}
                    <div className="lg:col-span-2">
                        <div className="aspect-square rounded-xl border-2 border-dashed flex items-center justify-center bg-muted/30 relative overflow-hidden group">
                            {generatedImage ? (
                                <>
                                    <Image
                                        src={generatedImage.url}
                                        alt={generatedImage.name}
                                        fill
                                        className="object-contain"
                                    />
                                    <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="secondary" onClick={() => window.open(generatedImage.url, '_blank')}>
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="secondary" onClick={() => {
                                            navigator.clipboard.writeText(generatedImage.url)
                                            toast.success("链接已复制")
                                        }}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                    <p>生成的图片将显示在这里</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
