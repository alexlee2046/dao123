import { getUserProjects } from "@/lib/actions/projects";
import { DashboardView } from "@/components/dashboard/DashboardView";

export default async function DashboardPage() {
    const projects = await getUserProjects();

    return <DashboardView projects={projects} />;
}
