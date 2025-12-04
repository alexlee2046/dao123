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
import {
    Wand2, ArrowRight, ChevronLeft, CheckCircle2, Layout, Palette,
    Users, Check, Type, Building2, MessageSquareQuote, Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GuideModalProps {
    onComplete: (prompt: string) => void;
}

// --- Constants & Options ---

const WEBSITE_TYPES = [
    { id: "portfolio", label: "个人作品集", icon: "🎨", desc: "展示个人作品、简历" },
    { id: "landing", label: "产品落地页", icon: "🚀", desc: "单一产品的推广与转化" },
    { id: "corporate", label: "企业官网", icon: "🏢", desc: "展示公司形象与服务" },
    { id: "event", label: "活动宣传页", icon: "📅", desc: "会议、展览、婚礼等" },
    { id: "blog", label: "博客/资讯", icon: "📰", desc: "文章分享与阅读" },
    { id: "saas", label: "SaaS 首页", icon: "💻", desc: "软件服务的介绍与定价" }
];

const STYLES = [
    { id: "minimal", label: "极简主义", desc: "留白、干净、现代" },
    { id: "tech", label: "科技未来", desc: "深色、霓虹、赛博朋克" },
    { id: "luxury", label: "高端典雅", desc: "衬线体、金色、精致" },
    { id: "playful", label: "活泼可爱", desc: "圆角、鲜艳色彩、插画" },
    { id: "corporate_clean", label: "商务专业", desc: "稳重、蓝色系、网格布局" },
    { id: "retro", label: "复古怀旧", desc: "噪点、像素、暖色调" }
];

const COLOR_THEMES = [
    { id: "blue", label: "科技蓝", color: "bg-blue-500" },
    { id: "green", label: "自然绿", color: "bg-emerald-500" },
    { id: "purple", label: "创意紫", color: "bg-purple-500" },
    { id: "orange", label: "活力橙", color: "bg-orange-500" },
    { id: "black", label: "极致黑", color: "bg-zinc-900" },
    { id: "white", label: "纯净白", color: "bg-zinc-100 border border-zinc-300" },
];

const TONES = [
    "专业权威 (Professional)",
    "亲切友好 (Friendly)",
    "幽默风趣 (Humorous)",
    "高端奢华 (Luxury)",
    "简洁直接 (Direct)",
    "充满激情 (Passionate)"
];

const SECTIONS = [
    "Hero (首屏)", "关于我们", "核心优势", "产品/服务展示",
    "客户评价", "合作伙伴", "团队介绍", "FAQ (常见问题)",
    "定价方案", "联系表单", "页脚"
];

export function GuideModal({ onComplete }: GuideModalProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);

    // Form State
    const [data, setData] = useState({
        // Step 1: Identity
        brandName: '',
        websiteType: '',
        customType: '',

        // Step 2: Visuals
        style: '',
        colorTheme: '',

        // Step 3: Content
        targetAudience: '',
        tone: '',

        // Step 4: Structure
        sections: [] as string[],

        // Step 5: Vision
        customVision: ''
    });

    const totalSteps = 5;

    const handleNext = () => {
        if (step < totalSteps) setStep(step + 1);
        else generateAndComplete();
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const generateAndComplete = () => {
        const typeLabel = WEBSITE_TYPES.find(t => t.id === data.websiteType)?.label || data.customType;
        const styleLabel = STYLES.find(s => s.id === data.style)?.label || '自适应';
        const colorLabel = COLOR_THEMES.find(c => c.id === data.colorTheme)?.label || '默认';

        const prompt = `我需要构建一个网站，详细需求如下：

1. **基本信息**
   - 品牌/项目名称：${data.brandName || '未命名'}
   - 网站类型：${typeLabel}

2. **视觉设计**
   - 设计风格：${styleLabel}
   - 色彩偏好：${colorLabel}

3. **内容策略**
   - 目标受众：${data.targetAudience || '通用用户'}
   - 品牌语调：${data.tone || '专业'}

4. **页面结构**
   - 包含板块：${data.sections.length > 0 ? data.sections.join(', ') : '请根据类型自动规划'}

5. **用户愿景与补充**
   ${data.customVision || '无特殊补充，请自由发挥。'}

请根据以上信息，扮演一位资深的网页设计师，为我生成这个网站的代码。`;

        onComplete(prompt);
        setOpen(false);
        // Reset after a delay
        setTimeout(() => {
            setStep(1);
            setData({
                brandName: '', websiteType: '', customType: '',
                style: '', colorTheme: '',
                targetAudience: '', tone: '',
                sections: [], customVision: ''
            });
        }, 500);
    };

    const toggleSection = (section: string) => {
        setData(prev => ({
            ...prev,
            sections: prev.sections.includes(section)
                ? prev.sections.filter(s => s !== section)
                : [...prev.sections, section]
        }));
    };

    // Validation
    const isStepValid = () => {
        if (step === 1) return (data.websiteType || data.customType) && data.brandName.trim().length > 0;
        return true; // Other steps are optional
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-7 text-xs border-dashed border-primary/50 hover:border-primary text-primary hover:bg-primary/5">
                    <Wand2 className="h-3.5 w-3.5" />
                    AI 需求引导
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-xl border-primary/10 shadow-2xl">
                {/* Header */}
                <div className="p-6 pb-4 border-b border-border/50 bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                        <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                            {step === 1 && <><Building2 className="h-5 w-5 text-primary" /> 品牌与定位</>}
                            {step === 2 && <><Palette className="h-5 w-5 text-primary" /> 视觉与风格</>}
                            {step === 3 && <><MessageSquareQuote className="h-5 w-5 text-primary" /> 内容与语调</>}
                            {step === 4 && <><Layout className="h-5 w-5 text-primary" /> 结构规划</>}
                            {step === 5 && <><Lightbulb className="h-5 w-5 text-primary" /> 您的想法</>}
                        </DialogTitle>
                        <span className="text-xs font-medium text-muted-foreground bg-background px-2 py-1 rounded-full border">
                            Step {step} / {totalSteps}
                        </span>
                    </div>
                    <DialogDescription>
                        {step === 1 && "首先，让我们确定网站的基础身份信息。"}
                        {step === 2 && "定义网站的视觉语言，让 AI 更懂你的审美。"}
                        {step === 3 && "设定沟通方式，吸引正确的目标人群。"}
                        {step === 4 && "规划页面布局，勾选您需要的功能模块。"}
                        {step === 5 && "最后，用您自己的话描述任何具体的想法或灵感。"}
                    </DialogDescription>
                </div>

                {/* Body */}
                <div className="p-6 min-h-[360px] max-h-[60vh] overflow-y-auto">

                    {/* Step 1: Identity */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">品牌 / 项目名称 <span className="text-red-500">*</span></Label>
                                <Input
                                    placeholder="例如：Dao Tech, 个人作品集, 婚礼邀请..."
                                    value={data.brandName}
                                    onChange={e => setData({ ...data, brandName: e.target.value })}
                                    className="h-11 bg-muted/30"
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-medium">网站类型 <span className="text-red-500">*</span></Label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {WEBSITE_TYPES.map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => setData({ ...data, websiteType: type.id })}
                                            className={cn(
                                                "flex flex-col items-start p-3 rounded-xl border text-left transition-all hover:shadow-md",
                                                data.websiteType === type.id
                                                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                                    : "border-border bg-background hover:border-primary/50"
                                            )}
                                        >
                                            <span className="text-2xl mb-2">{type.icon}</span>
                                            <span className="font-medium text-sm">{type.label}</span>
                                            <span className="text-[10px] text-muted-foreground mt-1 leading-tight">{type.desc}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-muted-foreground shrink-0">其他类型:</span>
                                    <Input
                                        placeholder="手动输入..."
                                        className="h-8 text-xs"
                                        value={data.customType}
                                        onChange={e => setData({ ...data, customType: e.target.value, websiteType: 'other' })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Visuals */}
                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-3">
                                <Label>设计风格</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {STYLES.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => setData({ ...data, style: s.id })}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                                                data.style === s.id
                                                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                                    : "border-border hover:bg-muted/50"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                                                data.style === s.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                            )}>
                                                {data.style === s.id ? <Check className="h-4 w-4" /> : <Palette className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm">{s.label}</div>
                                                <div className="text-xs text-muted-foreground">{s.desc}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>主色调偏好</Label>
                                <div className="flex flex-wrap gap-3">
                                    {COLOR_THEMES.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => setData({ ...data, colorTheme: c.id })}
                                            className={cn(
                                                "group relative flex items-center gap-2 px-3 py-2 rounded-full border transition-all",
                                                data.colorTheme === c.id
                                                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                                    : "border-border hover:border-primary/50"
                                            )}
                                        >
                                            <div className={cn("h-4 w-4 rounded-full shadow-sm", c.color)} />
                                            <span className="text-xs font-medium">{c.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Content */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-3">
                                <Label>目标受众 (Target Audience)</Label>
                                <Input
                                    placeholder="例如：20-35岁的科技从业者、寻找装修服务的房主..."
                                    value={data.targetAudience}
                                    onChange={e => setData({ ...data, targetAudience: e.target.value })}
                                    className="bg-muted/30"
                                />
                                <p className="text-xs text-muted-foreground">AI 将根据受众调整文案的难易程度和吸引力。</p>
                            </div>

                            <div className="space-y-3">
                                <Label>品牌语调 (Tone of Voice)</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {TONES.map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setData({ ...data, tone: t })}
                                            className={cn(
                                                "px-3 py-2 rounded-md text-xs font-medium border transition-all text-left",
                                                data.tone === t
                                                    ? "border-primary bg-primary/5 text-primary"
                                                    : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                                            )}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Structure */}
                    {step === 4 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between">
                                <Label>选择页面板块</Label>
                                <span className="text-xs text-muted-foreground">已选 {data.sections.length} 个</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {SECTIONS.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => toggleSection(s)}
                                        className={cn(
                                            "flex items-center justify-between px-4 py-3 rounded-lg border transition-all text-sm",
                                            data.sections.includes(s)
                                                ? "border-primary bg-primary/5 text-primary shadow-sm"
                                                : "border-border text-muted-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        <span>{s}</span>
                                        {data.sections.includes(s) && <Check className="h-3.5 w-3.5" />}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground text-center pt-2">
                                * 没选中的板块 AI 也会根据常识自动补充，不用担心。
                            </p>
                        </div>
                    )}

                    {/* Step 5: Vision */}
                    {step === 5 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex gap-3">
                                <Lightbulb className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-amber-800 dark:text-amber-400">发挥您的想象力</p>
                                    <p className="text-xs text-amber-700/80 dark:text-amber-500/80">
                                        这是最关键的一步。请用您自己的话描述您想要的“感觉”。比如：“像 Apple 官网那样简洁”、“要有那种赛博朋克的霓虹感”、“温馨得像家一样”...
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1">
                                <Textarea
                                    placeholder="在这里输入您的任何想法、参考网站、或者特殊的文案要求..."
                                    className="h-full min-h-[150px] resize-none bg-muted/30 p-4 leading-relaxed"
                                    value={data.customVision}
                                    onChange={e => setData({ ...data, customVision: e.target.value })}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <DialogFooter className="p-6 border-t bg-muted/20 flex items-center justify-between sm:justify-between">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={step === 1}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        上一步
                    </Button>

                    <div className="flex gap-2">
                        <Button
                            onClick={handleNext}
                            disabled={!isStepValid()}
                            className={cn(
                                "min-w-[100px] transition-all",
                                step === totalSteps ? "bg-primary hover:bg-primary/90" : ""
                            )}
                        >
                            {step === totalSteps ? (
                                <>
                                    生成提示词
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
