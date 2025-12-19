'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Plus,
  ArrowLeft,
  Send,
  TrendingUp,
  MousePointerClick,
  Calendar,
  Users,
} from 'lucide-react';
import { Link } from '@/components/link';
import { getCampaigns, type Campaign } from '@/lib/actions/mail/campaigns';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-muted text-muted-foreground' },
  scheduled: { label: '已排期', color: 'bg-blue-500/10 text-blue-500' },
  sent: { label: '已发送', color: 'bg-green-500/10 text-green-500' },
  cancelled: { label: '已取消', color: 'bg-red-500/10 text-red-500' },
};

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const router = useRouter();
  const stats = campaign.stats || { sent: 0, opened: 0, clicked: 0 };
  const config = statusConfig[campaign.status] || statusConfig.draft;

  const sent = stats.sent || 0;
  const opened = stats.opened || 0;
  const clicked = stats.clicked || 0;
  const openRate = sent > 0 ? ((opened / sent) * 100).toFixed(1) : '0';
  const clickRate = sent > 0 ? ((clicked / sent) * 100).toFixed(1) : '0';

  return (
    <Card
      className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={() => router.push(`/mail/campaigns/${campaign.id}`)}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{campaign.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{campaign.subject}</p>
          </div>
          <Badge className={config.color}>{config.label}</Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Send className="h-3 w-3" />
              <span className="text-xs">已发送</span>
            </div>
            <p className="font-semibold">{sent}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs">打开率</span>
            </div>
            <p className="font-semibold">{openRate}%</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <MousePointerClick className="h-3 w-3" />
              <span className="text-xs">点击率</span>
            </div>
            <p className="font-semibold">{clickRate}%</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true, locale: zhCN })}
          </span>
          {(campaign as any).audience_count && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {(campaign as any).audience_count} 人
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const data = await getCampaigns();
        setCampaigns(data);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        toast.error('加载失败');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-6 md:px-12">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/mail">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回控制台
          </Link>
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary backdrop-blur-sm mb-3">
              <Mail className="mr-2 h-3 w-3" />
              邮件活动
            </div>
            <h1 className="text-3xl font-bold tracking-tight">活动管理</h1>
            <p className="text-muted-foreground mt-1">
              创建和管理您的邮件营销活动
            </p>
          </div>

          <Button onClick={() => router.push('/mail/campaigns/create')}>
            <Plus className="h-4 w-4 mr-2" />
            创建活动
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-card/50 animate-pulse">
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-48 bg-muted rounded" />
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-12 bg-muted rounded" />
                    <div className="h-12 bg-muted rounded" />
                    <div className="h-12 bg-muted rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">还没有活动</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              创建您的第一个邮件营销活动
            </p>
            <Button onClick={() => router.push('/mail/campaigns/create')}>
              <Plus className="h-4 w-4 mr-2" />
              创建活动
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
