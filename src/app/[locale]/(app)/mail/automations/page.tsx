'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Zap,
  Plus,
  MoreVertical,
  Play,
  Pause,
  Copy,
  Trash2,
  Edit,
  Users,
  CheckCircle2,
  ArrowLeft,
  Mail,
  Clock,
  Tag,
} from 'lucide-react';
import { Link } from '@/components/link';
import {
  getAutomations,
  deleteAutomation,
  toggleAutomationStatus,
  duplicateAutomation,
  type AutomationWithStats,
} from '@/lib/actions/automations';
import { toast } from 'sonner';

const triggerLabels: Record<string, string> = {
  form_submission: '表单提交',
  contact_created: '新建联系人',
  tag_added: '添加标签',
  manual: '手动触发',
};

const triggerIcons: Record<string, React.ElementType> = {
  form_submission: Mail,
  contact_created: Users,
  tag_added: Tag,
  manual: Zap,
};

function AutomationCard({
  automation,
  onRefresh,
}: {
  automation: AutomationWithStats;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const TriggerIcon = triggerIcons[automation.trigger_type] || Zap;
  const stepCount = automation.steps?.length || 0;

  const handleToggle = async () => {
    try {
      await toggleAutomationStatus(automation.id);
      toast.success(automation.is_active ? '已暂停自动化' : '已启用自动化');
      onRefresh();
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleDuplicate = async () => {
    try {
      const newAutomation = await duplicateAutomation(automation.id);
      toast.success('已复制自动化');
      router.push(`/mail/automations/${newAutomation.id}`);
    } catch (error) {
      toast.error('复制失败');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAutomation(automation.id);
      toast.success('已删除自动化');
      onRefresh();
    } catch (error) {
      toast.error('删除失败');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-300">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                automation.is_active ? 'bg-green-500/10' : 'bg-muted'
              }`}>
                <Zap className={`h-5 w-5 ${automation.is_active ? 'text-green-500' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <h3 className="font-semibold">{automation.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TriggerIcon className="h-3 w-3" />
                  <span>{triggerLabels[automation.trigger_type]}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={automation.is_active ? 'default' : 'secondary'}>
                {automation.is_active ? '运行中' : '已暂停'}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/mail/automations/${automation.id}`)}>
                    <Edit className="h-4 w-4 mr-2" />
                    编辑
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleToggle}>
                    {automation.is_active ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        暂停
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        启用
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDuplicate}>
                    <Copy className="h-4 w-4 mr-2" />
                    复制
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Steps preview */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
            {(automation.steps || []).slice(0, 4).map((step, index) => (
              <div
                key={step.id}
                className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs whitespace-nowrap"
              >
                {step.type === 'send_email' && <Mail className="h-3 w-3" />}
                {step.type === 'wait' && <Clock className="h-3 w-3" />}
                {(step.type === 'add_tag' || step.type === 'remove_tag') && <Tag className="h-3 w-3" />}
                <span>
                  {step.type === 'send_email' && '发送邮件'}
                  {step.type === 'wait' && `等待 ${(step.config as any).duration}${(step.config as any).unit === 'days' ? '天' : (step.config as any).unit === 'hours' ? '小时' : '分钟'}`}
                  {step.type === 'add_tag' && `+${(step.config as any).tag}`}
                  {step.type === 'remove_tag' && `-${(step.config as any).tag}`}
                </span>
                {index < Math.min((automation.steps || []).length, 4) - 1 && (
                  <span className="text-muted-foreground ml-1">→</span>
                )}
              </div>
            ))}
            {stepCount > 4 && (
              <span className="text-xs text-muted-foreground">+{stepCount - 4} 步</span>
            )}
            {stepCount === 0 && (
              <span className="text-xs text-muted-foreground">暂无步骤</span>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {automation.enrollment_count} 人参与
            </span>
            <span className="flex items-center gap-1">
              <Play className="h-4 w-4" />
              {automation.active_count} 进行中
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              {automation.completed_count} 已完成
            </span>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除自动化「{automation.name}」吗？此操作无法撤销，所有相关的执行记录也将被删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function AutomationsPage() {
  const router = useRouter();
  const [automations, setAutomations] = useState<AutomationWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAutomations = async () => {
    try {
      const data = await getAutomations();
      setAutomations(data);
    } catch (error) {
      console.error('Error fetching automations:', error);
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomations();
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
              <Zap className="mr-2 h-3 w-3" />
              自动化
            </div>
            <h1 className="text-3xl font-bold tracking-tight">自动化工作流</h1>
            <p className="text-muted-foreground mt-1">
              创建自动化邮件序列，让获客更高效
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/mail/automations/records')}>
              <Users className="h-4 w-4 mr-2" />
              执行记录
            </Button>
            <Button onClick={() => router.push('/mail/automations/new')}>
              <Plus className="h-4 w-4 mr-2" />
              创建自动化
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-card/50 animate-pulse">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-24 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-8 bg-muted rounded mb-4" />
                <div className="flex gap-4">
                  <div className="h-4 w-20 bg-muted rounded" />
                  <div className="h-4 w-20 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : automations.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">还没有自动化</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              创建您的第一个自动化工作流，当访客提交表单后自动发送欢迎邮件序列
            </p>
            <Button onClick={() => router.push('/mail/automations/new')}>
              <Plus className="h-4 w-4 mr-2" />
              创建自动化
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {automations.map((automation) => (
            <AutomationCard
              key={automation.id}
              automation={automation}
              onRefresh={fetchAutomations}
            />
          ))}
        </div>
      )}
    </div>
  );
}
