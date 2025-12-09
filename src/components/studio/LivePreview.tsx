import React, { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { RefreshCw, ExternalLink } from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { BuilderCanvas } from "@/components/studio/builder/BuilderCanvas";
import { toast } from "sonner";
import { IFRAME_SCRIPT } from "@/lib/studio/iframe-script";

export function LivePreview() {
    const t = useTranslations('preview');
    const { htmlContent, previewDevice, pages, currentPage, setCurrentPage, isBuilderMode, setPages } = useStudioStore();
    const iframeRef = useRef<HTMLIFrameElement>(null);



    // ... (inside component)

    // Handle iframe navigation messages
    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.data && e.data.type === 'navigate') {
                const href = e.data.path;
                const normalize = (p: string) => p.replace(/^\//, '').replace(/^\.\//, '');
                const normalizedPath = normalize(href);

                // Try exact match first, then with .html
                let targetPage = pages.find(p => normalize(p.path) === normalizedPath || p.path === href);

                if (!targetPage) {
                    const withHtml = normalizedPath.endsWith('.html') ? normalizedPath : `${normalizedPath}.html`;
                    targetPage = pages.find(p => normalize(p.path) === withHtml);
                }

                if (targetPage) {
                    setCurrentPage(targetPage.path);
                    toast.success(`Switched to: ${targetPage.path}`);
                } else {
                    // Auto-create page if linked internally but missing
                    const newPath = normalizedPath.endsWith('.html') ? normalizedPath : `${normalizedPath}.html`;
                    const skeleton = `<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body class="bg-white min-h-screen p-8 flex items-center justify-center">\n    <div class="text-center">\n        <h1 class="text-2xl font-bold mb-2">${newPath}</h1>\n        <p class="text-gray-500">Page created automatically. Use AI to generate content.</p>\n    </div>\n</body>\n</html>`;

                    const updatedPages = [...pages, { path: newPath, content: skeleton }];
                    setPages(updatedPages);
                    setCurrentPage(newPath);
                    toast.success(`Created page: ${newPath}`);
                }
            } else if (e.data && e.data.type === 'notify') {
                if (e.data.kind === 'external') {
                    const href = e.data.href || '';
                    toast.info(t('externalLinkBlocked', { href: href.substring(0, 30) + '...' }));
                } else if (e.data.kind === 'form') {
                    toast.info(t('formSubmitBlocked'));
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [pages, setCurrentPage, t, setPages]);

    // ... (screenshot logic remains)

    // Inject scripts into iframe
    useEffect(() => {
        if (iframeRef.current && !isBuilderMode) {
            const contentToInject = htmlContent || '';
            let finalContent = contentToInject;

            // Append script before body end or at the end
            if (finalContent.includes('</body>')) {
                finalContent = finalContent.replace('</body>', `${IFRAME_SCRIPT}</body>`);
            } else {
                finalContent = finalContent + IFRAME_SCRIPT;
            }
            iframeRef.current.srcdoc = finalContent;
        }
    }, [htmlContent, isBuilderMode]);

    const handleRefresh = () => {
        if (iframeRef.current) {
            iframeRef.current.srcdoc = iframeRef.current.srcdoc;
        }
    };

    // Determine device dimensions
    const getDeviceStyle = () => {
        switch (previewDevice) {
            case 'mobile':
                return { width: '375px', height: '667px' };
            case 'tablet':
                return { width: '768px', height: '1024px' };
            default:
                return { width: '100%', height: '100%' };
        }
    };

    const isDesktop = previewDevice !== 'mobile' && previewDevice !== 'tablet';

    return (
        <div className="flex flex-col h-full bg-muted/30 relative group">
            {/* Floating Actions */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-background/50 backdrop-blur-sm p-1 rounded-lg border border-border/20 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md hover:bg-background"
                    onClick={handleRefresh}
                    title={t('refresh')}
                >
                    <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md hover:bg-background"
                    asChild
                    title={t('openNewWindow')}
                >
                    <a href={`/preview/${htmlContent ? 'custom' : 'demo'}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                </Button>
            </div>

            {/* Main Preview Area */}
            <div className={cn(
                "flex-1 relative w-full overflow-auto"
            )}>
                <div className={cn(
                    "w-full flex items-start justify-center transition-all duration-300",
                    previewDevice === 'desktop' ? "p-0 min-h-full" : "p-8"
                )}>
                    <div
                        className={cn(
                            "bg-white shadow-2xl transition-all duration-300 flex flex-col relative",
                            previewDevice === 'mobile' ? "w-[375px] h-[667px] rounded-[2rem] border-[8px] border-gray-800 shrink-0" :
                                previewDevice === 'tablet' ? "w-[768px] h-[1024px] rounded-[1.5rem] border-[8px] border-gray-800 shrink-0" :
                                    "w-full rounded-none border-0"
                        )}
                        style={previewDevice === 'desktop' ? { minHeight: '100%' } : undefined}
                    >
                        {/* Inner Scroll Container */}
                        <div className={cn(
                            "flex-1 w-full bg-white rounded-[inherit]",
                            previewDevice !== 'desktop' && "h-full overflow-y-auto overflow-x-hidden"
                        )}>
                            {isBuilderMode ? (
                                <div className="min-h-full">
                                    <BuilderCanvas />
                                </div>
                            ) : (
                                <iframe
                                    ref={iframeRef}
                                    className="w-full border-0 bg-white block"
                                    style={{ minHeight: previewDevice === 'desktop' ? 'calc(100vh - 56px)' : '100%', height: previewDevice !== 'desktop' ? '100%' : 'auto' }}
                                    sandbox="allow-scripts allow-same-origin allow-forms"
                                    title="Preview"
                                    src="about:blank"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
