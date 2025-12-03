import React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Undo, Redo, Share, Play, ArrowLeft, Save, Image as ImageIcon, Globe } from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { PublishModal } from "@/components/studio/PublishModal";
import { ShareModal } from "@/components/studio/ShareModal";
import { AssetLibrary } from "@/components/studio/AssetLibrary";
import { PublishToCommunityModal } from "@/components/studio/PublishToCommunityModal";
import { saveProject } from "@/lib/actions/projects";
import { toast } from "sonner";

export function Toolbar() {
  const { undo, redo, past, future } = useStudioStore();

  return (
    <div className="h-14 border-b bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild title="返回 Dashboard">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <span className="font-bold text-lg mr-4">dao123</span>
        <Button
          variant="ghost"
          size="icon"
          title="撤销"
          onClick={undo}
          disabled={past.length === 0}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="重做"
          onClick={redo}
          disabled={future.length === 0}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            const { htmlContent, currentProject, setCurrentProject } = useStudioStore.getState();

            try {
              toast.loading("Saving project...");
              const project = await saveProject({
                id: currentProject?.id,
                name: currentProject?.name || "Untitled Project",
                description: currentProject?.description,
                content: { html: htmlContent },
                is_public: currentProject?.is_public,
              });

              setCurrentProject(project);
              toast.success("Project saved successfully!");
            } catch (e: any) {
              console.error(e);
              toast.error("Failed to save project: " + e.message);
            }
          }}
        >
          <Save className="h-4 w-4 mr-2" />
          保存
        </Button>
        <PublishToCommunityModal>
          <Button variant="outline" size="sm">
            <Globe className="h-4 w-4 mr-2" />
            发布到广场
          </Button>
        </PublishToCommunityModal>
        <ShareModal>
          <Button variant="outline" size="sm">
            <Share className="h-4 w-4 mr-2" />
            分享
          </Button>
        </ShareModal>
        <PublishModal>
          <Button size="sm">
            <Play className="h-4 w-4 mr-2" />
            发布
          </Button>
        </PublishModal>
      </div>
    </div>
  );
}
