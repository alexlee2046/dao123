"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Code, FileCode, Copy, Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface CodeEditorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    htmlContent: string;
    cssContent: string;
    onApply: (html: string, css: string) => void;
}

export const CodeEditorModal: React.FC<CodeEditorModalProps> = ({
    open,
    onOpenChange,
    htmlContent,
    cssContent,
    onApply
}) => {
    const t = useTranslations('studio');
    const [html, setHtml] = useState(htmlContent);
    const [css, setCss] = useState(cssContent);
    const [copiedHtml, setCopiedHtml] = useState(false);
    const [copiedCss, setCopiedCss] = useState(false);

    // Sync with external content when modal opens
    useEffect(() => {
        if (open) {
            setHtml(htmlContent);
            setCss(cssContent);
        }
    }, [open, htmlContent, cssContent]);

    const handleCopy = useCallback(async (type: 'html' | 'css') => {
        const content = type === 'html' ? html : css;
        await navigator.clipboard.writeText(content);

        if (type === 'html') {
            setCopiedHtml(true);
            setTimeout(() => setCopiedHtml(false), 2000);
        } else {
            setCopiedCss(true);
            setTimeout(() => setCopiedCss(false), 2000);
        }

        toast.success(t('linkCopied') || 'Copied to clipboard');
    }, [html, css, t]);

    const handleReset = useCallback(() => {
        setHtml(htmlContent);
        setCss(cssContent);
        toast.info('Reset to original content');
    }, [htmlContent, cssContent]);

    const handleApply = useCallback(() => {
        onApply(html, css);
        onOpenChange(false);
        toast.success(t('saved') || 'Changes applied');
    }, [html, css, onApply, onOpenChange, t]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <Code className="w-5 h-5" />
                        {t('codeEditor') || 'Code Editor'}
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="html" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 pt-2">
                        <TabsList className="grid w-full grid-cols-2 max-w-xs">
                            <TabsTrigger value="html" className="gap-2">
                                <FileCode className="w-4 h-4" />
                                HTML
                            </TabsTrigger>
                            <TabsTrigger value="css" className="gap-2">
                                <Code className="w-4 h-4" />
                                CSS
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="html" className="flex-1 flex flex-col p-6 pt-4 overflow-hidden mt-0">
                        <div className="flex justify-end gap-2 mb-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy('html')}
                                className="gap-1.5"
                            >
                                {copiedHtml ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copiedHtml ? 'Copied' : 'Copy'}
                            </Button>
                        </div>
                        <Textarea
                            value={html}
                            onChange={(e) => setHtml(e.target.value)}
                            className="flex-1 font-mono text-sm resize-none"
                            placeholder="<!-- HTML content -->"
                        />
                    </TabsContent>

                    <TabsContent value="css" className="flex-1 flex flex-col p-6 pt-4 overflow-hidden mt-0">
                        <div className="flex justify-end gap-2 mb-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy('css')}
                                className="gap-1.5"
                            >
                                {copiedCss ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copiedCss ? 'Copied' : 'Copy'}
                            </Button>
                        </div>
                        <Textarea
                            value={css}
                            onChange={(e) => setCss(e.target.value)}
                            className="flex-1 font-mono text-sm resize-none"
                            placeholder="/* CSS styles */"
                        />
                    </TabsContent>
                </Tabs>

                <DialogFooter className="px-6 py-4 border-t">
                    <Button variant="outline" onClick={handleReset} className="gap-1.5">
                        <RotateCcw className="w-4 h-4" />
                        Reset
                    </Button>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {t('cancel') || 'Cancel'}
                    </Button>
                    <Button onClick={handleApply}>
                        {t('save') || 'Apply Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CodeEditorModal;
