import React, { useEffect, useCallback } from 'react';
import { Link } from '@/components/link';
// import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Undo, Redo, Share, Play, ArrowLeft, Save, Globe, Sparkles, Loader2, FileCode, Layers, Monitor, Tablet, Smartphone } from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { PublishModal } from "@/components/studio/PublishModal";
import { ShareModal } from "@/components/studio/ShareModal";
import { PublishToCommunityModal } from "@/components/studio/PublishToCommunityModal";
import { ImportCodeModal } from "@/components/studio/ImportCodeModal";
import { PageManager } from "@/components/studio/PageManager";
import { toast } from "sonner";
// import { motion } from "framer-motion";
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

export function Toolbar() {
  // const router = useRouter();
  const { undo, redo, past, future, currentProject, htmlContent, pages, currentPage, setCurrentPage, captureScreenshot, isBuilderMode, selectedModel, setSelectedModel, previewDevice, setPreviewDevice, markAsSaved } = useStudioStore();
  const [saving, setSaving] = React.useState(false);
  // const [isRefining, setIsRefining] = React.useState(false);
  const [models, setModels] = React.useState<Model[]>([]);
  const t = useTranslations('studio');
  const tCommon = useTranslations('common');
  // const locale = useLocale();

  // GrapesJS 不需要 CraftJS 的 useEditor hook

  useEffect(() => {
    getModels('chat').then(setModels);
  }, []);


  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      const { updateProject, updateProjectMetadata } = await import("@/lib/actions/projects");

      // Capture screenshot before saving
      const screenshot = await captureScreenshot();

      // GrapesJS 直接使用 htmlContent，不需要 builderData 转换
      // htmlContent 已经在 GrapesEditor 的 onHtmlChange 回调中实时同步
      const finalHtml = htmlContent;

      if (currentProject?.id) {
        await updateProject(currentProject.id, {
          html: finalHtml,
          pages,
          content_json: undefined // GrapesJS 不使用 content_json
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


  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;

        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, undo, redo]);

  return (
    <div className="h-16 border-b border-border/40 bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 sticky top-0 z-50 transition-all duration-300">
      {/* Left Section: Unified Navigation Capsule */}
      <div className="flex items-center gap-2">
        {/* Unified Capsule */}
        <div className="flex items-center p-1 bg-muted/40 rounded-full border border-border/30 backdrop-blur-sm hover:border-border/50 transition-colors">
          <Button variant="ghost" size="icon" asChild title={t('returnToDashboard')} className="h-7 w-7 rounded-full hover:bg-background hover:shadow-sm hover:text-primary transition-all">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div className="h-4 w-px bg-border/40 mx-1" />

          <span className="font-semibold text-sm tracking-tight px-2 cursor-default select-none text-foreground/80">
            {currentProject?.name || t('untitledProject')}
          </span>

          <div className="h-4 w-px bg-border/40 mx-1" />

          {/* Page Selector */}
          <Select value={currentPage} onValueChange={setCurrentPage}>
            <SelectTrigger className="h-7 border-0 bg-transparent p-0 px-2 hover:bg-background/50 rounded-full focus:ring-0 shadow-none gap-1 min-w-[100px] text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              <FileCode className="w-3.5 h-3.5 opacity-70" />
              <SelectValue placeholder={t('selectPage')} />
            </SelectTrigger>
            <SelectContent>
              {pages.map((page) => (
                <SelectItem key={page.path} value={page.path} className="text-xs">
                  {page.path}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="h-4 w-px bg-border/40 mx-1" />

          <PageManager>
            <Button
              variant="ghost"
              size="icon"
              title={t('pageManager')}
              className="h-7 w-7 rounded-full hover:bg-background hover:shadow-sm ml-0"
            >
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </PageManager>
        </div>

        {/* Undo/Redo Group */}
        <div className="flex items-center gap-0.5 ml-2 bg-muted/30 rounded-full p-0.5 border border-border/20">
          <Button
            variant="ghost"
            size="icon"
            title={`${t('undo')} (Cmd+Z)`}
            onClick={undo}
            disabled={past.length === 0}
            className="h-7 w-7 rounded-full hover:bg-background hover:shadow-sm"
          >
            <Undo className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={`${t('redo')} (Cmd+Shift+Z)`}
            onClick={redo}
            disabled={future.length === 0}
            className="h-7 w-7 rounded-full hover:bg-background hover:shadow-sm"
          >
            <Redo className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Center Section: Device Toggles - Anchored Dynamic Island */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 bg-muted/50 rounded-full p-1.5 border border-border/30 shadow-sm backdrop-blur-md">
        <Button
          variant={previewDevice === 'desktop' ? "secondary" : "ghost"}
          size="icon"
          className={`h-8 w-8 rounded-full transition-all ${previewDevice === 'desktop' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'}`}
          onClick={() => setPreviewDevice('desktop')}
          title="Desktop"
        >
          <Monitor className="h-4 w-4" />
        </Button>
        <Button
          variant={previewDevice === 'tablet' ? "secondary" : "ghost"}
          size="icon"
          className={`h-8 w-8 rounded-full transition-all ${previewDevice === 'tablet' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'}`}
          onClick={() => setPreviewDevice('tablet')}
          title="Tablet"
        >
          <Tablet className="h-4 w-4" />
        </Button>
        <Button
          variant={previewDevice === 'mobile' ? "secondary" : "ghost"}
          size="icon"
          className={`h-8 w-8 rounded-full transition-all ${previewDevice === 'mobile' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'}`}
          onClick={() => setPreviewDevice('mobile')}
          title="Mobile"
        >
          <Smartphone className="h-4 w-4" />
        </Button>
      </div>

      {/* Right Section: Simplified Actions */}
      <div className="flex items-center gap-2">

        {/* Secondary Actions Group */}
        <div className="flex items-center p-0.5 gap-0.5 bg-muted/30 rounded-full border border-border/20 backdrop-blur-sm mr-2">
          <ImportCodeModal>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-background hover:shadow-sm"
              title="Import Code"
            >
              <FileCode className="h-4 w-4 text-muted-foreground" />
            </Button>
          </ImportCodeModal>

          <PublishToCommunityModal>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-background hover:shadow-sm" title={t('publishToCommunity')}>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </Button>
          </PublishToCommunityModal>

          <ShareModal>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-background hover:shadow-sm" title={t('share')}>
              <Share className="h-4 w-4 text-muted-foreground" />
            </Button>
          </ShareModal>
        </div>


        {isBuilderMode && (
          <div className="mr-2">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="h-8 w-[160px] text-xs rounded-full border-border/50 bg-background/50 shadow-sm focus:ring-0">
                <Sparkles className="w-3 h-3 mr-2 text-primary" />
                <SelectValue placeholder={t('chatPanel.selectModel')} />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id} className="text-xs">
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={handleSave}
          disabled={saving}
          title={`${tCommon('save')} (Cmd+S)`}
          className="h-9 w-9 rounded-full border-primary/20 hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all mr-1"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        </Button>

        <PublishModal>
          <Button size="sm" className="h-9 rounded-full px-5 text-sm font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 border-0">
            <Play className="h-3.5 w-3.5 mr-2 fill-current" />
            {t('publishOnline')}
          </Button>
        </PublishModal>

        <div className="h-4 w-px bg-border/50 mx-2" />
        <ModeToggle />
      </div>
    </div>
  );
}
