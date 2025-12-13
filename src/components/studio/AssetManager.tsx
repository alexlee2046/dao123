import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Image as ImageIcon, Loader2, Trash2, Copy, Plus, Video, FileText, Search, X, Filter } from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { getAssets, saveAssetRecord, deleteAsset, type Asset } from "@/lib/actions/assets";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Image from 'next/image';
import { cn } from "@/lib/utils";
import { useTranslations } from 'next-intl';

type AssetFilter = 'all' | 'image' | 'video' | 'font';

const FILTER_OPTIONS: { value: AssetFilter; icon: React.ElementType }[] = [
    { value: 'all', icon: Filter },
    { value: 'image', icon: ImageIcon },
    { value: 'video', icon: Video },
    { value: 'font', icon: FileText },
];

export function AssetManager() {
    const t = useTranslations('studio');
    const tCommon = useTranslations('common');
    const { assets, setAssets, addAsset, removeAsset } = useStudioStore();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<AssetFilter>('all');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadAssets();
    }, []);

    // Filter and search assets
    const filteredAssets = useMemo(() => {
        return assets.filter(asset => {
            // Filter by type
            if (activeFilter !== 'all' && asset.type !== activeFilter) {
                return false;
            }
            // Filter by search query
            if (searchQuery && !asset.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }
            return true;
        });
    }, [assets, activeFilter, searchQuery]);

    // Count by type
    const typeCounts = useMemo(() => {
        const counts = { all: assets.length, image: 0, video: 0, font: 0 };
        assets.forEach(asset => {
            if (asset.type === 'image') counts.image++;
            else if (asset.type === 'video') counts.video++;
            else if (asset.type === 'font') counts.font++;
        });
        return counts;
    }, [assets]);

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

    const getFilterLabel = (filter: AssetFilter) => {
        const labels: Record<AssetFilter, string> = {
            all: t('assetsManager.filterAll'),
            image: t('assetsManager.filterImage'),
            video: t('assetsManager.filterVideo'),
            font: t('assetsManager.filterFont'),
        };
        return labels[filter];
    };

    return (
        <div className="flex flex-col h-full bg-background/50 backdrop-blur-xl border-l border-border/50">
            {/* Header */}
            <div className="p-4 border-b border-border/50 bg-background/50 backdrop-blur-md sticky top-0 z-10 space-y-3">
                <div className="flex items-center justify-between">
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

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder={tCommon('search') + '...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 pl-8 pr-8 text-xs bg-background/80"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-1">
                    {FILTER_OPTIONS.map(({ value, icon: Icon }) => (
                        <button
                            key={value}
                            onClick={() => setActiveFilter(value)}
                            className={cn(
                                "flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-all",
                                activeFilter === value
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <Icon className="h-3 w-3" />
                            <span>{getFilterLabel(value)}</span>
                            <span className="ml-0.5 text-[10px] opacity-70">({typeCounts[value]})</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Asset Grid */}
            <div className="flex-1 p-4 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>{tCommon('loading')}</span>
                    </div>
                ) : filteredAssets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-60">
                        {searchQuery || activeFilter !== 'all' ? (
                            <>
                                <Search className="h-12 w-12 mb-2 stroke-1" />
                                <p>{t('assetsManager.noAssetsFound')}</p>
                            </>
                        ) : (
                            <>
                                <ImageIcon className="h-12 w-12 mb-2 stroke-1" />
                                <p>{t('assetsManager.emptyState')}</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredAssets.map((asset) => (
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

                                {/* Type Badge */}
                                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-background/80 backdrop-blur-sm rounded text-[9px] font-medium uppercase text-muted-foreground">
                                    {asset.type}
                                </div>

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
                                                toast.success(t('assetsManager.urlCopied'));
                                            }}
                                            title={t('assetsManager.copyLink')}
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="h-8 w-8 rounded-full shadow-sm hover:scale-110 transition-transform"
                                            onClick={(e) => handleDelete(e, asset)}
                                            title={t('assetsManager.delete')}
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
