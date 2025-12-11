"use client";

import React, { useEffect, useRef, useState } from 'react';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Toolbar } from "@/components/studio/Toolbar";
import { ChatAssistant } from "@/components/studio/ChatAssistant";
import { LivePreview } from "@/components/studio/LivePreview";
import { AssetManager } from "@/components/studio/AssetManager";
import { PagesPanel } from "@/components/studio/sidebar/PagesPanel";
import { useParams, useRouter } from 'next/navigation';
import { useStudioStore } from "@/lib/store";
import { getProject } from "@/lib/actions/projects";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, FileText, Image as ImageIcon } from "lucide-react";

export default function StudioPage() {
    const t = useTranslations('studio');
    const params = useParams();
    const router = useRouter();
    const siteId = params?.siteId as string;

    // Loading State
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const { setCurrentProject, setHtmlContent, setPages, isBuilderMode, resetForNewProject, htmlContent, pages, lastSavedAt } = useStudioStore();

    // Track unsaved changes
    const initialContentRef = useRef<string>('');
    const lastSavedAtRef = useRef<number | null>(null);
    const [isDirty, setIsDirty] = useState(false);

    // Initial Load
    useEffect(() => {
        const initProject = async () => {
            setIsLoading(true);
            setLoadError(null);

            if (siteId && siteId !== 'new') {
                // Reset store, then load project
                resetForNewProject();
                await loadProject(siteId);
            } else {
                // Reset for new project
                resetForNewProject();
                setIsLoading(false);
            }
        };

        if (siteId) {
            initProject();
        }
    }, [siteId]);

    const loadProject = async (id: string) => {
        try {
            const project = await getProject(id);
            setCurrentProject(project);

            if (project.content) {
                if (project.content.pages && Array.isArray(project.content.pages) && project.content.pages.length > 0) {
                    setPages(project.content.pages);
                    // Record initial content for dirty check
                    const indexPage = project.content.pages.find((p: any) => p.path === 'index.html') || project.content.pages[0];
                    initialContentRef.current = indexPage?.content || '';
                } else if (project.content.html) {
                    setHtmlContent(project.content.html);
                    initialContentRef.current = project.content.html;
                }
            }

            // Note: We ignore content_json as we have fully migrated to HTML-based GrapesJS

            setIsDirty(false);
        } catch (error) {
            console.error(error);
            setLoadError(t('loadFailed'));
            toast.error(t('loadFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    // Detect Content Changes
    useEffect(() => {
        if (initialContentRef.current && htmlContent !== initialContentRef.current) {
            setIsDirty(true);
        }
    }, [htmlContent, pages]);

    // Detect Save Events
    useEffect(() => {
        if (lastSavedAt && lastSavedAt !== lastSavedAtRef.current) {
            lastSavedAtRef.current = lastSavedAt;
            setIsDirty(false);
            // Update initial content baseline
            initialContentRef.current = htmlContent;
        }
    }, [lastSavedAt, htmlContent]);

    // Unsaved Changes Warning
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
                return 'You have unsaved changes. Are you sure you want to leave?';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    // Redirect logic for 'new'
    useEffect(() => {
        if (siteId === 'new') {
            router.replace('/project/create');
        }
    }, [siteId, router]);

    // Loading UI
    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">{t('loading') || 'Loading...'}</p>
                </div>
            </div>
        );
    }

    // Error UI
    if (loadError) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4 text-center">
                    <p className="text-destructive">{loadError}</p>
                    <Button onClick={() => router.push('/dashboard')}>{t('returnToDashboard') || 'Return to Dashboard'}</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Toolbar />
            <div className="flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal">
                    {/* Left Panel: Chat & Pages (Collapsible) */}
                    <ResizablePanel
                        defaultSize={20}
                        minSize={15}
                        maxSize={30}
                        collapsible={true}
                        collapsedSize={0}
                        className="transition-all duration-300 ease-in-out"
                    >
                        <div className="h-full flex flex-col bg-background border-r">
                            <Tabs defaultValue="chat" className="flex-1 flex flex-col h-full">
                                <div className="px-2 pt-2 border-b bg-muted/30">
                                    <TabsList className="w-full grid grid-cols-2 h-9 mb-2">
                                        <TabsTrigger value="chat" className="text-xs px-0">
                                            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                                            {t('chat') || 'Chat'}
                                        </TabsTrigger>
                                        <TabsTrigger value="pages" className="text-xs px-0">
                                            <FileText className="w-3.5 h-3.5 mr-1.5" />
                                            {t('pages') || 'Pages'}
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="chat" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden h-full p-0 outline-none">
                                    <ChatAssistant />
                                </TabsContent>

                                <TabsContent value="pages" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden h-full p-0 outline-none">
                                    <PagesPanel />
                                </TabsContent>
                            </Tabs>
                        </div>
                    </ResizablePanel>

                    <ResizableHandle />

                    {/* Center: Editor/Preview */}
                    {/* When in Builder Mode, user might want to collapse the left panel to verify responsiveness, 
                        but effectively GrapesJS has its own preview mode. */}
                    <ResizablePanel defaultSize={60}>
                        <LivePreview />
                    </ResizablePanel>

                    {/* Right Panel: Assets (Only in AI Mode) */}
                    {/* In Builder Mode, GrapesJS preset has its own right sidebar, so we hide this panel to avoid clutter */}
                    {!isBuilderMode && (
                        <>
                            <ResizableHandle />
                            <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
                                <div className="h-full flex flex-col bg-background border-l">
                                    <div className="p-3 border-b bg-muted/20 flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('assets') || 'Assets'}</span>
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <AssetManager />
                                    </div>
                                </div>
                            </ResizablePanel>
                        </>
                    )}
                </ResizablePanelGroup>
            </div>
        </div>
    );
}
