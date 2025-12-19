'use client';

import { Link } from '@/components/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Plus, Edit, Eye, Sparkles, Clock, ArrowRight, Settings,
    Loader2, Zap, CreditCard, FolderOpen, Palette, Heart,
    Image as ImageIcon, Video, Globe, Mail
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from 'react';
import { updateProjectMetadata, createProject } from "@/lib/actions/projects";
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { getCredits } from "@/lib/actions/credits";
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
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [credits, setCredits] = useState<number | null>(null);

    useEffect(() => {
        getCredits().then(setCredits).catch(console.error);
    }, []);

    const handleQuickStart = async () => {
        setIsLoading(true);
        try {
            const dateStr = new Date().toLocaleDateString();
            const newProject = await createProject(`${t('untitledProject')} ${dateStr}`, "Quick Start Project");

            if (newProject?.id) {
                toast.success(t('projectCreated'));
                router.push(`/studio/${newProject.id}`);
            }
        } catch (error) {
            console.error("Quick start failed:", error);
            toast.error(t('createFailed'));
            setIsLoading(false);
        }
    };

    // Quick Actions Grid - 6 core features
    const quickActions = [
        {
            icon: Zap,
            label: t('quickStart'),
            description: t('quickActions.aiWebsite'),
            onClick: handleQuickStart,
            color: "from-violet-500 to-purple-500"
        },
        {
            icon: Palette,
            label: t('quickActions.studio'),
            description: t('quickActions.studioDesc'),
            href: "/studio",
            color: "from-blue-500 to-indigo-500"
        },
        {
            icon: Heart,
            label: t('quickActions.h5Invitation'),
            description: t('quickActions.makeEventPage'),
            href: "/h5",
            color: "from-pink-500 to-rose-500"
        },
        {
            icon: Mail,
            label: t('quickActions.daoMail'),
            description: t('quickActions.emailMarketing'),
            href: "/mail",
            color: "from-green-500 to-emerald-500"
        },
        {
            icon: ImageIcon,
            label: t('quickActions.aiImageTitle'),
            description: t('quickActions.textToImage'),
            href: "/generate/image",
            color: "from-orange-500 to-amber-500"
        },
        {
            icon: Globe,
            label: t('quickActions.community'),
            description: t('quickActions.discoverInspiration'),
            href: "/community",
            color: "from-cyan-500 to-teal-500"
        },
    ];

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
                    <Sparkles className="mr-2 h-3 w-3" />
                    {t('tagline')}
                </div>
                <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                    {t('myCreations')}
                </h1>
                <p className="text-muted-foreground mt-1">{t('manageProjects')}</p>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid gap-4 md:grid-cols-3 mb-8"
            >
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <CreditCard className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">{t('credits')}</p>
                            <p className="text-2xl font-bold">{credits !== null ? credits : '--'}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <FolderOpen className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">{t('totalProjects')}</p>
                            <p className="text-2xl font-bold">{projects.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                            <Clock className="h-6 w-6 text-green-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">{t('recentActivity')}</p>
                            <p className="text-2xl font-bold">
                                {projects.length > 0
                                    ? formatDistanceToNow(new Date(projects[0].updated_at), { addSuffix: true })
                                    : '--'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Quick Actions Grid */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="mb-8"
            >
                <h2 className="text-lg font-semibold mb-4">{t('quickEntry')}</h2>
                <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                    {quickActions.map((action, index) => {
                        const cardContent = (
                            <Card className="h-full cursor-pointer hover:shadow-lg transition-all duration-300 group border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                                <CardContent className="p-4 flex flex-col items-center text-center">
                                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                        {isLoading && action.onClick ? (
                                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                                        ) : (
                                            <action.icon className="h-6 w-6 text-white" />
                                        )}
                                    </div>
                                    <p className="font-medium text-sm group-hover:text-primary transition-colors">{action.label}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                                </CardContent>
                            </Card>
                        );

                        return (
                            <motion.div key={index} variants={item}>
                                {action.href ? (
                                    <Link href={action.href} className="block">
                                        {cardContent}
                                    </Link>
                                ) : (
                                    <div onClick={action.onClick} className="block">
                                        {cardContent}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Recent Projects - Horizontal Scroll */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">{t('recentProjects')}</h2>
                    {projects.length > 4 && (
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/projects">
                                {t('viewAll')} <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                </div>

                {projects.length === 0 ? (
                    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                        <CardContent className="p-8 text-center">
                            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                                <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <p className="text-muted-foreground mb-4">{t('newProjectDesc')}</p>
                            <Button onClick={handleQuickStart} disabled={isLoading}>
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="mr-2 h-4 w-4" />
                                )}
                                {t('quickStart')}
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                        {projects.slice(0, 8).map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                )}
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
        <Card className="flex-shrink-0 w-[280px] snap-start flex flex-col hover:shadow-lg transition-shadow duration-300 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden group relative">
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

            <div className="aspect-video bg-muted relative overflow-hidden">
                {project.preview_image ? (
                    <img
                        src={project.preview_image}
                        alt={project.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 bg-muted/50">
                        <Code2 className="h-10 w-10" />
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <Button size="sm" variant="secondary" className="w-full font-medium shadow-lg" asChild>
                        <Link href={`/studio/${project.id}`}>
                            <Edit className="mr-2 h-3 w-3" />
                            {t('continueEditing')}
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

            <CardFooter className="p-3 pt-0 text-xs text-muted-foreground flex items-center justify-between">
                <div className="flex items-center">
                    <Clock className="mr-1 h-3 w-3" />
                    {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                </div>
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
