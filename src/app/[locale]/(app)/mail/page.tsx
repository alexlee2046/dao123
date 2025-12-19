import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Mail,
    Users,
    Plus,
    Send,
    FileText,
    Target,
    TrendingUp,
    MousePointerClick,
    Calendar,
    ArrowRight,
    Zap,
} from "lucide-react";
import { Link } from "@/components/link";
import { getCampaignStats, getCampaigns, type Campaign } from "@/lib/actions/mail/campaigns";
import { getMailCredits } from "@/lib/actions/mail/credits";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

// Stats Card Component
function StatCard({ label, value, icon: Icon, subtext }: { label: string; value: string; icon: React.ElementType; subtext?: string }) {
    return (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <p className="text-2xl font-bold mt-1">{value}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                    </div>
                </div>
                {subtext && (
                    <p className="text-xs text-muted-foreground mt-2">{subtext}</p>
                )}
            </CardContent>
        </Card>
    );
}

// Campaign Card Component
function CampaignCard({ campaign }: { campaign: Campaign }) {
    const stats = campaign.stats || { sent: 0, opened: 0, clicked: 0 };
    const statusLabels: Record<string, string> = {
        draft: "草稿",
        scheduled: "已排期",
        sent: "已发送",
        cancelled: "已取消"
    };
    const statusColors: Record<string, string> = {
        draft: "bg-muted text-muted-foreground",
        scheduled: "bg-blue-500/10 text-blue-500",
        sent: "bg-green-500/10 text-green-500",
        cancelled: "bg-red-500/10 text-red-500"
    };

    return (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{campaign.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{campaign.subject}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[campaign.status]}`}>
                        {statusLabels[campaign.status]}
                    </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Send className="h-3 w-3" />
                        {stats.sent || 0}
                    </span>
                    <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {stats.opened || 0}
                    </span>
                    <span className="flex items-center gap-1">
                        <MousePointerClick className="h-3 w-3" />
                        {stats.clicked || 0}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true, locale: zhCN })}
                </p>
            </CardContent>
        </Card>
    );
}

// Stats Section with data fetching
async function StatsSection() {
    const [stats, credits] = await Promise.all([
        getCampaignStats(),
        getMailCredits()
    ]);

    const statItems = [
        { label: "邮件已发送", value: stats.totalSent.toLocaleString(), icon: Send, subtext: "全部活动累计" },
        { label: "打开率", value: `${stats.openRate}%`, icon: TrendingUp, subtext: `${stats.totalOpened} 次打开` },
        { label: "点击率", value: `${stats.clickRate}%`, icon: MousePointerClick, subtext: `${stats.totalClicked} 次点击` },
        { label: "联系人总数", value: stats.contactCount.toLocaleString(), icon: Users, subtext: `${credits} 积分剩余` }
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {statItems.map((stat, index) => (
                <StatCard key={index} {...stat} />
            ))}
        </div>
    );
}

// Recent Campaigns Section with data fetching
async function RecentCampaignsSection() {
    const campaigns = await getCampaigns(6);

    if (campaigns.length === 0) {
        return (
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-8 text-center">
                    <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                        <Mail className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-muted-foreground mb-4">还没有创建任何邮件活动</p>
                    <Button asChild>
                        <Link href="/mail/campaigns/create">
                            <Plus className="mr-2 h-4 w-4" />
                            创建第一个活动
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {campaigns.map((campaign) => (
                    <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
            </div>
            {campaigns.length >= 6 && (
                <div className="text-center">
                    <Button variant="ghost" asChild>
                        <Link href="/mail/campaigns">
                            查看全部活动
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}

// Loading Skeleton
function StatsSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-card/50 backdrop-blur-sm border-border/50 animate-pulse">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <div className="h-4 w-16 bg-muted rounded" />
                                <div className="h-6 w-12 bg-muted rounded" />
                            </div>
                            <div className="h-10 w-10 rounded-full bg-muted" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function CampaignsSkeleton() {
    return (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 animate-pulse">
            <CardContent className="p-8 text-center">
                <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4" />
                <div className="h-4 w-32 bg-muted rounded mx-auto" />
            </CardContent>
        </Card>
    );
}

export default async function MailDashboardPage() {
    const t = await getTranslations("mail");

    // Quick action cards
    const quickActions = [
        {
            icon: Target,
            title: "搜客引擎",
            description: "通过域名精准查找决策人邮箱",
            href: "/mail/search",
            color: "from-cyan-500 to-blue-500"
        },
        {
            icon: Plus,
            title: "新建活动",
            description: "创建新的邮件营销活动",
            href: "/mail/campaigns/create",
            color: "from-blue-500 to-indigo-500"
        },
        {
            icon: Users,
            title: "联系人管理",
            description: "管理和导入联系人列表",
            href: "/mail/contacts",
            color: "from-green-500 to-emerald-500"
        },
        {
            icon: FileText,
            title: "模板库",
            description: "浏览和编辑邮件模板",
            href: "/mail/templates",
            color: "from-purple-500 to-violet-500"
        },
        {
            icon: Target,
            title: "分组管理",
            description: "按条件筛选目标受众",
            href: "/mail/segments",
            color: "from-orange-500 to-amber-500"
        },
        {
            icon: Zap,
            title: "自动化",
            description: "设置自动邮件序列",
            href: "/mail/automations",
            color: "from-pink-500 to-rose-500"
        }
    ];

    return (
        <div className="w-full max-w-7xl mx-auto py-8 px-6 md:px-12">
            {/* Header */}
            <div className="mb-8">
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary backdrop-blur-sm mb-3">
                    <Mail className="mr-2 h-3 w-3" />
                    DaoMail · 邮件营销
                </div>
                <h1 className="text-3xl font-bold tracking-tight">邮件营销控制台</h1>
                <p className="text-muted-foreground mt-1">
                    管理您的邮件活动、联系人和分析数据
                </p>
            </div>

            {/* Stats Grid */}
            <Suspense fallback={<StatsSkeleton />}>
                <StatsSection />
            </Suspense>

            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">快捷操作</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {quickActions.map((action, index) => (
                        <Link key={index} href={action.href}>
                            <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                                <CardContent className="p-5">
                                    <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        <action.icon className="h-5 w-5 text-white" />
                                    </div>
                                    <CardTitle className="text-base mb-1 group-hover:text-primary transition-colors">
                                        {action.title}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        {action.description}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Campaigns */}
            <div>
                <h2 className="text-lg font-semibold mb-4">最近活动</h2>
                <Suspense fallback={<CampaignsSkeleton />}>
                    <RecentCampaignsSection />
                </Suspense>
            </div>
        </div>
    );
}
