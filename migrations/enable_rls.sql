-- Enable RLS on all sensitive tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

-- Projects policies
-- View: Users can see their own projects OR public projects
CREATE POLICY "Users can view own or public projects"
ON projects FOR SELECT
USING (auth.uid() = user_id OR is_public = true);

-- Insert: Users can create projects for themselves
CREATE POLICY "Users can insert their own projects"
ON projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update: Users can update their own projects
CREATE POLICY "Users can update their own projects"
ON projects FOR UPDATE
USING (auth.uid() = user_id);

-- Delete: Users can delete their own projects
CREATE POLICY "Users can delete their own projects"
ON projects FOR DELETE
USING (auth.uid() = user_id);

-- Assets policies
CREATE POLICY "Users can view their own assets"
ON assets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assets"
ON assets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assets"
ON assets FOR DELETE
USING (auth.uid() = user_id);

-- Profiles policies
-- Users can read their own profile (and maybe others for community? e.g. avatar/name)
-- For strict SaaS isolation, usually you only see your own. 
-- But community features need to see author names.
-- Let's allow viewing public profiles if they exist, or just allow all authenticated users to read basic profile info?
-- "profiles" usually contains credits, which is private.
-- We might need to separate public profile info.
-- For now, strict isolation: Users see their own. 
-- Community features usually join via a secure view or specific query that bypasses RLS if needed (using Service Role) 
-- OR we allow reading specific columns (Supabase RLS doesn't support column-level SELECT natively in the USING clause easily without Views).
-- Let's stick to: Users see their own. Community features might break if they query 'profiles' directly with user auth.
-- 'getCommunityProjects' in community.ts uses: select `*, profiles:user_id(email)`
-- If RLS on profiles blocks other users, this join will return null for profiles.
-- We should probably allow reading profiles if they have published a project? Too complex.
-- Alternative: Allow authenticated users to read "id" and "email" (masked?) of others?
-- Let's set it to: Users can view their own. 
-- AND: Users can view profiles of project owners for public projects?
-- Let's keep it simple for now: Users see their own. 
-- If community breaks, we advise to use a "public_profiles" view or allow all read (but that exposes credits).
-- Wait, 'getCommunityProjects' is a Server Action. It uses `createClient` from `@/lib/supabase/server`.
-- If `createClient` uses the user's session, RLS applies.
-- If `profiles` table has sensitive data like `credits`, we MUST NOT allow public read.
-- We should probably create a policy: "Anyone can read profiles" but maybe specific columns? Postgres doesn't do column RLS easily.
-- Better approach: Community queries should use `admin` client or `rpc` to fetch public info, OR we accept that for now we only show public info if we relax RLS.
-- Given the prompt "Strictly isolate", I will default to strict isolation.
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Deployment History policies
CREATE POLICY "Users can view own project deployment history"
ON deployment_history FOR SELECT
USING (
  project_id IN (
    SELECT id FROM projects WHERE user_id = auth.uid()
  )
);

-- Comments policies
-- View: Public (or associated with visible project)
CREATE POLICY "Users can view comments on visible projects"
ON comments FOR SELECT
USING (
  project_id IN (
    SELECT id FROM projects WHERE is_public = true OR user_id = auth.uid()
  )
);

-- Insert: Users can comment as themselves
CREATE POLICY "Users can create comments"
ON comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update/Delete: Own comments only
CREATE POLICY "Users can manage own comments"
ON comments FOR ALL
USING (auth.uid() = user_id);

-- Ratings policies
-- View: Visible projects
CREATE POLICY "Users can view ratings on visible projects"
ON ratings FOR SELECT
USING (
  project_id IN (
    SELECT id FROM projects WHERE is_public = true OR user_id = auth.uid()
  )
);

-- Insert/Update/Delete: Own ratings
CREATE POLICY "Users can manage own ratings"
ON ratings FOR ALL
USING (auth.uid() = user_id);

-- Purchases policies
-- View: Buyer or Seller
CREATE POLICY "Users can view own purchases"
ON purchases FOR SELECT
USING (
  user_id = auth.uid() OR 
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
);

-- Transactions policies
CREATE POLICY "Users can view own transactions"
ON transactions FOR SELECT
USING (user_id = auth.uid());

-- Models policies
CREATE POLICY "Anyone can view enabled models"
ON models FOR SELECT
USING (enabled = true);
