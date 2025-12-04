import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Upload, Image as ImageIcon, X, Loader2, Trash2, Copy, FileVideo, Type, Plus } from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { getAssets, saveAssetRecord, deleteAsset, type Asset } from "@/lib/actions/assets";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Image from 'next/image';
import { cn } from "@/lib/utils";
import { useTranslations } from 'next-intl';

export function AssetManager() {
    const t = useTranslations('studio');
    const tCommon = useTranslations('common');
    const { assets, setAssets, addAsset, removeAsset } = useStudioStore();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadAssets();
    }, []);

    const loadAssets = async () => {
        try {
            setLoading(true);
            const data = await getAssets();
            setAssets(data);
        } catch (error) {
            console.error(error);
            toast.error(t('assetsManager.loadFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
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

            // Determine type
            let type = 'other';
            if (file.type.startsWith('image/')) type = 'image';
            else if (file.type.startsWith('video/')) type = 'video';
            else if (file.type.startsWith('font/') || ['ttf', 'otf', 'woff', 'woff2'].includes(fileExt || '')) type = 'font';

            const newAsset = await saveAssetRecord({
                url: publicUrl,
                name: file.name,
                type,
            });

            addAsset({
                ...newAsset,
                type: newAsset.type as "image" | "video" | "font"
            });
            toast.success(t('assetsManager.uploadSuccess'));
        } catch (error: any) {
            console.error(error);
            toast.error(t('assetsManager.uploadFailed') + error.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (asset: Asset) => {
        try {
            const path = asset.url.split('/').pop();
            if (!path) return;

            await deleteAsset(asset.id, path);
            removeAsset(asset.id);
            toast.success(t('assetsManager.deleteSuccess'));
        } catch (error: any) {
            console.error(error);
            toast.error(t('assetsManager.deleteFailed') + error.message);
        }
    };

    const handleDragStart = (e: React.DragEvent, asset: Asset) => {
        e.dataTransfer.setData('text/plain', asset.url);
        e.dataTransfer.setData('application/json', JSON.stringify(asset));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div className="flex flex-col h-full bg-background/50 backdrop-blur-xl border-l border-border/50">
            <div className="p-4 border-b border-border/50 flex items-center justify-between bg-background/50 backdrop-blur-md sticky top-0 z-10">
                <div>
                    <h3 className="font-semibold text-sm">{t('assets')}</h3>
                    <p className="text-[10px] text-muted-foreground">{t('assetsManager.dragDropHint')}</p>
                </div>
                <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 px-2 text-xs gap-1 shadow-sm hover:bg-primary hover:text-primary-foreground transition-all"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    {t('assetsManager.upload')}
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleUpload}
                    accept="image/*,video/*,.ttf,.otf,.woff,.woff2"
                />
            </div>

            <ScrollArea className="flex-1 p-3">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="text-xs">{tCommon('loading')}</span>
                    </div>
                ) : assets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground/50">
                        <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center border border-dashed border-border">
                            <ImageIcon className="h-8 w-8" />
                        </div>
                        <p className="text-xs">{t('assetsManager.emptyState')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {assets.map((asset) => (
                            <Card
                                key={asset.id}
                                className="group relative aspect-square cursor-grab active:cursor-grabbing overflow-hidden border-0 shadow-sm ring-1 ring-border/50 hover:ring-primary/50 hover:shadow-md transition-all bg-muted/30"
                                draggable
                                onDragStart={(e) => handleDragStart(e, asset)}
                            >
                                {asset.type === 'image' ? (
                                    <div className="relative w-full h-full">
                                        <Image
                                            src={asset.url}
                                            alt={asset.name}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                            sizes="(max-width: 768px) 50vw, 33vw"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-muted/50 p-2">
                                        {asset.type === 'video' ? (
                                            <FileVideo className="h-8 w-8 text-muted-foreground/70" />
                                        ) : (
                                            <Type className="h-8 w-8 text-muted-foreground/70" />
                                        )}
                                        <span className="text-[10px] text-muted-foreground truncate max-w-full px-2">{asset.name}</span>
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        className="h-7 w-7 rounded-full shadow-lg scale-90 hover:scale-100 transition-transform"
                                        onClick={() => handleDelete(asset)}
                                        title={tCommon('delete')}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                                {asset.type === 'image' && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-[10px] text-white truncate text-center font-medium">{asset.name}</p>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
