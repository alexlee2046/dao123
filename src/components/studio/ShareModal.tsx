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

export function ShareModal({ children }: { children: React.ReactNode }) {
    const [copied, setCopied] = useState(false);
    const shareUrl = "https://my-awesome-site.dao123.app"; // Mock URL

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleEmailShare = () => {
        window.location.href = `mailto:?subject=查看我的网站&body=我用 dao123 构建了这个网站: ${shareUrl}`;
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>分享您的网站</DialogTitle>
                    <DialogDescription>
                        将您的网站链接分享给朋友和同事。
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
                            邮件分享
                        </Button>
                        <Button variant="outline" disabled>
                            <Share2 className="h-4 w-4 mr-2" />
                            社交媒体
                        </Button>
                    </div>

                    <div className="text-xs text-muted-foreground text-center pt-2">
                        提示：先发布您的网站以获得可分享的链接
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
