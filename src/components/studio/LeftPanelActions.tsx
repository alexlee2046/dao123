"use client";

import React, { useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Save, Loader2, FileCode, Globe, Share } from "lucide-react";
import { PublishModal } from "@/components/studio/PublishModal";
// ImportCodeModal removed - duplicated functionality
import { PublishToCommunityModal } from "@/components/studio/PublishToCommunityModal";
import { ShareModal } from "@/components/studio/ShareModal";
import { useTranslations } from 'next-intl';
import { ModeToggle } from "@/components/mode-toggle";
import { useStudioStore } from "@/lib/store";
import { toast } from "sonner";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from "@/components/ui/tooltip";

export function LeftPanelActions() {
    const t = useTranslations('studio');
    const tCommon = useTranslations('common');
    const [saving, setSaving] = React.useState(false);

    const { currentProject, htmlContent, pages, captureScreenshot, markAsSaved } = useStudioStore();

    const handleSave = useCallback(async () => {
        try {
            setSaving(true);
            const { updateProject, updateProjectMetadata } = await import("@/lib/actions/projects");

            const screenshot = await captureScreenshot();
            const finalHtml = htmlContent;

            if (currentProject?.id) {
                await updateProject(currentProject.id, {
                    html: finalHtml,
                    pages,
                    content_json: undefined
                });
                if (screenshot) {
                    await updateProjectMetadata(currentProject.id, { preview_image: screenshot });
                }
                toast.success(t('saved'));
                markAsSaved();
            } else {
                toast.error(t('saveFailed') + ": No active project found.");
            }
        } catch (error: any) {
            console.error(error);
            toast.error(t('saveFailed') + error.message);
        } finally {
            setSaving(false);
        }
    }, [currentProject, htmlContent, pages, captureScreenshot, markAsSaved, t]);

    return (
        <TooltipProvider delayDuration={300}>
            <div className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-muted/20">
                {/* Left: Secondary Actions */}
                <div className="flex items-center gap-1">
                    {/* ImportCodeModal removed - use Code Editor in Toolbar */}

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <PublishToCommunityModal>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-background">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </PublishToCommunityModal>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p>{t('publishToCommunity')}</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <ShareModal>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-background">
                                    <Share className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </ShareModal>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p>{t('share')}</p>
                        </TooltipContent>
                    </Tooltip>

                    <ModeToggle />
                </div>

                {/* Right: Primary Actions */}
                <div className="flex items-center gap-2">
                    <PublishModal>
                        <Button
                            size="sm"
                            className="h-8 rounded-lg px-3 text-xs font-medium shadow-sm bg-gradient-to-r from-primary via-violet-500 to-violet-600 border-0"
                        >
                            <Play className="h-3 w-3 mr-1.5 fill-current" />
                            {t('publishOnline')}
                        </Button>
                    </PublishModal>
                </div>
            </div>
        </TooltipProvider>
    );
}
