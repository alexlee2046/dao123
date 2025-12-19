'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Plus,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  ArrowLeft,
  Code,
  ExternalLink,
  Inbox,
  Eye,
} from 'lucide-react';
import { Link } from '@/components/link';
import { getForms, deleteForm, duplicateForm, generateFormEmbedCode } from '@/lib/actions/forms';
import type { Form } from '@/lib/forms/types';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-muted text-muted-foreground' },
  published: { label: '已发布', color: 'bg-green-500/10 text-green-500' },
  archived: { label: '已归档', color: 'bg-orange-500/10 text-orange-500' },
};

function FormCard({
  form,
  onRefresh,
}: {
  form: Form;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEmbedDialog, setShowEmbedDialog] = useState(false);
  const [embedCode, setEmbedCode] = useState<{ iframe: string; script: string } | null>(null);

  const config = statusConfig[form.status] || statusConfig.draft;

  const handleDuplicate = async () => {
    try {
      const result = await duplicateForm(form.id);
      if (result.success && result.form) {
        toast.success('已复制表单');
        router.push(`/mail/forms/${result.form.id}`);
      } else {
        toast.error(result.error || '复制失败');
      }
    } catch (error) {
      toast.error('复制失败');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteForm(form.id);
      if (result.success) {
        toast.success('已删除表单');
        onRefresh();
      } else {
        toast.error(result.error || '删除失败');
      }
    } catch (error) {
      toast.error('删除失败');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleShowEmbed = async () => {
    const code = await generateFormEmbedCode(form.id);
    setEmbedCode(code);
    setShowEmbedDialog(true);
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type}代码已复制`);
  };

  return (
    <>
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-300">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{form.name}</h3>
                {form.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">{form.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={config.color}>{config.label}</Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/mail/forms/${form.id}`)}>
                    <Edit className="h-4 w-4 mr-2" />
                    编辑
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(`/mail/forms/${form.id}/submissions`)}>
                    <Inbox className="h-4 w-4 mr-2" />
                    查看提交
                  </DropdownMenuItem>
                  {form.status === 'published' && (
                    <>
                      <DropdownMenuItem onClick={handleShowEmbed}>
                        <Code className="h-4 w-4 mr-2" />
                        嵌入代码
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(`/f/${form.id}`, '_blank')}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        预览表单
                      </DropdownMenuItem>
                    </>
                  )}
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

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Inbox className="h-4 w-4" />
              {form.submission_count || 0} 条提交
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {(form.fields as any[])?.length || 0} 个字段
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            创建于 {formatDistanceToNow(new Date(form.created_at), { addSuffix: true, locale: zhCN })}
          </p>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除表单「{form.name}」吗？此操作无法撤销，所有提交记录也将被删除。
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

      {/* Embed Code Dialog */}
      <Dialog open={showEmbedDialog} onOpenChange={setShowEmbedDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>嵌入代码</DialogTitle>
          </DialogHeader>
          {embedCode && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">iframe 嵌入</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(embedCode.iframe, 'iframe')}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    复制
                  </Button>
                </div>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  {embedCode.iframe}
                </pre>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Script 嵌入</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(embedCode.script, 'script')}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    复制
                  </Button>
                </div>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  {embedCode.script}
                </pre>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">独立链接</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(`${window.location.origin}/f/${form.id}`, '链接')}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    复制
                  </Button>
                </div>
                <code className="text-xs bg-muted p-3 rounded block">
                  {typeof window !== 'undefined' ? `${window.location.origin}/f/${form.id}` : ''}
                </code>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function FormsPage() {
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const result = await getForms();
      setForms(result.forms);
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
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
              <FileText className="mr-2 h-3 w-3" />
              表单管理
            </div>
            <h1 className="text-3xl font-bold tracking-tight">表单库</h1>
            <p className="text-muted-foreground mt-1">
              创建和管理您的线索收集表单
            </p>
          </div>

          <Button onClick={() => router.push('/mail/forms/new')}>
            <Plus className="h-4 w-4 mr-2" />
            创建表单
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-card/50 animate-pulse">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-24 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-4 w-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : forms.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">还没有表单</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              创建您的第一个表单，开始收集访客信息
            </p>
            <Button onClick={() => router.push('/mail/forms/new')}>
              <Plus className="h-4 w-4 mr-2" />
              创建表单
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <FormCard key={form.id} form={form} onRefresh={fetchForms} />
          ))}
        </div>
      )}
    </div>
  );
}
