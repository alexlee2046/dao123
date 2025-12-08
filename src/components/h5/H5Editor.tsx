'use client';

import { useState, useCallback } from 'react';
import { Link } from '@/components/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    ArrowLeft, Save, Eye, Share2, Smartphone, Settings,
    Type, Image, Music, Sparkles, Loader2, Copy, QrCode,
    Check
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from 'next-intl';
import { updateH5Project, publishH5Project, type H5Project, type H5Config } from '@/lib/actions/h5';
import QRCode from 'qrcode';

interface H5EditorProps {
    project: H5Project;
}

export function H5Editor({ project: initialProject }: H5EditorProps) {
    const t = useTranslations('h5');
    const router = useRouter();

    const [project, setProject] = useState(initialProject);
    const [content, setContent] = useState(initialProject.content);
    const [h5Config, setH5Config] = useState<H5Config>(initialProject.h5_config || {});
    const [name, setName] = useState(initialProject.name);
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState('');

    // 获取当前页面内容
    const currentPage = content?.pages?.[0] || { elements: [], background: '#ffffff' };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateH5Project(project.id, {
                name,
                content,
                h5_config: h5Config
            });
            toast.success(t('saved'));
        } catch (error) {
            console.error(error);
            toast.error(t('saveFailed'));
        } finally {
            setIsSaving(false);
        }
    };

    const handlePublish = async () => {
        setIsPublishing(true);
        try {
            // 先保存
            await updateH5Project(project.id, {
                name,
                content,
                h5_config: h5Config
            });

            // 发布
            const result = await publishH5Project(project.id);
            setShareUrl(result.url);

            // 生成二维码
            const qr = await QRCode.toDataURL(result.url, {
                width: 200,
                margin: 2,
                color: { dark: '#000000', light: '#ffffff' }
            });
            setQrCodeUrl(qr);

            setShareDialogOpen(true);
            toast.success(t('published'));
        } catch (error) {
            console.error(error);
            toast.error(t('publishFailed'));
        } finally {
            setIsPublishing(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        toast.success(t('linkCopied'));
    };

    const updateElement = (index: number, updates: any) => {
        const newContent = { ...content };
        if (newContent.pages && newContent.pages[0]) {
            newContent.pages[0].elements[index] = {
                ...newContent.pages[0].elements[index],
                ...updates
            };
            setContent(newContent);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-muted/30">
            {/* Header */}
            <header className="h-14 border-b bg-background flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/h5">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-[200px] font-medium"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href={`/h5/view/${project.id}`} target="_blank">
                            <Eye className="h-4 w-4 mr-2" />
                            {t('preview')}
                        </Link>
                    </Button>
                    <Button variant="outline" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        {t('save')}
                    </Button>
                    <Button
                        onClick={handlePublish}
                        disabled={isPublishing}
                        className="bg-gradient-to-r from-pink-500 to-purple-500"
                    >
                        {isPublishing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Share2 className="h-4 w-4 mr-2" />}
                        {t('publish')}
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Tools */}
                <div className="w-64 border-r bg-background p-4 overflow-y-auto">
                    <Tabs defaultValue="content">
                        <TabsList className="w-full">
                            <TabsTrigger value="content" className="flex-1">
                                <Type className="h-4 w-4 mr-1" />
                                {t('editor.content')}
                            </TabsTrigger>
                            <TabsTrigger value="settings" className="flex-1">
                                <Settings className="h-4 w-4 mr-1" />
                                {t('editor.settings')}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="content" className="space-y-4 mt-4">
                            {currentPage.elements?.map((element: any, index: number) => (
                                <Card key={index}>
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-sm flex items-center">
                                            <Type className="h-4 w-4 mr-2" />
                                            {t('editor.textElement')} {index + 1}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="py-2">
                                        <Textarea
                                            value={element.content || ''}
                                            onChange={(e) => updateElement(index, { content: e.target.value })}
                                            className="min-h-[60px]"
                                        />
                                    </CardContent>
                                </Card>
                            ))}

                            <Button variant="outline" className="w-full" onClick={() => {
                                const newContent = { ...content };
                                if (!newContent.pages) newContent.pages = [{ elements: [], background: '#ffffff' }];
                                newContent.pages[0].elements.push({
                                    type: 'text',
                                    content: '新文本',
                                    style: 'font-size: 16px;'
                                });
                                setContent(newContent);
                            }}>
                                <Type className="h-4 w-4 mr-2" />
                                {t('editor.addText')}
                            </Button>
                        </TabsContent>

                        <TabsContent value="settings" className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>{t('editor.pageEffect')}</Label>
                                <Select
                                    value={h5Config.page_effect || 'slide'}
                                    onValueChange={(v) => setH5Config({ ...h5Config, page_effect: v as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="slide">{t('editor.effects.slide')}</SelectItem>
                                        <SelectItem value="fade">{t('editor.effects.fade')}</SelectItem>
                                        <SelectItem value="flip">{t('editor.effects.flip')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>{t('editor.backgroundMusic')}</Label>
                                <Input
                                    placeholder="https://..."
                                    value={h5Config.music_url || ''}
                                    onChange={(e) => setH5Config({ ...h5Config, music_url: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <Label>{t('editor.showIndicator')}</Label>
                                <Switch
                                    checked={h5Config.show_page_indicator !== false}
                                    onCheckedChange={(v) => setH5Config({ ...h5Config, show_page_indicator: v })}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Center - Phone Preview */}
                <div className="flex-1 flex items-center justify-center p-8 bg-muted/50">
                    <div className="relative">
                        {/* Phone Frame */}
                        <div className="w-[375px] h-[667px] bg-black rounded-[40px] p-3 shadow-2xl">
                            <div className="w-full h-full bg-white rounded-[32px] overflow-hidden relative">
                                {/* Notch */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-10" />

                                {/* Content */}
                                <div
                                    className="w-full h-full flex flex-col items-center justify-center p-8 text-center"
                                    style={{ background: currentPage.background || '#ffffff' }}
                                >
                                    {currentPage.elements?.map((element: any, index: number) => (
                                        <div
                                            key={index}
                                            className="h5-element"
                                            dangerouslySetInnerHTML={{ __html: `<style>.h5-element-${index}{${element.style || ''}}</style><div class="h5-element-${index}" style="${element.style || ''}">${element.content}</div>` }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Phone Label */}
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-sm text-muted-foreground">
                            <Smartphone className="h-4 w-4" />
                            iPhone 14 Pro (375 × 667)
                        </div>
                    </div>
                </div>

                {/* Right Sidebar - AI Assistant */}
                <div className="w-80 border-l bg-background p-4 overflow-y-auto">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-pink-500" />
                            <h3 className="font-semibold">{t('editor.aiAssistant')}</h3>
                        </div>

                        <Card className="bg-gradient-to-br from-pink-500/5 to-purple-500/5 border-pink-500/20">
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground mb-4">
                                    {t('editor.aiDesc')}
                                </p>
                                <Textarea
                                    placeholder={t('editor.aiPlaceholder')}
                                    className="mb-3"
                                />
                                <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-500">
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    {t('editor.generateWithAI')}
                                </Button>
                            </CardContent>
                        </Card>

                        <div className="text-xs text-muted-foreground">
                            <p>{t('editor.aiTips')}</p>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>{t('editor.aiTip1')}</li>
                                <li>{t('editor.aiTip2')}</li>
                                <li>{t('editor.aiTip3')}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Share Dialog */}
            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-green-500" />
                            {t('publishSuccess')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('publishSuccessDesc')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col items-center py-6">
                        {qrCodeUrl && (
                            <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 mb-4" />
                        )}
                        <p className="text-sm text-muted-foreground mb-2">{t('scanToView')}</p>

                        <div className="flex items-center gap-2 w-full mt-4">
                            <Input value={shareUrl} readOnly className="flex-1" />
                            <Button variant="outline" size="icon" onClick={copyToClipboard}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
                            {t('close')}
                        </Button>
                        <Button onClick={() => window.open(shareUrl, '_blank')}>
                            <Eye className="h-4 w-4 mr-2" />
                            {t('viewPage')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
