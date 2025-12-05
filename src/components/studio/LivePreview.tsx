import React, { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Smartphone, Monitor, Tablet, RefreshCw, ExternalLink } from "lucide-react";
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
    const t = useTranslations('preview');
    const { htmlContent, previewDevice, setPreviewDevice, pages, currentPage, setCurrentPage, isBuilderMode } = useStudioStore();
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
                    toast.error(t('pageNotFound', { href }));
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [pages, setCurrentPage, t]);

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
            // 注入脚本拦截所有链接点击，防止 iframe 嵌套问题
            const script = `
                <script>
                    // 拦截所有链接点击
                    document.addEventListener('click', (e) => {
                        const link = e.target.closest('a');
                        if (!link) return;

                        const href = link.getAttribute('href');
                        const target = link.getAttribute('target');
                        
                        // 如果是 _blank 新标签页，阻止默认行为（防止嵌套）
                        if (target === '_blank') {
                            e.preventDefault();
                            // 可选：在新标签页打开
                            // window.open(href, '_blank');
                            return;
                        }
                        
                        if (!href) return;
                        
                        // 锚点链接，保持默认行为
                        if (href.startsWith('#')) return;
                        
                        // 阻止所有链接的默认行为
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // 检查是否是外部完整 URL
                        if (href.startsWith('http://') || href.startsWith('https://')) {
                            // 外部链接：显示提示或忽略
                            console.log('外部链接被拦截:', href);
                            return;
                        }
                        
                        // 内部链接：发送消息给父窗口处理页面切换
                        window.parent.postMessage({ type: 'navigate', path: href }, '*');
                    }, true);
                    
                    // 防止表单提交导致导航
                    document.addEventListener('submit', (e) => {
                        e.preventDefault();
                        console.log('表单提交被拦截');
                    }, true);
                </script>
                <base target="_self">
            `;

            const contentToInject = htmlContent || '';

            // 在 head 末尾添加 base 标签，在 body 末尾添加脚本
            let finalContent = contentToInject;

            // 注入脚本
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

    return (
        <div className="flex flex-col h-full bg-muted/30 relative">
            {/* Preview Toolbar */}
            <div className="h-10 border-b border-border/50 bg-background/50 flex items-center justify-between gap-2 px-4 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    {pages.length > 1 && (
                        <Select value={currentPage} onValueChange={setCurrentPage}>
                            <SelectTrigger className="h-7 w-[180px] text-xs bg-background/50 border-border/50 focus:ring-0">
                                <SelectValue placeholder={t('selectPage')} />
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
                        variant={previewDevice === 'desktop' ? "secondary" : "ghost"}
                        size="icon"
                        className="h-7 w-7 rounded-md"
                        onClick={() => setPreviewDevice('desktop')}
                        title={t('desktopView')}
                    >
                        <Monitor className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant={previewDevice === 'tablet' ? "secondary" : "ghost"}
                        size="icon"
                        className="h-7 w-7 rounded-md"
                        onClick={() => setPreviewDevice('tablet')}
                        title="Tablet"
                    >
                        <Tablet className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant={previewDevice === 'mobile' ? "secondary" : "ghost"}
                        size="icon"
                        className="h-7 w-7 rounded-md"
                        onClick={() => setPreviewDevice('mobile')}
                        title={t('mobileView')}
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
                        title={t('refresh')}
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Preview Canvas */}
            <div className="flex-1 overflow-auto bg-dot-pattern bg-zinc-50/50 dark:bg-zinc-950/50 relative">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-50 fixed"></div>

                <div className="min-h-full flex items-center justify-center p-4">
                    <div
                        className={cn(
                            "bg-white shadow-2xl transition-all duration-500 ease-in-out relative z-10 overflow-hidden shrink-0",
                            previewDevice === 'mobile'
                                ? "w-[375px] h-[667px] rounded-[40px] border-[8px] border-zinc-800 ring-1 ring-black/5"
                                : previewDevice === 'tablet'
                                    ? "w-[768px] h-[1024px] rounded-[20px] border-[8px] border-zinc-800 ring-1 ring-black/5"
                                    : cn(
                                        "w-full rounded-lg border border-border/50 ring-1 ring-black/5 h-[calc(100vh-136px)]"
                                    )
                        )}
                    >
                        {previewDevice === 'mobile' && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-800 rounded-b-xl z-20"></div>
                        )}

                        {isBuilderMode ? (
                            <div className={cn(
                                "w-full bg-white",
                                previewDevice !== 'desktop'
                                    ? "h-full overflow-y-auto rounded-[32px]"
                                    : "h-[calc(100vh-136px)] overflow-y-auto rounded-lg"
                            )}>
                            <BuilderCanvas />
                            </div>
                        ) : (
                            <iframe
                                ref={iframeRef}
                                className={cn("w-full h-full border-0 bg-white", previewDevice === 'mobile' ? "rounded-[32px]" : "rounded-lg")}
                                title="Preview"
                                sandbox="allow-scripts allow-same-origin allow-forms"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
