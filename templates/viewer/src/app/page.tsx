import { createClient } from '@/lib/db';
import { notFound } from 'next/navigation';

export default async function Page() {
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

    if (!projectId) {
        return (
            <div style={{ fontFamily: 'sans-serif', textAlign: 'center', marginTop: '50px' }}>
                <h1>Setup Required</h1>
                <p>Environment variable NEXT_PUBLIC_PROJECT_ID is missing.</p>
            </div>
        );
    }

    const supabase = await createClient();
    const { data: project } = await supabase
        .from('projects')
        .select('content, name')
        .eq('id', projectId)
        .single();

    if (!project) notFound();

    // Simple renderer: looks for HTML content
    let htmlContent = '';
    if (project.content?.html) {
        htmlContent = project.content.html;
    } else if (project.content?.pages?.[0]?.content) {
        // Fallback to first page
        htmlContent = project.content.pages[0].content;
    } else {
        return <div>No content found for project.</div>;
    }

    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
}
