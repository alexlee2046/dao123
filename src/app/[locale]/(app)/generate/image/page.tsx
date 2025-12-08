'use client'

import { useState, useEffect } from 'react'
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
import { getModels, type Model } from "@/lib/actions/models"
import { useTranslations } from 'next-intl'

export default function ImageGenerationPage() {
    const [prompt, setPrompt] = useState('')
    const [models, setModels] = useState<Model[]>([])
    const [model, setModel] = useState('')
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [generatedImage, setGeneratedImage] = useState<Asset | null>(null)
    const { openRouterApiKey } = useStudioStore()
    const t = useTranslations('generate.image')
    const tCommon = useTranslations('common')

    // Load models from database
    useEffect(() => {
        async function loadModels() {
            try {
                const imageModels = await getModels('image')
                setModels(imageModels)
                if (imageModels.length > 0) {
                    setModel(imageModels[0].id)
                }
            } catch (error) {
                console.error('Failed to load models:', error)
                toast.error('加载模型列表失败')
            } finally {
                setLoading(false)
            }
        }
        loadModels()
    }, [])

    const selectedModel = models.find(m => m.id === model)

    const handleGenerate = async () => {
        if (!prompt) return

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
            toast.success(t('generatedSuccess'))
        } catch (error) {
            const message = error instanceof Error ? error.message : t('generateFailed')
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
                        {t('title')}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        {t('subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Controls */}
                    <Card className="lg:col-span-1 h-fit">
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label>{t('model')}</Label>
                                {loading ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        加载模型中...
                                    </div>
                                ) : models.length === 0 ? (
                                    <p className="text-sm text-destructive">
                                        暂无可用的图片生成模型，请联系管理员配置。
                                    </p>
                                ) : (
                                    <Select value={model} onValueChange={setModel}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {models.map((m) => (
                                                <SelectItem key={m.id} value={m.id}>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span>{m.name}</span>
                                                        {m.is_free && (
                                                            <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                                                Pro免费
                                                            </span>
                                                        )}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>{t('prompt')}</Label>
                                <Textarea
                                    placeholder={t('prompt')}
                                    className="min-h-[150px]"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                />
                            </div>

                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handleGenerate}
                                disabled={generating || !prompt || !model || models.length === 0}
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('generating')}
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        {t('generate')}
                                    </>
                                )}
                            </Button>

                            {selectedModel && (
                                <p className="text-xs text-muted-foreground text-center">
                                    {t('cost', {
                                        cost: selectedModel.is_free ? '0 (Pro)' : selectedModel.cost_per_unit,
                                        unit: tCommon('credits')
                                    })}
                                </p>
                            )}
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
                                            toast.success(t('linkCopied'))
                                        }}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                    <p>{t('emptyPreview')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
