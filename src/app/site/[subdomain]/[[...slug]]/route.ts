
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ subdomain: string; slug?: string[] }> }
) {
    const { subdomain, slug } = await params;
    const supabase = await createClient();

    const { data: project } = await supabase
        .from('projects')
        .select('content, name')
        .eq('subdomain', subdomain)
        .single();

    if (!project) {
        return new NextResponse(
            `<html><head><title>Not Found</title></head><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;">
            <div style="text-align:center"><h1>404</h1><p>Site ${subdomain} not found</p></div>
         </body></html>`,
            { status: 404, headers: { 'Content-Type': 'text/html' } }
        );
    }

    // Determine requested path
    let requestPath = 'index.html';
    if (slug && slug.length > 0) {
        requestPath = slug.join('/');
    }

    // Normalize path logic (remove leading slash)
    const normalizedPath = requestPath.replace(/^\//, '');

    let htmlContent = '';
    let found = false;

    const content = project.content as any;

    if (content?.pages && Array.isArray(content.pages)) {
        // Multi-page mode
        const page = content.pages.find((p: any) => {
            const pPath = p.path.replace(/^\//, '');
            return pPath === normalizedPath || pPath === normalizedPath + '.html';
        });

        if (page) {
            htmlContent = page.content;
            found = true;
        }
    } else if (content?.html) {
        // Single page mode
        if (normalizedPath === 'index.html' || normalizedPath === '') {
            htmlContent = content.html;
            found = true;
        }
    }

    if (!found) {
        return new NextResponse(
            `<html><head><title>Page Not Found</title></head><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;">
            <div style="text-align:center"><h1>404</h1><p>Page not found: /${normalizedPath}</p></div>
         </body></html>`,
            { status: 404, headers: { 'Content-Type': 'text/html' } }
        );
    }

    // Serve the raw HTML
    return new NextResponse(htmlContent, {
        headers: {
            'Content-Type': 'text/html',
            // Optional: Add cache control
            'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300'
        }
    });
}
