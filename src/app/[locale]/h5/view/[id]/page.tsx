import { getPublicH5Project } from "@/lib/actions/h5";
import { H5Viewer } from "@/components/h5/H5Viewer";
import { notFound } from 'next/navigation';

// 这个页面是独立于主布局的，针对移动端优化
export const metadata = {
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function H5ViewPage({ params }: PageProps) {
    const { id } = await params;
    const project = await getPublicH5Project(id);

    if (!project) {
        notFound();
    }

    return <H5Viewer project={project} />;
}
