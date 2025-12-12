import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Upload, Image as ImageIcon, X, Loader2, Trash2, Copy, FileVideo, Type, Plus, Video, FileText } from "lucide-react";
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

    const handleDelete = async (e: React.MouseEvent, asset: Asset) => {
        e.stopPropagation();
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

            <div className="flex-1 p-4 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>{tCommon('loading')}</span>
                    </div>
                ) : assets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-60">
                        <ImageIcon className="h-12 w-12 mb-2 stroke-1" />
                        <p>{t('assetsManager.emptyState')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {assets.map((asset) => (
                            <div
                                key={asset.id}
                                className="group relative aspect-square bg-muted/30 rounded-xl overflow-hidden border border-border/40 hover:border-primary/50 transition-all duration-300 hover:shadow-md cursor-pointer"
                                draggable
                                onDragStart={(e) => handleDragStart(e, asset)}
                            >
                                {asset.type === 'image' ? (
                                    <Image
                                        src={asset.url}
                                        alt={asset.name}
                                        fill
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        sizes="(max-width: 768px) 50vw, 33vw"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-muted/50 p-2">
                                        {asset.type === 'video' ? (
                                            <Video className="h-10 w-10 text-muted-foreground/50" />
                                        ) : (
                                            <FileText className="h-10 w-10 text-muted-foreground/50" />
                                        )}
                                        <span className="text-[10px] text-muted-foreground truncate max-w-full px-2">{asset.name}</span>
                                    </div>
                                )}

                                {/* Glass Overlay on Hover */}
                                <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
                                    <div className="flex gap-2">
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="h-8 w-8 rounded-full shadow-sm hover:scale-110 transition-transform"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(asset.url);
                                                toast.success(tCommon('urlCopied'));
                                            }}
                                            title={tCommon('copyUrl')}
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="h-8 w-8 rounded-full shadow-sm hover:scale-110 transition-transform"
                                            onClick={(e) => handleDelete(e, asset)}
                                            title={tCommon('delete')}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                    <span className="text-[10px] font-medium text-foreground/80 truncate max-w-[90%] px-2 py-0.5 bg-background/80 rounded-full">
                                        {asset.name}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
