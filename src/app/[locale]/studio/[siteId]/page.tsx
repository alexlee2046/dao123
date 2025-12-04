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
import { BuilderText } from '@/components/builder/atoms/BuilderText';
import { BuilderButton } from '@/components/builder/atoms/BuilderButton';
import { BuilderImage } from '@/components/builder/atoms/BuilderImage';
import { BuilderContainer } from '@/components/builder/atoms/BuilderContainer';
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
                BuilderText,
                BuilderButton,
                BuilderImage,
                BuilderContainer,
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
