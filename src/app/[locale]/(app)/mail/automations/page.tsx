'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useTranslations } from 'next-intl';
import { SearchFilterBar, type FilterConfig } from '@/components/common/SearchFilterBar';
import { BulkActionsBar, type BulkAction } from '@/components/common/BulkActionsBar';
import { EmptyState } from '@/components/common/EmptyState';

function AutomationCard({
  automation,
  onRefresh,
  isSelected,
  onSelectionChange,
  t,
}: {
  automation: AutomationWithStats;
  onRefresh: () => void;
  isSelected: boolean;
  onSelectionChange: (checked: boolean) => void;
  t: ReturnType<typeof useTranslations<'mail.automations'>>;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const triggerLabels: Record<string, string> = {
    form_submission: t('triggers.formSubmission'),
    contact_created: t('triggers.contactCreated'),
    tag_added: t('triggers.tagAdded'),
    manual: t('triggers.manual'),
  };

  const triggerIcons: Record<string, React.ElementType> = {
    form_submission: Mail,
    contact_created: Users,
    tag_added: Tag,
    manual: Zap,
  };

  const TriggerIcon = triggerIcons[automation.trigger_type] || Zap;
  const stepCount = automation.steps?.length || 0;

  const handleToggle = async () => {
    try {
      await toggleAutomationStatus(automation.id);
      toast.success(automation.is_active ? t('actions.paused') : t('actions.enabled'));
      onRefresh();
    } catch (error) {
      toast.error(t('actions.toggleFailed'));
    }
  };

  const handleDuplicate = async () => {
    try {
      const newAutomation = await duplicateAutomation(automation.id);
      toast.success(t('actions.duplicated'));
      router.push(`/mail/automations/${newAutomation.id}`);
    } catch (error) {
      toast.error(t('actions.duplicateFailed'));
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAutomation(automation.id);
      toast.success(t('actions.deleted'));
      onRefresh();
    } catch (error) {
      toast.error(t('actions.deleteFailed'));
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const getStepLabel = (step: { type: string; config: unknown }) => {
    const config = step.config as { duration?: number; unit?: string; tag?: string } | undefined;
    switch (step.type) {
      case 'send_email':
        return t('steps.sendEmail');
      case 'wait':
        const unitLabel = config?.unit === 'days' ? t('steps.days') : config?.unit === 'hours' ? t('steps.hours') : t('steps.minutes');
        return `${t('steps.wait')} ${config?.duration || ''}${unitLabel}`;
      case 'add_tag':
        return `+${config?.tag || ''}`;
      case 'remove_tag':
        return `-${config?.tag || ''}`;
      default:
        return step.type;
    }
  };

  return (
    <>
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-300">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelectionChange}
                className="mt-1"
              />
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
              <StatusBadge
                status={automation.is_active ? 'running' : 'paused'}
                label={automation.is_active ? t('actions.enable') : t('actions.pause')}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/mail/automations/${automation.id}`)}>
                    <Edit className="h-4 w-4 mr-2" />
                    {t('actions.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleToggle}>
                    {automation.is_active ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        {t('actions.pause')}
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        {t('actions.enable')}
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDuplicate}>
                    <Copy className="h-4 w-4 mr-2" />
                    {t('actions.duplicate')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('actions.delete')}
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
                <span>{getStepLabel(step)}</span>
                {index < Math.min((automation.steps || []).length, 4) - 1 && (
                  <span className="text-muted-foreground ml-1">→</span>
                )}
              </div>
            ))}
            {stepCount > 4 && (
              <span className="text-xs text-muted-foreground">{t('steps.moreSteps', { count: stepCount - 4 })}</span>
            )}
            {stepCount === 0 && (
              <span className="text-xs text-muted-foreground">{t('steps.noSteps')}</span>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {automation.enrollment_count} {t('stats.enrolled')}
            </span>
            <span className="flex items-center gap-1">
              <Play className="h-4 w-4" />
              {automation.active_count} {t('stats.active')}
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              {automation.completed_count} {t('stats.completed')}
            </span>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDialog.description', { name: automation.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t('deleteDialog.deleting') : t('deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function AutomationsPage() {
  const router = useRouter();
  const t = useTranslations('mail.automations');
  const tCommon = useTranslations('mail.common');
  const tGlobal = useTranslations('common');

  const [automations, setAutomations] = useState<AutomationWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchAutomations = async () => {
    try {
      const data = await getAutomations();
      setAutomations(data);
    } catch (error) {
      console.error('Error fetching automations:', error);
      toast.error(t('actions.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  // Filter automations
  const filteredAutomations = useMemo(() => {
    return automations.filter((automation) => {
      const matchesSearch = automation.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'running' && automation.is_active) ||
        (statusFilter === 'paused' && !automation.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [automations, searchQuery, statusFilter]);

  // Filter config
  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: tCommon('allStatuses'),
      value: statusFilter,
      options: [
        { value: 'running', label: tCommon('running') },
        { value: 'paused', label: tCommon('paused') },
      ],
    },
  ];

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredAutomations.map((a) => a.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectionChange = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  // Bulk actions
  const handleBulkEnable = async () => {
    for (const id of selectedIds) {
      const automation = automations.find((a) => a.id === id);
      if (automation && !automation.is_active) {
        await toggleAutomationStatus(id);
      }
    }
    toast.success(tGlobal('bulkEnable'));
    setSelectedIds(new Set());
    fetchAutomations();
  };

  const handleBulkDisable = async () => {
    for (const id of selectedIds) {
      const automation = automations.find((a) => a.id === id);
      if (automation && automation.is_active) {
        await toggleAutomationStatus(id);
      }
    }
    toast.success(tGlobal('bulkDisable'));
    setSelectedIds(new Set());
    fetchAutomations();
  };

  const bulkActions: BulkAction[] = [
    {
      label: tGlobal('bulkEnable'),
      icon: Play,
      onClick: handleBulkEnable,
    },
    {
      label: tGlobal('bulkDisable'),
      icon: Pause,
      onClick: handleBulkDisable,
    },
  ];

  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0);

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-6 md:px-12">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/mail">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tCommon('backToConsole')}
          </Link>
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary backdrop-blur-sm mb-3">
              <Zap className="mr-2 h-3 w-3" />
              {t('badge')}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('description')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/mail/automations/records')}>
              <Users className="h-4 w-4 mr-2" />
              {t('viewRecords')}
            </Button>
            <Button onClick={() => router.push('/mail/automations/new')}>
              <Plus className="h-4 w-4 mr-2" />
              {t('createNew')}
            </Button>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      {automations.length > 0 && (
        <div className="mb-6">
          <SearchFilterBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder={tCommon('searchPlaceholder')}
            filters={filters}
            onFilterChange={(key, value) => {
              if (key === 'status') setStatusFilter(value);
            }}
            onClearFilters={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            activeFilterCount={activeFilterCount}
          />
        </div>
      )}

      {/* Bulk Actions */}
      <BulkActionsBar
        selectedCount={selectedIds.size}
        actions={bulkActions}
        onClearSelection={() => setSelectedIds(new Set())}
        selectedLabel={tGlobal('selected')}
        clearLabel={tGlobal('clear')}
        className="mb-4"
      />

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
      ) : filteredAutomations.length === 0 ? (
        automations.length === 0 ? (
          <EmptyState
            icon={Zap}
            title={t('emptyTitle')}
            description={t('emptyDesc')}
            action={{
              label: t('createNew'),
              onClick: () => router.push('/mail/automations/new'),
            }}
          />
        ) : (
          <EmptyState
            icon={Zap}
            title={tGlobal('noResults')}
            description={tGlobal('tryDifferentSearch')}
          />
        )
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredAutomations.map((automation) => (
            <AutomationCard
              key={automation.id}
              automation={automation}
              onRefresh={fetchAutomations}
              isSelected={selectedIds.has(automation.id)}
              onSelectionChange={(checked) => handleSelectionChange(automation.id, checked)}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}
