-- Create workflows table for DAG workflow engine
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger JSONB DEFAULT '{"type": "manual"}'::jsonb,
  nodes JSONB DEFAULT '[]'::jsonb,
  edges JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_is_active ON workflows(is_active);

-- Enable RLS
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own workflows"
  ON workflows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own workflows"
  ON workflows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workflows"
  ON workflows FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workflows"
  ON workflows FOR DELETE
  USING (auth.uid() = user_id);

-- Create workflow_runs table for execution tracking
CREATE TABLE IF NOT EXISTS workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  trigger_data JSONB,
  result JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error TEXT
);

-- Create indexes for workflow_runs
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow_id ON workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_user_id ON workflow_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON workflow_runs(status);

-- Enable RLS for workflow_runs
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflow_runs
CREATE POLICY "Users can view own workflow runs"
  ON workflow_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own workflow runs"
  ON workflow_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workflow runs"
  ON workflow_runs FOR UPDATE
  USING (auth.uid() = user_id);
