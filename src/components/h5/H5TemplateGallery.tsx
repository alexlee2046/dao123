'use client';

import { useState } from 'react';
import { Link } from '@/components/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Heart, Gift, Briefcase, PartyPopper, Sparkles, Crown, Loader2, LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from 'next-intl';
import { toast } from "sonner";
import { createH5Project, type H5Template } from '@/lib/actions/h5';

interface H5TemplateGalleryProps {
    templates: H5Template[];
    currentCategory: string;
}

const categories = [
    { id: 'all', icon: LayoutGrid },
    { id: 'wedding', icon: Heart },
    { id: 'birthday', icon: Gift },
    { id: 'business', icon: Briefcase },
    { id: 'holiday', icon: PartyPopper },
];

export function H5TemplateGallery({ templates, currentCategory }: H5TemplateGalleryProps) {
    const t = useTranslations('h5');
    const router = useRouter();
    const [selectedTemplate, setSelectedTemplate] = useState<H5Template | null>(null);
    const [projectName, setProjectName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleSelectTemplate = (template: H5Template) => {
        setSelectedTemplate(template);
        setProjectName(template.name);
        setIsDialogOpen(true);
    };

    const handleCreateProject = async () => {
        if (!selectedTemplate || !projectName.trim()) return;

        setIsCreating(true);
        try {
            const result = await createH5Project({
                name: projectName,
                templateId: selectedTemplate.id
            });

            if (result) {
                toast.success(t('projectCreated'));
                router.push(`/h5/${result.id}`);
            }
        } catch (error) {
            console.error(error);
            toast.error(t('createFailed'));
        } finally {
            setIsCreating(false);
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
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/h5">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">{t('selectTemplate')}</h1>
                    <p className="text-muted-foreground">{t('selectTemplateDesc')}</p>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = currentCategory === cat.id;
                    return (
                        <Link
                            key={cat.id}
                            href={cat.id === 'all' ? '/h5/templates' : `/h5/templates?category=${cat.id}`}
                        >
                            <Button
                                variant={isActive ? "default" : "outline"}
                                className={isActive ? "bg-gradient-to-r from-pink-500 to-purple-500" : ""}
                            >
                                <Icon className="h-4 w-4 mr-2" />
                                {t(`categories.${cat.id}`)}
                            </Button>
                        </Link>
                    );
                })}
            </div>

            {/* Templates Grid */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
                {/* AI 生成卡片 - 始终在第一个 */}
                <motion.div variants={item}>
                    <Card
                        className="cursor-pointer hover:shadow-xl transition-all group overflow-hidden border-dashed border-2 border-pink-500/30 bg-gradient-to-br from-pink-500/5 to-purple-500/5"
                        onClick={() => {
                            setSelectedTemplate(null);
                            setProjectName('');
                            setIsDialogOpen(true);
                        }}
                    >
                        <div className="aspect-[9/16] max-h-[280px] flex items-center justify-center">
                            <div className="text-center p-6">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <Sparkles className="h-8 w-8 text-white" />
                                </div>
                                <h3 className="font-bold text-lg mb-2">{t('aiGenerate')}</h3>
                                <p className="text-sm text-muted-foreground">{t('aiGenerateDesc')}</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* 模板卡片 */}
                {templates.map((template) => (
                    <motion.div key={template.id} variants={item}>
                        <Card
                            className="cursor-pointer hover:shadow-xl transition-all group overflow-hidden"
                            onClick={() => handleSelectTemplate(template)}
                        >
                            <div className="aspect-[9/16] max-h-[280px] bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 relative overflow-hidden">
                                {template.thumbnail ? (
                                    <img
                                        src={template.thumbnail}
                                        alt={template.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="text-6xl">
                                            {template.category === 'wedding' && '💒'}
                                            {template.category === 'birthday' && '🎂'}
                                            {template.category === 'business' && '🏢'}
                                            {template.category === 'holiday' && '🎉'}
                                        </div>
                                    </div>
                                )}

                                {/* Premium Badge */}
                                {template.is_premium && (
                                    <Badge className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500 border-0">
                                        <Crown className="h-3 w-3 mr-1" />
                                        {template.price} {t('credits')}
                                    </Badge>
                                )}

                                {/* Free Badge */}
                                {!template.is_premium && (
                                    <Badge className="absolute top-2 right-2 bg-green-500 border-0">
                                        {t('free')}
                                    </Badge>
                                )}
                            </div>
                            <CardContent className="p-4">
                                <h3 className="font-semibold truncate">{template.name}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                    {template.description}
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>

            {templates.length === 0 && (
                <div className="text-center py-20">
                    <p className="text-muted-foreground">{t('noTemplates')}</p>
                </div>
            )}

            {/* Create Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {selectedTemplate ? t('createFromTemplate') : t('createBlank')}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedTemplate
                                ? t('createFromTemplateDesc', { name: selectedTemplate.name })
                                : t('createBlankDesc')
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="projectName">{t('projectName')}</Label>
                        <Input
                            id="projectName"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder={t('projectNamePlaceholder')}
                            className="mt-2"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            {t('cancel')}
                        </Button>
                        <Button
                            onClick={handleCreateProject}
                            disabled={isCreating || !projectName.trim()}
                            className="bg-gradient-to-r from-pink-500 to-purple-500"
                        >
                            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('create')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
