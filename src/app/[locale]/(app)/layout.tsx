import { Suspense } from "react"
import { AppSidebar } from "@/components/dashboard/AppSidebar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LanguageSwitcher } from "@/components/language-switcher"

export default async function DashboardLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params;
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect(`/${locale}/login`)
    }

    return (
        <div className="flex h-screen bg-background">
            <AppSidebar className="hidden md:flex" />

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex items-center p-4 border-b bg-card">
                    <Sheet>
                        <SheetTrigger asChild className="md:hidden">
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-64">
                            <AppSidebar className="w-full border-none" />
                        </SheetContent>
                    </Sheet>
                    <div className="ml-4 font-bold text-lg md:ml-0">Dao123</div>

                    <div className="ml-auto">
                        <Suspense fallback={<div className="w-[140px]" />}>
                            <LanguageSwitcher />
                        </Suspense>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto relative">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none"></div>
                    {children}
                </main>
            </div>
        </div>
    )
}
