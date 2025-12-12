
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
import { cn } from "@/lib/utils";

export function PublishModal({ children }: { children: React.ReactNode }) {
    const t = useTranslations('publish');
    const params = useParams();
    const router = useRouter();
    const { currentProject, pages } = useStudioStore();
    const pageCount = pages.length;

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
    };

    const steps = [
        { id: 'choose', label: t('title') },
        { id: 'config', label: t('confirmTitle') },
        { id: 'success', label: t('successTitle') },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === step) !== -1
        ? steps.findIndex(s => s.id === step)
        : (step === 'deploying' ? 1 : (step === 'manage' ? 2 : 0));

    // Helper for Stepper UI
    const Stepper = () => (
        <div className="flex items-center justify-between mb-8 px-2 relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-muted -z-10" />
            <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary transition-all duration-500 ease-in-out -z-10"
                style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}% ` }}
            />

            {steps.map((s, idx) => {
                const isCompleted = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                    <div key={s.id} className="flex flex-col items-center gap-2 bg-background px-2">
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                            isCompleted ? "bg-primary border-primary text-primary-foreground" :
                                isCurrent ? "border-primary text-primary bg-background shadow-md scale-110" :
                                    "border-muted text-muted-foreground bg-background"
                        )}>
                            {isCompleted ? <Check className="w-4 h-4" /> :
                                isCurrent ? <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" /> :
                                    <span className="text-xs">{idx + 1}</span>}
                        </div>
                        {/* <span className={cn(
                            "text-[10px] font-medium transition-colors absolute -bottom-6 w-20 text-center",
                            isCurrent ? "text-primary" : "text-muted-foreground"
                        )}>{s.label}</span> */}
                    </div>
                );
            })}
        </div>
    );

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
                        </DialogHeader>
                        <div className="py-6">
                            <Alert variant="default" className="bg-yellow-50/50 border-yellow-200/50 dark:bg-yellow-900/10 dark:border-yellow-900/30">
                                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                                <AlertDescription className="text-yellow-800 dark:text-yellow-200 ml-2">
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
                    <div className="pt-2">
                        {step !== 'manage' && step !== 'deploying' && <div className="mt-2"><Stepper /></div>}

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
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
