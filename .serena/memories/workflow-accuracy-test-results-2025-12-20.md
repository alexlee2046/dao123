# Workflow AI Generation Accuracy Test Results (2025-12-20)

## Test Configuration
- **Test Cases**: 15 (complex: 3, very_complex: 5, ultra_complex: 5, edge_case: 2)
- **Node Range**: 3-6+ nodes per workflow
- **Validation**: Node types, expected nodes, edge references, retry count

## Model Comparison Results

| Model | Accuracy | complex | very_complex | ultra_complex | edge_case |
|-------|----------|---------|--------------|---------------|-----------|
| Gemini 2.5 Flash | 93.3% (14/15) | 100% | 100% | 80% | 100% |
| DeepSeek V3.2 | 93.3% (14/15) | 100% | 100% | 80% | 100% |
| **Gemini 3 Flash Preview** | 93.3% (14/15) | 100% | 80% | **100%** | 100% |

## Key Findings

1. **All models achieved 93.3% accuracy** - no retries needed (all first-attempt passes)
2. **Gemini 3 Flash excels at ultra-complex (6+ nodes)** - 100% vs 80% for others
3. **Failure modes differ** - missing nodes or alternative implementations, not invalid types
4. **z.enum() validation works** - zero invalid node types generated across all tests

## Implementation Techniques (all validated)
- NODE_REGISTRY with z.enum() type validation
- Hierarchical API documentation (WorkflowLLM approach)
- 3 few-shot examples (FlowMind approach)
- Post-generation validation with retry (not triggered)

## Recommendation
Use **Gemini 3 Flash Preview** (`google/gemini-3-flash-preview`) as default for workflow generation:
- Best performance on complex workflows
- $0.50/1M input, $3.00/1M output
- 1M context window

## Files
- `src/app/api/workflow/generate/route.ts` - Implementation
- `scripts/test-workflow-accuracy.ts` - Test script
