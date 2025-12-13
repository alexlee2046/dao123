import React, { useEffect, useCallback, useState } from 'react';
import { Link } from '@/components/link';
import { Button } from "@/components/ui/button";
import { DeviceSelector } from "@/components/studio/toolbar/DeviceSelector";
import { Undo, Redo, ArrowLeft, Layers, Eye, Code, Command } from "lucide-react";
import { CodeEditorModal } from "@/components/studio/CodeEditorModal";
import { PreviewModal } from "@/components/studio/PreviewModal";

import { AutosaveIndicator } from "@/components/studio/AutosaveIndicator";
import { CanvasControls } from "@/components/studio/CanvasControls";
import { useStudioStore } from "@/lib/store";
import { toast } from "sonner";
import { useTranslations } from 'next-intl';
export function Toolbar() {
  const { undo, redo, past, future, currentProject, htmlContent, pages, currentPage, setCurrentPage, captureScreenshot, markAsSaved, setHtmlContent, runCommand, setCommandPaletteOpen, isBuilderMode, saveStatus, lastSavedAt } = useStudioStore();
  const t = useTranslations('studio');

  // Code Editor Modal State
  const [codeEditorOpen, setCodeEditorOpen] = useState(false);
  const [editorHtml, setEditorHtml] = useState('');
  const [editorCss, setEditorCss] = useState('');

  // Preview Modal State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewCss, setPreviewCss] = useState('');

  // Get code from GrapesJS when opening editor
  const handleOpenCodeEditor = useCallback(() => {
    // Dispatch event to get current HTML/CSS from GrapesJS
    const event = new CustomEvent('dao:get-code', {
      detail: {
        callback: (html: string, css: string) => {
          setEditorHtml(html);
          setEditorCss(css);
          setCodeEditorOpen(true);
        }
      }
    });
    window.dispatchEvent(event);
  }, []);

  // Apply code changes back to GrapesJS
  const handleApplyCode = useCallback((html: string, css: string) => {
    window.dispatchEvent(new CustomEvent('dao:set-code', {
      detail: { html, css }
    }));
  }, []);

  // Open Preview Modal with current content
  const handleOpenPreview = useCallback(() => {
    const event = new CustomEvent('dao:get-code', {
      detail: {
        callback: (html: string, css: string) => {
          setPreviewHtml(html);
          setPreviewCss(css);
          setPreviewOpen(true);
        }
      }
    });
    window.dispatchEvent(event);
  }, []);

  const handleSave = useCallback(async () => {
    try {
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
    window.addEventListener('dao:open-code-editor', handleOpenCodeEditor);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('dao:open-code-editor', handleOpenCodeEditor);
    };
  }, [handleSave, undo, redo, handleOpenCodeEditor]);

  return (
    <div className="h-14 border-b border-border/40 bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 sticky top-0 z-50">
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
        </div>

        {/* Undo/Redo Group */}
        <div className="flex items-center gap-0.5 ml-2 bg-muted/30 rounded-full p-0.5 border border-border/20">
          <Button
            variant="ghost"
            size="icon"
            title={`${t('undo')} (Cmd+Z)`}
            onClick={() => {
              if (isBuilderMode) {
                runCommand('dao:undo');
              } else {
                undo();
              }
            }}
            disabled={past.length === 0 && !isBuilderMode}
            className="h-7 w-7 rounded-full hover:bg-background hover:shadow-sm"
          >
            <Undo className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={`${t('redo')} (Cmd+Shift+Z)`}
            onClick={() => {
              if (isBuilderMode) {
                runCommand('dao:redo');
              } else {
                redo();
              }
            }}
            disabled={future.length === 0 && !isBuilderMode}
            className="h-7 w-7 rounded-full hover:bg-background hover:shadow-sm"
          >
            <Redo className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Command Palette Button */}
        <Button
          variant="ghost"
          size="icon"
          title={`${t('commandPalette') || 'Command Palette'} (Cmd+K)`}
          onClick={() => setCommandPaletteOpen(true)}
          className="h-7 w-7 rounded-full hover:bg-background hover:shadow-sm ml-1"
        >
          <Command className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Right Section: Actions */}
      <div className="flex items-center gap-2">


        {/* Canvas Zoom Controls */}
        <CanvasControls />

        <div className="h-4 w-px bg-border/30" />

        {/* Device Selector (Center-ish or Right) */}
        <div className="mr-2">
          <DeviceSelector />
        </div>

        {/* Auto-save Status */}
        <AutosaveIndicator
          status={saveStatus}
          lastSavedAt={lastSavedAt}
        />

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-primary/5 hover:border-primary/30 transition-all duration-300"
          onClick={handleSave}
          title={`${t('save')} (Cmd+S)`}
        >
          <div className={`w-2 h-2 rounded-full ${currentProject ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-yellow-500'}`} />
          {t('save')}
        </Button>

        {/* Code Editor Button */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 bg-background/50 backdrop-blur-sm border-border/40 hover:bg-muted/50 transition-all"
          onClick={handleOpenCodeEditor}
          title={t('codeEditor') || 'Code Editor'}
        >
          <Code className="w-3.5 h-3.5" />
          {t('codeEditor') || 'Code'}
        </Button>

        <Button
          size="sm"
          className="h-8 gap-2 bg-primary/90 hover:bg-primary shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] transition-all duration-300"
          onClick={handleOpenPreview}
        >
          <Eye className="w-3.5 h-3.5" />
          {t('preview')}
        </Button>
      </div>

      {/* Code Editor Modal */}
      <CodeEditorModal
        open={codeEditorOpen}
        onOpenChange={setCodeEditorOpen}
        htmlContent={editorHtml}
        cssContent={editorCss}
        onApply={handleApplyCode}
      />

      {/* Preview Modal */}
      <PreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        htmlContent={previewHtml}
        cssContent={previewCss}
      />
    </div>
  );
}

