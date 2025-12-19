'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Loader2, Sparkles, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

const TONE_KEYS = ['professional', 'friendly', 'urgent', 'luxury', 'witty'] as const;

interface AIWriterDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUseContent: (content: string) => void;
}

export function AIWriterDialog({ open, onOpenChange, onUseContent }: AIWriterDialogProps) {
    const [tone, setTone] = useState('professional');
    const [copied, setCopied] = useState(false);
    const [prompt, setPrompt] = useState('');
    const t = useTranslations('mail.campaigns.wizard.aiWriter');

    const { messages, sendMessage, status, setMessages } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/ai/email',
            body: { tone },
        }),
        onError: (err: Error) => {
            toast.error(t('generationFailed', { message: err.message }));
            console.error(err);
        }
    });

    const isLoading = status === 'streaming' || status === 'submitted';

    // Extract content from the last assistant message
    const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
    let completion = '';
    if (lastAssistantMessage) {
        const msgAny = lastAssistantMessage as any;
        if (typeof msgAny.content === 'string') {
            completion = msgAny.content;
        } else if (msgAny.parts && Array.isArray(msgAny.parts)) {
            completion = msgAny.parts
                .filter((part: any) => part.type === 'text')
                .map((part: any) => part.text)
                .join('');
        }
    }

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setMessages([]);
        await sendMessage({ text: prompt });
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(completion);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success(t('copiedToClipboard'));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        {t('title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-3 space-y-2">
                            <Label>{t('prompt')}</Label>
                            <Textarea
                                placeholder={t('promptPlaceholder')}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="h-24 resize-none"
                            />
                        </div>
                        <div className="col-span-1 space-y-2">
                            <Label>{t('tone')}</Label>
                            <Select value={tone} onValueChange={setTone}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TONE_KEYS.map((toneKey) => (
                                        <SelectItem key={toneKey} value={toneKey}>
                                            {t(`tones.${toneKey}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={handleGenerate} disabled={isLoading || !prompt}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('generating')}
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    {t('generate')}
                                </>
                            )}
                        </Button>
                    </div>

                    {completion && (
                        <div className="mt-4 rounded-md border bg-muted/50 p-4 space-y-2">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-medium text-muted-foreground uppercase">{t('result')}</span>
                                <Button variant="ghost" size="sm" onClick={handleCopy} className="h-6 px-2">
                                    {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                                    {copied ? t('copied') : t('copy')}
                                </Button>
                            </div>
                            <div className="text-sm whitespace-pre-wrap font-mono bg-background p-3 rounded border max-h-[300px] overflow-y-auto">
                                {completion}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
                    <Button onClick={() => {
                        onUseContent(completion);
                        onOpenChange(false);
                    }} disabled={!completion}>
                        {t('useContent')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
