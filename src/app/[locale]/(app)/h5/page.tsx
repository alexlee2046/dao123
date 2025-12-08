import { getUserH5Projects } from "@/lib/actions/h5";
import { H5Dashboard } from "@/components/h5/H5Dashboard";
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'h5' });

    return {
        title: t('title'),
    };
}

export default async function H5Page() {
    const projects = await getUserH5Projects();

    return <H5Dashboard projects={projects} />;
}
