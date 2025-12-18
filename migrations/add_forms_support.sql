-- Forms Support Migration
-- Date: 2025-12-18
-- Description: Add tables for lead capture forms and submissions

-- =====================================================
-- 1. Forms Table (表单定义)
-- =====================================================
CREATE TABLE IF NOT EXISTS forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  site_id uuid REFERENCES sites(id) ON DELETE SET NULL,

  -- Basic Info
  name text NOT NULL,
  description text,

  -- Form Configuration (JSON)
  fields jsonb NOT NULL DEFAULT '[]',
  settings jsonb NOT NULL DEFAULT '{}',

  -- Status
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),

  -- Stats
  submission_count integer DEFAULT 0,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 2. Form Submissions Table (表单提交记录)
-- =====================================================
CREATE TABLE IF NOT EXISTS form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES forms(id) ON DELETE CASCADE NOT NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,

  -- Submission Data
  data jsonb NOT NULL,

  -- Metadata (IP, User Agent, Referrer, etc.)
  metadata jsonb DEFAULT '{}',

  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- 3. Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_forms_user_id ON forms(user_id);
CREATE INDEX IF NOT EXISTS idx_forms_site_id ON forms(site_id);
CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_contact_id ON form_submissions(contact_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at ON form_submissions(created_at DESC);

-- =====================================================
-- 4. RLS Policies
-- =====================================================
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Forms policies
DROP POLICY IF EXISTS "Users can view their own forms" ON forms;
CREATE POLICY "Users can view their own forms"
  ON forms FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own forms" ON forms;
CREATE POLICY "Users can create their own forms"
  ON forms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own forms" ON forms;
CREATE POLICY "Users can update their own forms"
  ON forms FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own forms" ON forms;
CREATE POLICY "Users can delete their own forms"
  ON forms FOR DELETE
  USING (auth.uid() = user_id);

-- Form submissions policies (users can view submissions for their forms)
DROP POLICY IF EXISTS "Users can view submissions for their forms" ON form_submissions;
CREATE POLICY "Users can view submissions for their forms"
  ON form_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM forms
      WHERE forms.id = form_submissions.form_id
      AND forms.user_id = auth.uid()
    )
  );

-- Allow anonymous submissions (for public forms)
DROP POLICY IF EXISTS "Anyone can submit to published forms" ON form_submissions;
CREATE POLICY "Anyone can submit to published forms"
  ON form_submissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM forms
      WHERE forms.id = form_submissions.form_id
      AND forms.status = 'published'
    )
  );

-- =====================================================
-- 5. Triggers for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS forms_updated_at ON forms;
CREATE TRIGGER forms_updated_at
  BEFORE UPDATE ON forms
  FOR EACH ROW
  EXECUTE FUNCTION update_forms_updated_at();

-- =====================================================
-- 6. Function to increment submission count
-- =====================================================
CREATE OR REPLACE FUNCTION increment_form_submission_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE forms
  SET submission_count = submission_count + 1
  WHERE id = NEW.form_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS form_submission_count_trigger ON form_submissions;
CREATE TRIGGER form_submission_count_trigger
  AFTER INSERT ON form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION increment_form_submission_count();

-- =====================================================
-- 7. Comments for documentation
-- =====================================================
COMMENT ON TABLE forms IS 'Lead capture form definitions';
COMMENT ON TABLE form_submissions IS 'Form submission records';
COMMENT ON COLUMN forms.fields IS 'JSON array of form field definitions';
COMMENT ON COLUMN forms.settings IS 'Form settings including theme, success message, automation trigger';
COMMENT ON COLUMN form_submissions.data IS 'Raw submission data as key-value pairs';
COMMENT ON COLUMN form_submissions.metadata IS 'Submission metadata: IP, user agent, referrer, etc.';
