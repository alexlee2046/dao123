import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'settings' });

    return {
        title: t('title'),
    };
}

export default async function SettingsPage() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">Settings Page</h1>
            <p>This page will display user settings.</p>
        </div>
    );
}
