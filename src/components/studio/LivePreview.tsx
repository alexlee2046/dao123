import React, { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Smartphone, Monitor, Tablet } from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function LivePreview() {
    const { htmlContent, isMobileView, toggleViewMode } = useStudioStore();
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (iframeRef.current) {
            iframeRef.current.srcdoc = htmlContent;
        }
    }, [htmlContent]);

    return (
        <div className="flex flex-col h-full bg-muted/50">
            {/* Preview Toolbar */}
            <div className="h-10 border-b bg-background/50 flex items-center justify-center gap-2 px-4 backdrop-blur-sm">
                <Button
                    variant={!isMobileView ? "secondary" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => isMobileView && toggleViewMode()}
                >
                    <Monitor className="h-4 w-4" />
                </Button>
                <Button
                    variant={isMobileView ? "secondary" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => !isMobileView && toggleViewMode()}
                >
                    <Smartphone className="h-4 w-4" />
                </Button>
            </div>

            {/* Preview Canvas */}
            <div className="flex-1 p-8 flex items-center justify-center overflow-hidden bg-zinc-100/50">
                <div
                    className={cn(
                        "bg-white shadow-lg border overflow-hidden relative transition-all duration-500 ease-in-out",
                        isMobileView ? "w-[375px] h-[667px] rounded-[30px] border-8 border-zinc-800" : "w-full h-full rounded-lg"
                    )}
                >
                    <iframe
                        ref={iframeRef}
                        className="w-full h-full border-0"
                        title="Preview"
                        sandbox="allow-scripts"
                    />
                </div>
            </div>
        </div>
    );
}
