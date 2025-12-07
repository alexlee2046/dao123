import { getFeaturedCommunityProjects } from '@/lib/actions/community';
import { LandingPage } from '@/components/home/LandingPage';

// Force dynamic rendering to ensure fresh data on every request
export const dynamic = 'force-dynamic';

export default async function Page() {
    // Fetch featured community projects on the server
    const featuredProjects = await getFeaturedCommunityProjects(3);

    return <LandingPage featuredProjects={featuredProjects} />;
}
