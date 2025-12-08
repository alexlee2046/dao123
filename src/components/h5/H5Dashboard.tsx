'use client';

import { Link } from '@/components/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Eye, Sparkles, Clock, ArrowRight, Heart, Gift, Briefcase, PartyPopper, LayoutTemplate } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { motion } from "framer-motion";
import { useTranslations } from 'next-intl';
import type { H5Project } from '@/lib/actions/h5';

interface H5DashboardProps {
    projects: H5Project[];
}

const categoryIcons: Record<string, React.ReactNode> = {
    wedding: <Heart className="h-5 w-5" />,
    birthday: <Gift className="h-5 w-5" />,
    business: <Briefcase className="h-5 w-5" />,
    holiday: <PartyPopper className="h-5 w-5" />,
};

export function H5Dashboard({ projects }: H5DashboardProps) {
    const t = useTranslations('h5');

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
                    <div className="inline-flex items-center rounded-full border border-pink-500/20 bg-pink-500/5 px-3 py-1 text-xs font-medium text-pink-500 backdrop-blur-sm mb-3">
                        <Sparkles className="mr-2 h-3 w-3" />
                        {t('tagline')}
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
                        {t('title')}
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        {t('subtitle')}
                    </p>
                </div>
                <Button asChild size="lg" className="rounded-full shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 transition-all bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                    <Link href="/h5/templates">
                        <LayoutTemplate className="mr-2 h-5 w-5" />
                        {t('selectTemplate')}
                    </Link>
                </Button>
            </motion.div>

            {/* 快捷创建卡片 */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
            >
                <QuickCreateCard
                    href="/h5/templates?category=wedding"
                    icon={<Heart className="h-6 w-6" />}
                    label={t('categories.wedding')}
                    color="from-rose-400 to-pink-500"
                />
                <QuickCreateCard
                    href="/h5/templates?category=birthday"
                    icon={<Gift className="h-6 w-6" />}
                    label={t('categories.birthday')}
                    color="from-amber-400 to-orange-500"
                />
                <QuickCreateCard
                    href="/h5/templates?category=business"
                    icon={<Briefcase className="h-6 w-6" />}
                    label={t('categories.business')}
                    color="from-blue-400 to-indigo-500"
                />
                <QuickCreateCard
                    href="/h5/templates?category=holiday"
                    icon={<PartyPopper className="h-6 w-6" />}
                    label={t('categories.holiday')}
                    color="from-green-400 to-emerald-500"
                />
            </motion.div>

            {/* 我的作品 */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold">{t('myWorks')}</h2>
                <p className="text-muted-foreground">{t('myWorksDesc')}</p>
            </div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
                {/* 新建卡片 */}
                <motion.div variants={item}>
                    <Link href="/h5/templates" className="block h-full">
                        <Card className="h-full border-dashed border-2 border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/10 hover:border-pink-500/40 transition-all cursor-pointer group flex flex-col items-center justify-center min-h-[280px]">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Plus className="h-8 w-8 text-pink-500" />
                            </div>
                            <h3 className="font-bold text-xl mb-2">{t('createNew')}</h3>
                            <p className="text-muted-foreground text-center max-w-[200px]">
                                {t('createNewDesc')}
                            </p>
                        </Card>
                    </Link>
                </motion.div>

                {/* 项目卡片 */}
                {projects.map((project) => (
                    <motion.div key={project.id} variants={item}>
                        <H5ProjectCard project={project} />
                    </motion.div>
                ))}

                {projects.length === 0 && (
                    <motion.div variants={item} className="col-span-2 text-center py-12">
                        <p className="text-muted-foreground">{t('noProjects')}</p>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}

function QuickCreateCard({ href, icon, label, color }: {
    href: string;
    icon: React.ReactNode;
    label: string;
    color: string;
}) {
    return (
        <Link href={href}>
            <Card className="group cursor-pointer hover:shadow-lg transition-all border-0 overflow-hidden">
                <div className={`h-24 bg-gradient-to-br ${color} flex items-center justify-center text-white group-hover:scale-105 transition-transform`}>
                    {icon}
                </div>
                <CardContent className="p-3 text-center">
                    <p className="font-medium text-sm">{label}</p>
                </CardContent>
            </Card>
        </Link>
    );
}

function H5ProjectCard({ project }: { project: H5Project }) {
    const t = useTranslations('h5');

    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden group">
            <div className="aspect-[9/16] max-h-[200px] bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 relative overflow-hidden">
                {project.preview_image ? (
                    <img
                        src={project.preview_image}
                        alt={project.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="text-4xl">📱</div>
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <div className="flex gap-2 w-full">
                        <Button size="sm" variant="secondary" className="flex-1" asChild>
                            <Link href={`/h5/${project.id}`}>
                                <Edit className="mr-1 h-3 w-3" />
                                {t('edit')}
                            </Link>
                        </Button>
                        <Button size="sm" variant="secondary" asChild>
                            <Link href={`/h5/view/${project.id}`} target="_blank">
                                <Eye className="h-3 w-3" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            <CardHeader className="pb-2">
                <CardTitle className="truncate text-lg">
                    <Link href={`/h5/${project.id}`} className="hover:text-pink-500 transition-colors">
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
                <Link href={`/h5/${project.id}`} className="hover:text-pink-500 transition-colors flex items-center font-medium">
                    {t('edit')} <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
            </CardFooter>
        </Card>
    );
}
