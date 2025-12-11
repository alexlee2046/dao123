import React, { useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { RefreshCw, ExternalLink } from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import dynamic from 'next/dynamic';
import { toast } from "sonner";
import { IFRAME_SCRIPT } from "@/lib/studio/iframe-script";

// Dynamic import for GrapesEditor (client-side only)
const GrapesEditor = dynamic(
    () => import('@/components/studio/grapes/GrapesEditor').then(mod => mod.GrapesEditor),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-gray-500 font-medium">加载编辑器...</p>
                </div>
            </div>
        )
    }
);

export function LivePreview() {
    const t = useTranslations('preview');
    const { htmlContent, previewDevice, pages, currentPage, setCurrentPage, isBuilderMode, setPages, setHtmlContent } = useStudioStore();
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Handle HTML change from GrapesEditor
    const handleGrapesHtmlChange = useCallback((html: string, css: string) => {
        console.log('[LivePreview] GrapesEditor content changed, length:', html.length);
        // Combine HTML with CSS for storage
        // Wrap in full document structure if needed
        const fullHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>${css}</style>
</head>
<body class="min-h-screen bg-white">
${html}
</body>
</html>`;
        setHtmlContent(fullHtml);
    }, [setHtmlContent]);

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
                    const skeleton = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <!-- Hero Section -->
    <div class="relative overflow-hidden bg-white">
        <div class="max-w-7xl mx-auto">
            <div class="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
                <main class="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                    <div class="sm:text-center lg:text-left">
                        <h1 class="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                            <span class="block xl:inline">Draft: ${newPath}</span>
                            <span class="block text-indigo-600">Start building today</span>
                        </h1>
                        <p class="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                            This page was automatically created. Use the AI assistant or drag-and-drop builder to bring your vision to life.
                        </p>
                        <div class="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                            <div class="rounded-md shadow">
                                <a href="#" class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg">
                                    Get Started
                                </a>
                            </div>
                            <div class="mt-3 sm:mt-0 sm:ml-3">
                                <a href="#" class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg">
                                    Learn More
                                </a>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
        <div class="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 bg-gray-50 flex items-center justify-center">
            <svg class="h-56 w-56 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        </div>
    </div>
</body>
</html>`;

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

    // Inject scripts into iframe (preview mode only)
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

    const isDesktop = previewDevice !== 'mobile' && previewDevice !== 'tablet';

    return (
        <div className="flex flex-col h-full bg-muted/30 relative group">
            {/* Floating Actions - only show in preview mode */}
            {!isBuilderMode && (
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
            )}

            {/* Main Preview Area */}
            <div className={cn(
                "flex-1 relative w-full",
                isBuilderMode ? "overflow-hidden" : "overflow-auto"
            )}>
                <div className={cn(
                    "w-full flex items-start justify-center transition-all duration-300",
                    // In builder mode, we want full width. In AI mode, use padding if not desktop.
                    isBuilderMode
                        ? "h-full p-0"
                        : (previewDevice === 'desktop' ? "p-0 min-h-full" : "p-8")
                )}>
                    <div
                        className={cn(
                            "bg-white transition-all duration-300 flex flex-col relative",
                            // Only apply device frames in AI mode
                            !isBuilderMode && previewDevice === 'mobile' && "w-[375px] h-[667px] rounded-[2rem] border-[8px] border-gray-800 shrink-0 shadow-2xl",
                            !isBuilderMode && previewDevice === 'tablet' && "w-[768px] h-[1024px] rounded-[1.5rem] border-[8px] border-gray-800 shrink-0 shadow-2xl",
                            (!isBuilderMode && previewDevice === 'desktop') || isBuilderMode ? "w-full h-full rounded-none border-0 shadow-none" : ""
                        )}
                        style={(!isBuilderMode && previewDevice === 'desktop') ? { minHeight: '100%' } : undefined}
                    >
                        {/* Inner Scroll Container */}
                        <div className={cn(
                            "flex-1 w-full bg-white rounded-[inherit]",
                            previewDevice !== 'desktop' && "h-full overflow-y-auto overflow-x-hidden",
                            isBuilderMode && "flex flex-col"
                        )}>
                            {isBuilderMode ? (
                                <div className="flex-1 w-full h-full relative">
                                    <GrapesEditor
                                        htmlContent={htmlContent || ''}
                                        onHtmlChange={handleGrapesHtmlChange}
                                        previewDevice={previewDevice}
                                    />
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

