import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { Plus, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/components/link';
import { EmptyState } from '@/components/common/EmptyState';

async function WorkflowList({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data: workflows, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[WorkflowList] Error fetching workflows:', error);
    return (
      <div className="text-center py-8 text-red-500">
        Error loading workflows: {error.message}
      </div>
    );
  }

  if (!workflows || workflows.length === 0) {
    return (
      <EmptyState
        icon={Workflow}
        title="No workflows yet"
        description="Create your first workflow to automate tasks"
        action={{
          label: 'Create Workflow',
          href: '/workflow/new',
        }}
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {workflows.map((workflow) => (
        <Link key={workflow.id} href={`/workflow/${workflow.id}`}>
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{workflow.name}</CardTitle>
                <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                  {workflow.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2">
                {workflow.description || 'No description'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {workflow.nodes?.length || 0} nodes
                </span>
                <span>
                  Updated {new Date(workflow.updated_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default async function WorkflowPage({
  params: _params,
}: {
  params: Promise<{ locale: string }>;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">
            Create and manage automated workflows
          </p>
        </div>
        <Link href="/workflow/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Workflow
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
        <WorkflowList userId={user.id} />
      </Suspense>
    </div>
  );
  } catch (err) {
    console.error('[WorkflowPage] Error:', err);
    return (
      <div className="container mx-auto py-6 text-center">
        <h1 className="text-2xl font-bold text-red-500">Error Loading Workflows</h1>
        <p className="text-muted-foreground mt-2">
          {err instanceof Error ? err.message : 'An unexpected error occurred'}
        </p>
      </div>
    );
  }
}
