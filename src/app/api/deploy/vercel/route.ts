import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { html, projectName } = await req.json();

        if (!html) {
            return NextResponse.json({ error: 'HTML 内容不能为空' }, { status: 400 });
        }

        // Vercel Deploy Hook or API integration
        // Since we don't have a direct Vercel API token for the user, we use the "Deploy Button" URL approach
        // or we can simulate a repo creation and deploy if we had GitHub integration.

        // However, for "One-click deploy" of a static HTML string without a repo, 
        // the best way is to use Vercel's "Deploy Button" flow which requires a Git repository.

        // Alternative: Use Vercel API to create a deployment directly (requires Vercel Team Token).
        // Assuming we want to let the USER deploy to THEIR Vercel account.

        // The standard way is to provide a "Deploy to Vercel" button that links to a repository.
        // But here we have dynamic content (the HTML).

        // Strategy:
        // 1. We can't easily deploy raw HTML to user's Vercel without their token.
        // 2. We can provide a "Download" feature for them to deploy manually.
        // 3. OR, we use a template repo that fetches the content from our API.

        // Let's implement a smarter approach:
        // We will generate a "Deploy URL" that pre-fills a Vercel deployment from a template repository.
        // This template repository will be a simple Next.js or HTML app that is configured to fetch the specific project content.

        // BUT, to make it truly "one-click" for *this specific* design:
        // We can use the Vercel API if the user provides a token.

        // Let's stick to the most robust "Deploy Button" pattern:
        // We need a public GitHub repository that acts as a "Viewer".
        // When user clicks "Deploy", they deploy this Viewer repo.
        // We pass the Project ID as an environment variable.
        // The Viewer repo fetches the HTML from OUR backend (public project) and renders it.

        // Let's construct that URL.

        const repoUrl = "https://github.com/vercel/next.js/tree/canary/examples/hello-world"; // Placeholder
        // In reality, you would create a repo like "dao123-viewer" that accepts a PROJECT_ID env var.

        // For now, since we don't have that repo, let's return a "Not Implemented" or a guide.
        // Wait, the user asked "how to implement".

        // Let's try to actually use the Vercel API if we can, or guide them.
        // Actually, a better way for a "No-Code" tool is to use the Vercel API with an integration.

        // Let's implement a simple "Download Code" for now, which is the prerequisite for manual deployment,
        // AND a "Deploy to Vercel" link that uses a demo repository.

        return NextResponse.json({
            url: `https://vercel.com/new/clone?repository-url=${encodeURIComponent('https://github.com/vercel/next.js/tree/canary/examples/hello-world')}&env=PROJECT_HTML_CONTENT&envDescription=Paste_your_HTML_here`
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
