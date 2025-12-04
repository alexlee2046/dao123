'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Upload, Image as ImageIcon, FileVideo, Type, Trash2, Copy, Check, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getAssets, saveAssetRecord, deleteAsset, type Asset } from "@/lib/actions/assets"
import { toast } from "sonner"
import Image from 'next/image'
import { useStudioStore } from "@/lib/store"

export function AssetLibrary({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const [assets, setAssets] = useState<Asset[]>([])
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const { openRouterApiKey } = useStudioStore()

    useEffect(() => {
        if (isOpen) {
            loadAssets()
        }
    }, [isOpen])

    const loadAssets = async () => {
        try {
            setLoading(true)
            const data = await getAssets()
            setAssets(data)
        } catch (error) {
            console.error(error)
            toast.error("加载素材失败")
        } finally {
            setLoading(false)
        }
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setUploading(true)
            const supabase = createClient()

            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('assets')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('assets')
                .getPublicUrl(filePath)

            // Determine type
            let type = 'other'
            if (file.type.startsWith('image/')) type = 'image'
            else if (file.type.startsWith('video/')) type = 'video'
            else if (file.type.startsWith('font/') || fileExt === 'ttf' || fileExt === 'otf' || fileExt === 'woff' || fileExt === 'woff2') type = 'font'

            const newAsset = await saveAssetRecord({
                url: publicUrl,
                name: file.name,
                type,
            })

            setAssets([newAsset, ...assets])
            toast.success("素材上传成功")
        } catch (error: any) {
            console.error(error)
            toast.error("上传失败: " + error.message)
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleDelete = async (asset: Asset) => {
        try {
            // Extract path from URL for storage deletion
            // URL format: .../storage/v1/object/public/assets/filename.ext
            const path = asset.url.split('/').pop()
            if (!path) return

            await deleteAsset(asset.id, path)
            setAssets(assets.filter(a => a.id !== asset.id))
            toast.success("素材已删除")
        } catch (error: any) {
            console.error(error)
            toast.error("删除失败: " + error.message)
        }
    }

    const handleCopyUrl = (url: string) => {
        navigator.clipboard.writeText(url)
        toast.success("URL 已复制到剪贴板")
    }

    const filteredAssets = (type: string) => {
        if (type === 'all') return assets
        return assets.filter(a => a.type === type)
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] h-[600px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>素材库</DialogTitle>
                    <DialogDescription>
                        管理您的图片、视频和字体。
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center justify-between py-4">
                    <Tabs defaultValue="all" className="w-full">
                        <div className="flex items-center justify-between mb-4">
                            <TabsList>
                                <TabsTrigger value="all">全部</TabsTrigger>
                                <TabsTrigger value="image">图片</TabsTrigger>
                                <TabsTrigger value="video">视频</TabsTrigger>
                                <TabsTrigger value="font">字体</TabsTrigger>
                            </TabsList>
                            <div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleUpload}
                                    accept="image/*,video/*,.ttf,.otf,.woff,.woff2"
                                />
                                <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                                    {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                                    上传
                                </Button>
                            </div>
                        </div>

                        <ScrollArea className="h-[400px] border rounded-md p-4">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <>
                                    {['all', 'image', 'video', 'font'].map((tab) => (
                                        <TabsContent key={tab} value={tab} className="mt-0">
                                            {assets.length === 0 && tab === 'all' ? (
                                                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                                                    <ImageIcon className="h-12 w-12 mb-2 opacity-20" />
                                                    <p>未找到素材</p>
                                                    <Button variant="link" onClick={() => fileInputRef.current?.click()}>上传您的第一个素材</Button>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                                    {filteredAssets(tab).map((asset) => (
                                                        <div key={asset.id} className="group relative border rounded-lg overflow-hidden bg-muted/30 aspect-square flex items-center justify-center">
                                                            {asset.type === 'image' ? (
                                                                <div className="relative w-full h-full">
                                                                    <Image
                                                                        src={asset.url}
                                                                        alt={asset.name}
                                                                        fill
                                                                        className="object-cover"
                                                                    />
                                                                </div>
                                                            ) : asset.type === 'video' ? (
                                                                <FileVideo className="h-10 w-10 text-muted-foreground" />
                                                            ) : (
                                                                <Type className="h-10 w-10 text-muted-foreground" />
                                                            )}

                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                                                <p className="text-xs text-white truncate w-full text-center px-1">{asset.name}</p>
                                                                <div className="flex gap-2">
                                                                    <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => handleCopyUrl(asset.url)} title="复制链接">
                                                                        <Copy className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDelete(asset)} title="删除">
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </TabsContent>
                                    ))}
                                </>
                            )}
                        </ScrollArea>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    )
}
