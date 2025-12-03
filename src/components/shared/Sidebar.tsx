"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Sparkles, Settings, LogOut, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
    const pathname = usePathname();

    const routes = [
        {
            label: '仪表盘',
            icon: LayoutDashboard,
            href: '/dashboard',
            active: pathname === '/dashboard',
        },
        {
            label: '灵感广场',
            icon: Sparkles,
            href: '/inspiration',
            active: pathname === '/inspiration',
        },
        {
            label: '设置',
            icon: Settings,
            href: '/settings',
            active: pathname === '/settings',
        },
    ];

    return (
        <div className="space-y-4 py-4 flex flex-col h-full text-sidebar-foreground">
            <div className="px-6 py-4">
                <Link href="/dashboard" className="flex items-center gap-2 mb-8 group">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-all duration-300">
                        <Code2 className="h-5 w-5" />
                    </div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                        dao123
                    </h1>
                </Link>
                <div className="space-y-1.5">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer rounded-xl transition-all duration-200 relative overflow-hidden",
                                route.active
                                    ? "text-primary-foreground bg-primary shadow-md shadow-primary/20"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            {route.active && (
                                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50" />
                            )}
                            <div className="flex items-center flex-1 relative z-10">
                                <route.icon className={cn("h-5 w-5 mr-3 transition-transform group-hover:scale-110", route.active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                                {route.label}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            <div className="mt-auto px-6 py-4">
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50 mb-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                            PRO
                        </div>
                        <div>
                            <p className="text-sm font-semibold">升级到专业版</p>
                            <p className="text-xs text-muted-foreground">解锁更多高级功能</p>
                        </div>
                    </div>
                    <Button size="sm" className="w-full mt-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 border-0 text-white shadow-lg shadow-orange-500/20">
                        立即升级
                    </Button>
                </div>
                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl">
                    <LogOut className="h-5 w-5 mr-3" />
                    退出登录
                </Button>
            </div>
        </div>
    );
}
