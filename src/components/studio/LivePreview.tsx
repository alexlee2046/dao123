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
            {/* Top Bar removed - merged into Toolbar */}
            
            <div className="flex-1 relative overflow-hidden">
                {/* Floating Actions */}
                <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-background/50 backdrop-blur-sm p-1 rounded-lg border border-border/20 shadow-sm opacity-0 hover:opacity-100 transition-opacity duration-200">
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
                        title={t('openInNewTab')}
                    >
                        <a href={`/preview/${htmlContent ? 'custom' : 'demo'}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                    </Button>
                </div>

                <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div 
                        className={cn(
                            "bg-white shadow-2xl transition-all duration-300 overflow-hidden flex flex-col",
                            previewDevice === 'mobile' ? "w-[375px] h-[667px] rounded-[2rem] border-8 border-gray-800" : 
                            previewDevice === 'tablet' ? "w-[768px] h-[1024px] rounded-[1.5rem] border-8 border-gray-800" : 
                            "w-full h-full rounded-none border-0"
                        )}
                    >
                        {isBuilderMode ? (
                            <BuilderCanvas />
                        ) : (
                            <iframe
                                ref={iframeRef}
                                className="w-full h-full border-0 bg-white"
                                sandbox="allow-scripts allow-same-origin allow-forms"
                                title="Preview"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
