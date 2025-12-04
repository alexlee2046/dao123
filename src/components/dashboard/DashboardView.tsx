'use client';

import { Link } from '@/components/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Eye, Sparkles, Clock, ArrowRight, Settings, Image as ImageIcon, Loader2 } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from 'react';
import { updateProjectMetadata } from "@/lib/actions/projects";
import { useRouter } from 'next/navigation';
import { toast } from "sonner";

import { useTranslations } from 'next-intl';

interface Project {
    id: string;
    name: string;
    description?: string;
    updated_at: string;
    content: any;
    preview_image?: string;
}

interface DashboardViewProps {
    projects: Project[];
}

export function DashboardView({ projects }: DashboardViewProps) {
    const t = useTranslations('dashboard');
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="w-full max-w-7xl mx-auto py-12 px-6 md:px-12">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6"
            >
                <div>
                    <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary backdrop-blur-sm mb-3">
                        <Sparkles className="mr-2 h-3 w-3" />
                        {t('tagline')}
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                        {t('myCreations')}
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        {t('manageProjects')}
                    </p>
                </div>
                <Button asChild size="lg" className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                    <Link href="/studio/new">
                        <Plus className="mr-2 h-5 w-5" />
                        {t('startProject')}
                    </Link>
                </Button>
            </motion.div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
                {/* New Site Card - Always first */}
                <motion.div variants={item}>
                    <Link href="/studio/new" className="block h-full">
                        <Card className="h-full border-dashed border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all cursor-pointer group flex flex-col items-center justify-center min-h-[280px]">
                            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Plus className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="font-bold text-xl mb-2">{t('newProjectTitle')}</h3>
                            <p className="text-muted-foreground text-center max-w-[200px]">
                                {t('newProjectDesc')}
                            </p>
                        </Card>
                    </Link>
                </motion.div>

                {/* Project Cards */}
                {projects.map((project) => (
                    <motion.div key={project.id} variants={item}>
                        <ProjectCard project={project} />
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}

function ProjectCard({ project }: { project: Project }) {
    const t = useTranslations('dashboard');
    const tProjects = useTranslations('projects');
    const tSettings = useTranslations('settings');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState(project.name);
    const [previewImage, setPreviewImage] = useState(project.preview_image || '');
    const router = useRouter();

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await updateProjectMetadata(project.id, {
                name,
                preview_image: previewImage
            });
            toast.success(t('projectUpdated'));
            setIsSettingsOpen(false);
            router.refresh();
        } catch (error) {
            toast.error(t('updateFailed'));
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden group relative">
            <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                    <DialogTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-md bg-background/80 backdrop-blur-sm hover:bg-background">
                            <Settings className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('projectSettings')}</DialogTitle>
                            <DialogDescription>
                                {t('editProjectDesc')}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdate} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">{tProjects('projectName')}</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={t('inputNamePlaceholder')}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="preview">{t('previewUrl')}</Label>
                                <Input
                                    id="preview"
                                    value={previewImage}
                                    onChange={(e) => setPreviewImage(e.target.value)}
                                    placeholder="https://..."
                                />
                                <p className="text-xs text-muted-foreground">
                                    {t('previewUrlDesc')}
                                </p>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {tSettings('saveChanges')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="aspect-video bg-muted relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                {project.preview_image ? (
                    <img
                        src={project.preview_image}
                        alt={project.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 bg-muted/50">
                        <Code2 className="h-12 w-12" />
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4 z-10">
                    <Button size="sm" variant="secondary" className="w-full font-medium shadow-lg" asChild>
                        <Link href={`/studio/${project.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            {t('continueEditing')}
                        </Link>
                    </Button>
                </div>
            </div>

            <CardHeader className="pb-2">
                <CardTitle className="truncate text-lg">
                    <Link href={`/studio/${project.id}`} className="hover:text-primary transition-colors">
                        {project.name}
                    </Link>
                </CardTitle>
                <CardDescription className="line-clamp-2 min-h-[2.5em]">
                    {project.description || t('noDesc')}
                </CardDescription>
            </CardHeader>

            <CardFooter className="pt-0 mt-auto text-xs text-muted-foreground flex items-center justify-between border-t border-border/30 p-4 bg-muted/20">
                <div className="flex items-center">
                    <Clock className="mr-1 h-3 w-3" />
                    {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                </div>
                <Link href={`/studio/${project.id}`} className="hover:text-primary transition-colors flex items-center font-medium">
                    {t('edit')} <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
            </CardFooter>
        </Card>
    );
}

function Code2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
        </svg>
    )
}
