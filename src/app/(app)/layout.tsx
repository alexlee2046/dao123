import { AppSidebar } from "@/components/dashboard/AppSidebar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="flex h-screen bg-background">
            <AppSidebar className="hidden md:flex" />
            
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="md:hidden flex items-center p-4 border-b bg-card">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-64">
                            <AppSidebar className="w-full border-none" />
                        </SheetContent>
                    </Sheet>
                    <div className="ml-4 font-bold text-lg">Dao123</div>
                </header>

                <main className="flex-1 overflow-y-auto relative">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none"></div>
                    {children}
                </main>
            </div>
        </div>
    )
}
