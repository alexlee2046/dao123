'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Palette,
    Image as ImageIcon,
    Video,
    Globe,
    Settings,
    LogOut,
    CreditCard,
    Cpu
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCredits } from "@/lib/actions/credits"
import { createClient } from "@/lib/supabase/client"

const sidebarItems = [
    { icon: LayoutDashboard, label: "仪表盘", href: "/dashboard" },
    { icon: Palette, label: "创作工坊", href: "/studio" },
    { icon: ImageIcon, label: "AI 绘图", href: "/generate/image" },
    { icon: Video, label: "AI 视频", href: "/generate/video" },
    { icon: Globe, label: "灵感广场", href: "/community" },
    { icon: Settings, label: "设置", href: "/settings" },
]

const adminItems = [
    { icon: Cpu, label: "模型管理", href: "/admin" },
]

export function AppSidebar({ className }: { className?: string }) {
    const pathname = usePathname()
    const router = useRouter()
    const [credits, setCredits] = useState<number | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        loadCredits()
        checkAdminRole()
    }, [])

    const loadCredits = async () => {
        try {
            const balance = await getCredits()
            setCredits(balance)
        } catch (error) {
            console.error('Failed to load credits:', error)
        }
    }

    const checkAdminRole = async () => {
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            setIsAdmin(profile?.role === 'admin')
        } catch (error) {
            console.error('Failed to check admin role:', error)
        }
    }

    const handleSignOut = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <div className={cn("w-64 bg-card border-r flex flex-col h-full", className)}>
            <div className="p-6 border-b flex items-center gap-3">
                <div className="h-8 w-8 bg-gradient-to-br from-primary to-violet-600 rounded-lg flex items-center justify-center text-primary-foreground font-bold shadow-md">
                    D
                </div>
                <span className="font-bold text-xl tracking-tight">Dao123</span>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {sidebarItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                        <Button
                            variant={pathname === item.href || pathname.startsWith(item.href) ? "secondary" : "ghost"}
                            className="w-full justify-start"
                        >
                            <item.icon className="mr-2 h-4 w-4" />
                            {item.label}
                        </Button>
                    </Link>
                ))}

                {isAdmin && (
                    <>
                        <div className="pt-4 mt-4 border-t">
                            <div className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Admin
                            </div>
                            {adminItems.map((item) => (
                                <Link key={item.href} href={item.href}>
                                    <Button
                                        variant={pathname === item.href || pathname.startsWith(item.href) ? "secondary" : "ghost"}
                                        className="w-full justify-start"
                                    >
                                        <item.icon className="mr-2 h-4 w-4" />
                                        {item.label}
                                    </Button>
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </nav>

            <div className="p-4 border-t">
                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Credits</span>
                    </div>
                    <div className="text-2xl font-bold">
                        <span className="text-primary">{credits !== null ? credits : '--'}</span>
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="w-full justify-start text-muted-foreground"
                    onClick={handleSignOut}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    )
}
