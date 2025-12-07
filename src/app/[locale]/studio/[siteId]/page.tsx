"use client";

import React, { useEffect } from 'react';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Toolbar } from "@/components/studio/Toolbar";
import { ChatAssistant } from "@/components/studio/ChatAssistant";
import { LivePreview } from "@/components/studio/LivePreview";
import { AssetManager } from "@/components/studio/AssetManager";
import { Toolbox } from "@/components/studio/builder/Toolbox";
import { SettingsPanel } from "@/components/studio/builder/SettingsPanel";
import { useParams } from 'next/navigation';
import { useStudioStore } from "@/lib/store";
import { getProject } from "@/lib/actions/projects";
import { toast } from "sonner";
import { Editor } from '@craftjs/core';

// Atoms
import { BuilderText } from '@/components/builder/atoms/BuilderText';
import { BuilderButton } from '@/components/builder/atoms/BuilderButton';
import { BuilderImage } from '@/components/builder/atoms/BuilderImage';
import { BuilderContainer } from '@/components/builder/atoms/BuilderContainer';
import { BuilderLink } from '@/components/builder/atoms/BuilderLink';
import { BuilderDivider } from '@/components/builder/atoms/BuilderDivider';
import { BuilderSpacer } from '@/components/builder/atoms/BuilderSpacer';
import { BuilderVideo } from '@/components/builder/atoms/BuilderVideo';

// Layout
import { BuilderRow } from '@/components/builder/layout/BuilderRow';
import { BuilderColumn } from '@/components/builder/layout/BuilderColumn';
import { BuilderGrid } from '@/components/builder/layout/BuilderGrid';

// Blocks
import { BuilderCard } from '@/components/builder/blocks/BuilderCard';
import { BuilderHero } from '@/components/builder/blocks/BuilderHero';
import { BuilderNavbar } from '@/components/builder/blocks/BuilderNavbar';
import { BuilderFooter } from '@/components/builder/blocks/BuilderFooter';

// Special
import { CustomHTML } from '@/components/builder/special/CustomHTML';

import { useTranslations } from 'next-intl';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayersPanel } from "@/components/studio/sidebar/LayersPanel";
import { PagesPanel } from "@/components/studio/sidebar/PagesPanel";
import { Layers, Box, FileText } from "lucide-react";

export default function StudioPage() {
    const t = useTranslations('studio');
    const params = useParams();
    const siteId = params?.siteId as string;
    const { setCurrentProject, setHtmlContent, setPages, isBuilderMode, setBuilderData } = useStudioStore();

    useEffect(() => {
        if (siteId && siteId !== 'new') {
            loadProject(siteId);
        } else {
            // Reset for new project
            setCurrentProject(null);
            // Optional: Reset HTML content to default if needed, or keep store state
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
            if (project.content_json) {
                setBuilderData(JSON.stringify(project.content_json));
            }
        } catch (error) {
            console.error(error);
            toast.error(t('loadFailed'));
        }
    };

    return (
        <Editor
            resolver={{
                // Atoms
                BuilderText,
                BuilderButton,
                BuilderImage,
                BuilderContainer,
                BuilderLink,
                BuilderDivider,
                BuilderSpacer,
                BuilderVideo,
                // Layout
                BuilderRow,
                BuilderColumn,
                BuilderGrid,
                // Blocks
                BuilderCard,
                BuilderHero,
                BuilderNavbar,
                BuilderFooter,
                // Special
                CustomHTML
            }}
        >
            <div className="h-screen flex flex-col overflow-hidden">
                <Toolbar />
                <div className="flex-1 overflow-hidden">
                    <ResizablePanelGroup direction="horizontal">
                        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                            {isBuilderMode ? (
                                <div className="h-full flex flex-col bg-background border-r">
                                    <Tabs defaultValue="components" className="flex-1 flex flex-col h-full">
                                        <div className="px-2 pt-2 border-b bg-muted/30">
                                            <TabsList className="w-full grid grid-cols-3 h-9 mb-2">
                                                <TabsTrigger value="components" className="text-xs px-0" title={t('toolbox')}><Box className="w-3.5 h-3.5 mr-1.5"/>Tools</TabsTrigger>
                                                <TabsTrigger value="layers" className="text-xs px-0" title={t('layers')}><Layers className="w-3.5 h-3.5 mr-1.5"/>Layers</TabsTrigger>
                                                <TabsTrigger value="pages" className="text-xs px-0" title={t('pages')}><FileText className="w-3.5 h-3.5 mr-1.5"/>Pages</TabsTrigger>
                                            </TabsList>
                                        </div>
                                        
                                        <TabsContent value="components" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden h-full p-0 outline-none">
                                            <Toolbox />
                                        </TabsContent>
                                        
                                        <TabsContent value="layers" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden h-full p-0 outline-none">
                                            <LayersPanel />
                                        </TabsContent>

                                        <TabsContent value="pages" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden h-full p-0 outline-none">
                                            <PagesPanel />
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            ) : <ChatAssistant />}
                        </ResizablePanel>

                        <ResizableHandle />

                        <ResizablePanel defaultSize={60}>
                            <LivePreview />
                        </ResizablePanel>

                        <ResizableHandle />

                        <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
                            {isBuilderMode ? <SettingsPanel /> : <AssetManager />}
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </div>
            </div>
        </Editor>
    );
}
