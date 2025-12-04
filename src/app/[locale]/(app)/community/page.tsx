import { getCommunityProjects } from "@/lib/actions/community";
import { CommunityView } from "@/components/community/CommunityView";

export default async function CommunityPage() {
    const projects = await getCommunityProjects();

    return <CommunityView projects={projects} />;
}
