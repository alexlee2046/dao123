'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Zap,
  ArrowLeft,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Mail,
  Tag,
  ChevronLeft,
  ChevronRight,
  StopCircle,
  Activity,
} from 'lucide-react';
import { Link } from '@/components/link';
import {
  getAllEnrollments,
  getEnrollmentStepLogs,
  stopEnrollment,
  type AutomationEnrollment,
  type AutomationStepLog,
} from '@/lib/actions/automations';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active: { label: '进行中', color: 'bg-blue-500/10 text-blue-500', icon: Activity },
  completed: { label: '已完成', color: 'bg-green-500/10 text-green-500', icon: CheckCircle2 },
  stopped: { label: '已停止', color: 'bg-muted text-muted-foreground', icon: StopCircle },
  error: { label: '出错', color: 'bg-red-500/10 text-red-500', icon: XCircle },
};

const stepTypeLabels: Record<string, string> = {
  send_email: '发送邮件',
  wait: '等待',
  add_tag: '添加标签',
  remove_tag: '移除标签',
};

interface EnrollmentWithExtra extends AutomationEnrollment {
  automation_name: string;
  automation_steps?: any[];
}

function EnrollmentCard({
  enrollment,
  onViewDetails,
  onStop,
}: {
  enrollment: EnrollmentWithExtra;
  onViewDetails: () => void;
  onStop: () => void;
}) {
  const config = statusConfig[enrollment.status] || statusConfig.active;
  const StatusIcon = config.icon;
  const totalSteps = enrollment.automation_steps?.length || 0;
  const progress = totalSteps > 0 ? Math.round((enrollment.current_step_index / totalSteps) * 100) : 0;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-300">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-medium">{enrollment.automation_name}</h3>
            <p className="text-sm text-muted-foreground">
              {enrollment.contacts?.email || 'Unknown contact'}
            </p>
          </div>
          <Badge className={config.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>步骤 {enrollment.current_step_index}/{totalSteps}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(enrollment.enrolled_at), { addSuffix: true, locale: zhCN })}
          </span>
          {enrollment.next_action_at && enrollment.status === 'active' && (
            <span className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              下一步: {formatDistanceToNow(new Date(enrollment.next_action_at), { addSuffix: true, locale: zhCN })}
            </span>
          )}
        </div>

        {/* Error message */}
        {enrollment.error_message && (
          <div className="text-xs text-red-500 bg-red-500/10 rounded p-2 mb-3">
            {enrollment.error_message}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            查看详情
          </Button>
          {enrollment.status === 'active' && (
            <Button variant="outline" size="sm" onClick={onStop}>
              <StopCircle className="h-3 w-3 mr-1" />
              停止
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StepLogItem({ log, step }: { log: AutomationStepLog; step?: any }) {
  const stepLogStatusConfig: Record<string, { color: string; icon: React.ElementType }> = {
    completed: { color: 'text-green-500', icon: CheckCircle2 },
    failed: { color: 'text-red-500', icon: XCircle },
    pending: { color: 'text-blue-500', icon: Clock },
    skipped: { color: 'text-muted-foreground', icon: AlertCircle },
  };

  const config = stepLogStatusConfig[log.status] || stepLogStatusConfig.pending;
  const LogIcon = config.icon;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <div className={`mt-0.5 ${config.color}`}>
        <LogIcon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            步骤 {log.step_index + 1}: {stepTypeLabels[log.step_type] || log.step_type}
          </span>
        </div>
        {log.executed_at && (
          <p className="text-xs text-muted-foreground mt-1">
            执行于 {formatDistanceToNow(new Date(log.executed_at), { addSuffix: true, locale: zhCN })}
          </p>
        )}
        {log.error_message && (
          <p className="text-xs text-red-500 mt-1">{log.error_message}</p>
        )}
        {log.result && Object.keys(log.result).length > 0 && (
          <pre className="text-xs bg-muted/50 rounded p-2 mt-2 overflow-auto max-h-20">
            {JSON.stringify(log.result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

export default function AutomationRecordsPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentWithExtra[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentWithExtra | null>(null);
  const [stepLogs, setStepLogs] = useState<AutomationStepLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const pageSize = 12;

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const result = await getAllEnrollments({
        status: statusFilter === 'all' ? undefined : statusFilter as any,
        limit: pageSize,
        offset: page * pageSize,
      });
      setEnrollments(result.enrollments as EnrollmentWithExtra[]);
      setTotal(result.total);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStepLogs = async (enrollmentId: string) => {
    setLoadingLogs(true);
    try {
      const logs = await getEnrollmentStepLogs(enrollmentId);
      setStepLogs(logs);
    } catch (error) {
      console.error('Error fetching step logs:', error);
      toast.error('加载步骤日志失败');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleStop = async (enrollmentId: string) => {
    try {
      await stopEnrollment(enrollmentId);
      toast.success('已停止执行');
      fetchEnrollments();
    } catch (error) {
      toast.error('停止失败');
    }
  };

  const handleViewDetails = (enrollment: EnrollmentWithExtra) => {
    setSelectedEnrollment(enrollment);
    fetchStepLogs(enrollment.id);
  };

  useEffect(() => {
    fetchEnrollments();
  }, [statusFilter, page]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-6 md:px-12">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/mail/automations">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Link>
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary backdrop-blur-sm mb-3">
              <Zap className="mr-2 h-3 w-3" />
              执行记录
            </div>
            <h1 className="text-3xl font-bold tracking-tight">自动化执行记录</h1>
            <p className="text-muted-foreground mt-1">
              查看所有自动化工作流的执行状态
            </p>
          </div>

          {/* Filter */}
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="筛选状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="active">进行中</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
              <SelectItem value="stopped">已停止</SelectItem>
              <SelectItem value="error">出错</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">进行中</p>
                <p className="text-xl font-bold">
                  {enrollments.filter(e => e.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">已完成</p>
                <p className="text-xl font-bold">
                  {enrollments.filter(e => e.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <StopCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">已停止</p>
                <p className="text-xl font-bold">
                  {enrollments.filter(e => e.status === 'stopped').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">出错</p>
                <p className="text-xl font-bold">
                  {enrollments.filter(e => e.status === 'error').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-card/50 animate-pulse">
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-48 bg-muted rounded" />
                  <div className="h-2 w-full bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : enrollments.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">暂无执行记录</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              当有联系人触发自动化工作流时，执行记录会显示在这里
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((enrollment) => (
              <EnrollmentCard
                key={enrollment.id}
                enrollment={enrollment}
                onViewDetails={() => handleViewDetails(enrollment)}
                onStop={() => handleStop(enrollment.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                第 {page + 1} 页，共 {totalPages} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedEnrollment} onOpenChange={() => setSelectedEnrollment(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>执行详情</DialogTitle>
          </DialogHeader>

          {selectedEnrollment && (
            <div className="space-y-4">
              {/* Enrollment info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">自动化</span>
                  <span className="font-medium">{selectedEnrollment.automation_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">联系人</span>
                  <span className="font-medium">{selectedEnrollment.contacts?.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">状态</span>
                  <Badge className={statusConfig[selectedEnrollment.status]?.color}>
                    {statusConfig[selectedEnrollment.status]?.label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">开始时间</span>
                  <span className="text-sm">
                    {new Date(selectedEnrollment.enrolled_at).toLocaleString('zh-CN')}
                  </span>
                </div>
                {selectedEnrollment.completed_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">完成时间</span>
                    <span className="text-sm">
                      {new Date(selectedEnrollment.completed_at).toLocaleString('zh-CN')}
                    </span>
                  </div>
                )}
              </div>

              {/* Step logs */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">步骤执行日志</h4>
                {loadingLogs ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-start gap-3 animate-pulse">
                        <div className="h-4 w-4 bg-muted rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-32 bg-muted rounded" />
                          <div className="h-3 w-24 bg-muted rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : stepLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    暂无执行日志
                  </p>
                ) : (
                  <div>
                    {stepLogs.map((log) => (
                      <StepLogItem
                        key={log.id}
                        log={log}
                        step={selectedEnrollment.automation_steps?.[log.step_index]}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
