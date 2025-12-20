# AI Workflow Generation Accuracy Research (2025-12-20)

## Research Sources
1. **n8n AI Workflow Builder** (Oct 2024 Beta)
2. **WorkflowLLM** (Microsoft Research) - 81.2% human agreement
3. **FlowMind** (ETH/MSR) - API grounding approach
4. **AutoFlow** (Salesforce) - Reinforcement learning

## Key Accuracy Techniques Implemented

### 1. Node Registry with Schema Validation (n8n approach)
- `NODE_REGISTRY` contains all valid node types with full param definitions
- Zod schema uses `z.enum(VALID_NODE_TYPES)` to reject invalid types at generation
- Prevents LLM from inventing fake node types

### 2. Hierarchical API Documentation (WorkflowLLM approach)
- Each node has: name, description, category, params, returns
- Params include: type, required, default, min/max, description
- `generateNodeCatalog()` creates consistent documentation from registry

### 3. Few-Shot Examples (FlowMind approach)
- 3 diverse examples showing different patterns
- Complete JSON structure with all required fields
- Demonstrates data reference syntax `{{nodeId.field}}`

### 4. Post-Generation Validation with Retry
- `validateWorkflow()` checks:
  - Edge source/target reference valid node IDs
  - No duplicate node IDs
  - All required params present
- Retry mechanism with error feedback to LLM (max 2 attempts)

## Files Modified
- `src/app/api/workflow/generate/route.ts`

## Comparison Table
| Technique | n8n | WorkflowLLM | Our Implementation |
|-----------|-----|-------------|-------------------|
| Registry Validation | ✅ | ✅ | ✅ z.enum() |
| Detailed Params | ✅ | ✅ | ✅ types/defaults/required |
| Few-shot Examples | Multiple | 100+ (fine-tuning) | 3 diverse |
| Post-validation | ✅ | ✅ | ✅ with retry |
| Error Recovery | ❌ | ❌ | ✅ feedback loop |

## Future Improvements
1. Fine-tuning on domain workflows (WorkflowLLM approach)
2. Reinforcement learning from execution results (AutoFlow)
3. Multi-turn refinement dialogue
4. Cost/time estimation preview
