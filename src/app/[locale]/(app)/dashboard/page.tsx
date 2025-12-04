import { getUserProjects } from "@/lib/actions/projects";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'dashboard' });

    return {
        title: t('title'),
    };
}

export default async function DashboardPage() {
    const projects = await getUserProjects();

    return <DashboardView projects={projects} />;
}
