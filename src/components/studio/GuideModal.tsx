import React, { useState, useMemo } from 'react';
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
import { useTranslations } from 'next-intl';

interface GuideModalProps {
    onComplete: (prompt: string) => void;
}

export function GuideModal({ onComplete }: GuideModalProps) {
    const t = useTranslations('guide');
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

    const WEBSITE_TYPES = useMemo(() => [
        { id: "portfolio", label: t('types.portfolio'), icon: "🎨", desc: t('types.portfolioDesc') },
        { id: "landing", label: t('types.landing'), icon: "🚀", desc: t('types.landingDesc') },
        { id: "corporate", label: t('types.corporate'), icon: "🏢", desc: t('types.corporateDesc') },
        { id: "event", label: t('types.event'), icon: "📅", desc: t('types.eventDesc') },
        { id: "blog", label: t('types.blog'), icon: "📰", desc: t('types.blogDesc') },
        { id: "saas", label: t('types.saas'), icon: "💻", desc: t('types.saasDesc') }
    ], [t]);

    const STYLES = useMemo(() => [
        { id: "minimal", label: t('styles.minimal'), desc: t('styles.minimalDesc') },
        { id: "tech", label: t('styles.tech'), desc: t('styles.techDesc') },
        { id: "luxury", label: t('styles.luxury'), desc: t('styles.luxuryDesc') },
        { id: "playful", label: t('styles.playful'), desc: t('styles.playfulDesc') },
        { id: "corporate_clean", label: t('styles.corporate_clean'), desc: t('styles.corporate_cleanDesc') },
        { id: "retro", label: t('styles.retro'), desc: t('styles.retroDesc') }
    ], [t]);

    const COLOR_THEMES = useMemo(() => [
        { id: "blue", label: t('colors.blue'), color: "bg-blue-500" },
        { id: "green", label: t('colors.green'), color: "bg-emerald-500" },
        { id: "purple", label: t('colors.purple'), color: "bg-purple-500" },
        { id: "orange", label: t('colors.orange'), color: "bg-orange-500" },
        { id: "black", label: t('colors.black'), color: "bg-zinc-900" },
        { id: "white", label: t('colors.white'), color: "bg-zinc-100 border border-zinc-300" },
    ], [t]);

    const TONES = ["professional", "friendly", "humorous", "luxury", "direct", "passionate"];
    
    const SECTIONS = [
        "hero", "about", "features", "products",
        "testimonials", "partners", "team", "faq",
        "pricing", "contact", "footer"
    ];

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
        const styleLabel = STYLES.find(s => s.id === data.style)?.label || 'Auto';
        const colorLabel = COLOR_THEMES.find(c => c.id === data.colorTheme)?.label || 'Default';
        const toneLabel = TONES.includes(data.tone) ? t(`tones.${data.tone}`) : data.tone;
        const sectionsLabels = data.sections.length > 0 
            ? data.sections.map(s => SECTIONS.includes(s) ? t(`sections.${s}`) : s).join(', ') 
            : 'Auto Plan';

        const prompt = `${t('prompt.intro')}

${t('prompt.basicInfo')}
   - ${t('prompt.brand')}：${data.brandName || 'Untitled'}
   - ${t('prompt.type')}：${typeLabel}

${t('prompt.visualDesign')}
   - ${t('prompt.style')}：${styleLabel}
   - ${t('prompt.color')}：${colorLabel}

${t('prompt.contentStrategy')}
   - ${t('prompt.audience')}：${data.targetAudience || 'General'}
   - ${t('prompt.tone')}：${toneLabel}

${t('prompt.structure')}
   - ${t('prompt.sections')}：${sectionsLabels}

${t('prompt.vision')}
   ${data.customVision || 'No specific instructions.'}

${t('prompt.instruction')}`;

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
                    {t('triggerButton')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-xl border-primary/10 shadow-2xl">
                {/* Header */}
                <div className="p-6 pb-4 border-b border-border/50 bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                        <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                            {step === 1 && <><Building2 className="h-5 w-5 text-primary" /> {t('steps.1')}</>}
                            {step === 2 && <><Palette className="h-5 w-5 text-primary" /> {t('steps.2')}</>}
                            {step === 3 && <><MessageSquareQuote className="h-5 w-5 text-primary" /> {t('steps.3')}</>}
                            {step === 4 && <><Layout className="h-5 w-5 text-primary" /> {t('steps.4')}</>}
                            {step === 5 && <><Lightbulb className="h-5 w-5 text-primary" /> {t('steps.5')}</>}
                        </DialogTitle>
                        <span className="text-xs font-medium text-muted-foreground bg-background px-2 py-1 rounded-full border">
                            Step {step} / {totalSteps}
                        </span>
                    </div>
                    <DialogDescription>
                        {step === 1 && t('stepDesc.1')}
                        {step === 2 && t('stepDesc.2')}
                        {step === 3 && t('stepDesc.3')}
                        {step === 4 && t('stepDesc.4')}
                        {step === 5 && t('stepDesc.5')}
                    </DialogDescription>
                </div>

                {/* Body */}
                <div className="p-6 min-h-[360px] max-h-[60vh] overflow-y-auto">

                    {/* Step 1: Identity */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">{t('labels.brandName')} <span className="text-red-500">*</span></Label>
                                <Input
                                    placeholder={t('labels.brandNamePlaceholder')}
                                    value={data.brandName}
                                    onChange={e => setData({ ...data, brandName: e.target.value })}
                                    className="h-11 bg-muted/30"
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-medium">{t('labels.websiteType')} <span className="text-red-500">*</span></Label>
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
                                    <span className="text-xs text-muted-foreground shrink-0">{t('labels.otherType')}:</span>
                                    <Input
                                        placeholder={t('labels.otherTypePlaceholder')}
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
                                <Label>{t('labels.style')}</Label>
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
                                <Label>{t('labels.colorTheme')}</Label>
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
                                <Label>{t('labels.targetAudience')}</Label>
                                <Input
                                    placeholder={t('labels.targetAudiencePlaceholder')}
                                    value={data.targetAudience}
                                    onChange={e => setData({ ...data, targetAudience: e.target.value })}
                                    className="bg-muted/30"
                                />
                                <p className="text-xs text-muted-foreground">AI 将根据受众调整文案的难易程度和吸引力。</p>
                            </div>

                            <div className="space-y-3">
                                <Label>{t('labels.tone')}</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {TONES.map(toneId => (
                                        <button
                                            key={toneId}
                                            onClick={() => setData({ ...data, tone: toneId })}
                                            className={cn(
                                                "px-3 py-2 rounded-md text-xs font-medium border transition-all text-left",
                                                data.tone === toneId
                                                    ? "border-primary bg-primary/5 text-primary"
                                                    : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                                            )}
                                        >
                                            {t(`tones.${toneId}`)}
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
                                <Label>{t('labels.sections')}</Label>
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
                                        <span>{t(`sections.${s}`)}</span>
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
                                    <p className="text-sm font-medium text-amber-800 dark:text-amber-400">{t('steps.5')}</p>
                                    <p className="text-xs text-amber-700/80 dark:text-amber-500/80">
                                        {t('stepDesc.5')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1">
                                <Textarea
                                    placeholder={t('labels.visionPlaceholder')}
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
                        {t('actions.prev')}
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
                                    {t('actions.generate')}
                                    <Wand2 className="ml-2 h-4 w-4" />
                                </>
                            ) : (
                                <>
                                    {t('actions.next')}
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