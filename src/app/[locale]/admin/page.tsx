'use client'

import { useEffect, useState } from 'react'
import { getAdminStats, getAdminChartData } from "@/lib/actions/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, Image as ImageIcon, Coins } from "lucide-react"
import { AdminCharts } from "@/components/admin/AdminCharts"
import { useTranslations } from 'next-intl'

export default function AdminDashboard() {
    const t = useTranslations('admin')
    const [stats, setStats] = useState({ usersCount: 0, projectsCount: 0, assetsCount: 0, totalCredits: 0 })
    const [chartData, setChartData] = useState<any>(null)

    useEffect(() => {
        const loadData = async () => {
            const [statsData, chartsData] = await Promise.all([
                getAdminStats(),
                getAdminChartData()
            ])
            setStats({
                usersCount: statsData.usersCount ?? 0,
                projectsCount: statsData.projectsCount ?? 0,
                assetsCount: statsData.assetsCount ?? 0,
                totalCredits: statsData.totalCredits ?? 0
            })
            setChartData(chartsData)
        }
        loadData()
    }, [])

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold tracking-tight">{t('dashboard')}</h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('totalUsers')}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.usersCount}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('totalProjects')}</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.projectsCount}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('totalAssets')}</CardTitle>
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.assetsCount}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('totalCreditsConsumed')}</CardTitle>
                        <Coins className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCredits}</div>
                    </CardContent>
                </Card>
            </div>

            {chartData && <AdminCharts data={chartData} />}
        </div>
    )
}
