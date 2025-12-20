'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Trophy,
  Users,
  Mail,
  MousePointer,
  Eye,
  AlertTriangle,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { getABTestAnalytics, type ABTestAnalytics, type ABTestVariantStats } from '@/lib/actions/automations';
import { cn } from '@/lib/utils';

interface ABTestAnalyticsPanelProps {
  automationId: string;
  className?: string;
}

export function ABTestAnalyticsPanel({ automationId, className }: ABTestAnalyticsPanelProps) {
  const [analytics, setAnalytics] = useState<ABTestAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        const data = await getABTestAnalytics(automationId);
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载分析数据失败');
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [automationId]);

  if (loading) {
    return <ABTestAnalyticsSkeleton className={className} />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!analytics) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-muted-foreground">
          <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>此自动化没有 A/B 测试</p>
          <p className="text-sm mt-1">添加「分流」步骤以启用 A/B 测试分析</p>
        </CardContent>
      </Card>
    );
  }

  const maxEnrolled = Math.max(...analytics.variants.map(v => v.enrolled), 1);
  const needsMoreData = analytics.variants.some(v => v.emailsSent < 10);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                A/B 测试分析
              </CardTitle>
              <CardDescription className="mt-1">
                {analytics.splitStepName} · 共 {analytics.totalEnrolled} 人参与
              </CardDescription>
            </div>
            {analytics.winner && (
              <Badge variant="success" className="gap-1">
                <Trophy className="h-3 w-3" />
                {analytics.winner.variantName} 胜出
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Sample Size Warning */}
      {needsMoreData && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            数据量较小，建议每个变体至少 10 封邮件以获得可靠结果。当前部分变体邮件数量不足。
          </AlertDescription>
        </Alert>
      )}

      {/* Variant Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {analytics.variants.map((variant) => (
          <VariantCard
            key={variant.id}
            variant={variant}
            isWinner={analytics.winner?.variantId === variant.id}
            maxEnrolled={maxEnrolled}
            lift={analytics.winner?.variantId === variant.id ? analytics.winner.lift : undefined}
          />
        ))}
      </div>

      {/* Winner Summary */}
      {analytics.winner && (
        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium">
                  {analytics.winner.variantName} 是当前胜出变体
                </p>
                <p className="text-sm text-muted-foreground">
                  {analytics.winner.metric === 'clickRate' ? '点击率' : '打开率'}
                  比其他变体高 {analytics.winner.lift}%
                  <span className="ml-2">
                    (置信度: {confidenceLabel(analytics.winner.confidence)})
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <TrendingUp className="h-4 w-4" />
                <span className="font-semibold">+{analytics.winner.lift}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface VariantCardProps {
  variant: ABTestVariantStats;
  isWinner: boolean;
  maxEnrolled: number;
  lift?: number;
}

function VariantCard({ variant, isWinner, maxEnrolled, lift }: VariantCardProps) {
  const enrollmentPercent = (variant.enrolled / maxEnrolled) * 100;

  return (
    <Card className={cn(
      'transition-all',
      isWinner && 'border-green-300 ring-1 ring-green-200 dark:border-green-800 dark:ring-green-900'
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {variant.name}
            {isWinner && (
              <Trophy className="h-4 w-4 text-green-500" />
            )}
          </CardTitle>
          <Badge variant="outline">{variant.percentage}%</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enrollment Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              参与人数
            </span>
            <span className="font-medium">{variant.enrolled}</span>
          </div>
          <Progress
            value={enrollmentPercent}
            className={cn(
              'h-2',
              isWinner && '[&>[data-slot=progress-indicator]]:bg-green-500'
            )}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
            </div>
            <p className="text-lg font-semibold">{variant.emailsSent}</p>
            <p className="text-xs text-muted-foreground">已发送</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
            </div>
            <p className="text-lg font-semibold">{variant.openRate}%</p>
            <p className="text-xs text-muted-foreground">打开率</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <MousePointer className="h-3.5 w-3.5" />
            </div>
            <p className={cn(
              'text-lg font-semibold',
              isWinner && 'text-green-600 dark:text-green-400'
            )}>
              {variant.clickRate}%
            </p>
            <p className="text-xs text-muted-foreground">点击率</p>
          </div>
        </div>

        {/* Lift indicator for winner */}
        {isWinner && lift !== undefined && lift > 0 && (
          <div className="flex items-center justify-center gap-1 rounded-md bg-green-100 py-1.5 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <TrendingUp className="h-4 w-4" />
            点击率领先 {lift}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function confidenceLabel(confidence: 'low' | 'medium' | 'high'): string {
  switch (confidence) {
    case 'high':
      return '高';
    case 'medium':
      return '中';
    case 'low':
      return '低';
  }
}

function ABTestAnalyticsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardHeader>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-2 w-full" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-2 w-full" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
