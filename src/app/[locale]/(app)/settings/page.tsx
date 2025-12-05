import { getTranslations } from 'next-intl/server';
import { SettingsForm } from '@/components/settings/SettingsForm';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'settings' });

    return {
        title: t('title'),
    };
}

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'settings' });

    return (
        <div className="container max-w-4xl py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
                <p className="text-muted-foreground">
                    {t('general')}
                </p>
            </div>
            <SettingsForm />
        </div>
    );
}
