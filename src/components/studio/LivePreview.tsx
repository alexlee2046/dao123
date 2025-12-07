import React, { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { RefreshCw, ExternalLink } from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { BuilderCanvas } from "@/components/studio/builder/BuilderCanvas";
import { toast } from "sonner";

export function LivePreview() {
    const t = useTranslations('preview');
    const { htmlContent, previewDevice, pages, currentPage, setCurrentPage, isBuilderMode, setPages } = useStudioStore();
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Handle iframe navigation messages
    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.data && e.data.type === 'navigate') {
                const href = e.data.path;
                const normalizedPath = href.replace(/^\//, '').replace(/^\.\//, '');
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
                    const newPath = normalizedPath.endsWith('.html') ? normalizedPath : `${normalizedPath}.html`;
                    const skeleton = `<!DOCTYPE html>\n<html>\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <script src=\"https://cdn.tailwindcss.com\"></script>\n</head>\n<body class=\"bg-white min-h-screen p-8\">\n    <div class=\"max-w-3xl mx-auto\">\n        <h1 class=\"text-2xl font-bold mb-2\">${newPath}</h1>\n        <p class=\"text-sm text-muted-foreground\">该页面尚未生成，使用左侧聊天让 AI 生成内容。</p>\n    </div>\n</body>\n</html>`;
                    const updatedPages = [...pages, { path: newPath, content: skeleton }];
                    setPages(updatedPages);
                    setCurrentPage(newPath);
                    toast.success(`已创建页面: ${newPath}`);
                }
            } else if (e.data && e.data.type === 'notify') {
                if (e.data.kind === 'external') {
                    const href = e.data.href || '';
                    toast.info(t('externalLinkBlocked', { href }));
                } else if (e.data.kind === 'form') {
                    toast.info(t('formSubmitBlocked'));
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [pages, setCurrentPage, t]);

    // Handle screenshot capture
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

    // Inject scripts into iframe
    useEffect(() => {
        if (iframeRef.current && !isBuilderMode) {
            const script = `
                <script>
                    (function(){
                        const intercept = (url) => {
                            if (!url) return;
                            const href = typeof url === 'string' ? url : String(url);
                            if (href.startsWith('#')) return;
                            if (href.startsWith('http://') || href.startsWith('https://')) {
                                window.parent.postMessage({ type: 'notify', kind: 'external', href }, '*');
                                return;
                            }
                            window.parent.postMessage({ type: 'navigate', path: href }, '*');
                        };

                        document.addEventListener('click', (e) => {
                            const link = e.target.closest('a');
                            if (!link) return;
                            const href = link.getAttribute('href');
                            const target = link.getAttribute('target');
                            if (target === '_blank') {
                                e.preventDefault();
                                window.parent.postMessage({ type: 'notify', kind: 'external', href }, '*');
                                return;
                            }
                            if (!href) return;
                            if (href.startsWith('#')) return;
                            e.preventDefault();
                            e.stopPropagation();
                            intercept(href);
                        }, true);

                        document.addEventListener('submit', (e) => {
                            e.preventDefault();
                            window.parent.postMessage({ type: 'notify', kind: 'form' }, '*');
                        }, true);

                        const origPush = history.pushState.bind(history);
                        history.pushState = function(state, title, url) { if (url) intercept(url); };
                        const origReplace = history.replaceState.bind(history);
                        history.replaceState = function(state, title, url) { if (url) intercept(url); };
                        const origOpen = window.open;
                        window.open = function(url, target) { if (url) intercept(url); return null; };
                        const origAssign = window.location.assign.bind(window.location);
                        window.location.assign = function(url) { if (url) intercept(url); };
                        const origLocReplace = window.location.replace.bind(window.location);
                        window.location.replace = function(url) { if (url) intercept(url); };
                    })();
                </script>
                <base target="_self">
            `;

            const contentToInject = htmlContent || '';
            let finalContent = contentToInject;
            if (finalContent.includes('</body>')) {
                finalContent = finalContent.replace('</body>', `${script}</body>`);
            } else {
                finalContent = finalContent + script;
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
