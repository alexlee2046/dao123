import React, { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Smartphone, Monitor, RefreshCw, ExternalLink } from "lucide-react";
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
import { BuilderCanvas } from "@/components/studio/builder/BuilderCanvas";

export function LivePreview() {
    const { htmlContent, isMobileView, toggleViewMode, pages, currentPage, setCurrentPage, isBuilderMode } = useStudioStore();
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.data && e.data.type === 'navigate') {
                const href = e.data.path;
                const normalizedPath = href.replace(/^\//, '');

                let targetPage = pages.find(p => p.path === normalizedPath || p.path === href);

                if (!targetPage) {
                    const withHtml = normalizedPath.endsWith('.html') ? normalizedPath : `${normalizedPath}.html`;
                    targetPage = pages.find(p => p.path === withHtml);
                }

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

    const { setCaptureScreenshotHandler } = useStudioStore();

    useEffect(() => {
        setCaptureScreenshotHandler(async () => {
            if (!iframeRef.current?.contentDocument?.body) return null;
            try {
                const html2canvas = (await import('html2canvas')).default;
                const canvas = await html2canvas(iframeRef.current.contentDocument.body, {
                    useCORS: true,
                    logging: false,
                    width: 1280,
                    windowWidth: 1280,
                    height: 720,
                    windowHeight: 720,
                    scale: 0.5
                } as any);
                return canvas.toDataURL('image/jpeg', 0.7);
            } catch (error) {
                console.error("Screenshot capture failed:", error);
                return null;
            }
        });
    }, [setCaptureScreenshotHandler]);

    useEffect(() => {
        if (iframeRef.current && !isBuilderMode) {
            const script = `
                <script>
                    document.addEventListener('click', (e) => {
                        const link = e.target.closest('a');
                        if (!link) return;

                        const href = link.getAttribute('href');
                        const target = link.getAttribute('target');
                        
                        if (target === '_blank') return;
                        if (!href) return;
                        if (href.startsWith('http')) return; 
                        if (href.startsWith('#')) return; 
                        
                        e.preventDefault();
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
    }, [htmlContent, isBuilderMode]);

    const handleRefresh = () => {
        if (iframeRef.current) {
            iframeRef.current.srcdoc = iframeRef.current.srcdoc;
        }
    };

    return (
        <div className="flex flex-col h-full bg-muted/30 relative">
            {/* Preview Toolbar */}
            <div className="h-10 border-b border-border/50 bg-background/50 flex items-center justify-between gap-2 px-4 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    {pages.length > 1 && (
                        <Select value={currentPage} onValueChange={setCurrentPage}>
                            <SelectTrigger className="h-7 w-[180px] text-xs bg-background/50 border-border/50 focus:ring-0">
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

                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5 border border-border/50">
                    <Button
                        variant={!isMobileView ? "secondary" : "ghost"}
                        size="icon"
                        className="h-7 w-7 rounded-md"
                        onClick={() => isMobileView && toggleViewMode()}
                        title="桌面视图"
                    >
                        <Monitor className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant={isMobileView ? "secondary" : "ghost"}
                        size="icon"
                        className="h-7 w-7 rounded-md"
                        onClick={() => !isMobileView && toggleViewMode()}
                        title="移动视图"
                    >
                        <Smartphone className="h-3.5 w-3.5" />
                    </Button>
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={handleRefresh}
                        title="刷新预览"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Preview Canvas */}
            <div className="flex-1 p-8 flex items-center justify-center overflow-hidden bg-dot-pattern bg-zinc-50/50 dark:bg-zinc-950/50 relative">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-50"></div>

                <div
                    className={cn(
                        "bg-white shadow-2xl transition-all duration-500 ease-in-out relative z-10 overflow-hidden",
                        isMobileView
                            ? "w-[375px] h-[667px] rounded-[40px] border-[8px] border-zinc-800 ring-1 ring-black/5"
                            : "w-full h-full rounded-lg border border-border/50 ring-1 ring-black/5"
                    )}
                >
                    {isMobileView && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-800 rounded-b-xl z-20"></div>
                    )}

                    {isBuilderMode ? (
                        <div className={cn("w-full h-full bg-white overflow-y-auto", isMobileView ? "rounded-[32px]" : "rounded-lg")}>
                            <BuilderCanvas />
                        </div>
                    ) : (
                        <iframe
                            ref={iframeRef}
                            className={cn("w-full h-full border-0 bg-white", isMobileView ? "rounded-[32px]" : "rounded-lg")}
                            title="Preview"
                            sandbox="allow-scripts allow-same-origin allow-forms"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
