import { notFound } from 'next/navigation';
import { ArrowLeft, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@/components/link';
import AutomationEditor from '@/components/automations/AutomationEditor';
import { createClient } from '@/lib/supabase/server';
import { getAutomation } from '@/lib/actions/automations';

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

      <AutomationEditor
        automation={automation}
        templates={templates}
        forms={forms}
      />
    </div>
  );
}
