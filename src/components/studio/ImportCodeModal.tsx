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
import { htmlToCraftData } from '@/lib/builder/htmlInfoCraft';

export function ImportCodeModal({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [code, setCode] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const { setBuilderData, isBuilderMode, toggleBuilderMode } = useStudioStore();

    const handleImport = async () => {
        if (!code.trim()) return;

        try {
            setIsProcessing(true);
            
            // Convert HTML to Craft Data
            const craftJson = htmlToCraftData(code);
            
            // Update Store
            setBuilderData(craftJson);
            
            // Switch to Builder Mode if not active
            if (!isBuilderMode) {
                toggleBuilderMode();
            }
            
            toast.success("Code imported successfully");
            setIsOpen(false);
            setCode('');
        } catch (error) {
            console.error("Import failed:", error);
            toast.error("Failed to import code");
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
                    <DialogTitle>Import HTML Code</DialogTitle>
                    <DialogDescription>
                        Paste your HTML code below. It will be converted to editable blocks.
                        Note: This will replace your current page content.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                    <Textarea 
                        placeholder="<div class='p-4 bg-blue-500'>...</div>" 
                        className="min-h-[300px] font-mono text-xs"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />
                </div>
                
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleImport} disabled={!code.trim() || isProcessing}>
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Import Code
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
