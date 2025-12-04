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
import { useParams } from 'next/navigation';
import { useStudioStore } from "@/lib/store";
import { getProject } from "@/lib/actions/projects";
import { toast } from "sonner";

export default function StudioPage() {
    const params = useParams();
    const siteId = params?.siteId as string;
    const { setCurrentProject, setHtmlContent } = useStudioStore();

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
            if (project.content && project.content.html) {
                setHtmlContent(project.content.html);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load project");
        }
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Toolbar />
            <div className="flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal">
                    <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                        <ChatAssistant />
                    </ResizablePanel>

                    <ResizableHandle />

                    <ResizablePanel defaultSize={60}>
                        <LivePreview />
                    </ResizablePanel>

                    <ResizableHandle />

                    <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
                        <AssetManager />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    );
}
