import { Sidebar } from "@/components/shared/Sidebar";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-full relative">
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-sidebar border-r border-border/50 backdrop-blur-xl">
                <Sidebar />
            </div>
            <main className="md:pl-72 h-full">
                {children}
            </main>
        </div>
    );
}
