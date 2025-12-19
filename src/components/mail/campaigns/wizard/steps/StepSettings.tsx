'use client';

import { useWizardStore } from '../store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

export function StepSettings() {
    const { data, updateData } = useWizardStore();
    const t = useTranslations('mail.campaigns.wizard.settings');

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('title')}</CardTitle>
                <CardDescription>{t('description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">{t('campaignName')}</Label>
                    <Input
                        id="name"
                        placeholder={t('campaignNamePlaceholder')}
                        value={data.name}
                        onChange={(e) => updateData({ name: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">{t('campaignNameHint')}</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="subject">{t('emailSubject')}</Label>
                    <Input
                        id="subject"
                        placeholder={t('emailSubjectPlaceholder')}
                        value={data.subject}
                        onChange={(e) => updateData({ subject: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="fromName">{t('fromName')}</Label>
                        <Input
                            id="fromName"
                            placeholder={t('fromNamePlaceholder')}
                            value={data.fromName}
                            onChange={(e) => updateData({ fromName: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="fromEmail">{t('fromEmail')}</Label>
                        <Input
                            id="fromEmail"
                            type="email"
                            placeholder={t('fromEmailPlaceholder')}
                            value={data.fromEmail}
                            onChange={(e) => updateData({ fromEmail: e.target.value })}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
