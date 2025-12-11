import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useStudioStore } from "@/lib/store";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function ImportCodeModal({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [code, setCode] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const { setHtmlContent } = useStudioStore();

    const handleImport = async () => {
        if (!code.trim()) return;

        try {
            setIsProcessing(true);
            let htmlToProcess = code;

            // Check if input is a URL (simple check)
            const isUrl = /^(http|https):\/\/[^ "]+$/.test(code.trim());

            if (isUrl) {
                toast.info("Recognizing web page content...");
                const response = await fetch('/api/recognize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: code.trim() })
                });

                if (response.ok) {
                    const { data } = await response.json();
                    if (data && data.content) {
                        htmlToProcess = data.content;
                        toast.success(`Extracted content: ${data.title}`);
                    }
                } else {
                    console.warn("Recognition failed, using URL as is");
                    toast.error("Could not fetch URL content. Please paste HTML directly.");
                    setIsProcessing(false);
                    return;
                }
            }

            // Directly update HTML content for GrapesJS
            setHtmlContent(htmlToProcess);

            toast.success("Content imported successfully!");
            setIsOpen(false);
            setCode('');

        } catch (error: any) {
            console.error('Import error:', error);
            toast.error("Failed to import content");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Import HTML or Web Page</DialogTitle>
                    <DialogDescription>
                        Paste HTML code or a URL below. We will attempt to recognize and extract the content.
                        Note: This will replace your current page content.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <Textarea
                        placeholder="<div class='...'>...</div> or https://example.com/article"
                        className="min-h-[300px] font-mono text-xs"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleImport} disabled={!code.trim() || isProcessing}>
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Import
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
