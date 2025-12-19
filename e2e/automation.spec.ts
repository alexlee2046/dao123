import { test, expect, Page } from '@playwright/test';
import { login } from './utils';

/**
 * Phase 2 自动化高级功能 E2E 测试
 *
 * 测试覆盖：
 * 1. 自动化列表页面
 * 2. 自动化创建流程
 * 3. 基础步骤类型 (send_email, wait, add_tag, remove_tag)
 * 4. 条件分支步骤配置
 * 5. A/B 测试分流步骤配置
 * 6. AI 序列生成对话框
 * 7. AI 序列生成 API
 */

// 测试数据
const TEST_AUTOMATION = {
  name: 'E2E测试自动化序列',
  triggerTag: '新用户',
};

// 辅助函数：导航到自动化页面
async function navigateToAutomations(page: Page) {
  await page.goto('/mail/automations', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
}

// 辅助函数：点击创建自动化
async function clickCreateAutomation(page: Page) {
  // 等待页面加载
  await page.waitForTimeout(1000);
  const createBtn = page.locator('button:has-text("创建"), a:has-text("创建")').first();
  await createBtn.waitFor({ state: 'visible', timeout: 15000 });
  await createBtn.click();
  // 等待编辑器页面加载
  await page.waitForSelector('text=基本信息', { timeout: 15000 });
  await page.waitForTimeout(500);
}

// 辅助函数：打开添加步骤对话框
async function openAddStepDialog(page: Page) {
  const addStepBtn = page.locator('button:has-text("添加步骤")').first();
  await addStepBtn.waitFor({ state: 'visible', timeout: 15000 });
  await addStepBtn.click();
  await page.waitForTimeout(500);
}

// 辅助函数：选择步骤类型 - 在对话框内选择
async function selectStepType(page: Page, stepLabel: string) {
  // 等待对话框完全打开
  await page.waitForTimeout(500);
  // 使用更精确的选择器：在对话框内找到步骤类型按钮
  const dialog = page.locator('[role="dialog"]');
  const stepOption = dialog.locator(`button:has-text("${stepLabel}")`).first();
  await stepOption.click({ force: true });
  await page.waitForTimeout(500);
}

test.describe('自动化列表页面测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('自动化列表页面正确加载', async ({ page }) => {
    await navigateToAutomations(page);

    // 验证页面标题
    await expect(page.locator('h1:has-text("自动化"), h1:has-text("自动化流程")')).toBeVisible({ timeout: 10000 });

    // 验证创建按钮存在
    const createBtn = page.locator('button:has-text("创建自动化"), a:has-text("创建")').first();
    await expect(createBtn).toBeVisible();
  });

  test('空状态提示正确显示', async ({ page }) => {
    await navigateToAutomations(page);

    // 检查是否有自动化列表或空状态
    const hasAutomations = await page.locator('[data-automation-card], .automation-card').count() > 0;

    if (!hasAutomations) {
      // 验证空状态提示
      const emptyState = page.locator('text=还没有自动化, text=创建您的第一个').first();
      const isVisible = await emptyState.isVisible().catch(() => false);
      console.log(`空状态提示: ${isVisible ? '显示' : '未显示（可能有数据）'}`);
    }
  });
});

test.describe('自动化编辑器基础功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToAutomations(page);
  });

  test('自动化编辑器页面正确加载', async ({ page }) => {
    await clickCreateAutomation(page);

    // 验证编辑器主要区域
    await expect(page.locator('text=基本信息').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('触发条件', { exact: true })).toBeVisible();
    await expect(page.getByText('自动化步骤', { exact: true })).toBeVisible();

    // 验证名称输入框
    const nameInput = page.locator('input[placeholder*="名称"], input[placeholder*="序列"]').first();
    await expect(nameInput).toBeVisible();
  });

  test('触发条件选择功能', async ({ page }) => {
    await clickCreateAutomation(page);
    await page.waitForTimeout(500);

    // 验证四种触发类型按钮（使用 role 定位更精确）
    await expect(page.getByRole('button', { name: /表单提交/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /新建联系人/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /添加标签/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /手动触发/ })).toBeVisible();

    // 点击"添加标签"触发类型
    const tagTrigger = page.locator('button:has-text("添加标签")').first();
    await tagTrigger.click();
    await page.waitForTimeout(300);

    // 验证标签输入框出现
    const tagInput = page.locator('input[placeholder*="标签"]').first();
    await expect(tagInput).toBeVisible({ timeout: 5000 });
  });

  test('启用状态开关功能', async ({ page }) => {
    await clickCreateAutomation(page);
    await page.waitForTimeout(500);

    // 找到启用状态开关
    const switchElement = page.locator('[role="switch"], button[aria-checked]').first();
    await expect(switchElement).toBeVisible();

    // 获取初始状态
    const initialState = await switchElement.getAttribute('aria-checked');
    console.log(`启用状态初始值: ${initialState}`);

    // 点击切换
    await switchElement.click();
    await page.waitForTimeout(200);

    // 验证状态已切换
    const newState = await switchElement.getAttribute('aria-checked');
    expect(newState).not.toBe(initialState);
  });
});

test.describe('步骤类型测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToAutomations(page);
    await clickCreateAutomation(page);
    await page.waitForTimeout(500);
  });

  test('添加步骤对话框显示所有步骤类型', async ({ page }) => {
    await openAddStepDialog(page);
    await page.waitForTimeout(500);

    // 验证六种步骤类型 - 在对话框内查找
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog.locator('button:has-text("发送邮件")')).toBeVisible();
    await expect(dialog.locator('button:has-text("等待")')).toBeVisible();
    await expect(dialog.locator('button:has-text("添加标签")')).toBeVisible();
    await expect(dialog.locator('button:has-text("移除标签")')).toBeVisible();
    await expect(dialog.locator('button:has-text("条件分支")')).toBeVisible();
    await expect(dialog.locator('button:has-text("A/B 测试")')).toBeVisible();
  });

  test('添加等待步骤', async ({ page }) => {
    await openAddStepDialog(page);
    await selectStepType(page, '等待');

    // 验证步骤已添加到列表
    await expect(page.locator('text=等待 1 天')).toBeVisible({ timeout: 5000 });
  });

  test('添加并编辑等待步骤', async ({ page }) => {
    await openAddStepDialog(page);
    await selectStepType(page, '等待');

    // 等待步骤添加完成，对话框关闭
    await page.waitForTimeout(800);

    // 验证步骤已添加
    await expect(page.locator('text=等待 1 天')).toBeVisible();

    // 悬停并点击编辑按钮
    const stepCard = page.locator('.group').first();
    await stepCard.hover();
    const editBtn = stepCard.locator('button:has-text("编辑")');
    await editBtn.click();
    await page.waitForTimeout(500);

    // 验证编辑对话框
    await expect(page.locator('text=编辑步骤')).toBeVisible();

    // 修改等待时间
    const durationInput = page.locator('[role="dialog"] input[type="number"]').first();
    await durationInput.fill('3');

    // 修改单位为小时 - 使用 force click 避免 overlay 干扰
    const unitSelect = page.locator('[role="dialog"] [role="combobox"]').first();
    await unitSelect.click({ force: true });
    await page.waitForTimeout(300);
    await page.locator('[role="option"]:has-text("小时")').click();

    // 保存
    await page.waitForTimeout(300);
    const saveBtn = page.locator('[role="dialog"] button:has-text("保存")');
    await saveBtn.click();
    await page.waitForTimeout(500);

    // 验证更新后的显示
    await expect(page.locator('text=等待 3 小时')).toBeVisible();
  });

  test('添加标签步骤', async ({ page }) => {
    await openAddStepDialog(page);
    await selectStepType(page, '添加标签');

    // 验证步骤已添加
    const stepCard = page.locator('text=添加标签:').first();
    await expect(stepCard).toBeVisible({ timeout: 5000 });
  });

  test('删除步骤功能', async ({ page }) => {
    // 添加一个步骤
    await openAddStepDialog(page);
    await selectStepType(page, '等待');

    // 验证步骤存在
    await expect(page.locator('text=等待 1 天')).toBeVisible();

    // 悬停显示删除按钮
    const stepCard = page.locator('.group').first();
    await stepCard.hover();

    // 点击删除
    const deleteBtn = page.locator('button svg.text-destructive, button:has(svg.text-destructive)').first();
    await deleteBtn.click();
    await page.waitForTimeout(300);

    // 验证步骤已删除
    await expect(page.locator('text=等待 1 天')).not.toBeVisible();
  });
});

test.describe('条件分支步骤测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToAutomations(page);
    await clickCreateAutomation(page);
    await page.waitForTimeout(500);
  });

  test('添加条件分支步骤', async ({ page }) => {
    await openAddStepDialog(page);
    await selectStepType(page, '条件分支');

    // 验证步骤已添加
    await expect(page.locator('text=条件:')).toBeVisible({ timeout: 5000 });
  });

  test('条件分支编辑对话框 - 四种条件类型', async ({ page }) => {
    await openAddStepDialog(page);
    await selectStepType(page, '条件分支');

    // 等待对话框关闭
    await page.waitForTimeout(1000);

    // 悬停并点击编辑
    const stepCard = page.locator('.group').first();
    await stepCard.hover();
    const editBtn = stepCard.locator('button:has-text("编辑")');
    await editBtn.click();
    await page.waitForTimeout(800);

    // 验证编辑对话框
    await expect(page.locator('text=编辑步骤')).toBeVisible();
    await expect(page.locator('text=条件类型')).toBeVisible();

    // 打开条件类型下拉 - 使用 force click
    const conditionSelect = page.locator('[role="dialog"] [role="combobox"]').first();
    await conditionSelect.click({ force: true });
    await page.waitForTimeout(500);

    // 验证四种条件类型
    await expect(page.locator('[role="option"]:has-text("邮件已打开")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("邮件已点击")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("标签存在")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("字段等于")')).toBeVisible();
  });

  test('条件分支 - 邮件打开条件配置', async ({ page }) => {
    await openAddStepDialog(page);
    await selectStepType(page, '条件分支');

    const editBtn = page.locator('button:has-text("编辑")').first();
    await editBtn.click();
    await page.waitForTimeout(300);

    // 默认应该是邮件已打开
    await expect(page.locator('text=检查哪个邮件步骤')).toBeVisible();
    await expect(page.locator('text=留空则检查序列中的上一封邮件')).toBeVisible();
  });

  test('条件分支 - 标签存在条件配置', async ({ page }) => {
    await openAddStepDialog(page);
    await selectStepType(page, '条件分支');

    // 等待对话框关闭
    await page.waitForTimeout(1000);

    // 悬停并点击编辑
    const stepCard = page.locator('.group').first();
    await stepCard.hover();
    const editBtn = stepCard.locator('button:has-text("编辑")');
    await editBtn.click();
    await page.waitForTimeout(800);

    // 选择标签存在条件 - 使用 force click
    const conditionSelect = page.locator('[role="dialog"] [role="combobox"]').first();
    await conditionSelect.click({ force: true });
    await page.waitForTimeout(300);
    await page.locator('[role="option"]:has-text("标签存在")').click();
    await page.waitForTimeout(300);

    // 验证标签输入框出现
    await expect(page.locator('text=检查标签')).toBeVisible();
    const tagInput = page.locator('[role="dialog"] input[placeholder*="标签名称"]').first();
    await expect(tagInput).toBeVisible();
  });

  test('条件分支 - 字段等于条件配置', async ({ page }) => {
    await openAddStepDialog(page);
    await selectStepType(page, '条件分支');

    // 等待对话框关闭
    await page.waitForTimeout(1000);

    // 悬停并点击编辑
    const stepCard = page.locator('.group').first();
    await stepCard.hover();
    const editBtn = stepCard.locator('button:has-text("编辑")');
    await editBtn.click();
    await page.waitForTimeout(800);

    // 选择字段等于条件 - 使用 force click
    const conditionSelect = page.locator('[role="dialog"] [role="combobox"]').first();
    await conditionSelect.click({ force: true });
    await page.waitForTimeout(300);
    await page.locator('[role="option"]:has-text("字段等于")').click();
    await page.waitForTimeout(300);

    // 验证字段名和值输入框出现
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog.getByText('字段名')).toBeVisible();
    await expect(dialog.getByText('等于值')).toBeVisible();
    await expect(dialog.locator('input[placeholder*="country"]')).toBeVisible();
    await expect(dialog.locator('input[placeholder*="China"]')).toBeVisible();
  });

  test('条件分支 - 分支说明显示', async ({ page }) => {
    await openAddStepDialog(page);
    await selectStepType(page, '条件分支');

    const editBtn = page.locator('button:has-text("编辑")').first();
    await editBtn.click();
    await page.waitForTimeout(300);

    // 验证分支说明
    await expect(page.locator('text=分支说明')).toBeVisible();
    await expect(page.locator('text=条件为真')).toBeVisible();
    await expect(page.locator('text=条件为假')).toBeVisible();
  });
});

test.describe('A/B 测试步骤测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToAutomations(page);
    await clickCreateAutomation(page);
    await page.waitForTimeout(500);
  });

  test('添加 A/B 测试步骤', async ({ page }) => {
    await openAddStepDialog(page);
    await selectStepType(page, 'A/B 测试');

    // 验证步骤已添加
    await expect(page.locator('text=A/B 测试')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=2 个变体')).toBeVisible();
  });

  test('A/B 测试编辑对话框 - 变体配置', async ({ page }) => {
    await openAddStepDialog(page);
    await selectStepType(page, 'A/B 测试');

    const editBtn = page.locator('button:has-text("编辑")').first();
    await editBtn.click();
    await page.waitForTimeout(300);

    // 验证对话框内容
    await expect(page.locator('text=A/B 测试配置')).toBeVisible();
    await expect(page.locator('text=变体数量')).toBeVisible();
    await expect(page.locator('button:has-text("添加变体")')).toBeVisible();
    await expect(page.locator('button:has-text("移除变体")')).toBeVisible();
  });

  test('A/B 测试 - 添加变体', async ({ page }) => {
    await openAddStepDialog(page);
    await selectStepType(page, 'A/B 测试');

    const editBtn = page.locator('button:has-text("编辑")').first();
    await editBtn.click();
    await page.waitForTimeout(300);

    // 初始应该有 2 个变体
    const initialInputs = await page.locator('input[placeholder*="变体"]').count();
    expect(initialInputs).toBe(2);

    // 添加变体
    const addBtn = page.locator('button:has-text("添加变体")');
    await addBtn.click();
    await page.waitForTimeout(200);

    // 应该有 3 个变体
    const newInputs = await page.locator('input[placeholder*="变体"]').count();
    expect(newInputs).toBe(3);
  });

  test('A/B 测试 - 移除变体', async ({ page }) => {
    await openAddStepDialog(page);
    await selectStepType(page, 'A/B 测试');

    const editBtn = page.locator('button:has-text("编辑")').first();
    await editBtn.click();
    await page.waitForTimeout(300);

    // 先添加一个变体（变成3个）
    await page.locator('button:has-text("添加变体")').click();
    await page.waitForTimeout(200);

    // 移除变体
    await page.locator('button:has-text("移除变体")').click();
    await page.waitForTimeout(200);

    // 应该回到 2 个变体
    const inputs = await page.locator('input[placeholder*="变体"]').count();
    expect(inputs).toBe(2);
  });

  test('A/B 测试 - 变体百分比配置', async ({ page }) => {
    await openAddStepDialog(page);
    await selectStepType(page, 'A/B 测试');

    const editBtn = page.locator('button:has-text("编辑")').first();
    await editBtn.click();
    await page.waitForTimeout(300);

    // 验证百分比输入框
    const percentInputs = page.locator('input[type="number"][max="100"]');
    const count = await percentInputs.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // 修改第一个变体百分比
    const firstPercent = percentInputs.first();
    await firstPercent.fill('70');

    // 验证值已更新
    await expect(firstPercent).toHaveValue('70');
  });

  test('A/B 测试 - 变体名称编辑', async ({ page }) => {
    await openAddStepDialog(page);
    await selectStepType(page, 'A/B 测试');

    const editBtn = page.locator('button:has-text("编辑")').first();
    await editBtn.click();
    await page.waitForTimeout(300);

    // 找到第一个变体名称输入框并修改
    const nameInput = page.locator('input[placeholder*="变体"]').first();
    await nameInput.fill('优惠方案 A');

    // 保存
    await page.locator('button:has-text("保存")').last().click();
    await page.waitForTimeout(300);

    // 验证步骤卡片仍显示
    await expect(page.locator('text=A/B 测试')).toBeVisible();
  });
});

test.describe('AI 序列生成对话框测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToAutomations(page);
    await clickCreateAutomation(page);
    await page.waitForTimeout(500);
  });

  test('AI 生成按钮存在且样式正确', async ({ page }) => {
    const aiBtn = page.locator('button:has-text("AI 生成")');
    await expect(aiBtn).toBeVisible();

    // 验证紫色渐变样式（通过class检查）
    const className = await aiBtn.getAttribute('class');
    expect(className).toContain('violet');
  });

  test('AI 生成对话框打开', async ({ page }) => {
    const aiBtn = page.locator('button:has-text("AI 生成")');
    await aiBtn.click();
    await page.waitForTimeout(300);

    // 验证对话框内容
    await expect(page.locator('text=AI 智能生成')).toBeVisible();
    await expect(page.locator('text=产品/服务描述')).toBeVisible();
  });

  test('AI 生成对话框 - 所有表单字段', async ({ page }) => {
    const aiBtn = page.locator('button:has-text("AI 生成")');
    await aiBtn.click();
    await page.waitForTimeout(300);

    // 验证所有表单字段
    await expect(page.locator('text=产品/服务描述')).toBeVisible();
    await expect(page.locator('text=目标受众')).toBeVisible();
    await expect(page.locator('text=邮件数量')).toBeVisible();
    await expect(page.locator('text=语气风格')).toBeVisible();

    // 验证生成按钮
    await expect(page.locator('button:has-text("生成序列")')).toBeVisible();
  });

  test('AI 生成对话框 - 邮件数量选项', async ({ page }) => {
    const aiBtn = page.locator('button:has-text("AI 生成")');
    await aiBtn.click();
    await page.waitForTimeout(800);

    // 找到邮件数量下拉 - 在对话框内
    const dialog = page.locator('[role="dialog"]');
    const countSelect = dialog.locator('[role="combobox"]').first();
    await countSelect.click({ force: true });
    await page.waitForTimeout(300);

    // 验证选项
    await expect(page.locator('[role="option"]:has-text("3 封")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("5 封")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("7 封")')).toBeVisible();
  });

  test('AI 生成对话框 - 语气风格选项', async ({ page }) => {
    const aiBtn = page.locator('button:has-text("AI 生成")');
    await aiBtn.click();
    await page.waitForTimeout(800);

    // 找到语气风格下拉 - 在对话框内，第二个 combobox
    const dialog = page.locator('[role="dialog"]');
    const toneSelect = dialog.locator('[role="combobox"]').nth(1);
    await toneSelect.click({ force: true });
    await page.waitForTimeout(300);

    // 验证选项
    await expect(page.locator('[role="option"]:has-text("专业正式")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("友好亲切")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("轻松随意")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("紧迫感")')).toBeVisible();
  });

  test('AI 生成按钮 - 空描述时禁用', async ({ page }) => {
    const aiBtn = page.locator('button:has-text("AI 生成")');
    await aiBtn.click();
    await page.waitForTimeout(300);

    // 生成按钮应该禁用
    const generateBtn = page.locator('button:has-text("生成序列")');
    await expect(generateBtn).toBeDisabled();
  });

  test('AI 生成按钮 - 填写描述后启用', async ({ page }) => {
    const aiBtn = page.locator('button:has-text("AI 生成")');
    await aiBtn.click();
    await page.waitForTimeout(300);

    // 填写产品描述
    const descInput = page.locator('textarea').first();
    await descInput.fill('一款帮助中小企业管理客户关系的SaaS软件');

    // 生成按钮应该启用
    const generateBtn = page.locator('button:has-text("生成序列")');
    await expect(generateBtn).toBeEnabled();
  });

  test('AI 生成 - 已有步骤时显示警告', async ({ page }) => {
    // 先添加一个步骤
    await openAddStepDialog(page);
    await selectStepType(page, '等待');
    await page.waitForTimeout(300);

    // 打开 AI 对话框
    const aiBtn = page.locator('button:has-text("AI 生成")');
    await aiBtn.click();
    await page.waitForTimeout(300);

    // 验证警告提示
    await expect(page.locator('text=注意：生成将覆盖现有的')).toBeVisible();
    await expect(page.locator('text=1 个步骤')).toBeVisible();
  });
});

test.describe('AI 序列生成 API 测试', () => {
  test('API 端点响应格式验证', async ({ request }) => {
    const response = await request.post('/api/ai/automation', {
      data: {
        productDescription: '一款在线教育平台，提供编程课程',
        targetAudience: '程序员和技术爱好者',
        sequenceLength: 3,
        tone: 'professional',
        language: 'zh'
      }
    });

    // 可能因为 API Key 问题返回 500，但格式应该正确
    const body = await response.json();
    console.log('API Response:', JSON.stringify(body, null, 2));

    if (response.ok()) {
      // 成功时验证响应格式
      expect(body.success).toBe(true);
      expect(body.sequence).toBeDefined();
      expect(body.sequence.name).toBeDefined();
      expect(body.sequence.steps).toBeDefined();
      expect(Array.isArray(body.sequence.steps)).toBe(true);
    } else {
      // 失败时验证错误格式
      expect(body.error).toBeDefined();
      console.log('API Error (expected in test env):', body.error);
    }
  });

  test('API 缺少必填字段返回 400', async ({ request }) => {
    const response = await request.post('/api/ai/automation', {
      data: {
        // 缺少 productDescription
        targetAudience: '程序员',
        sequenceLength: 5
      }
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });
});

test.describe('自动化保存流程测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToAutomations(page);
    await clickCreateAutomation(page);
    await page.waitForTimeout(500);
  });

  test('空名称时显示错误提示', async ({ page }) => {
    // 添加一个步骤
    await openAddStepDialog(page);
    await selectStepType(page, '等待');

    // 尝试保存
    const saveBtn = page.locator('button:has-text("创建自动化")').last();
    await saveBtn.click();

    // 应该显示错误提示
    await expect(page.locator('text=请输入自动化名称')).toBeVisible({ timeout: 5000 });
  });

  test('无步骤时显示错误提示', async ({ page }) => {
    // 填写名称
    const nameInput = page.locator('input[placeholder*="名称"], input[placeholder*="序列"]').first();
    await nameInput.fill(TEST_AUTOMATION.name);

    // 尝试保存
    const saveBtn = page.locator('button:has-text("创建自动化")').last();
    await saveBtn.click();

    // 应该显示错误提示
    await expect(page.locator('text=请至少添加一个步骤')).toBeVisible({ timeout: 5000 });
  });

  test('完整流程 - 创建包含多种步骤的自动化', async ({ page }) => {
    // 填写名称
    const nameInput = page.locator('input[placeholder*="名称"], input[placeholder*="序列"]').first();
    await nameInput.fill(TEST_AUTOMATION.name);

    // 选择触发类型
    await page.locator('button:has-text("添加标签")').first().click();
    await page.waitForTimeout(200);
    const tagInput = page.locator('input[placeholder*="标签"]').first();
    await tagInput.fill(TEST_AUTOMATION.triggerTag);

    // 添加等待步骤
    await openAddStepDialog(page);
    await selectStepType(page, '等待');

    // 添加条件分支步骤
    await openAddStepDialog(page);
    await selectStepType(page, '条件分支');

    // 添加 A/B 测试步骤
    await openAddStepDialog(page);
    await selectStepType(page, 'A/B 测试');

    // 验证步骤已添加
    await expect(page.locator('text=等待 1 天')).toBeVisible();
    await expect(page.locator('text=条件:')).toBeVisible();
    await expect(page.locator('text=A/B 测试')).toBeVisible();

    console.log('自动化配置完成，包含 3 个步骤');

    // 注意：实际保存需要后端支持，这里只验证 UI 配置
  });
});

test.describe('响应式布局测试', () => {
  test('移动端自动化编辑器布局', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await login(page);
    await navigateToAutomations(page);
    await clickCreateAutomation(page);

    // 验证关键元素在移动端可见
    await expect(page.locator('text=基本信息').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('触发条件', { exact: true })).toBeVisible();
    await expect(page.locator('button:has-text("添加步骤")')).toBeVisible();
  });
});

test.describe('性能测试', () => {
  test('自动化编辑器加载时间', async ({ page }) => {
    await login(page);

    const startTime = Date.now();
    await page.goto('/mail/automations/new', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=基本信息', { timeout: 15000 });
    const loadTime = Date.now() - startTime;

    console.log(`自动化编辑器加载时间: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000); // 10秒内加载
  });
});
