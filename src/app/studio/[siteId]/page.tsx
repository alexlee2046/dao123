"use client";

import React from 'react';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Toolbar } from "@/components/studio/Toolbar";
import { ChatAssistant } from "@/components/studio/ChatAssistant";
import { LivePreview } from "@/components/studio/LivePreview";
import { AssetManager } from "@/components/studio/AssetManager";

export default function StudioPage() {
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
