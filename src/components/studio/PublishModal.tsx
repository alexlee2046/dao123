
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
    generateUniqueSubdomain,
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
    const paramId = params.siteId as string;
    const isParamIdValid = paramId && paramId !== 'new' && !paramId.startsWith('new:');
    const projectId = currentProject?.id || (isParamIdValid ? paramId : null);

    const [isOpen, setIsOpen] = useState(false);
    // Simplified steps: 'confirm' (initial) -> 'generating' (new) -> 'success' | 'manage'
    const [step, setStep] = useState<'confirm' | 'generating' | 'success' | 'manage'>('confirm');
    const [subdomain, setSubdomain] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [deployedUrl, setDeployedUrl] = useState('');
    const [deploymentStatus, setDeploymentStatus] = useState<string>('draft');

    // Status messsage for auto-generation
    const [statusMessage, setStatusMessage] = useState('');

    // Custom Domain State
    const [customDomain, setCustomDomain] = useState<string | null>(null);
    const [domainInput, setDomainInput] = useState('');
    const [isCheckingDomain, setIsCheckingDomain] = useState(false);
    const [domainConfig, setDomainConfig] = useState<any>(null);

    // 加载已有的子域名配置
    useEffect(() => {
        if (isOpen && projectId) {
            loadProjectSubdomain();
        }
    }, [isOpen, projectId]);

    const handleAddCustomDomain = async () => {
        if (!domainInput || !projectId) return;
        setIsCheckingDomain(true);
        try {
            const res = await fetch('/api/domain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: domainInput, siteId: projectId })
            });
            const data = await res.json();
            if (data.success) {
                setCustomDomain(domainInput);
                setDeployedUrl(`https://${domainInput}`);
                toast.success('Custom domain added');
                checkDomainStatus(domainInput);
            } else {
                toast.error(data.error || 'Failed to add domain');
            }
        } catch (e) {
            toast.error('Failed to add domain');
        } finally {
            setIsCheckingDomain(false);
        }
    };

    const handleRemoveCustomDomain = async () => {
        if (!customDomain || !projectId) return;
        if (!confirm('Are you sure you want to remove this domain?')) return;

        setIsCheckingDomain(true);
        try {
            const res = await fetch(`/api/domain?siteId=${projectId}&domain=${customDomain}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setCustomDomain(null);
                setDomainConfig(null);
                // Fallback to subdomain URL
                setDeployedUrl(getSubdomainUrl(subdomain));
                toast.success('Domain removed');
            } else {
                toast.error('Failed to remove domain');
            }
        } catch (e) {
            toast.error('Failed to remove domain');
        } finally {
            setIsCheckingDomain(false);
        }
    };

    const loadProjectSubdomain = async () => {
        if (!projectId) return;

        const supabase = createClient();
        const { data } = await supabase
            .from('projects')
            .select('subdomain, name, deployment_status, custom_domain')
            .eq('id', projectId)
            .single();

        if (data) {
            if (data.deployment_status) {
                setDeploymentStatus(data.deployment_status);
            }

            if (data.custom_domain) {
                setCustomDomain(data.custom_domain);
                // Optionally check config immediately
                checkDomainStatus(data.custom_domain);
            }

            if (data.subdomain) {
                setSubdomain(data.subdomain);
                if (data.deployment_status === 'deployed') {
                    setDeployedUrl(data.custom_domain ? `https://${data.custom_domain}` : getSubdomainUrl(data.subdomain));
                    setStep('manage');
                } else {
                    // exists but not deployed (draft with subdomain reserved)
                    setStep('confirm');
                }
            } else {
                // No subdomain yet
                setStep('confirm');
            }
        }
    };

    const checkDomainStatus = async (domain: string) => {
        try {
            const res = await fetch(`/api/domain/check?domain=${domain}`);
            const data = await res.json();
            setDomainConfig(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handlePublish = async () => {
        if (!projectId || !currentProject) return;

        setIsSaving(true);
        setStatusMessage(t('startingPublish') || 'Starting publish...');

        try {
            let finalSubdomain = subdomain;
            const supabase = createClient();

            // 1. If no subdomain assigned, generate one automatically
            if (!finalSubdomain) {
                setStep('generating');
                setStatusMessage(t('generatingUrl') || 'Generating unique URL...');

                // Use project name or fallback to 'site'
                const uniqueSub = await generateUniqueSubdomain(currentProject.name || 'site');
                finalSubdomain = uniqueSub;
                setSubdomain(uniqueSub);
            }

            // 2. Save to DB
            setStatusMessage(t('savingConfig') || 'Saving configuration...');

            const normalized = normalizeSubdomain(finalSubdomain);

            const { error } = await supabase
                .from('projects')
                .update({
                    subdomain: normalized,
                    deployment_status: 'deployed',
                })
                .eq('id', projectId);

            if (error) throw error;

            setStep('success');
            setDeployedUrl(getSubdomainUrl(normalized));
            setDeploymentStatus('deployed');
        } catch (error) {
            console.error('Error publishing:', error);
            toast.error(t('publishFailed') || 'Publish failed');
            // Check if it was a generation error or DB error
            setStep('confirm');
        } finally {
            setIsSaving(false);
            setStatusMessage('');
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
            setStep('confirm');
            setDeployedUrl('');
        } catch (error) {
            console.error('Error unpublishing:', error);
            toast.error(t('saveFailed'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(deployedUrl);
        toast.success(t('linkCopied') || "Link copied");
    };

    // Helper for generating Vercel deploy link (optional feature now)
    const handleVercelDeploy = () => {
        if (!projectId) return;
        // Use current subdomain if exists, or just project name as hint
        const subHint = subdomain || currentProject?.name || 'project';

        const url = getVercelDeployUrl({
            templateRepo: 'dao123-inc/dao123-template',
            subdomain: normalizeSubdomain(subHint),
            projectId: projectId
        });
        window.open(url, '_blank');
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
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
                        {/* Manage State (Already Deployed) */}
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

                                    <div className="grid grid-cols-1 gap-4">
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

                                        {/* Custom Domain Section */}
                                        <div className="pt-4 border-t space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Globe className="h-4 w-4 text-muted-foreground" />
                                                <h4 className="text-sm font-medium">Custom Domain</h4>
                                            </div>

                                            {customDomain ? (
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md border">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-sm font-mono">{customDomain}</span>
                                                            {domainConfig && !domainConfig.misconfigured ? (
                                                                <div className="flex items-center text-xs text-green-600 gap-1">
                                                                    <Check className="w-3 h-3" /> Valid Configuration
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center text-xs text-yellow-600 gap-1">
                                                                    <AlertCircle className="w-3 h-3" /> Configuration Needed
                                                                </div>
                                                            )}
                                                        </div>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleRemoveCustomDomain} disabled={isCheckingDomain}>
                                                            {isCheckingDomain ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                        </Button>
                                                    </div>

                                                    {domainConfig && domainConfig.misconfigured && (
                                                        <div className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded border border-yellow-200 dark:border-yellow-900/30">
                                                            <p className="font-medium mb-1 text-yellow-800 dark:text-yellow-200">DNS Configuration Required:</p>
                                                            <p className="mb-1">Please add a CNAME record to your DNS provider:</p>
                                                            <div className="bg-white dark:bg-black/20 p-2 rounded border flex flex-col gap-1 font-mono text-[10px] sm:text-xs">
                                                                <div className="flex justify-between">
                                                                    <span className="text-muted-foreground">Type:</span>
                                                                    <span>CNAME</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-muted-foreground">Name:</span>
                                                                    <span>{customDomain.startsWith('www') ? 'www' : '@'}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-muted-foreground">Value:</span>
                                                                    <span>cname.vercel-dns.com</span>
                                                                </div>
                                                            </div>
                                                            <Button size="sm" variant="outline" className="w-full mt-2 h-7 text-xs" onClick={() => checkDomainStatus(customDomain)}>
                                                                <RefreshCw className="w-3 h-3 mr-1" /> Refresh Status
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <p className="text-xs text-muted-foreground">Connect your own domain (e.g. www.mysite.com)</p>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            placeholder="example.com"
                                                            value={domainInput}
                                                            onChange={e => setDomainInput(e.target.value)}
                                                            className="flex-1 h-9 text-sm"
                                                        />
                                                        <Button size="sm" onClick={handleAddCustomDomain} disabled={isCheckingDomain || !domainInput}>
                                                            {isCheckingDomain ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                                        {t('close')}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}

                        {/* Confirm State (About to Publish) */}
                        {step === 'confirm' && (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-primary" />
                                        {t('confirmPublishTitle') || "Ready to Publish?"}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {t('confirmPublishDesc') || "Your site will be available on a unique subdomain."}
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="py-6 space-y-4">
                                    <div className="p-4 bg-muted/50 rounded-lg space-y-3 border">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">{t('pageCount')}</span>
                                            <span className="text-sm font-medium">{pageCount} Pages</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Domain</span>
                                            <span className="text-sm font-medium flex items-center gap-1">
                                                <span className="italic text-muted-foreground">auto-generated</span>
                                                .dao123.me
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-xs text-muted-foreground text-center px-4">
                                        {t('publishingAgree') || "By publishing, you agree to our Terms of Service."}
                                    </div>
                                </div>

                                <DialogFooter className="flex-col sm:flex-row gap-2">
                                    <div className="flex-1 flex justify-start">
                                        <Button variant="ghost" size="sm" onClick={handleVercelDeploy} className="text-xs text-muted-foreground h-8">
                                            <svg className="mr-1.5 h-3 w-3" viewBox="0 0 1155 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M577.344 0L1154.69 1000H0L577.344 0Z" fill="currentColor" />
                                            </svg>
                                            Vercel
                                        </Button>
                                    </div>
                                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                                        {t('cancel')}
                                    </Button>
                                    <Button onClick={handlePublish} disabled={isSaving} className="min-w-[120px]">
                                        {t('publishNow') || "Publish Now"}
                                        <Globe className="ml-2 h-4 w-4" />
                                    </Button>
                                </DialogFooter>
                            </>
                        )}

                        {/* Generating State */}
                        {step === 'generating' && (
                            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="relative">
                                    <div className="h-12 w-12 rounded-full border-4 border-primary/20 animate-spin border-t-primary" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-medium text-lg">{t('gettingReady') || "Getting your site ready..."}</h3>
                                    <p className="text-sm text-muted-foreground">{statusMessage}</p>
                                </div>
                            </div>
                        )}

                        {/* Success State */}
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
                                <div className="py-6 space-y-4">
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

                                    <div className="flex items-center justify-center">
                                        <div className="h-32 w-32 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-xs border border-dashed">
                                            QR Code Placeholder
                                        </div>
                                    </div>
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
