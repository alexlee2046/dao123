import { getH5Templates } from "@/lib/actions/h5";
import { H5TemplateGallery } from "@/components/h5/H5TemplateGallery";
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'h5' });

    return {
        title: t('templates'),
    };
}

interface PageProps {
    searchParams: Promise<{ category?: string }>;
}

export default async function H5TemplatesPage({ searchParams }: PageProps) {
    const { category } = await searchParams;
    const templates = await getH5Templates(category);

    return <H5TemplateGallery templates={templates} currentCategory={category || 'all'} />;
}
