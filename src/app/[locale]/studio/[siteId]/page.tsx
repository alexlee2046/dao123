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
                            {isBuilderMode ? <Toolbox /> : <ChatAssistant />}
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
