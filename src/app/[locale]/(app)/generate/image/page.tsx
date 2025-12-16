'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import type { Asset } from "@/lib/actions/assets"
import { ShareToCommunityModal } from "@/components/community/ShareToCommunityModal"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Loader2, Download, Copy, Sparkles, Image as ImageIcon, Upload, X, Wand2 } from "lucide-react"
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

    // Image-to-image state
    const [sourceImage, setSourceImage] = useState<string | null>(null)
    const [sourceImageName, setSourceImageName] = useState<string>('')
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

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

    // Handle file upload
    const handleFileSelect = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error(t('invalidImageType') || '请选择图片文件')
            return
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error(t('imageTooLarge') || '图片大小不能超过 10MB')
            return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
            setSourceImage(e.target?.result as string)
            setSourceImageName(file.name)
        }
        reader.readAsDataURL(file)
    }, [t])

    // Drag and drop handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFileSelect(file)
    }, [handleFileSelect])

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleFileSelect(file)
    }, [handleFileSelect])

    const clearSourceImage = useCallback(() => {
        setSourceImage(null)
        setSourceImageName('')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }, [])

    // Text-to-image generation
    const handleGenerateText2Image = async () => {
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
                    mode: 'text-to-image',
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

    // Image-to-image generation
    const handleGenerateImage2Image = async () => {
        if (!sourceImage) {
            toast.error(t('imageRequired') || '请先上传参考图片')
            return
        }
        if (!prompt) {
            toast.error(t('promptRequired') || '请输入提示词')
            return
        }

        try {
            setGenerating(true)
            const response = await fetch('/api/generate-asset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    model,
                    type: 'image',
                    mode: 'image-to-image',
                    sourceImage,
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

    // Render model selector
    const renderModelSelector = () => (
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
    )

    // Render cost info
    const renderCostInfo = () => (
        selectedModel && (
            <p className="text-xs text-muted-foreground text-center">
                {t('cost', {
                    cost: selectedModel.is_free ? '0 (Pro)' : selectedModel.cost_per_unit,
                    unit: tCommon('credits')
                })}
            </p>
        )
    )

    // Render preview area
    const renderPreview = () => (
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
                            <ShareToCommunityModal
                                entityId={generatedImage.id}
                                type="asset"
                                defaultName={generatedImage.name}
                            >
                                <Button size="icon" variant="secondary" title="Share to Community">
                                    <Sparkles className="h-4 w-4" />
                                </Button>
                            </ShareToCommunityModal>
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
    )

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

                <Tabs defaultValue="text-to-image" className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="text-to-image" className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            {t('textToImage') || '文生图'}
                        </TabsTrigger>
                        <TabsTrigger value="image-to-image" className="flex items-center gap-2">
                            <Wand2 className="h-4 w-4" />
                            {t('imageToImage') || '图生图'}
                        </TabsTrigger>
                    </TabsList>

                    {/* Text-to-Image Tab */}
                    <TabsContent value="text-to-image" className="mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <Card className="lg:col-span-1 h-fit">
                                <CardContent className="p-6 space-y-6">
                                    {renderModelSelector()}

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
                                        onClick={handleGenerateText2Image}
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

                                    {renderCostInfo()}
                                </CardContent>
                            </Card>

                            {renderPreview()}
                        </div>
                    </TabsContent>

                    {/* Image-to-Image Tab */}
                    <TabsContent value="image-to-image" className="mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <Card className="lg:col-span-1 h-fit">
                                <CardContent className="p-6 space-y-6">
                                    {renderModelSelector()}

                                    {/* Source Image Upload */}
                                    <div className="space-y-2">
                                        <Label>{t('uploadImage') || '上传参考图片'}</Label>
                                        <div
                                            className={`
                                                relative border-2 border-dashed rounded-lg p-4 
                                                transition-colors cursor-pointer
                                                ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
                                                ${sourceImage ? 'border-solid border-primary/50' : ''}
                                            `}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleInputChange}
                                            />

                                            {sourceImage ? (
                                                <div className="relative aspect-square">
                                                    <Image
                                                        src={sourceImage}
                                                        alt={sourceImageName}
                                                        fill
                                                        className="object-contain rounded"
                                                    />
                                                    <Button
                                                        size="icon"
                                                        variant="destructive"
                                                        className="absolute top-2 right-2 h-6 w-6"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            clearSourceImage()
                                                        }}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                    <p className="absolute bottom-2 left-2 right-2 text-xs text-center bg-background/80 rounded px-2 py-1 truncate">
                                                        {sourceImageName}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                                    <Upload className="h-10 w-10 mb-3 opacity-50" />
                                                    <p className="text-sm text-center">
                                                        {t('uploadHint') || '拖拽图片到此处或点击上传'}
                                                    </p>
                                                    <p className="text-xs mt-1 opacity-70">
                                                        PNG, JPG, WebP (Max 10MB)
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>{t('prompt')}</Label>
                                        <Textarea
                                            placeholder={t('editPromptPlaceholder') || '描述您想要的修改效果...'}
                                            className="min-h-[100px]"
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                        />
                                    </div>

                                    <Button
                                        className="w-full"
                                        size="lg"
                                        onClick={handleGenerateImage2Image}
                                        disabled={generating || !sourceImage || !prompt || !model || models.length === 0}
                                    >
                                        {generating ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                {t('generating')}
                                            </>
                                        ) : (
                                            <>
                                                <Wand2 className="mr-2 h-4 w-4" />
                                                {t('generateFromImage') || '生成图片'}
                                            </>
                                        )}
                                    </Button>

                                    {renderCostInfo()}
                                </CardContent>
                            </Card>

                            {renderPreview()}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
