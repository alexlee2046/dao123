-- H5 邀请函/贺卡支持
-- 添加 project_type 字段区分网站和 H5

-- 1. 添加项目类型字段
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'website';

-- 2. 添加 H5 特有字段
ALTER TABLE projects ADD COLUMN IF NOT EXISTS h5_config JSONB DEFAULT '{}';
-- h5_config 示例结构:
-- {
--   "music_url": "https://...",
--   "page_effect": "slide", -- slide | fade | flip
--   "auto_play": true,
--   "show_page_indicator": true
-- }

-- 3. 创建 H5 模板表
CREATE TABLE IF NOT EXISTS h5_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- wedding, birthday, business, holiday, other
    thumbnail TEXT,
    content JSONB NOT NULL,
    h5_config JSONB DEFAULT '{}',
    is_premium BOOLEAN DEFAULT false,
    price INTEGER DEFAULT 0, -- 积分价格
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 添加索引
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(project_type);
CREATE INDEX IF NOT EXISTS idx_h5_templates_category ON h5_templates(category);

-- 5. 插入一些默认模板
INSERT INTO h5_templates (name, description, category, thumbnail, content, h5_config, is_premium, price)
VALUES 
(
    '简约婚礼邀请函',
    '简洁优雅的婚礼邀请函模板，适合现代风格的婚礼',
    'wedding',
    '/templates/h5/wedding-simple.jpg',
    '{
        "pages": [{
            "id": "page-1",
            "elements": [
                {"type": "text", "content": "我们结婚啦", "style": "font-size: 32px; font-weight: bold; color: #d4a574;"},
                {"type": "text", "content": "张三 & 李四", "style": "font-size: 24px; margin-top: 20px;"},
                {"type": "text", "content": "诚挚邀请您参加我们的婚礼", "style": "font-size: 16px; color: #666; margin-top: 40px;"},
                {"type": "text", "content": "2025年2月14日 12:00", "style": "font-size: 18px; margin-top: 20px;"},
                {"type": "text", "content": "北京市朝阳区某某酒店", "style": "font-size: 14px; color: #888;"}
            ],
            "background": "linear-gradient(180deg, #fdf6ee 0%, #f5e6d3 100%)"
        }]
    }',
    '{"page_effect": "slide", "auto_play": false}',
    false,
    0
),
(
    '浪漫花卉婚礼',
    '浪漫唯美的花卉风格婚礼邀请函',
    'wedding',
    '/templates/h5/wedding-floral.jpg',
    '{
        "pages": [{
            "id": "page-1",
            "elements": [
                {"type": "text", "content": "WEDDING", "style": "font-size: 14px; letter-spacing: 8px; color: #b8860b;"},
                {"type": "text", "content": "邀请函", "style": "font-size: 36px; font-weight: bold; margin-top: 10px;"},
                {"type": "text", "content": "新郎 · 新娘", "style": "font-size: 20px; margin-top: 30px;"},
                {"type": "text", "content": "恭候您的光临", "style": "font-size: 16px; color: #666; margin-top: 40px;"}
            ],
            "background": "#fff5f5"
        }]
    }',
    '{"page_effect": "fade", "auto_play": false}',
    false,
    0
),
(
    '生日快乐贺卡',
    '活泼可爱的生日贺卡模板',
    'birthday',
    '/templates/h5/birthday-happy.jpg',
    '{
        "pages": [{
            "id": "page-1",
            "elements": [
                {"type": "text", "content": "🎂", "style": "font-size: 64px;"},
                {"type": "text", "content": "Happy Birthday!", "style": "font-size: 28px; font-weight: bold; color: #ff6b6b; margin-top: 20px;"},
                {"type": "text", "content": "生日快乐", "style": "font-size: 24px; margin-top: 10px;"},
                {"type": "text", "content": "愿你的每一天都充满阳光和欢笑", "style": "font-size: 14px; color: #666; margin-top: 30px;"}
            ],
            "background": "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)"
        }]
    }',
    '{"page_effect": "slide", "auto_play": false}',
    false,
    0
),
(
    '企业年会邀请',
    '专业大气的企业年会邀请函',
    'business',
    '/templates/h5/business-annual.jpg',
    '{
        "pages": [{
            "id": "page-1",
            "elements": [
                {"type": "text", "content": "2025", "style": "font-size: 48px; font-weight: bold; color: #1a237e;"},
                {"type": "text", "content": "年度盛典", "style": "font-size: 28px; margin-top: 10px;"},
                {"type": "text", "content": "诚邀您莅临", "style": "font-size: 18px; color: #666; margin-top: 40px;"},
                {"type": "text", "content": "共襄盛举", "style": "font-size: 16px; color: #888; margin-top: 10px;"}
            ],
            "background": "linear-gradient(180deg, #e8eaf6 0%, #c5cae9 100%)"
        }]
    }',
    '{"page_effect": "fade", "auto_play": false}',
    true,
    10
),
(
    '新年祝福',
    '喜庆的新年祝福贺卡',
    'holiday',
    '/templates/h5/holiday-newyear.jpg',
    '{
        "pages": [{
            "id": "page-1",
            "elements": [
                {"type": "text", "content": "🧧", "style": "font-size: 64px;"},
                {"type": "text", "content": "新年快乐", "style": "font-size: 36px; font-weight: bold; color: #d32f2f; margin-top: 20px;"},
                {"type": "text", "content": "Happy New Year", "style": "font-size: 16px; color: #666; margin-top: 10px;"},
                {"type": "text", "content": "祝您新年大吉，万事如意", "style": "font-size: 18px; margin-top: 30px;"}
            ],
            "background": "linear-gradient(180deg, #ffebee 0%, #ffcdd2 100%)"
        }]
    }',
    '{"page_effect": "slide", "auto_play": false}',
    false,
    0
)
ON CONFLICT DO NOTHING;

-- 6. 为 h5_templates 启用 RLS
ALTER TABLE h5_templates ENABLE ROW LEVEL SECURITY;

-- 任何人都可以读取模板
CREATE POLICY "Anyone can read h5_templates" ON h5_templates
    FOR SELECT USING (true);

-- 只有管理员可以修改模板
CREATE POLICY "Only admins can manage h5_templates" ON h5_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
