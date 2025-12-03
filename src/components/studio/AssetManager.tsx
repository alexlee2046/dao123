import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { useStudioStore } from "@/lib/store";

export function AssetManager() {
    const { assets, addAsset } = useStudioStore();
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        // Mock upload - in real app, this would upload to Supabase Storage
        const files = Array.from(e.dataTransfer.files);
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    addAsset({
                        id: Date.now().toString(),
                        name: file.name,
                        url: e.target?.result as string,
                        type: 'image'
                    });
                };
                reader.readAsDataURL(file);
            }
        });
    };

    return (
        <div className="flex flex-col h-full bg-background border-l">
            <div className="p-4 border-b">
                <h3 className="font-semibold mb-1">Assets</h3>
                <p className="text-xs text-muted-foreground">Drag & drop images here</p>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div
                    className={`border-2 border-dashed rounded-lg p-4 mb-4 text-center transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
                        }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="flex flex-col items-center gap-2 py-4">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <Upload className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">Upload Assets</p>
                        <p className="text-xs text-muted-foreground">Support JPG, PNG, SVG</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {assets.map((asset) => (
                        <Card key={asset.id} className="overflow-hidden group relative aspect-square">
                            <img
                                src={asset.url}
                                alt={asset.name}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button size="icon" variant="secondary" className="h-8 w-8">
                                    <ImageIcon className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="destructive" className="h-8 w-8">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
