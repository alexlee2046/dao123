
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Share, Play, Save, Globe, Sparkles, Loader2, FileCode } from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { PublishModal } from "@/components/studio/PublishModal";
import { ShareModal } from "@/components/studio/ShareModal";
import { PublishToCommunityModal } from "@/components/studio/PublishToCommunityModal";
import { ImportCodeModal } from "@/components/studio/ImportCodeModal";
import { useTranslations } from 'next-intl';
import { ModeToggle } from "@/components/mode-toggle";
import { getModels, type Model } from "@/lib/actions/models";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ActionButtonsProps {
    onSave: () => void;
    isSaving: boolean;
}

export function ActionButtons({ onSave, isSaving }: ActionButtonsProps) {
    const t = useTranslations('studio');
    const tCommon = useTranslations('common');
    const { isBuilderMode, selectedModel, setSelectedModel } = useStudioStore();
    const [models, setModels] = React.useState<Model[]>([]);

    useEffect(() => {
        getModels('chat').then(setModels);
    }, []);

    return (
        <div className="flex items-center gap-3">
            {/* Secondary Actions Group */}
            <div className="flex items-center p-1 gap-1 bg-muted/20 hover:bg-muted/30 transition-colors rounded-full border border-border/10 backdrop-blur-sm">
                <ImportCodeModal>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-background hover:scale-105 transition-all duration-200"
                        title="Import Code"
                    >
                        <FileCode className="h-4 w-4 text-muted-foreground/80" />
                    </Button>
                </ImportCodeModal>

                <PublishToCommunityModal>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-background hover:scale-105 transition-all duration-200" title={t('publishToCommunity')}>
                        <Globe className="h-4 w-4 text-muted-foreground/80" />
                    </Button>
                </PublishToCommunityModal>

                <ShareModal>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-background hover:scale-105 transition-all duration-200" title={t('share')}>
                        <Share className="h-4 w-4 text-muted-foreground/80" />
                    </Button>
                </ShareModal>
            </div>

            {isBuilderMode && (
                <div className="hidden lg:block relative group">
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger className="h-9 w-[180px] text-xs rounded-full border-border/40 bg-background/40 hover:bg-background/80 transition-all shadow-sm focus:ring-0 backdrop-blur-sm">
                            <Sparkles className="w-3.5 h-3.5 mr-2 text-primary animate-pulse-slow" />
                            <SelectValue placeholder={t('chatPanel.selectModel')} />
                        </SelectTrigger>
                        <SelectContent className="backdrop-blur-xl bg-background/90 border-border/40">
                            {models.map((model) => (
                                <SelectItem key={model.id} value={model.id} className="text-xs py-2 cursor-pointer focus:bg-primary/5">
                                    {model.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="flex items-center gap-2 pl-2 border-l border-border/20">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={onSave}
                    disabled={isSaving}
                    title={`${tCommon('save')} (Cmd+S)`}
                    className={cn(
                        "h-9 w-9 rounded-full border-border/40 bg-background/20 hover:bg-background hover:border-primary/20 transition-all duration-300",
                        isSaving && "opacity-80"
                    )}
                >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Save className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />}
                </Button>

                <PublishModal>
                    <Button
                        size="sm"
                        className="h-9 rounded-full px-5 text-sm font-medium shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 bg-gradient-to-r from-primary via-violet-500 to-violet-600 hover:scale-[1.02] border-0"
                    >
                        <Play className="h-3.5 w-3.5 mr-2 fill-current" />
                        {t('publishOnline')}
                    </Button>
                </PublishModal>
            </div>

            <div className="h-8 w-px bg-border/20 mx-1" />
            <ModeToggle />
        </div>
    );
}
