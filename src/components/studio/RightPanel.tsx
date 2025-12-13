"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Settings2, Image as ImageIcon, Tag } from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { AssetManager } from "@/components/studio/AssetManager";

export const RightPanel = () => {
    const t = useTranslations('studio');
    const { isBuilderMode } = useStudioStore();
    const [activeTab, setActiveTab] = React.useState('styles');

    // Listen for view switch events from Toolbar
    React.useEffect(() => {
        const handleSwitchView = (e: CustomEvent) => {
            const view = e.detail.view;
            if (['styles', 'traits'].includes(view)) {
                setActiveTab(view);
            }
        };

        window.addEventListener('dao:switch-view', handleSwitchView as EventListener);
        return () => window.removeEventListener('dao:switch-view', handleSwitchView as EventListener);
    }, []);

    // If not in builder mode, show Asset Manager (preserving original behavior)
    if (!isBuilderMode) {
        return (
            <div className="h-full flex flex-col bg-background border-l">
                <div className="p-3 border-b bg-muted/20 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('assets') || 'Assets'}</span>
                </div>
                <div className="flex-1 overflow-hidden">
                    <AssetManager />
                </div>
            </div>
        );
    }

    // In Builder Mode, show Selectors, Styles, and Traits tabs
    return (
        <div className="h-full flex flex-col bg-background border-l">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="px-2 pt-2 border-b bg-muted/30">
                    <TabsList className="w-full grid grid-cols-2 h-9 mb-2">
                        <TabsTrigger value="styles" className="text-xs px-0">
                            <Palette className="w-3.5 h-3.5 mr-1" />
                            {t('styles') || 'Styles'}
                        </TabsTrigger>
                        <TabsTrigger value="traits" className="text-xs px-0">
                            <Settings2 className="w-3.5 h-3.5 mr-1" />
                            {t('traits') || 'Traits'}
                        </TabsTrigger>
                    </TabsList>
                </div>


                <TabsContent value="styles" forceMount={true} className="flex-1 overflow-y-auto custom-scrollbar mt-0 data-[state=inactive]:hidden h-full p-0">
                    <div className="flex flex-col min-h-full">
                        {/* Selector Manager moved here for better UX */}
                        <div id="gjs-selector-manager" className="border-b bg-muted/10" />
                        <div id="gjs-style-manager" className="flex-1" />
                    </div>
                </TabsContent>

                <TabsContent value="traits" forceMount={true} className="flex-1 overflow-y-auto custom-scrollbar mt-0 data-[state=inactive]:hidden h-full p-0">
                    <div id="gjs-trait-manager" className="min-h-full" />
                </TabsContent>
            </Tabs>
        </div>
    );
};

