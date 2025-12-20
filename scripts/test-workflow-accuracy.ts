/**
 * Workflow Generation Accuracy Test Script
 *
 * Run: npx tsx scripts/test-workflow-accuracy.ts
 */

// Full test set
const TEST_PROMPTS = [
  // Simple (1-2 nodes)
  { prompt: '生成一张产品图片', expectedNodes: ['ai.generateImage'], difficulty: 'simple' },
  { prompt: '发送一封营销邮件', expectedNodes: ['email.send'], difficulty: 'simple' },

  // Medium (2-3 nodes)
  { prompt: '生成4张图片，选最好的一张', expectedNodes: ['ai.generateImage', 'media.filter'], difficulty: 'medium' },
  { prompt: '生成文案后发邮件', expectedNodes: ['ai.generateText', 'email.send'], difficulty: 'medium' },
  { prompt: '生成视频并上传', expectedNodes: ['ai.generateVideo', 'media.upload'], difficulty: 'medium' },
  { prompt: '等待1小时后发送提醒邮件', expectedNodes: ['flow.delay', 'email.send'], difficulty: 'medium' },
  { prompt: '下载图片并调整尺寸', expectedNodes: ['media.download', 'media.resize'], difficulty: 'medium' },

  // Complex (3+ nodes)
  { prompt: '生成4张产品图，筛选最好的，发送邮件给客户', expectedNodes: ['ai.generateImage', 'media.filter', 'email.send'], difficulty: 'complex' },
  { prompt: '生成营销文案，人工审批后发送', expectedNodes: ['ai.generateText', 'flow.approval', 'email.send'], difficulty: 'complex' },
  { prompt: '生成多张图片，合并成画廊，发送预览邮件', expectedNodes: ['ai.generateImage', 'media.merge', 'email.send'], difficulty: 'complex' },
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
  for (const diff of ['simple', 'medium', 'complex']) {
    const subset = results.filter(r => r.difficulty === diff);
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
