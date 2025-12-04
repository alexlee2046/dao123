'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Settings, FileText, Database, LogOut, Image } from "lucide-react"
import { Button } from "@/components/ui/button"

const sidebarItems = [
    { icon: LayoutDashboard, label: "仪表盘", href: "/admin" },
    { icon: Users, label: "用户管理", href: "/admin/users" },
    { icon: FileText, label: "项目管理", href: "/admin/projects" },
    { icon: Database, label: "模型管理", href: "/admin/models" },
    { icon: Image, label: "素材管理", href: "/admin/assets" },
    { icon: Settings, label: "系统设置", href: "/admin/settings" },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="w-64 bg-card border-r flex flex-col h-full">
            <div className="p-6 border-b">
                <h1 className="text-xl font-bold">Admin Portal</h1>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {sidebarItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                        <Button
                            variant={pathname === item.href ? "secondary" : "ghost"}
                            className="w-full justify-start"
                        >
                            <item.icon className="mr-2 h-4 w-4" />
                            {item.label}
                        </Button>
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t">
                <Link href="/dashboard">
                    <Button variant="outline" className="w-full justify-start">
                        <LogOut className="mr-2 h-4 w-4" />
                        Back to App
                    </Button>
                </Link>
            </div>
        </div>
    )
}
