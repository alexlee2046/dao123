'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  ArrowLeft,
  Inbox,
  Eye,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';
import { Link } from '@/components/link';
import { getForm, getFormSubmissions } from '@/lib/actions/forms';
import type { Form, FormSubmission } from '@/lib/forms/types';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function FormSubmissionsPage() {
  const params = useParams();
  const formId = params.id as string;

  const [form, setForm] = useState<Form | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);

  const pageSize = 20;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [formData, submissionsData] = await Promise.all([
        getForm(formId),
        getFormSubmissions(formId, { limit: pageSize, offset: page * pageSize }),
      ]);
      setForm(formData);
      setSubmissions(submissionsData.submissions);
      setTotal(submissionsData.total);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [formId, page]);

  const totalPages = Math.ceil(total / pageSize);

  // Get field labels for table headers
  const fieldLabels = (form?.fields as any[])?.slice(0, 4).map((f) => f.label) || [];

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-6 md:px-12">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/mail/forms/${formId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回编辑
          </Link>
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary backdrop-blur-sm mb-3">
              <Inbox className="mr-2 h-3 w-3" />
              提交记录
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {form?.name || '表单'} - 提交记录
            </h1>
            <p className="text-muted-foreground mt-1">
              共 {total} 条提交
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <Card className="bg-card/50 animate-pulse">
          <CardContent className="p-8">
            <div className="h-64 bg-muted rounded" />
          </CardContent>
        </Card>
      ) : submissions.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">暂无提交</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              当有访客提交表单后，记录会显示在这里
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  {fieldLabels.map((label, i) => (
                    <TableHead key={i}>{label}</TableHead>
                  ))}
                  <TableHead>联系人</TableHead>
                  <TableHead>提交时间</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission, index) => {
                  const data = submission.data as Record<string, any>;
                  const fields = (form?.fields as any[]) || [];

                  return (
                    <TableRow key={submission.id}>
                      <TableCell className="text-muted-foreground">
                        {page * pageSize + index + 1}
                      </TableCell>
                      {fields.slice(0, 4).map((field) => (
                        <TableCell key={field.id} className="max-w-[200px] truncate">
                          {data[field.id] || '-'}
                        </TableCell>
                      ))}
                      <TableCell>
                        {submission.contact_id ? (
                          <Link
                            href={`/mail/contacts?id=${submission.contact_id}`}
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <User className="h-3 w-3" />
                            查看
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(new Date(submission.created_at), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedSubmission(submission)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
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
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>提交详情</DialogTitle>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              {/* Submission data */}
              <div className="space-y-3">
                {((form?.fields as any[]) || []).map((field) => {
                  const value = (selectedSubmission.data as Record<string, any>)[field.id];
                  return (
                    <div key={field.id} className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">{field.label}</span>
                      <span className="text-sm font-medium">{value || '-'}</span>
                    </div>
                  );
                })}
              </div>

              {/* Metadata */}
              {selectedSubmission.metadata && Object.keys(selectedSubmission.metadata).length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">元数据</h4>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                    {JSON.stringify(selectedSubmission.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                提交于 {new Date(selectedSubmission.created_at).toLocaleString('zh-CN')}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
