'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Target,
  Plus,
  ArrowLeft,
  Edit,
  Trash2,
  MoreVertical,
  Users,
  Filter,
} from 'lucide-react';
import { Link } from '@/components/link';
import { getSegments, createSegment, deleteSegment } from '@/lib/actions/mail/segments';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Segment {
  id: string;
  name: string;
  description?: string;
  filters: any;
  contact_count?: number;
  created_at: string;
  updated_at: string;
}

function SegmentCard({
  segment,
  onRefresh,
}: {
  segment: Segment;
  onRefresh: () => void;
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteSegment(segment.id);
      toast.success('已删除分组');
      onRefresh();
    } catch (error) {
      toast.error('删除失败');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const filterCount = Array.isArray(segment.filters) ? segment.filters.length : 0;

  return (
    <>
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-300">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{segment.name}</h3>
                {segment.description && (
                  <p className="text-sm text-muted-foreground truncate">{segment.description}</p>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {segment.contact_count || 0} 个联系人
            </span>
            <span className="flex items-center gap-1">
              <Filter className="h-4 w-4" />
              {filterCount} 个筛选条件
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            创建于 {formatDistanceToNow(new Date(segment.created_at), { addSuffix: true, locale: zhCN })}
          </p>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除分组「{segment.name}」吗？此操作无法撤销。
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

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSegmentName, setNewSegmentName] = useState('');
  const [newSegmentDesc, setNewSegmentDesc] = useState('');

  const fetchSegments = async () => {
    setLoading(true);
    try {
      const data = await getSegments();
      setSegments(data);
    } catch (error) {
      console.error('Error fetching segments:', error);
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  const handleCreate = async () => {
    if (!newSegmentName.trim()) {
      toast.error('请输入分组名称');
      return;
    }

    setCreating(true);
    try {
      await createSegment(newSegmentName.trim(), {
        conditions: [],
        logic: 'AND',
      });
      toast.success('已创建分组');
      setShowCreateDialog(false);
      setNewSegmentName('');
      setNewSegmentDesc('');
      fetchSegments();
    } catch (error) {
      toast.error('创建失败');
    } finally {
      setCreating(false);
    }
  };

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
              <Target className="mr-2 h-3 w-3" />
              分组管理
            </div>
            <h1 className="text-3xl font-bold tracking-tight">联系人分组</h1>
            <p className="text-muted-foreground mt-1">
              按条件筛选和分组您的联系人
            </p>
          </div>

          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            创建分组
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
      ) : segments.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">还没有分组</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              创建分组来更精准地管理您的联系人
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              创建分组
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {segments.map((segment) => (
            <SegmentCard key={segment.id} segment={segment} onRefresh={fetchSegments} />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建分组</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>分组名称 *</Label>
              <Input
                value={newSegmentName}
                onChange={(e) => setNewSegmentName(e.target.value)}
                placeholder="例如：高价值客户"
              />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Input
                value={newSegmentDesc}
                onChange={(e) => setNewSegmentDesc(e.target.value)}
                placeholder="分组描述（可选）"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
