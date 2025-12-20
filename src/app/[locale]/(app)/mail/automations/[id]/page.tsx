import { notFound } from 'next/navigation';
import { ArrowLeft, Zap, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@/components/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AutomationEditor from '@/components/automations/AutomationEditor';
import { ABTestAnalyticsPanel } from '@/components/automations/ABTestAnalyticsPanel';
import { createClient } from '@/lib/supabase/server';
import { getAutomation, type AutomationStep } from '@/lib/actions/automations';

async function getTemplates() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('templates')
    .select('id, name')
    .eq('user_id', user.id)
    .order('name');

  return data || [];
}

async function getForms() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('forms')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('status', 'published')
    .order('name');

  return data || [];
}

export default async function EditAutomationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [automation, templates, forms] = await Promise.all([
    getAutomation(id),
    getTemplates(),
    getForms(),
  ]);

  if (!automation) {
    notFound();
  }

  // Check if automation has A/B test (split step)
  const steps = automation.steps as AutomationStep[];
  const hasABTest = steps.some(s => s.type === 'split');

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-6 md:px-12">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/mail/automations">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Link>
        </Button>

        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary backdrop-blur-sm mb-3">
          <Zap className="mr-2 h-3 w-3" />
          编辑自动化
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{automation.name}</h1>
        <p className="text-muted-foreground mt-1">
          修改触发条件和执行步骤
        </p>
      </div>

      <Tabs defaultValue="editor" className="space-y-6">
        <TabsList>
          <TabsTrigger value="editor">编辑器</TabsTrigger>
          <TabsTrigger value="analytics" disabled={!hasABTest} className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            A/B 分析
            {!hasABTest && (
              <span className="text-xs text-muted-foreground">(无测试)</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor">
          <AutomationEditor
            automation={automation}
            templates={templates}
            forms={forms}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <ABTestAnalyticsPanel automationId={automation.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
