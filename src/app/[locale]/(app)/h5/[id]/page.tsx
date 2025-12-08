import { getH5Project } from "@/lib/actions/h5";
import { H5Editor } from "@/components/h5/H5Editor";
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }) {
    const { locale, id } = await params;
    const t = await getTranslations({ locale, namespace: 'h5' });
    const project = await getH5Project(id);

    return {
        title: project?.name || t('title'),
    };
}

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function H5EditorPage({ params }: PageProps) {
    const { id } = await params;
    const project = await getH5Project(id);

    if (!project) {
        notFound();
    }

    return <H5Editor project={project} />;
}
