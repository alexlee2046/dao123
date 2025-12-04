import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Wand2, ArrowRight, ChevronLeft, CheckCircle2, Layout, Palette, Users, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuideModalProps {
    onComplete: (prompt: string) => void;
}

const PURPOSES = [
    "个人作品集",
    "产品落地页",
    "公司官网",
    "活动宣传页",
    "博客/资讯站",
    "简历/介绍"
];

const STYLES = [
    "极简主义 (Minimalist)",
    "科技感 (Tech/Cyberpunk)",
    "商务专业 (Corporate)",
    "活泼可爱 (Playful)",
    "复古风格 (Retro)",
    "暗黑模式 (Dark)"
];

const SECTIONS = [
    "Hero (首屏)",
    "关于我们",
    "功能特性",
    "作品展示",
    "客户评价",
    "联系方式",
    "FAQ",
    "页脚"
];

export function GuideModal({ onComplete }: GuideModalProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [data, setData] = useState({
        purpose: '',
        customPurpose: '',
        audience: '',
        style: '',
        sections: [] as string[],
    });

    const handleNext = () => {
        if (step < 4) setStep(step + 1);
        else {
            generateAndComplete();
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const generateAndComplete = () => {
        const finalPurpose = data.purpose === '其他' ? data.customPurpose : data.purpose;
        const sectionsStr = data.sections.join(', ');
        
        const prompt = `我想构建一个**${finalPurpose}**。
目标用户群体：${data.audience || '所有人'}
视觉风格偏好：${data.style || '自适应'}
包含的页面板块：${sectionsStr || '标准布局'}

请注意：我了解这是一个静态展示网站，不需要复杂的后端交互。`;

        onComplete(prompt);
        setOpen(false);
        setTimeout(reset, 300);
    };

    const reset = () => {
        setStep(1);
        setData({ purpose: '', customPurpose: '', audience: '', style: '', sections: [] });
    };

    const toggleSection = (section: string) => {
        setData(prev => ({
            ...prev,
            sections: prev.sections.includes(section)
                ? prev.sections.filter(s => s !== section)
                : [...prev.sections, section]
        }));
    };

    const isStepValid = () => {
        if (step === 1) return data.purpose || data.customPurpose;
        if (step === 2) return true; // Optional
        if (step === 3) return true; // Optional
        return true;
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-7 text-xs border-dashed border-primary/50 hover:border-primary text-primary hover:bg-primary/5">
                    <Wand2 className="h-3.5 w-3.5" />
                    需求引导
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-xl">
                <div className="p-6 pb-0">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Wand2 className="h-5 w-5 text-primary" />
                            {step === 1 && "您想构建什么样的网站？"}
                            {step === 2 && "目标用户与风格偏好"}
                            {step === 3 && "页面结构规划"}
                            {step === 4 && "确认需求"}
                        </DialogTitle>
                        <DialogDescription>
                            {step === 1 && "选择一个最符合您需求的类型，或者直接描述。"}
                            {step === 2 && "帮助 AI 更好地理解您的设计品味。"}
                            {step === 3 && "选择您希望包含的页面板块。"}
                            {step === 4 && "请确认您的需求，准备开始构建。"}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 py-8 min-h-[300px]">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                {PURPOSES.map(p => (
                                    <Button
                                        key={p}
                                        variant={data.purpose === p ? "default" : "outline"}
                                        className={cn("justify-start h-auto py-3 px-4", data.purpose === p ? "border-primary" : "")}
                                        onClick={() => setData({ ...data, purpose: p })}
                                    >
                                        <Layout className="mr-2 h-4 w-4 opacity-70" />
                                        {p}
                                    </Button>
                                ))}
                                <Button
                                    variant={data.purpose === '其他' ? "default" : "outline"}
                                    className="justify-start h-auto py-3 px-4"
                                    onClick={() => setData({ ...data, purpose: '其他' })}
                                >
                                    <Wand2 className="mr-2 h-4 w-4 opacity-70" />
                                    其他 / 自定义
                                </Button>
                            </div>
                            
                            {data.purpose === '其他' && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <Label>请描述您的网站类型</Label>
                                    <Input 
                                        value={data.customPurpose}
                                        onChange={(e) => setData({...data, customPurpose: e.target.value})}
                                        placeholder="例如：在线相册、婚礼邀请函..."
                                        className="mt-1.5"
                                        autoFocus
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    目标用户群体 (选填)
                                </Label>
                                <Input 
                                    value={data.audience}
                                    onChange={(e) => setData({...data, audience: e.target.value})}
                                    placeholder="例如：求职者、科技爱好者、潜在客户..."
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="flex items-center gap-2">
                                    <Palette className="h-4 w-4" />
                                    视觉风格 (选填)
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {STYLES.map(s => (
                                        <Button
                                            key={s}
                                            variant={data.style === s ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setData({ ...data, style: s })}
                                            className="justify-start text-xs"
                                        >
                                            {data.style === s && <CheckCircle2 className="mr-2 h-3.5 w-3.5" />}
                                            {s}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                             <div className="grid grid-cols-2 gap-3">
                                {SECTIONS.map(s => (
                                    <Button
                                        key={s}
                                        variant={data.sections.includes(s) ? "default" : "outline"}
                                        className="justify-start"
                                        onClick={() => toggleSection(s)}
                                    >
                                        <div className={cn(
                                            "mr-2 h-4 w-4 rounded-full border flex items-center justify-center transition-colors",
                                            data.sections.includes(s) ? "border-primary-foreground bg-primary-foreground/20" : "border-muted-foreground"
                                        )}>
                                            {data.sections.includes(s) && <Check className="h-3 w-3" />}
                                        </div>
                                        {s}
                                    </Button>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground text-center pt-4">
                                * AI 会根据这些板块自动规划页面布局
                            </p>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6">
                            <div className="bg-muted/50 rounded-lg p-4 space-y-3 border border-border/50">
                                <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                                    <span className="text-muted-foreground">网站类型:</span>
                                    <span className="font-medium">{data.purpose === '其他' ? data.customPurpose : data.purpose}</span>
                                    
                                    <span className="text-muted-foreground">目标用户:</span>
                                    <span>{data.audience || '未指定'}</span>
                                    
                                    <span className="text-muted-foreground">视觉风格:</span>
                                    <span>{data.style || '未指定'}</span>
                                    
                                    <span className="text-muted-foreground">包含板块:</span>
                                    <span>{data.sections.length > 0 ? data.sections.join(', ') : '自动规划'}</span>
                                </div>
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex gap-3 items-start">
                                <div className="mt-0.5 p-1 bg-amber-500/20 rounded-full">
                                    <Layout className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                                        仅支持静态展示
                                    </p>
                                    <p className="text-xs text-amber-600/80 dark:text-amber-400/80 leading-relaxed">
                                        当前版本专注于生成高质量的静态展示网站。
                                        暂时不支持用户登录、数据库存储、支付功能或复杂的后端逻辑。
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 border-t bg-muted/20 flex items-center justify-between sm:justify-between">
                    <div className="flex gap-1">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div 
                                key={i}
                                className={cn(
                                    "h-1.5 w-1.5 rounded-full transition-colors",
                                    i + 1 === step ? "bg-primary" : "bg-primary/20"
                                )}
                            />
                        ))}
                    </div>
                    <div className="flex gap-2">
                        {step > 1 && (
                            <Button variant="ghost" onClick={handleBack}>
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                上一步
                            </Button>
                        )}
                        <Button onClick={handleNext} disabled={!isStepValid()}>
                            {step === 4 ? (
                                <>
                                    开始构建
                                    <Wand2 className="ml-2 h-4 w-4" />
                                </>
                            ) : (
                                <>
                                    下一步
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
