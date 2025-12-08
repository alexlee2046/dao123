'use client'

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useLocale, useTranslations } from 'next-intl'
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Palette,
    Image as ImageIcon,
    Video,
    Globe,
    Settings,
    LogOut,
    CreditCard
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCredits } from "@/lib/actions/credits"
import { createClient } from "@/lib/supabase/client"
import { Link } from "@/components/link"

export function AppSidebar({ className }: { className?: string }) {
    const t = useTranslations('common')
    const tNav = useTranslations('nav')
    const pathname = usePathname()
    const router = useRouter()
    const locale = useLocale()
    const [credits, setCredits] = useState<number | null>(null)

    // 定义侧边栏项目，使用翻译键
    const sidebarItems = [
        { icon: LayoutDashboard, label: t('dashboard'), href: "/dashboard" },
        { icon: Palette, label: tNav('studio'), href: "/studio" },
        { icon: ImageIcon, label: tNav('aiImage'), href: "/generate/image" },
        { icon: Video, label: tNav('aiVideo'), href: "/generate/video" },
        { icon: Globe, label: t('community'), href: "/community" },
        { icon: Settings, label: t('settings'), href: "/settings" },
    ]

    useEffect(() => {
        loadCredits()
    }, [])

    const loadCredits = async () => {
        try {
            const balance = await getCredits()
            setCredits(balance)
        } catch (error) {
            console.error('Failed to load credits:', error)
        }
    }

    const handleSignOut = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push(`/${locale}/login`)
        router.refresh()
    }

    // 检查路径是否激活，需要考虑 locale 前缀
    const isActive = (href: string) => {
        const pathWithoutLocale = pathname.replace(`/${locale}`, '')
        return pathWithoutLocale === href || pathWithoutLocale.startsWith(href)
    }

    return (
        <div className={cn("w-64 bg-card border-r flex flex-col h-full", className)}>
            <div className="p-6 border-b flex items-center gap-3">
                <div className="h-8 w-8 relative flex items-center justify-center">
                    <img src="/logo.svg" alt="Dao123 Logo" className="h-8 w-8 text-primary" />
                </div>
                <span className="font-bold text-xl tracking-tight">dao123</span>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {sidebarItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                        <Button
                            variant={isActive(item.href) ? "secondary" : "ghost"}
                            className="w-full justify-start"
                        >
                            <item.icon className="mr-2 h-4 w-4" />
                            {item.label}
                        </Button>
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t">
                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{t('credits')}</span>
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
                    {t('logout')}
                </Button>
            </div>
        </div>
    )
}
