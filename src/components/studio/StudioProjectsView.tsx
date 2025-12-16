'use client';

import { Link } from '@/components/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Plus, Edit, Clock, ArrowRight, Loader2, FolderOpen,
    Palette, Sparkles, Grid3X3, List
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { motion } from "framer-motion";
import { useState } from 'react';
import { createProject } from "@/lib/actions/projects";
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface Project {
    id: string;
    name: string;
    description?: string;
    updated_at: string;
    content: any;
    preview_image?: string;
}

interface StudioProjectsViewProps {
    projects: Project[];
}

export function StudioProjectsView({ projects }: StudioProjectsViewProps) {
    const t = useTranslations('studio');
    const tDashboard = useTranslations('dashboard');
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const handleCreateProject = async () => {
        setIsLoading(true);
        try {
            const dateStr = new Date().toLocaleDateString();
            const newProject = await createProject(`${tDashboard('untitledProject')} ${dateStr}`, "New Project");

            if (newProject?.id) {
                toast.success(tDashboard('projectCreated'));
                router.push(`/studio/${newProject.id}`);
            }
        } catch (error) {
            console.error("Create project failed:", error);
            toast.error(tDashboard('createFailed'));
            setIsLoading(false);
        }
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="w-full max-w-7xl mx-auto py-8 px-6 md:px-12">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
            >
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary backdrop-blur-sm mb-3">
                    <Palette className="mr-2 h-3 w-3" />
                    工作室 · 可视化编辑器
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                            我的项目
                        </h1>
                        <p className="text-muted-foreground mt-1">管理和编辑您的网站项目</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* View Mode Toggle */}
                        <div className="flex items-center border rounded-lg p-1 bg-muted/30">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn("h-8 w-8 p-0", viewMode === 'grid' && "bg-background shadow-sm")}
                                onClick={() => setViewMode('grid')}
                            >
                                <Grid3X3 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn("h-8 w-8 p-0", viewMode === 'list' && "bg-background shadow-sm")}
                                onClick={() => setViewMode('list')}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button onClick={handleCreateProject} disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="mr-2 h-4 w-4" />
                            )}
                            新建项目
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Projects */}
            {projects.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                        <CardContent className="p-12 text-center">
                            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="h-10 w-10 text-primary/60" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">开始创建您的第一个项目</h3>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                使用我们的可视化编辑器，轻松拖放组件来构建您的网站
                            </p>
                            <Button onClick={handleCreateProject} disabled={isLoading} size="lg">
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="mr-2 h-4 w-4" />
                                )}
                                创建新项目
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className={cn(
                        "gap-4",
                        viewMode === 'grid'
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                            : "flex flex-col"
                    )}
                >
                    {projects.map((project) => (
                        <motion.div key={project.id} variants={item}>
                            {viewMode === 'grid' ? (
                                <ProjectGridCard project={project} />
                            ) : (
                                <ProjectListCard project={project} />
                            )}
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
}

function ProjectGridCard({ project }: { project: Project }) {
    const tDashboard = useTranslations('dashboard');

    return (
        <Card className="flex flex-col hover:shadow-lg transition-shadow duration-300 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden group">
            <div className="aspect-video bg-muted relative overflow-hidden">
                {project.preview_image ? (
                    <img
                        src={project.preview_image}
                        alt={project.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 bg-gradient-to-br from-muted/50 to-muted">
                        <Palette className="h-10 w-10" />
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <Button size="sm" variant="secondary" className="w-full font-medium shadow-lg" asChild>
                        <Link href={`/studio/${project.id}`}>
                            <Edit className="mr-2 h-3 w-3" />
                            {tDashboard('continueEditing')}
                        </Link>
                    </Button>
                </div>
            </div>

            <CardHeader className="p-3 pb-1">
                <CardTitle className="truncate text-sm">
                    <Link href={`/studio/${project.id}`} className="hover:text-primary transition-colors">
                        {project.name}
                    </Link>
                </CardTitle>
            </CardHeader>

            <CardFooter className="p-3 pt-0 text-xs text-muted-foreground flex items-center">
                <Clock className="mr-1 h-3 w-3" />
                {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
            </CardFooter>
        </Card>
    );
}

function ProjectListCard({ project }: { project: Project }) {
    const tDashboard = useTranslations('dashboard');

    return (
        <Card className="hover:shadow-md transition-shadow duration-300 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden group">
            <div className="flex items-center p-4 gap-4">
                <div className="h-16 w-24 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {project.preview_image ? (
                        <img
                            src={project.preview_image}
                            alt={project.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 bg-gradient-to-br from-muted/50 to-muted">
                            <Palette className="h-6 w-6" />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">
                        <Link href={`/studio/${project.id}`} className="hover:text-primary transition-colors">
                            {project.name}
                        </Link>
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                        <Clock className="mr-1 h-3 w-3" />
                        {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                    </p>
                </div>
                <Button size="sm" variant="outline" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/studio/${project.id}`}>
                        <Edit className="mr-2 h-3 w-3" />
                        编辑
                    </Link>
                </Button>
            </div>
        </Card>
    );
}
