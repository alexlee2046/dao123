import React from 'react';
import { Link } from '@/components/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Undo, Redo, Share, Play, ArrowLeft, Save, Globe, Sparkles, ChevronRight, Loader2, MessageSquare, Hammer, FileCode } from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { PublishModal } from "@/components/studio/PublishModal";
import { ShareModal } from "@/components/studio/ShareModal";
import { PublishToCommunityModal } from "@/components/studio/PublishToCommunityModal";
import { ImportCodeModal } from "@/components/studio/ImportCodeModal";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useEditor } from "@craftjs/core";
import { useTranslations, useLocale } from 'next-intl';

export function Toolbar() {
  const router = useRouter();
  const { undo, redo, past, future, currentProject, setCurrentProject, htmlContent, pages, captureScreenshot, isBuilderMode, toggleBuilderMode, setBuilderData, builderData } = useStudioStore();
  const [saving, setSaving] = React.useState(false);
  const t = useTranslations('studio');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const { query, actions } = useEditor();

  const handleSave = async () => {
    try {
      setSaving(true);
      const { updateProject, createProject, updateProjectMetadata } = await import("@/lib/actions/projects");

      // Capture screenshot before saving
      const screenshot = await captureScreenshot();

      // Get Builder Data if in builder mode (or always if we want to sync)
      // Note: query.serialize() returns a JSON string
      let builderContent = null;
      try {
        builderContent = query.serialize();
      } catch (e) {
        // Ignore if editor is not active or empty
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
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild title={t('returnToDashboard')} className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-muted/30 border border-border/20">
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="h-3 w-3" />
          </div>
          <span className="font-semibold text-sm tracking-tight">{t('workshop')}</span>
          <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
          <span className="text-xs text-muted-foreground max-w-[150px] truncate">{currentProject?.name || t('untitledProject')}</span>
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

        <Button
          variant={isBuilderMode ? "secondary" : "ghost"}
          size="sm"
          onClick={() => {
            if (!isBuilderMode) {
              // 如果编辑器是空的，且我们有 HTML 内容，尝试将其转换为 Builder 数据
              // 注意：我们通过检查 store 中的 builderData 来判断，或者简单地覆盖它（如果这是第一次进入且 builderData 是空的）
              const isBasicallyEmpty = !builderData || builderData === '{}' || (JSON.parse(builderData).ROOT && JSON.parse(builderData).ROOT.nodes.length === 0);

              if (isBasicallyEmpty && htmlContent) {
                try {
                  console.log("Auto-converting HTML content to Builder data...");
                  // 动态导入解析器以避免服务端渲染问题（它使用了 DOMParser）
                  import('@/lib/builder/htmlInfoCraft').then(({ htmlToCraftData }) => {
                    const craftJson = htmlToCraftData(htmlContent);
                    setBuilderData(craftJson);
                  });
                } catch (e) {
                  console.error("Failed to convert HTML to Builder data:", e);
                  // 降级：仅包裹在 CustomHTML 中 (旧逻辑)
                  import('@/components/builder/special/CustomHTML').then(({ CustomHTML }) => {
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
                  });
                }
              }

              toggleBuilderMode();
            } else {
              // 切换回 AI 模式
              // TODO: 可选 - 将 Builder 数据反向转换为 HTML（非常困难，暂时不处理）
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

        <PublishModal pageCount={pages.length}>
          <Button size="sm" className="h-8 rounded-full px-4 text-xs shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 border-0">
            <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
            {t('publishOnline')}
          </Button>
        </PublishModal>
      </div>
    </div>
  );
}
