import React, { useEffect, useCallback } from 'react';
import { Link } from '@/components/link';
// import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Undo, Redo, ArrowLeft, FileCode, Layers } from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { PageManager } from "@/components/studio/PageManager";
import { DeviceSelector } from "@/components/studio/toolbar/DeviceSelector";
import { toast } from "sonner";
// import { motion } from "framer-motion";
import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActionButtons } from "@/components/studio/toolbar/ActionButtons";

export function Toolbar() {
  // const router = useRouter();
  const { undo, redo, past, future, currentProject, htmlContent, pages, currentPage, setCurrentPage, captureScreenshot, isBuilderMode, selectedModel, setSelectedModel, previewDevice, setPreviewDevice, markAsSaved } = useStudioStore();
  const [saving, setSaving] = React.useState(false);
  // const [isRefining, setIsRefining] = React.useState(false);
  const t = useTranslations('studio');
  // const locale = useLocale();

  // GrapesJS 不需要 CraftJS 的 useEditor hook

  useEffect(() => {
    // getModels('chat').then(setModels); // Removed as models state and getModels are unused
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
      <DeviceSelector />

      {/* Right Section: Simplified Actions */}
      <ActionButtons onSave={handleSave} isSaving={saving} />
    </div>
  );
}
