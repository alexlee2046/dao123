'use client';

import { useWizardStore } from './store';
import { StepSettings } from './steps/StepSettings';
import { StepAudience } from './steps/StepAudience';
import { StepContent } from './steps/StepContent';
import { StepSchedule } from './steps/StepSchedule';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, Send, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const STEPS = [
    { id: 1, title: 'Settings', description: 'Campaign details' },
    { id: 2, title: 'Audience', description: 'Who to send to' },
    { id: 3, title: 'Content', description: 'Email design' },
    { id: 4, title: 'Schedule', description: 'Review & Send' },
];

export function CampaignWizard() {
    const { step, setStep, data } = useWizardStore();
    const router = useRouter();

    const handleNext = () => {
        if (step === 1 && (!data.name || !data.subject || !data.fromEmail)) {
            toast.error('Please fill in all required fields');
            return;
        }
        if (step === 2 && data.audienceIds.length === 0) {
            toast.error('Please select at least one recipient');
            return;
        }
        // Step 3 validation (content) skipped for now as it's a placeholder

        if (step < STEPS.length) {
            setStep(step + 1);
        } else {
            handleFinish();
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleFinish = () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 2000)),
            {
                loading: 'Creating campaign...',
                success: () => {
                    router.push('/mail/campaigns');
                    return 'Campaign scheduled successfully!';
                },
                error: 'Failed to create campaign',
            }
        );
    };

    const CurrentStepComponent = () => {
        switch (step) {
            case 1: return <StepSettings />;
            case 2: return <StepAudience />;
            case 3: return <StepContent />;
            case 4: return <StepSchedule />;
            default: return null;
        }
    };

    return (
        <div className="flex flex-col h-full max-w-5xl mx-auto p-6 space-y-8">
            {/* Stepper */}
            <div className="relative flex justify-between items-center px-10">
                <div className="absolute left-0 top-1/2 w-full h-0.5 bg-muted -z-10" />
                {STEPS.map((s) => {
                    const isActive = s.id === step;
                    const isCompleted = s.id < step;

                    return (
                        <div key={s.id} className="flex flex-col items-center gap-2 bg-background px-4">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center font-semibold border-2 transition-all",
                                isActive ? "border-primary bg-primary text-primary-foreground" :
                                    isCompleted ? "border-primary bg-primary/20 text-primary" : "border-muted text-muted-foreground bg-background"
                            )}>
                                {s.id}
                            </div>
                            <div className="text-center">
                                <p className={cn("text-sm font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
                                    {s.title}
                                </p>
                                <p className="text-xs text-muted-foreground hidden md:block">{s.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Content */}
            <div className="flex-1 min-h-[400px]">
                <CurrentStepComponent />
            </div>

            {/* Footer Actions */}
            <div className="flex justify-between items-center pt-6 border-t">
                <Button variant="outline" onClick={handleBack} disabled={step === 1}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>

                <div className="flex gap-2">
                    <Button variant="ghost">Save Draft</Button>
                    <Button onClick={handleNext}>
                        {step === STEPS.length ? (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Launch Campaign
                            </>
                        ) : (
                            <>
                                Next Step
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
