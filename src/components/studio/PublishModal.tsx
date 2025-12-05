"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, Copy, Globe, Loader2, AlertCircle, ExternalLink, Sparkles, Save, Lock, Trash2, RefreshCw } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import {
    validateSubdomain,
    normalizeSubdomain,
    suggestSubdomain,
    getSubdomainUrl,
    checkSubdomainAvailability,
    getVercelDeployUrl,
} from '@/lib/subdomain';
import { useStudioStore } from "@/lib/store";
import { toast } from "sonner";

export function PublishModal({ children, pageCount = 1 }: { children: React.ReactNode, pageCount?: number }) {
    const t = useTranslations('publish');
    const params = useParams();
    const router = useRouter();
    const { currentProject } = useStudioStore();

    // Determine the valid project ID. 
    // If params.siteId is 'new' or starts with 'new:', it's not a valid DB ID yet.
    // We prefer currentProject.id if available.
    const paramId = params.siteId as string;
    const isParamIdValid = paramId && paramId !== 'new' && !paramId.startsWith('new:');
    const projectId = currentProject?.id || (isParamIdValid ? paramId : null);

    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<'choose' | 'config' | 'deploying' | 'success' | 'manage'>('choose');
    const [subdomain, setSubdomain] = useState('');
    const [subdomainError, setSubdomainError] = useState('');
    const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [deployedUrl, setDeployedUrl] = useState('');
    const [deploymentStatus, setDeploymentStatus] = useState<string>('draft');

    // 加载已有的子域名配置
    useEffect(() => {
        if (isOpen && projectId) {
            loadProjectSubdomain();
        }
    }, [isOpen, projectId]);

    const loadProjectSubdomain = async () => {
        if (!projectId) return;

        const supabase = createClient();
        const { data } = await supabase
            .from('projects')
            .select('subdomain, name, deployment_status')
            .eq('id', projectId)
            .single();

        if (data) {
            if (data.deployment_status) {
                setDeploymentStatus(data.deployment_status);
            }

            if (data.subdomain) {
                setSubdomain(data.subdomain);
                setIsAvailable(true);
                if (data.deployment_status === 'deployed') {
                    setDeployedUrl(getSubdomainUrl(data.subdomain));
                    setStep('manage');
                }
            } else if (data.name) {
                // 自动建议子域名
                const suggested = suggestSubdomain(data.name);
                setSubdomain(suggested);
                // 自动检查可用性
                checkAvailability(suggested);
            }
        }
    };

    // 实时验证子域名
    useEffect(() => {
        const normalized = normalizeSubdomain(subdomain);

        if (!normalized) {
            setSubdomainError('');
            setIsAvailable(null);
            return;
        }

        const validation = validateSubdomain(normalized);
        if (!validation.valid) {
            setSubdomainError(validation.error || '');
            setIsAvailable(false);
            return;
        }

        // 格式正确，检查可用性
        setSubdomainError('');
        const timeoutId = setTimeout(() => {
            checkAvailability(normalized);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [subdomain]);

    const checkAvailability = async (normalizedSubdomain: string) => {
        // If checking the same subdomain that is already assigned to this project, it's available
        if (deploymentStatus === 'deployed' && normalizedSubdomain === subdomain) {
            setIsAvailable(true);
            return;
        }

        setIsCheckingAvailability(true);

        try {
            const result = await checkSubdomainAvailability(normalizedSubdomain);
            setIsAvailable(result.available);
            if (!result.available && result.error) {
                setSubdomainError(result.error);
            }
        } catch (error) {
            console.error('Error checking availability:', error);
            setSubdomainError(t('checkFailed'));
            setIsAvailable(null);
        } finally {
            setIsCheckingAvailability(false);
        }
    };

    const handleQuickPublish = async () => {
        // 快速发布到 dao123 子域名
        if (!isAvailable || subdomainError || !projectId) {
            return;
        }

        setIsSaving(true);

        try {
            const supabase = createClient();
            const normalized = normalizeSubdomain(subdomain);

            // 保存子域名到数据库
            const { error } = await supabase
                .from('projects')
                .update({
                    subdomain: normalized,
                    deployment_status: 'deployed', // Directly set to deployed for simulation
                })
                .eq('id', projectId);

            if (error) throw error;

            setStep('success');
            setDeployedUrl(getSubdomainUrl(normalized));
            setDeploymentStatus('deployed');
        } catch (error) {
            console.error('Error saving subdomain:', error);
            alert(t('saveFailed'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleUnpublish = async () => {
        if (!projectId) return;

        if (!confirm(t('unpublishConfirmDesc'))) {
            return;
        }

        setIsSaving(true);

        try {
            const supabase = createClient();

            // Update status to draft
            const { error } = await supabase
                .from('projects')
                .update({
                    deployment_status: 'draft',
                })
                .eq('id', projectId);

            if (error) throw error;

            toast.success(t('unpublishedSuccess'));
            setDeploymentStatus('draft');
            setStep('choose');
            setDeployedUrl('');
        } catch (error) {
            console.error('Error unpublishing:', error);
            toast.error(t('saveFailed'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleVercelDeploy = async () => {
        if (!projectId || !subdomain) return;

        const url = getVercelDeployUrl({
            templateRepo: 'dao123-inc/dao123-template', // Placeholder
            subdomain: normalizeSubdomain(subdomain),
            projectId: projectId
        });

        window.open(url, '_blank');
        setStep('deploying');
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(deployedUrl);
        toast.success(t('linkCopied') || "Link copied");
    };

    const handleReset = () => {
        if (deploymentStatus === 'deployed') {
            setStep('manage');
        } else {
            setStep('choose');
        }
        setSubdomainError('');
        // Don't reset isAvailable if we have a valid subdomain
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                {!projectId ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Save className="h-5 w-5 text-yellow-500" />
                                {t('saveRequiredTitle') || "Save Required"}
                            </DialogTitle>
                            <DialogDescription>
                                {t('saveRequiredDesc') || "Please save your project before publishing."}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Alert variant="default" className="bg-yellow-50 border-yellow-200">
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                <AlertDescription className="text-yellow-800">
                                    {t('saveRequiredAlert')}
                                </AlertDescription>
                            </Alert>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setIsOpen(false)}>
                                {t('close')}
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        {step === 'manage' && (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Globe className="h-5 w-5 text-primary" />
                                        {t('manageTitle')}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {t('manageDesc')}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4 space-y-6">
                                    <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                                <span className="text-sm font-medium text-green-900 dark:text-green-100">
                                                    {t('statusDeployed')}
                                                </span>
                                            </div>
                                            <Button variant="ghost" size="sm" asChild className="h-6 text-xs">
                                                <a href={deployedUrl} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="mr-1 h-3 w-3" />
                                                    {t('visitSite')}
                                                </a>
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 text-sm bg-white dark:bg-black/50 px-3 py-2 rounded border truncate">
                                                {deployedUrl}
                                            </code>
                                            <Button size="icon" variant="ghost" onClick={handleCopy}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start"
                                            onClick={() => setStep('choose')}
                                        >
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            {t('update')}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                                            onClick={handleUnpublish}
                                            disabled={isSaving}
                                        >
                                            {isSaving ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="mr-2 h-4 w-4" />
                                            )}
                                            {t('unpublish')}
                                        </Button>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                                        {t('close')}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}

                        {step === 'choose' && (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-primary" />
                                        {t('title')}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {t('description')}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    {/* 配置子域名 */}
                                    <div className="space-y-2">
                                        <Label htmlFor="subdomain">{t('customSubdomain')}</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="subdomain"
                                                value={subdomain}
                                                onChange={(e) => setSubdomain(e.target.value)}
                                                placeholder={t('subdomainPlaceholder')}
                                                className={subdomainError ? 'border-red-500' : ''}
                                            />
                                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                                                .dao123.me
                                            </span>
                                        </div>

                                        {/* 验证状态 */}
                                        {isCheckingAvailability && (
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                {t('checking')}
                                            </p>
                                        )}

                                        {!isCheckingAvailability && isAvailable === true && subdomain && (
                                            <p className="text-sm text-green-600 flex items-center gap-1">
                                                <Check className="h-3 w-3" />
                                                {t('available')}
                                            </p>
                                        )}

                                        {!isCheckingAvailability && subdomainError && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {subdomainError}
                                            </p>
                                        )}

                                        {/* 预览完整 URL */}
                                        {subdomain && !subdomainError && (
                                            <p className="text-xs text-muted-foreground">
                                                {t('deployTo')} <span className="font-medium">{getSubdomainUrl(normalizeSubdomain(subdomain))}</span>
                                            </p>
                                        )}
                                    </div>

                                    {/* 发布选项 */}
                                    <div className="space-y-2 pt-2">
                                        <Button
                                            onClick={() => setStep('config')}
                                            className="w-full"
                                            disabled={!isAvailable || !!subdomainError || !subdomain}
                                        >
                                            <Globe className="mr-2 h-4 w-4" />
                                            {t('publishToDao')}
                                        </Button>

                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <span className="w-full border-t" />
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
                                                <span className="bg-background px-2 text-muted-foreground">{t('or')}</span>
                                            </div>
                                        </div>

                                        <div className="relative group">
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                onClick={handleVercelDeploy}
                                                disabled={!isAvailable || !!subdomainError || !subdomain}
                                            >
                                                <svg className="mr-2 h-3 w-3" viewBox="0 0 1155 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M577.344 0L1154.69 1000H0L577.344 0Z" fill="currentColor" />
                                                </svg>
                                                {t('deployToVercel')}
                                            </Button>
                                        </div>

                                        <Alert className="bg-muted/50 border-muted">
                                            <Sparkles className="h-4 w-4 text-primary" />
                                            <AlertDescription className="text-xs text-muted-foreground">
                                                {t('vercelDesc')}
                                            </AlertDescription>
                                        </Alert>
                                    </div>
                                </div>
                                {deploymentStatus === 'deployed' && (
                                    <DialogFooter>
                                        <Button variant="ghost" onClick={() => setStep('manage')}>
                                            {t('back')}
                                        </Button>
                                    </DialogFooter>
                                )}
                            </>
                        )}

                        {step === 'config' && (
                            <>
                                <DialogHeader>
                                    <DialogTitle>{t('confirmTitle')}</DialogTitle>
                                    <DialogDescription>
                                        {t('confirmDesc')}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                    <div className="p-4 bg-muted rounded-lg space-y-3">
                                        <div className="flex justify-between items-start">
                                            <span className="text-sm text-muted-foreground">{t('siteUrl')}</span>
                                            <span className="text-sm font-medium text-right break-all">
                                                {getSubdomainUrl(normalizeSubdomain(subdomain))}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">{t('pageCount')}</span>
                                            <span className="text-sm font-medium">{pageCount} {t('pageCount').endsWith('Count') ? '' : '个'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">{t('deployMethod')}</span>
                                            <span className="text-sm font-medium">{t('daoHosted')}</span>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="gap-2">
                                    <Button variant="outline" onClick={handleReset}>
                                        {t('back')}
                                    </Button>
                                    <Button onClick={handleQuickPublish} disabled={isSaving}>
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                {t('publishing')}
                                            </>
                                        ) : (
                                            t('confirm')
                                        )}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}

                        {step === 'deploying' && (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                                        {t('deployingVercel')}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {t('vercelStepsDesc')}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription className="text-sm space-y-2">
                                            <p className="font-medium">{t('stepsTitle')}</p>
                                            <ol className="list-decimal list-inside space-y-1 text-xs">
                                                <li>{t('step1')}</li>
                                                <li>{t('step2')}</li>
                                                <li>{t('step3')}</li>
                                                <li>{t('step4')}<br />
                                                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                                        {normalizeSubdomain(subdomain)}.dao123.me
                                                    </code>
                                                </li>
                                            </ol>
                                        </AlertDescription>
                                    </Alert>

                                    <div className="p-4 bg-muted rounded-lg">
                                        <p className="text-sm font-medium mb-2">{t('yourSubdomain')}</p>
                                        <code className="text-sm bg-background px-2 py-1 rounded block">
                                            {getSubdomainUrl(normalizeSubdomain(subdomain))}
                                        </code>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                                        {t('gotIt')}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}

                        {step === 'success' && (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-green-600">
                                        <Check className="h-5 w-5" />
                                        {t('successTitle')}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {t('successDesc')}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                    <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Globe className="h-4 w-4 text-green-600" />
                                            <span className="text-sm font-medium text-green-900 dark:text-green-100">
                                                {t('yourSiteUrl')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 text-sm bg-white dark:bg-gray-900 px-3 py-2 rounded border truncate">
                                                {deployedUrl}
                                            </code>
                                            <Button size="icon" variant="ghost" onClick={handleCopy}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription className="text-xs">
                                            {t('simulationNote')}
                                        </AlertDescription>
                                    </Alert>
                                </div>
                                <DialogFooter className="gap-2">
                                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                                        {t('close')}
                                    </Button>
                                    <Button asChild>
                                        <a href={deployedUrl} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            {t('visitSite')}
                                        </a>
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
