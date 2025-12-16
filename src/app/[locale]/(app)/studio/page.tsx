import { getUserProjects } from "@/lib/actions/projects";
import { StudioProjectsView } from "@/components/studio/StudioProjectsView";
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'studio' });

    return {
        title: t('projectList'),
    };
}

export default async function StudioListPage() {
    const projects = await getUserProjects();

    return <StudioProjectsView projects={projects} />;
}
