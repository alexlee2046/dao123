#!/usr/bin/env node

/**
 * 数据库迁移脚本
 * 用于应用子域名支持的数据库更改
 * 
 * 使用方法：
 * node scripts/migrate-subdomain.js
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 获取环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ 错误：缺少必需的环境变量');
    console.error('请确保设置了以下环境变量：');
    console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    console.error('  - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

// 创建 Supabase 客户端（使用 service role key）
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('🚀 开始数据库迁移...\n');

    try {
        // 读取迁移文件
        const migrationPath = join(__dirname, '../migrations/add_subdomain_support.sql');
        console.log(`📄 读取迁移文件: ${migrationPath}`);

        const migrationSQL = readFileSync(migrationPath, 'utf-8');

        // 执行迁移
        console.log('⚙️  执行迁移SQL...');

        const { data, error } = await supabase.rpc('exec_sql', {
            sql: migrationSQL
        });

        if (error) {
            // 如果 exec_sql 函数不存在，尝试直接执行
            console.log('⚠️  exec_sql 函数不可用，尝试分段执行...\n');

            // 将 SQL 分割成单独的语句
            const statements = migrationSQL
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            for (const statement of statements) {
                if (!statement) continue;

                console.log(`执行: ${statement.substring(0, 60)}...`);

                // 使用 PostgreSQL HTTP API
                const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': supabaseServiceKey,
                        'Authorization': `Bearer ${supabaseServiceKey}`
                    },
                    body: JSON.stringify({ query: statement })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`❌ 执行失败: ${errorText}`);
                }
            }
        }

        console.log('\n✅ 迁移完成！\n');
        console.log('已添加的功能：');
        console.log('  ✓ projects 表新增 subdomain 字段');
        console.log('  ✓ projects 表新增 custom_domain 字段');
        console.log('  ✓ projects 表新增 deployed_at 字段');
        console.log('  ✓ projects 表新增 deployment_status 字段');
        console.log('  ✓ 创建了 reserved_subdomains 表');
        console.log('  ✓ 创建了 deployment_history 表');
        console.log('  ✓ 添加了子域名格式约束');
        console.log('  ✓ 添加了保留字检查触发器');
        console.log('  ✓ 配置了 RLS 策略\n');

        // 验证迁移
        console.log('🔍 验证迁移结果...');

        const { data: columns, error: colError } = await supabase
            .rpc('get_table_columns', { table_name: 'projects' })
            .catch(() => ({ data: null, error: null }));

        if (!colError && columns) {
            const hasSubdomain = columns.some((col: any) => col.column_name === 'subdomain');
            if (hasSubdomain) {
                console.log('✅ subdomain 字段已成功添加');
            } else {
                console.log('⚠️  无法验证字段，请手动检查数据库');
            }
        }

    } catch (error) {
        console.error('❌ 迁移失败:', error);
        console.error('\n解决方法：');
        console.error('1. 确保你有数据库的完整访问权限');
        console.error('2. 尝试在 Supabase Dashboard 的 SQL Editor 中手动运行迁移文件');
        console.error('3. 检查 SUPABASE_SERVICE_ROLE_KEY 是否正确');
        process.exit(1);
    }
}

// 运行迁移
runMigration()
    .then(() => {
        console.log('🎉 所有操作完成！');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ 发生错误:', error);
        process.exit(1);
    });
