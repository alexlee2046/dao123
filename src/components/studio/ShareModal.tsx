"use client";

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Share2, Mail } from "lucide-react";
import { useTranslations } from 'next-intl';

export function ShareModal({ children }: { children: React.ReactNode }) {
    const t = useTranslations('share');
    const [copied, setCopied] = useState(false);
    const shareUrl = "https://my-awesome-site.dao123.me"; // Mock URL

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleEmailShare = () => {
        const subject = t('emailSubject');
        const body = t('emailBody', { url: shareUrl });
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription>
                        {t('description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-2">
                        <Input
                            value={shareUrl}
                            readOnly
                            className="flex-1"
                        />
                        <Button
                            size="icon"
                            variant={copied ? "default" : "outline"}
                            onClick={handleCopy}
                        >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={handleEmailShare}>
                            <Mail className="h-4 w-4 mr-2" />
                            {t('email')}
                        </Button>
                        <Button variant="outline" disabled>
                            <Share2 className="h-4 w-4 mr-2" />
                            {t('social')}
                        </Button>
                    </div>

                    <div className="text-xs text-muted-foreground text-center pt-2">
                        {t('tip')}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
