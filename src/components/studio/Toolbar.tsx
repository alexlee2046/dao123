import React, { useEffect } from 'react';
import { Link } from '@/components/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Undo, Redo, Share, Play, ArrowLeft, Save, Globe, Sparkles, ChevronRight, Loader2, MessageSquare, Hammer, FileCode, Wand2, Layers, Monitor, Tablet, Smartphone, Plus } from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { PublishModal } from "@/components/studio/PublishModal";
import { ShareModal } from "@/components/studio/ShareModal";
import { PublishToCommunityModal } from "@/components/studio/PublishToCommunityModal";
import { ImportCodeModal } from "@/components/studio/ImportCodeModal";
import { PageManager } from "@/components/studio/PageManager";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useEditor } from "@craftjs/core";
import { useTranslations, useLocale } from 'next-intl';
import { ModeToggle } from "@/components/mode-toggle";
import { convertHtmlToBuilder } from "@/app/actions/ai-transform";
import { getModels, type Model } from "@/lib/actions/models";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Toolbar() {
  const router = useRouter();
  const { undo, redo, past, future, currentProject, setCurrentProject, htmlContent, pages, currentPage, setCurrentPage, captureScreenshot, isBuilderMode, toggleBuilderMode, setBuilderData, builderData, selectedModel, setSelectedModel, openRouterApiKey, previewDevice, setPreviewDevice } = useStudioStore();
  const [saving, setSaving] = React.useState(false);
  const [isRefining, setIsRefining] = React.useState(false);
  const [models, setModels] = React.useState<Model[]>([]);
  const t = useTranslations('studio');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const { query, actions } = useEditor();

  useEffect(() => {
    getModels('chat').then(setModels);
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const { updateProject, createProject, updateProjectMetadata } = await import("@/lib/actions/projects");

      // Capture screenshot before saving
      const screenshot = await captureScreenshot();

      // Get Builder Data if in builder mode (or always if we want to sync)
      // Note: query.serialize() returns a JSON string
      let builderContent = null;
      if (isBuilderMode) {
        try {
          builderContent = query.serialize();
          // Update store with latest data
          setBuilderData(builderContent);
        } catch (e) {
          // Ignore if editor is not active or empty
          console.warn("Failed to serialize builder data:", e);
        }
      } else {
        // If not in builder mode, use existing data from store to avoid overwriting with empty state
        builderContent = builderData;
      }

      // Parse it back to object because our API expects object for JSONB column
      const contentJson = builderContent ? JSON.parse(builderContent) : null;

      if (currentProject?.id) {
        await updateProject(currentProject.id, {
          html: htmlContent,
          pages,
          content_json: contentJson
        });
        if (screenshot) {
          await updateProjectMetadata(currentProject.id, { preview_image: screenshot });
        }
        toast.success(t('saved'));
      } else {
        const newProject = await createProject(t('untitledProject'), t('generatedBy'));
        setCurrentProject(newProject);
        // Save content immediately after creation
        await updateProject(newProject.id, {
          html: htmlContent,
          pages,
          content_json: contentJson
        });
        if (screenshot) {
          await updateProjectMetadata(newProject.id, { preview_image: screenshot });
        }
        toast.success(t('createdAndSaved'));
        // Update URL to include the new project ID
        window.history.replaceState(null, '', `/${locale}/studio/${newProject.id}`);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(t('saveFailed') + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-14 border-b border-border/40 bg-background/60 backdrop-blur-xl flex items-center justify-between px-4 sticky top-0 z-50 transition-all duration-300">
      {/* Left Section: Back, Project Info, Page Selector */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild title={t('returnToDashboard')} className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-muted/30 border border-border/20">
          <span className="font-semibold text-sm tracking-tight ml-1">{currentProject?.name || t('untitledProject')}</span>
          <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
          
          {/* Page Selector */}
          <Select value={currentPage} onValueChange={setCurrentPage}>
            <SelectTrigger className="h-6 min-w-[100px] max-w-[160px] text-xs border-0 bg-transparent p-0 px-1 hover:bg-background/50 rounded-sm focus:ring-0 shadow-none">
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

          <PageManager>
            <Button
              variant="ghost"
              size="icon"
              title={t('pageManager')}
              className="h-5 w-5 rounded-full hover:bg-background/80 ml-1"
            >
              <Layers className="h-3 w-3 text-muted-foreground" />
            </Button>
          </PageManager>
        </div>

        <div className="h-4 w-px bg-border/50 mx-1" />

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            title={t('undo')}
            onClick={undo}
            disabled={past.length === 0}
            className="h-8 w-8 rounded-full hover:bg-muted"
          >
            <Undo className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={t('redo')}
            onClick={redo}
            disabled={future.length === 0}
            className="h-8 w-8 rounded-full hover:bg-muted"
          >
            <Redo className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Center Section: Device Toggles */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 bg-muted/30 rounded-full p-1 border border-border/20">
        <Button
          variant={previewDevice === 'desktop' ? "secondary" : "ghost"}
          size="sm"
          className={`h-7 px-3 rounded-full text-xs ${previewDevice === 'desktop' ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}
          onClick={() => setPreviewDevice('desktop')}
          title="Desktop"
        >
          <Monitor className="h-3.5 w-3.5 mr-1.5" />
          Desktop
        </Button>
        <Button
          variant={previewDevice === 'tablet' ? "secondary" : "ghost"}
          size="sm"
          className={`h-7 px-3 rounded-full text-xs ${previewDevice === 'tablet' ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}
          onClick={() => setPreviewDevice('tablet')}
          title="Tablet"
        >
          <Tablet className="h-3.5 w-3.5 mr-1.5" />
          Tablet
        </Button>
        <Button
          variant={previewDevice === 'mobile' ? "secondary" : "ghost"}
          size="sm"
          className={`h-7 px-3 rounded-full text-xs ${previewDevice === 'mobile' ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}
          onClick={() => setPreviewDevice('mobile')}
          title="Mobile"
        >
          <Smartphone className="h-3.5 w-3.5 mr-1.5" />
          Mobile
        </Button>
      </div>

      {/* Right Section: Actions */}
      <div className="flex items-center gap-2">
        <ImportCodeModal>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3 text-xs font-medium border border-transparent hover:border-border/50"
          >
            <FileCode className="h-3.5 w-3.5 mr-1.5" />
            Import
          </Button>
        </ImportCodeModal>

        {isBuilderMode && (
          <>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="h-8 w-[180px] text-xs rounded-full border-border/50 bg-transparent">
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

            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                if (!htmlContent) {
                  toast.error(t('emptyContentError'));
                  return;
                }
                
                if (!confirm("This will use AI to reconstruct the builder components from the original HTML. Current changes in the builder might be lost. Continue?")) {
                    return;
                }

                try {
                  setIsRefining(true);
                  const result = await convertHtmlToBuilder(htmlContent || '', selectedModel, openRouterApiKey);
                  if (result.success) {
                    setBuilderData(result.data || null);
                    toast.success(t('refineSuccess'));
                  } else {
                    toast.error(t('refineError') + ': ' + result.error);
                  }
                } catch (e: any) {
                  toast.error(e.message);
                } finally {
                  setIsRefining(false);
                }
              }}
              disabled={isRefining}
              className="h-8 rounded-full px-3 text-xs font-medium border border-transparent hover:border-border/50 text-purple-500 hover:text-purple-600"
              title={t('refineStructure')}
            >
              {isRefining ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5 mr-1.5" />}
              {isRefining ? t('refining') : t('refineStructure')}
            </Button>
          </>
        )}

        <Button
          variant={isBuilderMode ? "secondary" : "ghost"}
          size="sm"
          onClick={async () => {
            if (!isBuilderMode) {
              // 如果编辑器是空的，且我们有 HTML 内容，尝试将其转换为 Builder 数据
              let isBasicallyEmpty = !builderData || builderData === '{}';

              if (!isBasicallyEmpty && builderData) {
                try {
                  const parsed = JSON.parse(builderData);
                  // 检查 ROOT 节点是否为空（没有子节点）
                  isBasicallyEmpty = !parsed.ROOT || (parsed.ROOT.nodes && parsed.ROOT.nodes.length === 0);
                } catch (e) {
                  // 解析失败，视为空
                  isBasicallyEmpty = true;
                }
              }

              if (isBasicallyEmpty && htmlContent) {
                try {
                  console.log("Auto-converting HTML content to Builder data...");
                  // 动态导入解析器以避免服务端渲染问题（它使用了 DOMParser）
                  const { htmlToCraftData } = await import('@/lib/builder/htmlInfoCraft');
                  const craftJson = htmlToCraftData(htmlContent);
                  console.log("Conversion successful, setting builder data...");
                  setBuilderData(craftJson);
                } catch (e) {
                  console.error("Failed to convert HTML to Builder data:", e);
                  // 降级：仅包裹在 CustomHTML 中
                  const fallbackJson = JSON.stringify({
                    "ROOT": {
                      "type": { "resolvedName": "BuilderContainer" },
                      "isCanvas": true,
                      "props": { "className": "w-full min-h-screen bg-white" },
                      "displayName": "Body",
                      "custom": {},
                      "hidden": false,
                      "nodes": ["fallback-node"],
                      "linkedNodes": {}
                    },
                    "fallback-node": {
                      "type": { "resolvedName": "CustomHTML" },
                      "isCanvas": true,
                      "props": { "code": htmlContent },
                      "displayName": "Custom HTML",
                      "custom": {},
                      "hidden": false,
                      "nodes": [],
                      "linkedNodes": {},
                      "parent": "ROOT"
                    }
                  });
                  setBuilderData(fallbackJson);
                }
              }

              // 等待一小段时间让状态更新
              await new Promise(resolve => setTimeout(resolve, 100));
              toggleBuilderMode();
            } else {
              // 切换回 AI 模式
              toggleBuilderMode();
            }
          }}
          className="h-8 rounded-full px-3 text-xs font-medium border border-transparent hover:border-border/50"
        >
          {isBuilderMode ? (
            <>
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
              {t('aiChat')}
            </>
          ) : (
            <>
              <Hammer className="h-3.5 w-3.5 mr-1.5" />
              {t('manualEdit')}
            </>
          )}
        </Button>

        <div className="h-4 w-px bg-border/50 mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="h-8 rounded-full px-4 text-xs font-medium hover:bg-primary/5 hover:text-primary"
        >
          {saving ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-2" />}
          {saving ? t('saving') : tCommon('save')}
        </Button>

        <PublishToCommunityModal>
          <Button variant="outline" size="sm" className="h-8 rounded-full px-3 text-xs border-primary/20 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all">
            <Globe className="h-3.5 w-3.5 mr-1.5" />
            {t('publishToCommunity')}
          </Button>
        </PublishToCommunityModal>

        <ShareModal>
          <Button variant="outline" size="sm" className="h-8 rounded-full px-3 text-xs border-primary/20 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all">
            <Share className="h-3.5 w-3.5 mr-1.5" />
            {t('share')}
          </Button>
        </ShareModal>

        <PublishModal>
          <Button size="sm" className="h-8 rounded-full px-4 text-xs shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 border-0">
            <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
            {t('publishOnline')}
          </Button>
        </PublishModal>

        <div className="h-4 w-px bg-border/50 mx-1" />
        <ModeToggle />
      </div>
    </div>
  );
}
