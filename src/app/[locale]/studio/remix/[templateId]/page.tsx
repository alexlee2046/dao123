"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStudioStore } from '@/lib/store';

// Mock templates data (should be shared or fetched)
const TEMPLATES: Record<string, string> = {
    '1': `<!DOCTYPE html><html><body class="bg-zinc-900 text-white flex items-center justify-center h-screen"><div class="text-center"><h1 class="text-6xl font-bold mb-4">亚历克斯的作品集</h1><p class="text-xl text-zinc-400">设计师 & 开发者</p></div></body></html>`,
    '2': `<!DOCTYPE html><html><body class="bg-[#f5ebe0]"><nav class="p-6 flex justify-between items-center"><div class="text-2xl font-bold text-[#6f4e37]">咖啡时光</div></nav><main class="container mx-auto px-6 py-12"><h1 class="text-6xl font-bold text-[#3e2723]">新鲜烘焙</h1></main></body></html>`,
    '3': `<!DOCTYPE html><html><body class="bg-blue-50"><div class="container mx-auto px-4 py-16"><h1 class="text-5xl font-bold text-blue-900 mb-6">SaaS 解决方案</h1><button class="bg-blue-600 text-white px-8 py-3 rounded-lg">开始免费试用</button></div></body></html>`,
    '4': `<!DOCTYPE html><html><body class="bg-white"><article class="max-w-2xl mx-auto py-16 prose lg:prose-xl"><h1>我的第一篇博客</h1><p>关于代码和设计的思考...</p></article></body></html>`
};

export default function RemixPage({ params }: { params: { templateId: string } }) {
    const router = useRouter();
    const setHtmlContent = useStudioStore(state => state.setHtmlContent);

    useEffect(() => {
        const templateContent = TEMPLATES[params.templateId];
        if (templateContent) {
            setHtmlContent(templateContent);
            // Generate a random ID for the new site
            const newSiteId = Math.random().toString(36).substring(7);
            router.push(`/studio/${newSiteId}`);
        } else {
            router.push('/dashboard');
        }
    }, [params.templateId, router, setHtmlContent]);

    return (
        <div className="flex items-center justify-center h-screen bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">正在应用模板...</p>
            </div>
        </div>
    );
}
