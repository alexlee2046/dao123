"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStudioStore } from '@/lib/store';

// Mock templates data (should be shared or fetched)
const TEMPLATES: Record<string, string> = {
    '1': `<!DOCTYPE html><html><body class="bg-zinc-900 text-white flex items-center justify-center h-screen"><div class="text-center"><h1 class="text-6xl font-bold mb-4">Alex's Portfolio</h1><p class="text-xl text-zinc-400">Designer & Developer</p></div></body></html>`,
    '2': `<!DOCTYPE html><html><body class="bg-[#f5ebe0]"><nav class="p-6 flex justify-between items-center"><div class="text-2xl font-bold text-[#6f4e37]">CoffeeHouse</div></nav><main class="container mx-auto px-6 py-12"><h1 class="text-6xl font-bold text-[#3e2723]">Fresh Coffee</h1></main></body></html>`,
    '3': `<!DOCTYPE html><html><body class="bg-blue-50"><div class="container mx-auto px-4 py-16"><h1 class="text-5xl font-bold text-blue-900 mb-6">SaaS Solution</h1><button class="bg-blue-600 text-white px-8 py-3 rounded-lg">Start Free Trial</button></div></body></html>`,
    '4': `<!DOCTYPE html><html><body class="bg-white"><article class="max-w-2xl mx-auto py-16 prose lg:prose-xl"><h1>My First Blog Post</h1><p>Writing about code and design...</p></article></body></html>`
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
                <p className="text-muted-foreground">Remixing template...</p>
            </div>
        </div>
    );
}
