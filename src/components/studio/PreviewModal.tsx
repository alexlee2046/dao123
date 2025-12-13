"use client";

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Eye, X, Monitor, Tablet, Smartphone } from "lucide-react";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface PreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    htmlContent: string;
    cssContent: string;
}

type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

const deviceWidths: Record<PreviewDevice, string> = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
};

export const PreviewModal: React.FC<PreviewModalProps> = ({
    open,
    onOpenChange,
    htmlContent,
    cssContent
}) => {
    const t = useTranslations('studio');
    const [device, setDevice] = useState<PreviewDevice>('desktop');

    const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: "Inter", system-ui, sans-serif; line-height: 1.5; }
                ${cssContent}
            </style>
        </head>
        <body>
            ${htmlContent}
        </body>
        </html>
    `;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-full w-full h-screen max-h-screen p-0 gap-0 border-0 rounded-none">
                {/* Preview Toolbar */}
                <div className="h-14 border-b flex items-center justify-between px-4 bg-background">
                    <div className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-primary" />
                        <span className="font-semibold">{t('previewMode') || 'Preview Mode'}</span>
                    </div>

                    {/* Device Switcher */}
                    <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-full">
                        <Button
                            variant={device === 'desktop' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full"
                            onClick={() => setDevice('desktop')}
                            title="Desktop"
                        >
                            <Monitor className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={device === 'tablet' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full"
                            onClick={() => setDevice('tablet')}
                            title="Tablet"
                        >
                            <Tablet className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={device === 'mobile' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full"
                            onClick={() => setDevice('mobile')}
                            title="Mobile"
                        >
                            <Smartphone className="w-4 h-4" />
                        </Button>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="gap-2"
                    >
                        <X className="w-4 h-4" />
                        Close
                    </Button>
                </div>

                {/* Preview Content */}
                <div className="flex-1 flex justify-center items-start overflow-auto bg-muted/30 p-4">
                    <div
                        className={cn(
                            "bg-white shadow-2xl transition-all duration-300 overflow-hidden",
                            device !== 'desktop' && "rounded-lg border"
                        )}
                        style={{
                            width: deviceWidths[device],
                            maxWidth: '100%',
                            height: device === 'desktop' ? 'calc(100vh - 80px)' : 'calc(100vh - 100px)',
                        }}
                    >
                        <iframe
                            srcDoc={fullHtml}
                            className="w-full h-full border-0"
                            title="Preview"
                            sandbox="allow-scripts"
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PreviewModal;
