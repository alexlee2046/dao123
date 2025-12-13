"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Image as ImageIcon, Loader2, Plus, Video, FileText, Check } from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { getAssets, saveAssetRecord, type Asset } from "@/lib/actions/assets";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Image from 'next/image';
import { cn } from "@/lib/utils";

interface AssetPickerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (url: string) => void;
    allowedTypes?: string[];
}

export const AssetPickerModal: React.FC<AssetPickerModalProps> = ({
    open,
    onOpenChange,
    onSelect,
    allowedTypes = ['image']
}) => {
    const t = useTranslations('studio');
    const tCommon = useTranslations('common');
    const { assets, setAssets, addAsset } = useStudioStore();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            loadAssets();
            setSelectedAsset(null);
        }
    }, [open]);

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

            let type = 'other';
            if (file.type.startsWith('image/')) type = 'image';
            else if (file.type.startsWith('video/')) type = 'video';

            const newAsset = await saveAssetRecord({
                url: publicUrl,
                name: file.name,
                type,
            });

            addAsset({
                ...newAsset,
                type: newAsset.type as "image" | "video" | "font"
            });

            // Auto-select the new asset
            setSelectedAsset(newAsset as Asset);
            toast.success(t('assetsManager.uploadSuccess'));
        } catch (error: any) {
            console.error(error);
            toast.error(t('assetsManager.uploadFailed') + error.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleConfirm = () => {
        if (selectedAsset) {
            onSelect(selectedAsset.url);
            onOpenChange(false);
        }
    };

    const filteredAssets = assets.filter(asset =>
        allowedTypes.length === 0 || allowedTypes.includes(asset.type)
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        {t('assets')}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex items-center justify-between py-2 border-b">
                    <p className="text-sm text-muted-foreground">
                        {t('assetsManager.dragDropHint')}
                    </p>
                    <Button
                        size="sm"
                        variant="secondary"
                        className="gap-1.5"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        {t('assetsManager.upload')}
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleUpload}
                        accept="image/*,video/*"
                    />
                </div>

                <ScrollArea className="flex-1 max-h-[400px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : filteredAssets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                            <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
                            <p>{t('assetsManager.emptyState')}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-3 p-2">
                            {filteredAssets.map((asset) => (
                                <div
                                    key={asset.id}
                                    className={cn(
                                        "relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all hover:shadow-md",
                                        selectedAsset?.id === asset.id
                                            ? "border-primary ring-2 ring-primary/30"
                                            : "border-border hover:border-primary/50"
                                    )}
                                    onClick={() => setSelectedAsset(asset)}
                                >
                                    {asset.type === 'image' ? (
                                        <Image
                                            src={asset.url}
                                            alt={asset.name}
                                            fill
                                            className="object-cover"
                                            sizes="150px"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-muted/50">
                                            {asset.type === 'video' ? (
                                                <Video className="h-8 w-8 text-muted-foreground" />
                                            ) : (
                                                <FileText className="h-8 w-8 text-muted-foreground" />
                                            )}
                                            <span className="text-xs text-muted-foreground mt-1 truncate px-1 max-w-full">
                                                {asset.name}
                                            </span>
                                        </div>
                                    )}
                                    {selectedAsset?.id === asset.id && (
                                        <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-1">
                                            <Check className="h-3 w-3" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {tCommon('cancel')}
                    </Button>
                    <Button onClick={handleConfirm} disabled={!selectedAsset}>
                        {tCommon('save') || 'Select'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AssetPickerModal;
