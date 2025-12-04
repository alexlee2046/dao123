import React, { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Smartphone, Monitor } from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export function LivePreview() {
    const { htmlContent, isMobileView, toggleViewMode, pages, currentPage, setCurrentPage } = useStudioStore();
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.data && e.data.type === 'navigate') {
                const href = e.data.path;
                // Normalize path: remove leading slash
                const normalizedPath = href.replace(/^\//, '');
                
                // 1. Try exact match
                let targetPage = pages.find(p => p.path === normalizedPath || p.path === href);
                
                // 2. Try without extension (e.g. 'about' -> 'about.html')
                if (!targetPage) {
                    const withHtml = normalizedPath.endsWith('.html') ? normalizedPath : `${normalizedPath}.html`;
                    targetPage = pages.find(p => p.path === withHtml);
                }

                // 3. Try matching basename
                if (!targetPage) {
                     targetPage = pages.find(p => p.path.replace(/\.html$/, '') === normalizedPath.replace(/\.html$/, ''));
                }

                if (targetPage) {
                    setCurrentPage(targetPage.path);
                } else {
                    toast.error(`页面未找到: ${href}`);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [pages, setCurrentPage]);

    useEffect(() => {
        if (iframeRef.current) {
            const script = `
                <script>
                    document.addEventListener('click', (e) => {
                        const link = e.target.closest('a');
                        if (!link) return;

                        const href = link.getAttribute('href');
                        const target = link.getAttribute('target');
                        
                        // Allow external links and hash links
                        if (target === '_blank') return;
                        if (!href) return;
                        if (href.startsWith('http')) return; 
                        if (href.startsWith('#')) return; 
                        
                        e.preventDefault();
                        
                        // Send navigation request to parent
                        window.parent.postMessage({ type: 'navigate', path: href }, '*');
                    }, true);
                </script>
            `;

            const contentToInject = htmlContent || '';
            if (contentToInject.includes('</body>')) {
                iframeRef.current.srcdoc = contentToInject.replace('</body>', `${script}</body>`);
            } else {
                iframeRef.current.srcdoc = contentToInject + script;
            }
        }
    }, [htmlContent]);

    return (
        <div className="flex flex-col h-full bg-muted/50">
            {/* Preview Toolbar */}
            <div className="h-10 border-b bg-background/50 flex items-center justify-between gap-2 px-4 backdrop-blur-sm">
                 <div className="flex items-center gap-2">
                    {pages.length > 1 && (
                        <Select value={currentPage} onValueChange={setCurrentPage}>
                            <SelectTrigger className="h-7 w-[180px] text-xs bg-background/50">
                                <SelectValue placeholder="选择页面" />
                            </SelectTrigger>
                            <SelectContent>
                                {pages.map((page) => (
                                    <SelectItem key={page.path} value={page.path} className="text-xs">
                                        {page.path}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                 </div>

                <div className="flex items-center gap-1">
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
                        sandbox="allow-scripts allow-same-origin allow-forms"
                    />
                </div>
            </div>
        </div>
    );
}
