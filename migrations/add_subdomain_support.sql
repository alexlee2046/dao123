-- 添加子域名支持到 projects 表
-- Migration: add_subdomain_support
-- Created: 2025-12-05

-- 添加新字段
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS subdomain TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS custom_domain TEXT,
ADD COLUMN IF NOT EXISTS deployed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deployment_status TEXT DEFAULT 'draft' CHECK (deployment_status IN ('draft', 'deploying', 'deployed', 'failed'));

-- 创建索引以加速子域名查询
CREATE INDEX IF NOT EXISTS idx_projects_subdomain ON projects(subdomain) WHERE subdomain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_deployment_status ON projects(deployment_status);

-- 添加子域名格式约束
-- 只允许小写字母、数字和连字符，长度 3-63
-- 不能以连字符开头或结尾
ALTER TABLE projects 
ADD CONSTRAINT subdomain_format 
CHECK (
  subdomain IS NULL OR 
  (subdomain ~ '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$' AND length(subdomain) >= 3)
);

-- 保留的子域名（防止冲突）
CREATE TABLE IF NOT EXISTS reserved_subdomains (
  subdomain TEXT PRIMARY KEY,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入保留子域名
INSERT INTO reserved_subdomains (subdomain, reason) VALUES
  ('www', 'Standard web prefix'),
  ('api', 'API endpoint'),
  ('admin', 'Administration panel'),
  ('app', 'Main application'),
  ('mail', 'Email service'),
  ('ftp', 'File transfer'),
  ('smtp', 'Email server'),
  ('pop', 'Email protocol'),
  ('imap', 'Email protocol'),
  ('blog', 'Blog service'),
  ('shop', 'E-commerce'),
  ('store', 'E-commerce'),
  ('dev', 'Development environment'),
  ('staging', 'Staging environment'),
  ('test', 'Testing environment'),
  ('static', 'Static assets'),
  ('assets', 'Asset storage'),
  ('cdn', 'Content delivery'),
  ('docs', 'Documentation'),
  ('help', 'Help center'),
  ('support', 'Support system'),
  ('status', 'Status page'),
  ('dashboard', 'Dashboard'),
  ('console', 'Console'),
  ('portal', 'Portal'),
  ('vpn', 'VPN service'),
  ('ssh', 'SSH access'),
  ('git', 'Git service'),
  ('svn', 'SVN service'),
  ('mysql', 'Database'),
  ('postgres', 'Database'),
  ('redis', 'Cache'),
  ('memcached', 'Cache')
ON CONFLICT (subdomain) DO NOTHING;

-- 添加触发器：检查子域名是否被保留
CREATE OR REPLACE FUNCTION check_reserved_subdomain()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subdomain IS NOT NULL AND EXISTS (
    SELECT 1 FROM reserved_subdomains WHERE subdomain = NEW.subdomain
  ) THEN
    RAISE EXCEPTION '子域名 % 已被系统保留', NEW.subdomain;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_reserved_subdomain
  BEFORE INSERT OR UPDATE OF subdomain ON projects
  FOR EACH ROW
  EXECUTE FUNCTION check_reserved_subdomain();

-- 创建部署历史表（可选，用于追踪部署记录）
CREATE TABLE IF NOT EXISTS deployment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  subdomain TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'deploying', 'success', 'failed')),
  vercel_deployment_id TEXT,
  deployment_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_deployment_history_project_id ON deployment_history(project_id);
CREATE INDEX IF NOT EXISTS idx_deployment_history_status ON deployment_history(status);
CREATE INDEX IF NOT EXISTS idx_deployment_history_created_at ON deployment_history(created_at DESC);

-- 添加 RLS 策略
ALTER TABLE deployment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deployment history"
  ON deployment_history FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own deployment records"
  ON deployment_history FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- 注释
COMMENT ON COLUMN projects.subdomain IS '用户自定义子域名，如 alex-portfolio（对应 alex-portfolio.dao123.me）';
COMMENT ON COLUMN projects.custom_domain IS '用户绑定的完全自定义域名（可选），如 www.example.com';
COMMENT ON COLUMN projects.deployed_at IS '项目最后部署时间';
COMMENT ON COLUMN projects.deployment_status IS '部署状态：draft（草稿）、deploying（部署中）、deployed（已部署）、failed（失败）';
COMMENT ON TABLE reserved_subdomains IS '系统保留的子域名列表，这些子域名不能被用户使用';
COMMENT ON TABLE deployment_history IS '部署历史记录，追踪每次部署的状态和结果';
