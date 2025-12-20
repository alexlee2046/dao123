/**
 * Workflow Generation Accuracy Test Script
 *
 * Run: npx tsx scripts/test-workflow-accuracy.ts
 */

// Advanced test set - higher complexity
const TEST_PROMPTS = [
  // Complex (4 nodes)
  {
    prompt: '生成产品宣传视频，上传到云存储，等待5分钟后发送通知邮件',
    expectedNodes: ['ai.generateVideo', 'media.upload', 'flow.delay', 'email.send'],
    difficulty: 'complex'
  },
  {
    prompt: '下载外部图片，调整尺寸为1080p，上传到我们的存储',
    expectedNodes: ['media.download', 'media.resize', 'media.upload'],
    difficulty: 'complex'
  },
  {
    prompt: '生成8张不同风格的产品图，随机选3张，合并成一个展示画廊',
    expectedNodes: ['ai.generateImage', 'media.filter', 'media.merge'],
    difficulty: 'complex'
  },

  // Very Complex (4-5 nodes with approval/delay)
  {
    prompt: '生成营销邮件内容，人工审批通过后，等待1天，然后发送给客户',
    expectedNodes: ['ai.generateEmail', 'flow.approval', 'flow.delay', 'email.send'],
    difficulty: 'very_complex'
  },
  {
    prompt: '生成产品介绍文案和配图，人工审批后发送邮件',
    expectedNodes: ['ai.generateText', 'ai.generateImage', 'flow.approval', 'email.send'],
    difficulty: 'very_complex'
  },
  {
    prompt: '批量生成10张图片，筛选前3张最好的，调整尺寸后合并成画廊，发邮件预览',
    expectedNodes: ['ai.generateImage', 'media.filter', 'media.resize', 'media.merge', 'email.send'],
    difficulty: 'very_complex'
  },

  // Edge cases - ambiguous or unusual
  {
    prompt: '每天定时生成一条问候语发给团队',
    expectedNodes: ['ai.generateText', 'email.send'],
    difficulty: 'edge_case'
  },
  {
    prompt: '把用户上传的视频下载下来处理后重新上传',
    expectedNodes: ['media.download', 'media.upload'],
    difficulty: 'edge_case'
  },
  {
    prompt: '生成一个产品发布会的完整素材包：宣传图、介绍视频、新闻稿，审批后发布',
    expectedNodes: ['ai.generateImage', 'ai.generateVideo', 'ai.generateText', 'flow.approval'],
    difficulty: 'very_complex'
  },
  {
    prompt: '循环处理客户列表，为每个客户生成个性化邮件内容并发送',
    expectedNodes: ['flow.forEach', 'ai.generateEmail', 'email.send'],
    difficulty: 'very_complex'
  },

  // Ultra Complex (6+ nodes)
  {
    prompt: '生成10张产品图，筛选最好的3张，分别调整尺寸，合并成画廊，人工审批后发送邮件给客户',
    expectedNodes: ['ai.generateImage', 'media.filter', 'media.resize', 'media.merge', 'flow.approval', 'email.send'],
    difficulty: 'ultra_complex'
  },
  {
    prompt: '下载客户提供的图片，生成配套的宣传文案和视频，全部上传到云存储，等待24小时后发送汇总邮件',
    expectedNodes: ['media.download', 'ai.generateText', 'ai.generateVideo', 'media.upload', 'flow.delay', 'email.send'],
    difficulty: 'ultra_complex'
  },
  {
    prompt: '为每个VIP客户生成专属的产品图和介绍邮件，人工审批后批量发送',
    expectedNodes: ['flow.forEach', 'ai.generateImage', 'ai.generateEmail', 'flow.approval', 'email.send'],
    difficulty: 'ultra_complex'
  },
  {
    prompt: '生成产品宣传视频，同时生成多张不同尺寸的封面图，全部上传后发送下载链接邮件',
    expectedNodes: ['ai.generateVideo', 'ai.generateImage', 'media.resize', 'media.upload', 'email.send'],
    difficulty: 'ultra_complex'
  },
  {
    prompt: '批量处理100张图片：下载、调整尺寸、上传，完成后等待审批，审批通过发送通知',
    expectedNodes: ['flow.forEach', 'media.download', 'media.resize', 'media.upload', 'flow.approval', 'email.send'],
    difficulty: 'ultra_complex'
  },
];

interface TestResult {
  prompt: string;
  difficulty: string;
  success: boolean;
  validStructure: boolean;
  correctNodeTypes: boolean;
  hasAllExpectedNodes: boolean;
  noExtraNodes: boolean;
  validEdges: boolean;
  attempts: number;
  errors: string[];
  generatedNodes: string[];
  expectedNodes: string[];
}

async function testWorkflowGeneration(): Promise<void> {
  const results: TestResult[] = [];
  const API_URL = process.env.API_URL || 'http://localhost:3000';

  console.log('🧪 Testing Workflow Generation Accuracy\n');
  console.log(`API: ${API_URL}/api/workflow/generate\n`);
  console.log('='.repeat(60) + '\n');

  for (let i = 0; i < TEST_PROMPTS.length; i++) {
    const test = TEST_PROMPTS[i];

    // Add delay between requests to avoid rate limiting
    if (i > 0) {
      console.log('⏳ Waiting 10s to avoid rate limiting...\n');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    console.log(`Testing: "${test.prompt}"`);
    console.log(`Expected: [${test.expectedNodes.join(', ')}]`);

    try {
      const response = await fetch(`${API_URL}/api/workflow/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: test.prompt, language: 'zh' }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        results.push({
          prompt: test.prompt,
          difficulty: test.difficulty,
          success: false,
          validStructure: false,
          correctNodeTypes: false,
          hasAllExpectedNodes: false,
          noExtraNodes: false,
          validEdges: false,
          attempts: data._meta?.attempts || 0,
          errors: [data.error || 'Unknown error'],
          generatedNodes: [],
          expectedNodes: test.expectedNodes,
        });
        console.log(`❌ FAILED: ${data.error}\n`);
        continue;
      }

      const workflow = data.workflow;
      const generatedNodes = workflow.nodes.map((n: { type: string }) => n.type);
      const nodeIds = new Set(workflow.nodes.map((n: { id: string }) => n.id));

      // Validation checks
      const errors: string[] = [];

      // Check node types are valid
      const validNodeTypes = [
        'ai.generateImage', 'ai.generateVideo', 'ai.generateText', 'ai.generateEmail',
        'media.upload', 'media.download', 'media.resize', 'media.filter', 'media.merge',
        'email.send', 'flow.delay', 'flow.approval', 'flow.forEach'
      ];
      const correctNodeTypes = generatedNodes.every((t: string) => validNodeTypes.includes(t));
      if (!correctNodeTypes) {
        errors.push(`Invalid node types: ${generatedNodes.filter((t: string) => !validNodeTypes.includes(t)).join(', ')}`);
      }

      // Check expected nodes present
      const hasAllExpectedNodes = test.expectedNodes.every(expected =>
        generatedNodes.includes(expected)
      );
      if (!hasAllExpectedNodes) {
        const missing = test.expectedNodes.filter(e => !generatedNodes.includes(e));
        errors.push(`Missing expected nodes: ${missing.join(', ')}`);
      }

      // Check no unnecessary nodes
      const noExtraNodes = generatedNodes.length <= test.expectedNodes.length + 1; // Allow 1 extra
      if (!noExtraNodes) {
        errors.push(`Too many nodes: got ${generatedNodes.length}, expected ~${test.expectedNodes.length}`);
      }

      // Check edge validity
      const validEdges = workflow.edges.every((e: { source: string; target: string }) =>
        nodeIds.has(e.source) && nodeIds.has(e.target) && e.source !== e.target
      );
      if (!validEdges) {
        errors.push('Invalid edge references');
      }

      const success = correctNodeTypes && hasAllExpectedNodes && validEdges;

      results.push({
        prompt: test.prompt,
        difficulty: test.difficulty,
        success,
        validStructure: true,
        correctNodeTypes,
        hasAllExpectedNodes,
        noExtraNodes,
        validEdges,
        attempts: data._meta?.attempts || 1,
        errors,
        generatedNodes,
        expectedNodes: test.expectedNodes,
      });

      console.log(`Generated: [${generatedNodes.join(', ')}]`);
      console.log(`${success ? '✅ PASSED' : '⚠️ PARTIAL'} (attempts: ${data._meta?.attempts || 1})`);
      if (errors.length > 0) {
        console.log(`Issues: ${errors.join('; ')}`);
      }
      console.log('');

    } catch (error) {
      results.push({
        prompt: test.prompt,
        difficulty: test.difficulty,
        success: false,
        validStructure: false,
        correctNodeTypes: false,
        hasAllExpectedNodes: false,
        noExtraNodes: false,
        validEdges: false,
        attempts: 0,
        errors: [error instanceof Error ? error.message : 'Network error'],
        generatedNodes: [],
        expectedNodes: test.expectedNodes,
      });
      console.log(`❌ ERROR: ${error instanceof Error ? error.message : 'Unknown'}\n`);
    }
  }

  // Summary
  console.log('='.repeat(60));
  console.log('\n📊 ACCURACY SUMMARY\n');

  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const partial = results.filter(r => r.validStructure && !r.success).length;
  const failed = results.filter(r => !r.validStructure).length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed} (${(passed/total*100).toFixed(1)}%)`);
  console.log(`⚠️ Partial: ${partial} (${(partial/total*100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${failed} (${(failed/total*100).toFixed(1)}%)`);

  // By difficulty
  console.log('\nBy Difficulty:');
  for (const diff of ['simple', 'medium', 'complex', 'very_complex', 'ultra_complex', 'edge_case']) {
    const subset = results.filter(r => r.difficulty === diff);
    if (subset.length === 0) continue;
    const subPassed = subset.filter(r => r.success).length;
    console.log(`  ${diff}: ${subPassed}/${subset.length} (${(subPassed/subset.length*100).toFixed(1)}%)`);
  }

  // Retry stats
  const avgAttempts = results.reduce((sum, r) => sum + r.attempts, 0) / results.length;
  const retriedCount = results.filter(r => r.attempts > 1).length;
  console.log(`\nRetry Stats:`);
  console.log(`  Average attempts: ${avgAttempts.toFixed(2)}`);
  console.log(`  Required retry: ${retriedCount}/${total}`);

  console.log('\n' + '='.repeat(60));
}

testWorkflowGeneration().catch(console.error);
