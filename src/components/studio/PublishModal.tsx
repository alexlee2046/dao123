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
import { Check, Copy, Globe, Loader2, AlertCircle, ExternalLink, Sparkles } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import {
    validateSubdomain,
    normalizeSubdomain,
    suggestSubdomain,
    getSubdomainUrl,
    checkSubdomainAvailability,
    getVercelDeployUrl,
} from '@/lib/subdomain';

export function PublishModal({ children, pageCount = 1 }: { children: React.ReactNode, pageCount?: number }) {
    const t = useTranslations('publish');
    const params = useParams();
    const router = useRouter();
    const projectId = params.siteId as string;

    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<'choose' | 'config' | 'deploying' | 'success'>('choose');
    const [subdomain, setSubdomain] = useState('');
    const [subdomainError, setSubdomainError] = useState('');
    const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [deployedUrl, setDeployedUrl] = useState('');

    // 加载已有的子域名配置
    useEffect(() => {
        if (isOpen && projectId) {
            loadProjectSubdomain();
        }
    }, [isOpen, projectId]);

    const loadProjectSubdomain = async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from('projects')
            .select('subdomain, name, deployment_status')
            .eq('id', projectId)
            .single();

        if (data) {
            if (data.subdomain) {
                setSubdomain(data.subdomain);
                setIsAvailable(true);
                if (data.deployment_status === 'deployed') {
                    setDeployedUrl(getSubdomainUrl(data.subdomain));
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
        if (!isAvailable || subdomainError) {
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
                    deployment_status: 'draft',
                })
                .eq('id', projectId);

            if (error) throw error;

            setStep('success');
            setDeployedUrl(getSubdomainUrl(normalized));
        } catch (error) {
            console.error('Error saving subdomain:', error);
            alert(t('saveFailed'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleVercelDeploy = async () => {
        // 部署到 Vercel
        if (!subdomain || !isAvailable) {
            setStep('config');
            return;
        }

        setIsSaving(true);

        try {
            const supabase = createClient();
            const normalized = normalizeSubdomain(subdomain);

            // 保存子域名和部署状态
            const { error } = await supabase
                .from('projects')
                .update({
                    subdomain: normalized,
                    deployment_status: 'deploying',
                })
                .eq('id', projectId);

            if (error) throw error;

            // 记录部署历史
            await supabase.from('deployment_history').insert({
                project_id: projectId,
                subdomain: normalized,
                status: 'pending',
            });

            // 获取环境变量
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            // 生成 Vercel 部署 URL
            const templateRepo = 'YOUR_GITHUB_USERNAME/dao123-viewer-template'; // TODO: 替换为实际的模板仓库
            const vercelUrl = getVercelDeployUrl({
                templateRepo,
                subdomain: normalized,
                projectId,
            });

            // 打开 Vercel 部署页面
            window.open(vercelUrl, '_blank', 'noopener,noreferrer');

            // 显示部署指南
            setStep('deploying');

        } catch (error) {
            console.error('Error initiating deployment:', error);
            alert(t('startDeployFailed'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(deployedUrl);
    };

    const handleReset = () => {
        setStep('choose');
        setSubdomainError('');
        setIsAvailable(null);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
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
                                        placeholder="my-awesome-site"
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

                                <Button
                                    variant="outline"
                                    onClick={handleVercelDeploy}
                                    className="w-full"
                                    disabled={!isAvailable || !!subdomainError || !subdomain || isSaving}
                                >
                                    {isSaving ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <svg className="mr-2 h-4 w-4" viewBox="0 0 1155 1000" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M577.344 0L1154.69 1000H0L577.344 0Z" />
                                        </svg>
                                    )}
                                    {t('deployToVercel')}
                                </Button>

                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="text-xs">
                                        {t('vercelDesc')}
                                    </AlertDescription>
                                </Alert>
                            </div>
                        </div>
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
            </DialogContent>
        </Dialog>
    );
}
