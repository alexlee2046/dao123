import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Upload, Image as ImageIcon, X, Loader2, Trash2, Copy, FileVideo, Type } from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { getAssets, saveAssetRecord, deleteAsset, type Asset } from "@/lib/actions/assets";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Image from 'next/image';

export function AssetManager() {
    const [assets, setAssets] = useState<Asset[]>([]);
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
            toast.error("Failed to load assets");
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

            setAssets([newAsset, ...assets]);
            toast.success("Asset uploaded successfully");
        } catch (error: any) {
            console.error(error);
            toast.error("Upload failed: " + error.message);
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
            setAssets(assets.filter(a => a.id !== asset.id));
            toast.success("Asset deleted");
        } catch (error: any) {
            console.error(error);
            toast.error("Delete failed: " + error.message);
        }
    };

    const handleDragStart = (e: React.DragEvent, asset: Asset) => {
        e.dataTransfer.setData('text/plain', asset.url);
        e.dataTransfer.setData('application/json', JSON.stringify(asset));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div className="flex flex-col h-full bg-background border-l">
            <div className="p-4 border-b flex items-center justify-between">
                <div>
                    <h3 className="font-semibold mb-1">Assets</h3>
                    <p className="text-xs text-muted-foreground">Drag to chat</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleUpload}
                    accept="image/*,video/*,.ttf,.otf,.woff,.woff2"
                />
            </div>

            <ScrollArea className="flex-1 p-4">
                {loading ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : assets.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No assets yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        {assets.map((asset) => (
                            <Card
                                key={asset.id}
                                className="overflow-hidden group relative aspect-square cursor-grab active:cursor-grabbing"
                                draggable
                                onDragStart={(e) => handleDragStart(e, asset)}
                            >
                                {asset.type === 'image' ? (
                                    <div className="relative w-full h-full">
                                        <Image
                                            src={asset.url}
                                            alt={asset.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-muted">
                                        {asset.type === 'video' ? <FileVideo className="h-8 w-8 text-muted-foreground" /> : <Type className="h-8 w-8 text-muted-foreground" />}
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        className="h-8 w-8"
                                        onClick={() => handleDelete(asset)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/40 p-1">
                                    <p className="text-[10px] text-white truncate text-center">{asset.name}</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
