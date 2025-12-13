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
import { PagesPanel } from "@/components/studio/sidebar/PagesPanel";
import { BlockManagerPanel, LayerManagerPanel } from "@/components/studio/sidebar/BuilderPanels";
import { SidebarRail } from "@/components/studio/sidebar/SidebarRail";
import { RightPanel } from "@/components/studio/RightPanel";
import { useParams, useRouter } from 'next/navigation';
import { useStudioStore } from "@/lib/store";
import { getProject } from "@/lib/actions/projects";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, FileText, Box, Layers } from "lucide-react";
import { LeftPanelActions } from "@/components/studio/LeftPanelActions";
import { AssetPickerModal } from "@/components/studio/AssetPickerModal";
import { CommandPalette } from "@/components/studio/CommandPalette";
import { cn } from "@/lib/utils";
import { useAutosave } from "@/hooks/useAutosave";

export default function StudioPage() {
    const t = useTranslations('studio');
    const params = useParams();
    const router = useRouter();
    const siteId = params?.siteId as string;

    // Loading State
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const { setCurrentProject, setHtmlContent, setPages, isBuilderMode, resetForNewProject, htmlContent, pages, lastSavedAt, currentProject } = useStudioStore();

    // Track unsaved changes
    const initialContentRef = useRef<string>('');
    const lastSavedAtRef = useRef<number | null>(null);
    const [isDirty, setIsDirty] = useState(false);

    // Asset Picker Modal State
    const [assetPickerOpen, setAssetPickerOpen] = useState(false);
    const [assetPickerCallback, setAssetPickerCallback] = useState<((url: string) => void) | null>(null);
    const [assetPickerTypes, setAssetPickerTypes] = useState<string[]>(['image']);

    // Left Panel State
    const [activeLeftTab, setActiveLeftTab] = useState('chat');

    // Update left tab when entering builder mode
    useEffect(() => {
        if (isBuilderMode && activeLeftTab === 'chat') {
            setActiveLeftTab('blocks');
        } else if (!isBuilderMode && (activeLeftTab === 'blocks' || activeLeftTab === 'layers')) {
            setActiveLeftTab('chat');
        }
    }, [isBuilderMode]);

    // Listen for view switch events from Toolbar
    useEffect(() => {
        const handleSwitchView = (e: CustomEvent) => {
            const view = e.detail.view;
            if (['blocks', 'layers'].includes(view) && isBuilderMode) {
                setActiveLeftTab(view);
            }
        };

        window.addEventListener('dao:switch-view', handleSwitchView as EventListener);
        return () => window.removeEventListener('dao:switch-view', handleSwitchView as EventListener);
    }, [isBuilderMode]);

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
                } else if (project.content.html) {
                    setHtmlContent(project.content.html);
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

    // Enable auto-save
    useAutosave({
        enabled: !!currentProject?.id && isBuilderMode,
        onSaveSuccess: () => {
            // Optional: show toast or just rely on indicator
        },
        onSaveError: (error) => {
            toast.error(t('saveFailed') + ": " + error.message);
        }
    });

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

    // Asset Picker Event Listener
    useEffect(() => {
        const handleOpenAssetPicker = (e: CustomEvent) => {
            const { types, onSelect, onClose } = e.detail;
            setAssetPickerTypes(types || ['image']);
            setAssetPickerCallback(() => (url: string) => {
                onSelect?.(url);
                setAssetPickerOpen(false);
            });
            setAssetPickerOpen(true);
        };

        window.addEventListener('dao:open-asset-picker', handleOpenAssetPicker as EventListener);
        return () => window.removeEventListener('dao:open-asset-picker', handleOpenAssetPicker as EventListener);
    }, []);

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
            <div className="flex-1 flex overflow-hidden">
                {/* Vertical Navigation Rail */}
                <SidebarRail
                    activeTab={activeLeftTab}
                    onTabChange={setActiveLeftTab}
                    className="flex-shrink-0"
                />

                <ResizablePanelGroup direction="horizontal" className="flex-1">
                    {/* Left Panel Drawer: Chat, Pages, Blocks, Layers */}
                    <ResizablePanel
                        defaultSize={20}
                        minSize={15}
                        maxSize={30}
                        collapsible={true}
                        collapsedSize={0}
                        className="transition-all duration-300 ease-in-out"
                    >
                        <div className="h-full flex flex-col bg-background border-r">
                            {/* Action Buttons - Keep inside the drawer for specific context actions if needed, or remove if redundant */}
                            <LeftPanelActions />

                            <Tabs value={activeLeftTab} className="flex-1 flex flex-col h-full overflow-hidden">
                                {/* TabsList removed - controlled by SidebarRail */}

                                <TabsContent value="chat" forceMount={true} className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden h-full p-0 outline-none">
                                    <ChatAssistant />
                                </TabsContent>

                                <TabsContent value="pages" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden h-full p-0 outline-none">
                                    <PagesPanel />
                                </TabsContent>

                                {isBuilderMode && (
                                    <>
                                        <TabsContent value="blocks" forceMount={true} className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden h-full p-0 outline-none">
                                            <BlockManagerPanel />
                                        </TabsContent>
                                        <TabsContent value="layers" forceMount={true} className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden h-full p-0 outline-none">
                                            <LayerManagerPanel />
                                        </TabsContent>
                                    </>
                                )}
                            </Tabs>
                        </div>
                    </ResizablePanel>

                    <ResizableHandle />

                    {/* Center: Editor/Preview */}
                    <ResizablePanel defaultSize={60}>
                        <LivePreview />
                    </ResizablePanel>

                    <ResizableHandle />

                    {/* Right Panel: Assets / Styles / Traits */}
                    <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
                        <RightPanel />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>

            {/* Asset Picker Modal for GrapesJS Integration */}
            <AssetPickerModal
                open={assetPickerOpen}
                onOpenChange={setAssetPickerOpen}
                onSelect={(url) => {
                    assetPickerCallback?.(url);
                }}
                allowedTypes={assetPickerTypes}
            />

            {/* Command Palette */}
            <CommandPalette />
        </div>
    );
}
