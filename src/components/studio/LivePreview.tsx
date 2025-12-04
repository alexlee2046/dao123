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
                        if (href.startsWith('http')) return; // External links usually have target=_blank but just in case
                        if (href.startsWith('#')) return; // Allow normal anchor navigation
                        
                        e.preventDefault();
                        
                        // Smart Navigation: Try to find a section that matches the path
                        // e.g. /contact -> id="contact"
                        const slug = href.replace(/^\\//, '').replace(/\\.html$/, '');
                        const targetElement = document.getElementById(slug) || document.querySelector(\`[name="\${slug}"]\`);

                        if (targetElement) {
                            console.log('Smart navigation to section:', slug);
                            targetElement.scrollIntoView({ behavior: 'smooth' });
                            return;
                        }
                        
                        console.log('Preview navigation prevented:', href);
                        
                        // Visual feedback for blocked navigation
                        const toast = document.createElement('div');
                        toast.textContent = \`Navigation to '\${href}' prevented. Page not found in preview.\`;
                        toast.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: rgba(0,0,0,0.8); color: white; padding: 8px 12px; border-radius: 6px; z-index: 9999; font-family: system-ui; font-size: 12px; pointer-events: none; animation: fadeIn 0.3s;';
                        document.body.appendChild(toast);
                        setTimeout(() => {
                            toast.style.opacity = '0';
                            toast.style.transition = 'opacity 0.5s';
                            setTimeout(() => toast.remove(), 500);
                        }, 2000);
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
                        sandbox="allow-scripts allow-same-origin allow-forms"
                    />
                </div>
            </div>
        </div>
    );
}
