import { getProject } from "@/lib/actions/projects";
import { checkAccess } from "@/lib/actions/community";
import { ProjectActions } from "@/components/community/ProjectActions";
import { CommentsSection } from "@/components/community/CommentsSection";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { notFound } from "next/navigation";
import { getTranslations } from 'next-intl/server';

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const project = await getProject(id);

    if (!project || !project.is_public) {
        notFound();
    }

    const hasAccess = await checkAccess(id);
    const t = await getTranslations('community');
    const tCommon = await getTranslations('common');

    // Determine preview content
    let previewContent = project.content?.html || '';
    if (project.content?.pages && Array.isArray(project.content.pages) && project.content.pages.length > 0) {
        // Try to find index.html or use the first page
        const indexPage = project.content.pages.find((p: any) => p.path === 'index.html') || project.content.pages[0];
        previewContent = indexPage.content;
    }

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <div className="grid gap-8">
                {/* Header */}
                <div className="space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold">{project.name}</h1>
                            <p className="text-muted-foreground mt-2">{project.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <Badge variant={project.price > 0 ? "default" : "secondary"} className="text-lg px-4 py-1">
                                {project.price > 0 ? `${project.price} ${tCommon('credits')}` : t('free')}
                            </Badge>
                        </div>
                    </div>

                    <ProjectActions
                        projectId={project.id}
                        price={project.price}
                        hasAccess={hasAccess}
                        projectData={project}
                    />
                </div>

                <Separator />

                {/* Content Preview */}
                <div className="aspect-video bg-muted rounded-lg border flex items-center justify-center relative overflow-hidden">
                    <iframe
                        srcDoc={previewContent}
                        className="w-full h-full pointer-events-none scale-75 origin-top-left w-[133%] h-[133%]"
                        title="Preview"
                    />
                    {!hasAccess && (
                        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
                            <p className="font-semibold text-lg">{t('buyToView')}</p>
                        </div>
                    )}
                </div>

                <Separator />

                {/* Comments & Ratings */}
                <CommentsSection projectId={project.id} />
            </div>
        </div>
    );
}
