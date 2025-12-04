import React, { useState } from 'react';
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
import { Progress } from "@/components/ui/progress";
import { Check, Copy, Globe, Loader2 } from "lucide-react";

export function PublishModal({ children, pageCount = 1 }: { children: React.ReactNode, pageCount?: number }) {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<'config' | 'deploying' | 'success'>('config');
    const [subdomain, setSubdomain] = useState('my-awesome-site');
    const [progress, setProgress] = useState(0);

    const handlePublish = () => {
        setStep('deploying');
        setProgress(0);

        // Simulate deployment process
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setStep('success');
                    return 100;
                }
                return prev + 10;
            });
        }, 300);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(`https://${subdomain}.dao123.app`);
    };

    const handleVercelDeploy = () => {
        // This is a simplified "Deploy to Vercel" flow.
        // In a real app, you would:
        // 1. Create a GitHub repo for the user (requires OAuth)
        // 2. Push the code to that repo
        // 3. Trigger Vercel deployment via URL

        // For this demo, we will use a "Download & Deploy" approach or a pre-filled link.
        // We'll open a new window with the Vercel deploy link for a generic starter, 
        // and user would ideally paste their code. 

        // A better approach for this specific app:
        // We provide a "Viewer" template. User deploys that template.
        // The template takes a "PROJECT_ID" env var.
        // It fetches the project from our DB.

        const repoUrl = "https://github.com/vercel/next.js/tree/canary/examples/hello-world"; // Replace with your actual template repo
        const deployUrl = `https://vercel.com/new/clone?repository-url=${encodeURIComponent(repoUrl)}&env=NEXT_PUBLIC_PROJECT_ID&envDescription=Enter_your_Project_ID_to_load_content&project-name=my-dao123-site`;

        window.open(deployUrl, '_blank');
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                {step === 'config' && (
                    <>
                        <DialogHeader>
                            <DialogTitle>发布到 Web</DialogTitle>
                            <DialogDescription>
                                选择您希望如何发布您的网站。
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <Button onClick={handlePublish} className="w-full">
                                <Globe className="mr-2 h-4 w-4" />
                                发布到 dao123 子域名
                            </Button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">或</span>
                                </div>
                            </div>

                            <Button variant="outline" onClick={handleVercelDeploy} className="w-full">
                                <svg className="mr-2 h-4 w-4" viewBox="0 0 1155 1000" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M577.344 0L1154.69 1000H0L577.344 0Z" />
                                </svg>
                                部署到 Vercel
                            </Button>
                        </div>
                    </>
                )}

                {step === 'deploying' && (
                    <>
                        <DialogHeader>
                            <DialogTitle>正在部署...</DialogTitle>
                            <DialogDescription>
                                正在构建并将您的网站部署到边缘节点。
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-8 space-y-4">
                            <Progress value={progress} className="w-full" />
                            <p className="text-sm text-center text-muted-foreground">
                                {progress < 30 && "正在优化资源..."}
                                {progress >= 30 && progress < 70 && `正在构建 ${pageCount} 个静态页面...`}
                                {progress >= 70 && "正在分发到 CDN..."}
                            </p>
                        </div>
                    </>
                )}

                {step === 'success' && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-green-600">
                                <Check className="h-5 w-5" />
                                发布成功！
                            </DialogTitle>
                            <DialogDescription>
                                您的网站现已上线，可以分享给他人。
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                <span className="flex-1 text-sm font-medium truncate">
                                    https://{subdomain}.dao123.app
                                </span>
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCopy}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsOpen(false)}>关闭</Button>
                            <Button asChild>
                                <a href="#" target="_blank" rel="noopener noreferrer">访问网站</a>
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
